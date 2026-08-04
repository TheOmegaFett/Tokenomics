import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CycleMetrics } from '../simulation/types';

export const chartGroups = {
  'Supply composition': ['liquidActiveSupply', 'dormantSupply', 'stakedSupply', 'treasuryBalance', 'issuedSupply'],
  'Minting versus burning': ['mintedTokens', 'burnedTokens', 'netSupplyChange'],
  'Treasury balance and runway': ['treasuryBalance', 'treasuryRunway'],
  'Users': ['activeUsers', 'dormantUsers', 'newUsers', 'churnedUsers'],
  'Service demand versus completed': ['requestedServiceUnits', 'completedServiceUnits', 'serviceFulfilmentRatio'],
  'Service price and purchasing power': ['servicePrice', 'purchasingPower'],
  'Utility Value Index': ['utilityValueIndex'],
  'Fee allocation': ['totalFees', 'validatorRewards', 'treasuryIncome', 'burnedTokens'],
  'Validator count and safety threshold': ['validators', 'validatorSafetyRatio'],
  'Nominal yield versus real utility yield': ['nominalStakingYield', 'realUtilityYield'],
  'Staking ratio': ['stakingRatio'],
  'Token velocity': ['tokenVelocity'],
  'Transactions': ['transactionDemand', 'completedTransactions', 'transactionBacklog'],
  'Confidence and health score': ['userConfidence', 'economyHealthScore'],
  'Concentration': ['giniEstimate', 'topHolderShare'],
} as const;

export function MetricChart({ data, group, percent }: { data: CycleMetrics[]; group: keyof typeof chartGroups; percent: boolean }) {
  const keys = chartGroups[group];
  const palette = ['#6ee7f9', '#a7f3d0', '#fbbf24', '#f472b6', '#c4b5fd'];
  const chartData = data.map((row) => {
    const out: Record<string, number> = { cycle: row.cycle };
    for (const key of keys) {
      const value = Number(row[key as keyof CycleMetrics]);
      out[key] = percent ? value * 100 : value;
    }
    return out;
  });
  return (
    <ResponsiveContainer width="100%" height={260}>
      {group === 'Supply composition' ? (
        <AreaChart data={chartData}>
          <CartesianGrid stroke="#1d2a34" />
          <XAxis dataKey="cycle" stroke="#8aa0ad" />
          <YAxis stroke="#8aa0ad" width={70} />
          <Tooltip contentStyle={{ background: '#071016', border: '1px solid #25404c' }} />
          <Legend />
          {keys.map((key, i) => <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={palette[i]} fill={palette[i]} fillOpacity={0.22} dot={false} />)}
        </AreaChart>
      ) : (
        <LineChart data={chartData}>
          <CartesianGrid stroke="#1d2a34" />
          <XAxis dataKey="cycle" stroke="#8aa0ad" />
          <YAxis stroke="#8aa0ad" width={70} />
          <Tooltip contentStyle={{ background: '#071016', border: '1px solid #25404c' }} />
          <Legend />
          {keys.map((key, i) => <Line key={key} type="monotone" dataKey={key} stroke={palette[i]} dot={false} strokeWidth={2} />)}
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}

export function Heatmap({ cells, onPick }: { cells: { x: number; y: number; value: number; scenario: unknown }[]; onPick: (scenario: unknown) => void }) {
  if (cells.length === 0) return <div className="empty">Run a sweep to populate the heatmap.</div>;
  const xs = [...new Set(cells.map((c) => c.x))];
  const ys = [...new Set(cells.map((c) => c.y))];
  const values = cells.map((c) => c.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return (
    <div className="heatmap" style={{ gridTemplateColumns: `repeat(${xs.length}, minmax(28px, 1fr))` }}>
      {ys.flatMap((y) => xs.map((x) => {
        const cell = cells.find((c) => c.x === x && c.y === y)!;
        const t = (cell.value - min) / Math.max(0.0001, max - min);
        return <button key={`${x}-${y}`} style={{ background: `hsl(${190 * t}, 70%, ${22 + t * 35}%)` }} title={`x ${x.toFixed(2)}, y ${y.toFixed(2)}: ${cell.value.toFixed(3)}`} onClick={() => onPick(cell.scenario)}>{cell.value.toFixed(1)}</button>;
      }))}
    </div>
  );
}
