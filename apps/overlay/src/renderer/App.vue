<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { GuardrailFinding, IdeStatus, OverlayState, ProgressSnapshot, RavenCommand } from '@core/index';

const mode = ref<'orb' | 'expanded'>('expanded');
const state = ref<OverlayState>('idle');
const completed = ref(0);
const total = 5;
const progressIssue = ref<string | null>(null);
const guardrailFindings = ref<GuardrailFinding[]>([]);
const guardrailIssue = ref<string | null>(null);
const taskResult = ref<string | null>(null);
const taskIssue = ref<string | null>(null);
const autoStart = ref(false);
const ideStatus = ref<IdeStatus[]>([]);
const ideStatusIssue = ref<string | null>(null);

const stateMeta: Record<OverlayState, { label: string; icon: string }> = {
  idle: { label: 'Idle', icon: '·' },
  working: { label: 'Working', icon: '↻' },
  'needs-me': { label: 'Needs you', icon: '!' },
  done: { label: 'Done', icon: '✓' },
  failed: { label: 'Failed', icon: '×' }
};
const progress = computed(() => Math.round((completed.value / total) * 100));

function dispatch(command: RavenCommand): void {
  window.raven.dispatch(command);
}
function advance(): void {
  completed.value = Math.min(total, completed.value + 1);
  state.value = completed.value === total ? 'done' : 'working';
}
function handleCommand(command: RavenCommand): void {
  if (command.type === 'set-state') state.value = command.state;
  if (command.type === 'advance-progress') advance();
  if (command.type === 'reset-progress') {
    completed.value = 0;
    state.value = 'idle';
  }
}
function handleProgress(snapshot: ProgressSnapshot): void {
  progressIssue.value = snapshot.issues.length > 0 ? snapshot.issues[0].message : null;
  if (snapshot.document) {
    completed.value = snapshot.document.completed;
    state.value = snapshot.document.status;
  }
}
let removeCommandListener: (() => void) | undefined;
let removeModeListener: (() => void) | undefined;
let removeProgressListener: (() => void) | undefined;
let removeProgressErrorListener: (() => void) | undefined;
let removeGuardrailsListener: (() => void) | undefined;
let removeGuardrailsErrorListener: (() => void) | undefined;
let removeTaskResultListener: (() => void) | undefined;
let removeTaskErrorListener: (() => void) | undefined;
let removeAutostartListener: (() => void) | undefined;
let removeIdeStatusListener: (() => void) | undefined;
let removeIdeStatusErrorListener: (() => void) | undefined;
onMounted(() => {
  removeCommandListener = window.raven.onCommand(handleCommand);
  removeModeListener = window.raven.onWindowMode((nextMode) => { mode.value = nextMode; });
  removeProgressListener = window.raven.onProgress(handleProgress);
  removeProgressErrorListener = window.raven.onProgressError((message) => { progressIssue.value = message; });
  removeGuardrailsListener = window.raven.onGuardrails((findings) => {
    guardrailFindings.value = findings;
    guardrailIssue.value = null;
  });
  removeGuardrailsErrorListener = window.raven.onGuardrailsError((message) => { guardrailIssue.value = message; });
  removeTaskResultListener = window.raven.onTaskResult((message) => {
    taskResult.value = message;
    taskIssue.value = null;
  });
  removeTaskErrorListener = window.raven.onTaskError((message) => { taskIssue.value = message; });
  removeAutostartListener = window.raven.onAutostartStatus((enabled) => { autoStart.value = enabled; });
  removeIdeStatusListener = window.raven.onIdeStatus((status) => {
    ideStatus.value = status;
    ideStatusIssue.value = null;
  });
  removeIdeStatusErrorListener = window.raven.onIdeStatusError((message) => { ideStatusIssue.value = message; });
});
onUnmounted(() => {
  removeCommandListener?.();
  removeModeListener?.();
  removeProgressListener?.();
  removeProgressErrorListener?.();
  removeGuardrailsListener?.();
  removeGuardrailsErrorListener?.();
  removeTaskResultListener?.();
  removeTaskErrorListener?.();
  removeAutostartListener?.();
  removeIdeStatusListener?.();
  removeIdeStatusErrorListener?.();
});
</script>

