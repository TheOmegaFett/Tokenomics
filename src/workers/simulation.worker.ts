import { runSweep } from '../simulation/sweep';
import type { SweepConfig } from '../simulation/types';

let cancelled = false;

self.onmessage = (event: MessageEvent<{ type: 'sweep'; config: SweepConfig } | { type: 'cancel' }>) => {
  if (event.data.type === 'cancel') {
    cancelled = true;
    return;
  }
  cancelled = false;
  try {
    const result = runSweep(
      event.data.config,
      (done, total) => self.postMessage({ type: 'progress', done, total }),
      () => cancelled,
    );
    self.postMessage({ type: 'result', result });
  } catch (error) {
    self.postMessage({ type: 'error', error: error instanceof Error ? error.message : String(error) });
  }
};
