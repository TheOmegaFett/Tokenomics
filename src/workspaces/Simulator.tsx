import { Copy, Download, FileDown, FileUp, Pause, Play, RotateCcw, Save, SkipForward, StepForward } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { chartGroups, MetricChart } from '../components/Charts';
import { ParameterControls, sections } from '../components/Controls';
import { defaultParams } from '../simulation/defaults';
import { runSimulation } from '../simulation/engine';
import { normalizeFeeShares } from '../simulation/invariants';
import { metricsToCsv, parseScenarioJson, resultToJson, scenarioToJson } from '../simulation/metrics';
import type { CycleMetrics, Scenario, SimulationParams, SimulationResult } from '../simulation/types';
import { downloadText, readFile } from '../utilities/download';

interface Props {
  scenario: Scenario;
  onScenario: (scenario: Scenario) => void;
  onSave: (scenario: Scenario) => void;
  onDuplicate: (scenario: Scenario) => void;
  result: SimulationResult;
  setResult: Dispatch<SetStateAction<SimulationResult>>;
}

const fmt = (n: number, digits = 2) => Math.abs(n) >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: digits }) : n.toFixed(digits);

export function Simulator({ scenario, onScenario, onSave, onDuplicate, result, setResult }: Props) {
  const [chart, setChart] = useState<keyof typeof chartGroups>('Supply composition');
  const [percent, setPercent] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [playing, setPlaying] = useState(false);
  const playbackRef = useRef({ baseCycle: 0, startedAt: 0 });
  const [range, setRange] = useState<[number, number]>([1, scenario.params.cycles]);
  const fileRef = useRef<HTMLInputElement>(null);
  const latest = result.metrics.at(-1);
  const visible = useMemo(() => result.metrics.filter((m) => m.cycle >= range[0] && m.cycle <= range[1]), [result.metrics, range]);
  const updateParams = (patch: Partial<SimulationParams>) => onScenario({ ...scenario, params: normalizeFeeShares({ ...scenario.params, ...patch }), updatedAt: new Date().toISOString() });
  useEffect(() => setPlaying(false), [scenario]);
  useEffect(() => {
    if (!playing) return;
    if (result.failed || result.metrics.length >= scenario.params.cycles) {
      setPlaying(false);
      return;
    }
    const { baseCycle, startedAt } = playbackRef.current;
    const nextCycle = result.metrics.length + 1;
    const dueAt = startedAt + (nextCycle - baseCycle) * 1000 / speed;
    const timer = window.setTimeout(() => {
      const elapsedCycles = Math.floor((performance.now() - startedAt) * speed / 1000);
      const targetCycle = Math.min(scenario.params.cycles, Math.max(nextCycle, baseCycle + elapsedCycles));
      setResult(runSimulation(scenario, targetCycle));
    }, Math.max(0, dueAt - performance.now()));
    return () => window.clearTimeout(timer);
  }, [playing, result, scenario, setResult, speed]);
  const play = () => {
    const restarting = result.failed || result.metrics.length >= scenario.params.cycles;
    playbackRef.current = { baseCycle: restarting ? 0 : result.metrics.length, startedAt: performance.now() };
    if (restarting) setResult(runSimulation(scenario, 0));
    setPlaying(true);
  };
  const step = () => {
    setPlaying(false);
    const nextCycle = result.failed || result.metrics.length >= scenario.params.cycles ? 1 : result.metrics.length + 1;
    setResult(runSimulation(scenario, nextCycle));
  };
  const importScenario = async (file?: File) => {
    if (!file) return;
    const imported = parseScenarioJson(await readFile(file));
    onScenario(imported);
    setResult(runSimulation(imported));
  };
  return (
    <div className="workspace simulator">
      <aside className="panel sidebar">
        <label className="scenario-name"><span>Scenario name</span><input value={scenario.name} onChange={(e) => onScenario({ ...scenario, name: e.target.value })} /></label>
        <div className="runbar">
          <button onClick={play} disabled={playing} title="Play simulation"><Play size={16} />Play</button>
          <button onClick={() => setPlaying(false)} disabled={!playing} title="Pause simulation"><Pause size={16} />Pause</button>
          <button onClick={step} title="Single-cycle step"><StepForward size={16} />Step</button>
          <button onClick={() => { setPlaying(false); setResult(runSimulation(scenario, 0)); }} title="Reset"><RotateCcw size={16} />Reset</button>
          <button onClick={() => { setPlaying(false); setResult(runSimulation(scenario)); }} title="Run to completion"><SkipForward size={16} />Complete</button>
        </div>
        <output aria-label="Simulation progress">Cycle {result.metrics.length} of {scenario.params.cycles}</output>
        <label><span>Simulation speed: {speed} cycles per second</span><input type="range" min="1" max="60" value={speed} onChange={(e) => {
          if (playing) playbackRef.current = { baseCycle: result.metrics.length, startedAt: performance.now() };
          setSpeed(Number(e.target.value));
        }} /></label>
        <div className="runbar">
          <button onClick={() => onSave(scenario)}><Save size={16} />Save</button>
          <button onClick={() => onDuplicate(scenario)}><Copy size={16} />Duplicate</button>
          <button onClick={() => fileRef.current?.click()}><FileUp size={16} />Import</button>
          <button onClick={() => downloadText(`${scenario.name}.scenario.json`, scenarioToJson(scenario), 'application/json')}><Download size={16} />Scenario</button>
          <button onClick={() => downloadText(`${scenario.name}.result.json`, resultToJson(result), 'application/json')}><FileDown size={16} />Result</button>
          <button onClick={() => downloadText(`${scenario.name}.cycles.csv`, metricsToCsv(result.metrics), 'text/csv')}><FileDown size={16} />CSV</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => void importScenario(e.target.files?.[0])} />
        </div>
        <ParameterControls params={scenario.params} onChange={updateParams} onReset={(title) => {
          const patch: Partial<SimulationParams> = {};
          for (const field of sections.find((s) => s.title === title)?.fields ?? []) patch[field.key] = defaultParams[field.key] as never;
          updateParams(patch);
        }} />
      </aside>
      <main className="main-grid">
        <section className="headline">
          {[
            ['Health', latest?.economyHealthScore ?? 0, '0-100 transparent health score'],
            ['Utility index', latest?.utilityValueIndex ?? 1, 'Simulated utility value index, not a market price'],
            ['Purchasing power', latest?.purchasingPower ?? 1, 'Service units purchasable per token'],
            ['Treasury', latest?.treasuryBalance ?? scenario.params.initialTreasuryAllocation, 'Treasury token reserve'],
            ['Validators', latest?.validators ?? scenario.params.initialValidators, 'Current validator count'],
            ['Real utility yield', latest?.realUtilityYield ?? 0, 'Nominal yield adjusted by purchasing-power change'],
          ].map(([label, value, tip]) => <div className="metric" title={String(tip)} key={String(label)}><span>{label}</span><strong>{fmt(Number(value))}</strong></div>)}
        </section>
        {latest?.failureSignals.length ? <section className="warning critical">Invariant stopped simulation: {latest.failureSignals.join('; ')}</section> : null}
        <section className="panel chart-panel">
          <div className="toolbar">
            <select value={chart} onChange={(e) => setChart(e.target.value as keyof typeof chartGroups)}>{Object.keys(chartGroups).map((c) => <option key={c}>{c}</option>)}</select>
            <label className="check"><input type="checkbox" checked={percent} onChange={(e) => setPercent(e.target.checked)} /> Percentage view</label>
            <label>Cycle start<input type="number" min="1" max={scenario.params.cycles} value={range[0]} onChange={(e) => setRange([Number(e.target.value), range[1]])} /></label>
            <label>End<input type="number" min="1" max={scenario.params.cycles} value={range[1]} onChange={(e) => setRange([range[0], Number(e.target.value)])} /></label>
          </div>
          <MetricChart data={visible} group={chart} percent={percent} />
        </section>
        <section className="panel"><h2>Token Flow</h2><Flow latest={latest} /></section>
        <section className="panel"><h2>Economy Diagnosis</h2><DiagnosisList latest={latest} /></section>
        <section className="panel"><h2>Event Timeline</h2><div className="timeline">{result.events.slice(-20).map((e, i) => <span key={`${e.cycle}-${i}`}>Cycle {e.cycle}: {e.label}</span>)}{result.events.length === 0 && <span>No shocks or runtime events recorded.</span>}</div></section>
        <section className="panel"><h2>Accounting Invariant</h2><code>{latest?.invariant}</code></section>
      </main>
    </div>
  );
}

function Flow({ latest }: { latest?: CycleMetrics }) {
  if (!latest) return null;
  return <div className="flow"><span>Minted {fmt(latest.mintedTokens)}</span><span>Burned {fmt(latest.burnedTokens)}</span><span>Fees {fmt(latest.totalFees)}</span><span>Validator rewards {fmt(latest.validatorRewards)}</span><span>Treasury spend {fmt(latest.treasuryExpenditure)}</span><span>Net supply {fmt(latest.netSupplyChange)}</span></div>;
}

export function DiagnosisList({ latest }: { latest?: CycleMetrics }) {
  return <div className="diagnoses">{latest?.diagnoses.map((d) => <div key={d.label} className={`diag ${d.severity}`}><strong>{d.label}</strong><span>{d.reason}</span></div>)}</div>;
}
