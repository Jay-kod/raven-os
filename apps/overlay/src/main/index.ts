import { app, BrowserWindow, clipboard, globalShortcut, ipcMain, screen } from 'electron';
import { join } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  buildHandoffDraft,
  buildNextTaskPrompt,
  CommandBus,
  detectIdeStatus,
  nextTodoTask,
  readProgress,
  scanGuardrails,
  watchProgress,
  type RavenCommand
} from '@core/index';

const execFileAsync = promisify(execFile);

interface WindowPreferences {
  bounds: { x: number; y: number; width: number; height: number };
  expandedBounds: { x: number; y: number; width: number; height: number };
  minimized: boolean;
  autoStart: boolean;
}

const defaultPreferences: WindowPreferences = {
  bounds: { x: 80, y: 80, width: 420, height: 520 },
  expandedBounds: { x: 80, y: 80, width: 420, height: 520 },
  minimized: false,
  autoStart: false
};

let mainWindow: BrowserWindow | null = null;
let preferences = defaultPreferences;
const commandBus = new CommandBus();
let progressWatcher: { close(): void } | undefined;
let ideStatusTimer: NodeJS.Timeout | undefined;

async function loadPreferences(): Promise<void> {
  try {
    const raw = await readFile(join(app.getPath('userData'), 'preferences.json'), 'utf8');
    const parsed: Partial<WindowPreferences> = JSON.parse(raw) as Partial<WindowPreferences>;
    if (parsed.bounds && parsed.minimized !== undefined) {
      preferences = {
        bounds: parsed.bounds,
        expandedBounds: parsed.expandedBounds ?? parsed.bounds,
        minimized: parsed.minimized,
        autoStart: parsed.autoStart === true
      };
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('Raven preferences could not be loaded.', error);
    }
  }
}

async function savePreferences(): Promise<void> {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  preferences = {
    bounds,
    expandedBounds: preferences.minimized ? preferences.expandedBounds : bounds,
    minimized: preferences.minimized,
    autoStart: preferences.autoStart
  };
  await writeFile(join(app.getPath('userData'), 'preferences.json'), JSON.stringify(preferences, null, 2));
}

function snapOrbToNearestEdge(): void {
  if (!mainWindow || !preferences.minimized) return;
  const bounds = mainWindow.getBounds();
  const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
  const workArea = display.workArea;
  const distances = {
    left: Math.abs(bounds.x - workArea.x),
    right: Math.abs(workArea.x + workArea.width - (bounds.x + bounds.width)),
    top: Math.abs(bounds.y - workArea.y),
    bottom: Math.abs(workArea.y + workArea.height - (bounds.y + bounds.height))
  };
  const nearest = (Object.keys(distances) as Array<keyof typeof distances>)
    .sort((a, b) => distances[a] - distances[b])[0];
  const next = { x: bounds.x, y: bounds.y };
  if (nearest === 'left') next.x = workArea.x;
  if (nearest === 'right') next.x = workArea.x + workArea.width - bounds.width;
  if (nearest === 'top') next.y = workArea.y;
  if (nearest === 'bottom') next.y = workArea.y + workArea.height - bounds.height;
  mainWindow.setPosition(next.x, next.y);
}

function setMinimized(minimized: boolean): void {
  if (!mainWindow || preferences.minimized === minimized) return;
  if (minimized) preferences.expandedBounds = mainWindow.getBounds();
  preferences.minimized = minimized;
  mainWindow.setMinimumSize(minimized ? 76 : 280, minimized ? 76 : 180);
  mainWindow.setResizable(!minimized);
  if (minimized) {
    mainWindow.setSize(92, 92);
    snapOrbToNearestEdge();
  } else {
    mainWindow.setBounds(preferences.expandedBounds);
  }
  mainWindow.webContents.send('window-mode', minimized ? 'orb' : 'expanded');
  void savePreferences();
}

