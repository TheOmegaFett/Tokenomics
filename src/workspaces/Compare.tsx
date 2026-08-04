import { useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { runSimulation } from '../simulation/engine';
import type { Scenario } from '../simulation/types';

export function Compare({ scenarios }: { scenarios: Scenario[] }) {
  const [selected, setSelected] = useState<string[]>(scenarios.slice(0, 3).map((s) => s.id));
  const [cycles, setCycles] = useState(365);
  const [seed, setSeed] = useState(4242);
  const results = useMemo(() => selected.map((id) => {
    const scenario = scenarios.find((s) => s.id === id) ?? scenarios[0];
    return runSimulation({ ...scenario, params: { ...scenario.params, seed, cycles } }, cycles);
  }), [selected, scenarios, cycles, seed]);
  const data = Array.from({ length: Math.max(...results.map((r) => r.metrics.length), 1) }, (_, i) => {
    const row: Record<string, number> = { cycle: i + 1 };
    for (const result of results) row[result.scenario.name] = result.metrics[i]?.economyHealthScore ?? 0;
    return row;
  });
  const explanation = explainDivergence(results);
  return (
    <div className="workspace stacked">
      <section className="panel toolbar">
        <label>Same seed<input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} /></label>
        <label>Same cycles<input type="number" value={cycles} min={1} max={10000} onChange={(e) => setCycles(Number(e.target.value))} /></label>
        <select multiple value={selected} onChange={(e) => setSelected(Array.from(e.target.selectedOptions).map((o) => o.value).slice(0, 3))}>{scenarios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
      </section>
      <section className="panel"><h2>Overlaid Health Score</h2><ResponsiveContainer width="100%" height={280}><LineChart data={data}><CartesianGrid stroke="#1d2a34" /><XAxis dataKey="cycle" stroke="#8aa0ad" /><YAxis stroke="#8aa0ad" /><Tooltip contentStyle={{ background: '#071016', border: '1px solid #25404c' }} /><Legend />{results.map((r, i) => <Line key={r.scenario.id} dataKey={r.scenario.name} stroke={['#6ee7f9', '#fbbf24', '#f472b6'][i]} dot={false} />)}</LineChart></ResponsiveContainer></section>
      <section className="comparison-grid">
        {results.map((r) => {
          const last = r.metrics.at(-1);
          const firstFailure = r.metrics.find((m) => m.diagnoses.some((d) => d.severity === 'critical'))?.cycle ?? 'none';
          return <div className="panel" key={r.scenario.id}><h2>{r.scenario.name}</h2><dl><dt>Final health</dt><dd>{last?.economyHealthScore.toFixed(1)}</dd><dt>First failure</dt><dd>{firstFailure}</dd><dt>Purchasing-power change</dt><dd>{(((last?.purchasingPower ?? 1) / r.scenario.params.initialServicePrice - 1) * 100).toFixed(1)}%</dd><dt>Nominal / real yield</dt><dd>{((last?.nominalStakingYield ?? 0) * 100).toFixed(1)}% / {((last?.realUtilityYield ?? 0) * 100).toFixed(1)}%</dd><dt>Treasury</dt><dd>{last?.treasuryBalance.toFixed(0)}</dd><dt>Active users</dt><dd>{last?.activeUsers}</dd></dl><div className="mini-components">{last && Object.entries(last.healthComponents).map(([k, v]) => <span key={k}>{k}: {v.toFixed(0)}</span>)}</div></div>;
        })}
      </section>
      <section className="panel"><h2>Why Outcomes Diverged</h2><ul>{explanation.map((line) => <li key={line}>{line}</li>)}</ul></section>
    </div>
  );
}

function explainDivergence(results: ReturnType<typeof runSimulation>[]): string[] {
  if (results.length < 2) return ['Select at least two scenarios.'];
  const sorted = [...results].sort((a, b) => (b.metrics.at(-1)?.economyHealthScore ?? 0) - (a.metrics.at(-1)?.economyHealthScore ?? 0));
  const best = sorted[0], worst = sorted.at(-1)!;
  const b = best.metrics.at(-1), w = worst.metrics.at(-1);
  if (!b || !w) return ['No completed metrics are available.'];
  const lines = [`${best.scenario.name} finished ${(b.economyHealthScore - w.economyHealthScore).toFixed(1)} health points above ${worst.scenario.name}.`];
  if (b.serviceFulfilmentRatio > w.serviceFulfilmentRatio + 0.1) lines.push('Higher service fulfilment explains a material part of the gap.');
  if (b.treasuryBalance > w.treasuryBalance * 1.5) lines.push('Treasury reserves lasted longer and supported rewards or onboarding.');
  if (b.validators > w.validators) lines.push('Validator survival improved reliability and confidence.');
  if (b.realUtilityYield > w.realUtilityYield + 0.05) lines.push('Real utility yield stayed healthier after purchasing-power adjustment.');
  if (w.diagnoses.some((d) => d.severity === 'critical')) lines.push(`${worst.scenario.name} crossed critical diagnoses: ${w.diagnoses.filter((d) => d.severity === 'critical').map((d) => d.label).join(', ')}.`);
  return lines;
}
