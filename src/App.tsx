import { useEffect, useMemo, useState } from 'react';
import { Compare } from './workspaces/Compare';
import { StressLab } from './workspaces/StressLab';
import { Simulator } from './workspaces/Simulator';
import { ModelInspector } from './workspaces/ModelInspector';
import { runSimulation } from './simulation/engine';
import { presets } from './simulation/presets';
import type { Scenario } from './simulation/types';
import { loadScenarios, saveScenarios, upsertScenario } from './state/storage';

type Workspace = 'SIMULATOR' | 'COMPARE' | 'STRESS LAB' | 'MODEL INSPECTOR';

export function App() {
  const [workspace, setWorkspace] = useState<Workspace>('SIMULATOR');
  const [scenarios, setScenarios] = useState<Scenario[]>(loadScenarios);
  const [scenario, setScenario] = useState<Scenario>(scenarios[0] ?? presets[0]);
  const [result, setResult] = useState(() => runSimulation(scenario));
  const critical = result.metrics.at(-1)?.diagnoses.some((d) => d.severity === 'critical');
  useEffect(() => saveScenarios(scenarios), [scenarios]);
  useEffect(() => setResult(runSimulation(scenario)), [scenario]);
  const allScenarios = useMemo(() => {
    const ids = new Set(scenarios.map((s) => s.id));
    return [...scenarios, ...presets.filter((p) => !ids.has(p.id))];
  }, [scenarios]);
  const save = (s: Scenario) => setScenarios((existing) => upsertScenario(existing, s));
  const duplicate = (s: Scenario) => {
    const copy = { ...s, id: crypto.randomUUID(), name: `${s.name} Copy`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setScenario(copy);
    save(copy);
  };
  return (
    <div className="app">
      <header className="topbar">
        <div><h1>TOKENOMICS LAB</h1><p>Local-first fictional service-economy simulator. No fiat, markets, wallets, or live chain connections.</p></div>
        <nav>{(['SIMULATOR', 'COMPARE', 'STRESS LAB', 'MODEL INSPECTOR'] as Workspace[]).map((tab) => <button key={tab} className={workspace === tab ? 'active' : ''} onClick={() => setWorkspace(tab)}>{tab}</button>)}</nav>
      </header>
      <div className="preset-strip">
        <label>Load scenario<select value={scenario.id} onChange={(e) => {
          const picked = allScenarios.find((s) => s.id === e.target.value);
          if (picked) setScenario({ ...picked, params: { ...picked.params }, shocks: [...picked.shocks] });
        }}>{allScenarios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label>Preset<select value="" onChange={(e) => {
          const picked = presets.find((p) => p.id === e.target.value);
          if (picked) setScenario({ ...picked, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        }}><option value="">Choose preset</option>{presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        {critical && <strong className="status critical">critical diagnosis active</strong>}
        {result.failed && <strong className="status critical">simulation stopped: {result.failure}</strong>}
      </div>
      {workspace === 'SIMULATOR' && <Simulator scenario={scenario} onScenario={setScenario} onSave={save} onDuplicate={duplicate} result={result} setResult={setResult} />}
      {workspace === 'COMPARE' && <Compare scenarios={allScenarios} />}
      {workspace === 'STRESS LAB' && <StressLab scenario={scenario} onScenario={setScenario} />}
      {workspace === 'MODEL INSPECTOR' && <ModelInspector scenario={scenario} metrics={result.metrics} />}
    </div>
  );
}
