import type { CycleMetrics, Scenario, SimulationResult } from './types';

export interface VersionedScenarioPayload {
  kind: 'tokenomics-lab.scenario';
  version: 1;
  scenario: Scenario;
}

export interface VersionedResultPayload {
  kind: 'tokenomics-lab.result';
  version: 1;
  result: SimulationResult;
}

export function scenarioToJson(scenario: Scenario): string {
  return JSON.stringify({ kind: 'tokenomics-lab.scenario', version: 1, scenario } satisfies VersionedScenarioPayload, null, 2);
}

export function resultToJson(result: SimulationResult): string {
  return JSON.stringify({ kind: 'tokenomics-lab.result', version: 1, result } satisfies VersionedResultPayload, null, 2);
}

export function parseScenarioJson(input: string): Scenario {
  const parsed = JSON.parse(input) as unknown;
  const scenario = isScenarioPayload(parsed) ? parsed.scenario : parsed;
  if (!isScenario(scenario)) {
    throw new Error('Invalid scenario JSON: missing name, params, or shocks.');
  }
  return {
    ...(scenario as Scenario),
    version: 1,
    updatedAt: new Date().toISOString(),
  };
}

function isScenarioPayload(value: unknown): value is VersionedScenarioPayload {
  return typeof value === 'object' && value !== null && 'scenario' in value;
}

function isScenario(value: unknown): value is Scenario {
  return typeof value === 'object' && value !== null && 'name' in value && 'params' in value && 'shocks' in value && Array.isArray((value as { shocks: unknown }).shocks);
}

export function metricsToCsv(metrics: CycleMetrics[]): string {
  if (metrics.length === 0) return '';
  const keys = Object.keys(metrics[0]).filter((key) => !['diagnoses', 'healthComponents', 'events', 'failureSignals', 'components'].includes(key)) as (keyof CycleMetrics)[];
  const escape = (value: unknown) => {
    if (typeof value === 'number') return String(value);
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  };
  return [keys.join(','), ...metrics.map((row) => keys.map((key) => escape(row[key])).join(','))].join('\n');
}

export function explainMetricChange(metrics: CycleMetrics[], cycle: number, metric: keyof CycleMetrics): string[] {
  const current = metrics.find((m) => m.cycle === cycle);
  const previous = metrics.find((m) => m.cycle === cycle - 1);
  if (!current || !previous) return ['Select a cycle after the first recorded cycle.'];
  const cur = current[metric];
  const prev = previous[metric];
  if (typeof cur !== 'number' || typeof prev !== 'number') return ['This metric is descriptive and does not have numeric contributors.'];
  const change = cur - prev;
  const c = current.components;
  const reasons: string[] = [];
  if (metric === 'purchasingPower' || metric === 'utilityValueIndex') {
    if (c.liquidSupplyEffect > 0.05) reasons.push('liquid supply rose, increasing token spend pressure');
    if (c.velocityEffect > 0.03) reasons.push('spending velocity increased');
    if (c.serviceOutputEffect < -0.03) reasons.push('service output fell');
    if (c.congestionEffect < -0.1) reasons.push('congestion reduced completed utility');
    if (c.stakingOffset > 0.18) reasons.push('staking partially removed liquid tokens from circulation');
  }
  if (metric === 'economyHealthScore') {
    const entries = Object.entries(current.healthComponents).sort((a, b) => a[1] - b[1]).slice(0, 3);
    reasons.push(...entries.map(([name, value]) => `${name} is scoring ${value.toFixed(0)}/100`));
  }
  if (metric === 'treasuryBalance') reasons.push(change < 0 ? 'treasury expenditure exceeded fee income' : 'fee income, grants, or rescue issuance increased treasury reserves');
  if (metric === 'validators') reasons.push(change < 0 ? 'expected validator rewards fell below operating costs' : 'validator rewards and confidence supported new validators');
  if (reasons.length === 0) reasons.push(change >= 0 ? 'positive model contributors outweighed negative pressure' : 'negative model contributors outweighed positive support');
  return reasons;
}