<template>
  <main class="raven-shell" :class="[`state-${state}`, { orb: mode === 'orb' }]">
    <button v-if="mode === 'orb'" class="orb-button no-drag" :aria-label="`Raven: ${stateMeta[state].label}`"
      @click="dispatch({ type: 'expand' })">
      <span class="state-icon">{{ stateMeta[state].icon }}</span>
      <span class="orb-progress" :style="{ '--progress': `${progress}%` }" />
    </button>
    <section v-else class="panel">
      <header class="titlebar">
        <div class="brand"><span class="raven-mark">R</span><strong>Raven</strong></div>
        <div class="title-actions no-drag">
          <button aria-label="Minimize to orb" @click="dispatch({ type: 'minimize' })">−</button>
          <button aria-label="Close Raven" @click="dispatch({ type: 'close-app' })">×</button>
        </div>
      </header>
      <div class="status-row">
        <div class="state-icon large">{{ stateMeta[state].icon }}</div>
        <div><p class="eyebrow">CURRENT TASK</p><h1>Build overlay shell</h1><p class="muted">{{ stateMeta[state].label }} · {{ completed }}/{{ total }} steps</p></div>
      </div>
      <div class="ide-status" aria-label="Connected IDEs">
        <p class="eyebrow">IDE CONNECTIONS</p>
        <div v-if="ideStatusIssue" class="progress-warning">{{ ideStatusIssue }}</div>
        <div v-else class="ide-list">
          <span v-for="ide in ideStatus" :key="ide.id" class="ide-pill" :class="{ connected: ide.connected }">
            <i aria-hidden="true" />{{ ide.name }}: {{ ide.connected ? 'connected' : 'offline' }}
          </span>
        </div>
      </div>
      <div class="segmented-progress" role="progressbar" :aria-valuenow="completed" :aria-valuemax="total">
        <span v-for="segment in total" :key="segment" :class="{ complete: segment <= completed }" />
      </div>
      <p v-if="progressIssue" class="progress-warning">{{ progressIssue }}</p>
      <div class="dev-controls no-drag">
        <p class="eyebrow">DEV MOCK FEED</p>
        <div class="control-grid">
          <button @click="dispatch({ type: 'advance-progress' })">Advance</button>
          <button @click="dispatch({ type: 'set-state', state: 'needs-me' })">Needs me</button>
          <button @click="dispatch({ type: 'set-state', state: 'done' })">Done</button>
          <button @click="dispatch({ type: 'set-state', state: 'failed' })">Failed</button>
          <button @click="dispatch({ type: 'reset-progress' })">Reset</button>
          <button @click="dispatch({ type: 'run-guardrails' })">Guardrails</button>
          <button @click="dispatch({ type: 'copy-next-task-prompt' })">Next prompt</button>
          <button @click="dispatch({ type: 'draft-handoff' })">Handoff draft</button>
          <button @click="dispatch({ type: 'toggle-autostart' })">Auto-start: {{ autoStart ? 'on' : 'off' }}</button>
        </div>
      </div>
      <div v-if="taskResult || taskIssue" class="task-output">
        <p class="eyebrow">TASK OUTPUT</p>
        <p v-if="taskIssue" class="progress-warning">{{ taskIssue }}</p>
        <pre v-else>{{ taskResult }}</pre>
      </div>
      <div v-if="guardrailFindings.length > 0 || guardrailIssue" class="guardrails">
        <p class="eyebrow">GUARDRAILS</p>
        <p v-if="guardrailIssue" class="progress-warning">{{ guardrailIssue }}</p>
        <ul v-else>
          <li v-for="finding in guardrailFindings" :key="`${finding.file}:${finding.line}:${finding.code}`">
            <strong>{{ finding.severity }}</strong> {{ finding.message }}
            <span>{{ finding.file }}:{{ finding.line }}</span>
          </li>
        </ul>
      </div>
      <p class="footer-note">Ctrl + Shift + R toggles Raven</p>
    </section>
  </main>
</template>
