import { useMemo, useRef, useState } from 'react';
import { Heatmap } from '../components/Charts';
import { numericParamKeys } from '../simulation/sweep';
import { shockLabels } from '../simulation/shocks';
import type { Scenario, Shock, ShockType, SweepConfig, SweepResult } from '../simulation/types';

export function StressLab({ scenario, onScenario }: { scenario: Scenario; onScenario: (scenario: Scenario) => void }) {
  const [draft, setDraft] = useState<Shock>({ id: 'shock', type: 'validatorOutage', startCycle: 50, duration: 20, magnitude: 0.4, gradualRecovery: true });
  const keys = useMemo(() => numericParamKeys(scenario.params), [scenario.params]);
  const [config, setConfig] = useState<SweepConfig>({ scenario, xParam: 'burnShare', yParam: 'fixedNewUsersPerCycle', xMin: 0, xMax: 0.5, yMin: 0, yMax: 250, xSteps: 8, ySteps: 8, seedsPerCell: 2, outputMetric: 'finalHealthScore' });
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<SweepResult>();
  const workerRef = useRef<Worker | null>(null);
  const addShock = () => onScenario({ ...scenario, shocks: [...scenario.shocks, { ...draft, id: crypto.randomUUID() }] });
  const run = () => {
    workerRef.current?.terminate();
    const worker = new Worker(new URL('../workers/simulation.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<{ type: string; done?: number; total?: number; result?: SweepResult; error?: string }>) => {
      if (event.data.type === 'progress') setProgress(`${event.data.done}/${event.data.total}`);
      if (event.data.type === 'result' && event.data.result) { setResult(event.data.result); setProgress('complete'); worker.terminate(); }
      if (event.data.type === 'error') setProgress(event.data.error ?? 'worker error');
    };
    worker.postMessage({ type: 'sweep', config: { ...config, scenario } });
  };
  return (
    <div className="workspace stacked">
      <section className="panel"><h2>Shock Scheduler</h2><div className="shock-grid">
        <label>Shock<select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as ShockType })}>{Object.entries(shockLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Start cycle<input type="number" value={draft.startCycle} min={1} onChange={(e) => setDraft({ ...draft, startCycle: Number(e.target.value) })} /></label>
        <label>Duration<input type="number" value={draft.duration} min={1} onChange={(e) => setDraft({ ...draft, duration: Number(e.target.value) })} /></label>
        <label>Magnitude<input type="number" value={draft.magnitude} step="0.05" onChange={(e) => setDraft({ ...draft, magnitude: Number(e.target.value) })} /></label>
        <label className="check"><input type="checkbox" checked={draft.gradualRecovery} onChange={(e) => setDraft({ ...draft, gradualRecovery: e.target.checked })} /> Gradual recovery</label>
        <button onClick={addShock}>Add shock</button>
      </div><div className="timeline">{scenario.shocks.map((s) => <span key={s.id}>Cycle {s.startCycle}: {shockLabels[s.type]} x{s.magnitude}</span>)}</div></section>
      <section className="panel"><h2>Parameter Sweep</h2><div className="shock-grid">
        <label>X parameter<select value={config.xParam} onChange={(e) => setConfig({ ...config, xParam: e.target.value as SweepConfig['xParam'] })}>{keys.map((k) => <option key={String(k)} value={String(k)}>{String(k)}</option>)}</select></label>
        <label>Y parameter<select value={config.yParam} onChange={(e) => setConfig({ ...config, yParam: e.target.value as SweepConfig['yParam'] })}>{keys.map((k) => <option key={String(k)} value={String(k)}>{String(k)}</option>)}</select></label>
        {(['xMin', 'xMax', 'xSteps', 'yMin', 'yMax', 'ySteps', 'seedsPerCell'] as const).map((k) => <label key={k}>{k}<input type="number" value={config[k]} onChange={(e) => setConfig({ ...config, [k]: Number(e.target.value) })} /></label>)}
        <label>Output<select value={config.outputMetric} onChange={(e) => setConfig({ ...config, outputMetric: e.target.value as SweepConfig['outputMetric'] })}><option value="finalHealthScore">Final health score</option><option value="collapseProbability">Collapse probability</option><option value="finalPurchasingPower">Final purchasing power</option><option value="treasurySurvival">Treasury survival</option><option value="validatorSurvival">Validator survival</option><option value="finalActiveUsers">Final active users</option><option value="realUtilityYield">Real utility yield</option><option value="firstFailureCycle">First failure cycle</option></select></label>
        <button onClick={run}>Run sweep</button><button onClick={() => { workerRef.current?.postMessage({ type: 'cancel' }); setProgress('cancelling'); }}>Cancel</button>
      </div><p>Progress: {progress || 'idle'}</p>{result && <Heatmap cells={result.cells} onPick={(s) => onScenario(s as Scenario)} />}</section>
    </div>
  );
}
