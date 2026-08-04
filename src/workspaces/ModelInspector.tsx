import { useState } from 'react';
import { explainMetricChange } from '../simulation/metrics';
import type { CycleMetrics, Scenario } from '../simulation/types';

export function ModelInspector({ scenario, metrics }: { scenario: Scenario; metrics: CycleMetrics[] }) {
  const [cycle, setCycle] = useState(2);
  const [metric, setMetric] = useState<keyof CycleMetrics>('purchasingPower');
  const latest = metrics.at(-1);
  const reasons = explainMetricChange(metrics, cycle, metric);
  return (
    <div className="workspace inspector">
      <section className="panel"><h2>Current Parameters</h2><div className="param-table">{Object.entries(scenario.params).map(([k, v]) => <span key={k}><b>{k}</b>{String(v)}</span>)}</div></section>
      <section className="panel"><h2>Cycle Processing Order</h2><ol>{['Add users', 'Reactivate dormant users', 'Select active users and providers', 'Request demand', 'Calculate provider and network capacity', 'Complete services', 'Transfer service payments', 'Collect protocol fees', 'Allocate fees to validators, treasury, community, burns', 'Calculate validator rewards', 'Stake and unstake', 'Apply minting policy', 'Apply burns', 'Treasury subsidies and grants', 'Churn and dormancy', 'Update confidence, service price, purchasing power', 'Verify invariants', 'Record metrics and failure signals'].map((x) => <li key={x}>{x}</li>)}</ol></section>
      <section className="panel"><h2>Equations and Identities</h2><code className="formula">blocksPerCycle = cycleDurationSeconds / blockTimeSeconds</code><code className="formula">transactionCapacity = blocksPerCycle x transactionsPerBlock x networkUptimeFactor</code><code className="formula">desiredTokenSpend = activeLiquidTokens x spendPropensity x confidence</code><code className="formula">marketClearingPrice = desiredTokenSpend / max(completedServiceUnits, epsilon)</code><code className="formula">purchasingPower = 1 / averageServicePrice</code><code className="formula">issuedSupply = liquidActive + liquidDormant + staked + treasury + communityRewardPool</code><code className="formula">endingIssuedSupply = startingIssuedSupply + mintedThisCycle - burnedThisCycle</code></section>
      <section className="panel"><h2>Health Score Components</h2>{latest && Object.entries(latest.healthComponents).map(([k, v]) => <div className="bar" key={k}><span>{k}</span><meter min="0" max="100" value={v} /> <b>{v.toFixed(0)}</b></div>)}<p>Components: supply discipline, treasury sustainability, validator security, service fulfilment, user retention, purchasing-power stability, circulation health, and decentralization. The score is their average.</p></section>
      <section className="panel"><h2>Why Did This Change?</h2><div className="toolbar"><label>Cycle<input type="number" min="2" max={metrics.length} value={cycle} onChange={(e) => setCycle(Number(e.target.value))} /></label><label>Metric<select value={String(metric)} onChange={(e) => setMetric(e.target.value as keyof CycleMetrics)}>{metrics[0] && Object.keys(metrics[0]).filter((k) => typeof metrics[0][k as keyof CycleMetrics] === 'number').map((k) => <option key={k}>{k}</option>)}</select></label></div><p>{String(metric)} changed because:</p><ul>{reasons.map((r) => <li key={r}>{r}</li>)}</ul></section>
      <section className="panel"><h2>Assumptions and Simplifications</h2><p>No fiat, markets, wallets, chains, or investment returns are modeled. Participants are aggregate cohorts, not individual accounts. Prices are internal tokens per abstract service unit. APY is an experimental output and is not guaranteed.</p><p>Fee shares are normalized to 100%, minting is capped by remaining supply, burn replacement is limited to eligible unreplaced burns, and treasury transfers conserve issued supply.</p></section>
    </div>
  );
}
