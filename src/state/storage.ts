import { makeScenario } from '../simulation/defaults';
import { presets } from '../simulation/presets';
import type { Scenario } from '../simulation/types';

const KEY = 'tokenomics-lab.scenarios.v1';

export function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [presets[0]];
    const parsed = JSON.parse(raw) as Scenario[];
    return parsed.length > 0 ? parsed : [presets[0]];
  } catch {
    return [makeScenario()];
  }
}

export function saveScenarios(scenarios: Scenario[]): void {
  localStorage.setItem(KEY, JSON.stringify(scenarios));
}

export function upsertScenario(scenarios: Scenario[], scenario: Scenario): Scenario[] {
  const next = { ...scenario, updatedAt: new Date().toISOString() };
  return scenarios.some((s) => s.id === scenario.id) ? scenarios.map((s) => (s.id === scenario.id ? next : s)) : [...scenarios, next];
}