function handleCommand(command: RavenCommand): void {
  if (!mainWindow) return;
  if (command.type === 'close-app') {
    app.quit();
    return;
  }
  if (command.type === 'toggle-visibility') {
    if (mainWindow.isVisible()) mainWindow.hide();
    else mainWindow.showInactive();
    return;
  }
  if (command.type === 'expand') setMinimized(false);
  if (command.type === 'minimize') setMinimized(true);
  if (command.type === 'run-guardrails') {
    void scanGuardrails(process.cwd()).then(
      (findings) => mainWindow?.webContents.send('guardrails-update', findings),
      (error: unknown) => mainWindow?.webContents.send(
        'guardrails-error',
        error instanceof Error ? error.message : 'Guardrails scan failed.'
      )
    );
  }
  if (command.type === 'copy-next-task-prompt') {
    void readFile(join(process.cwd(), 'docs', 'TODO.md'), 'utf8').then((todo) => {
      const task = nextTodoTask(todo);
      if (!task) throw new Error('No incomplete TODO task was found.');
      const prompt = buildNextTaskPrompt(task);
      clipboard.writeText(prompt);
      mainWindow?.webContents.send('task-result', `Copied next-task prompt for: ${task.title}`);
    }).catch((error: unknown) => mainWindow?.webContents.send(
      'task-error',
      error instanceof Error ? error.message : 'Next-task prompt could not be copied.'
    ));
  }
  if (command.type === 'draft-handoff') {
    void Promise.all([
      readProgress(join(process.cwd(), '.ai', 'progress.json'), process.cwd()),
      execFileAsync('git', ['log', '-5', '--oneline'], { cwd: process.cwd(), windowsHide: true })
    ]).then(([progress, git]) => {
      const document = progress.document;
      const draft = buildHandoffDraft({
        task: document?.task ?? 'Unknown task',
        status: document?.status ?? 'unknown',
        completedSteps: document?.steps.filter((step) => step.status === 'done').map((step) => step.title) ?? [],
        blockedSteps: progress.issues.map((issue) => issue.message),
        gitLog: git.stdout
      });
      mainWindow?.webContents.send('task-result', draft);
    }).catch((error: unknown) => mainWindow?.webContents.send(
      'task-error',
      error instanceof Error ? error.message : 'Handoff draft could not be generated.'
    ));
  }
  if (command.type === 'toggle-autostart') {
    preferences.autoStart = !preferences.autoStart;
    app.setLoginItemSettings({ openAtLogin: preferences.autoStart });
    mainWindow.webContents.send('autostart-status', preferences.autoStart);
    void savePreferences();
  }
  mainWindow.webContents.send('command', command);
}

async function createWindow(): Promise<void> {
  await loadPreferences();
  app.setLoginItemSettings({ openAtLogin: preferences.autoStart });
  mainWindow = new BrowserWindow({
    ...preferences.bounds,
    minWidth: 76,
    minHeight: 76,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.setMinimumSize(preferences.minimized ? 76 : 280, preferences.minimized ? 76 : 180);
  mainWindow.setResizable(!preferences.minimized);
  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.on('move', () => void savePreferences());
  mainWindow.on('resize', () => void savePreferences());
  mainWindow.on('moved', snapOrbToNearestEdge);
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('window-mode', preferences.minimized ? 'orb' : 'expanded');
    mainWindow?.webContents.send('autostart-status', preferences.autoStart);
    void detectIdeStatus().then(
      (status) => mainWindow?.webContents.send('ide-status', status),
      (error: unknown) => mainWindow?.webContents.send(
        'ide-status-error',
        error instanceof Error ? error.message : 'IDE status could not be detected.'
      )
    );
    ideStatusTimer = setInterval(() => {
      void detectIdeStatus().then(
        (status) => mainWindow?.webContents.send('ide-status', status),
        (error: unknown) => mainWindow?.webContents.send(
          'ide-status-error',
          error instanceof Error ? error.message : 'IDE status could not be detected.'
        )
      );
    }, 3000);
    progressWatcher = watchProgress(
      join(process.cwd(), '.ai', 'progress.json'),
      process.cwd(),
      (snapshot) => mainWindow?.webContents.send('progress-update', snapshot),
      (error) => mainWindow?.webContents.send('progress-update-error', error.message)
    );
    mainWindow?.showInactive();
  });
  if (process.env.ELECTRON_RENDERER_URL) {
    await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

const singleInstanceLock = app.requestSingleInstanceLock();

if (!singleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (!mainWindow.isVisible()) mainWindow.showInactive();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    ipcMain.on('dispatch-command', (_event, command: RavenCommand) => commandBus.dispatch(command));
    commandBus.subscribe(handleCommand);
    globalShortcut.register('CommandOrControl+Shift+R', () => commandBus.dispatch({ type: 'toggle-visibility' }));
    await createWindow();
  });
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (ideStatusTimer) clearInterval(ideStatusTimer);
  progressWatcher?.close();
  void savePreferences();
});
