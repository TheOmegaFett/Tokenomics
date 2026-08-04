import { runSimulation } from './engine';
import type { Scenario, SimulationParams, SweepCell, SweepConfig, SweepResult } from './types';

export function numericParamKeys(params: SimulationParams): (keyof SimulationParams)[] {
  return Object.entries(params).filter(([, value]) => typeof value === 'number').map(([key]) => key as keyof SimulationParams);
}

export function runSweep(config: SweepConfig, onProgress?: (done: number, total: number) => void, cancelled?: () => boolean): SweepResult {
  const xValues = values(config.xMin, config.xMax, config.xSteps);
  const yValues = values(config.yMin, config.yMax, config.ySteps);
  const cells: SweepCell[] = [];
  const total = xValues.length * yValues.length;
  let done = 0;
  for (const y of yValues) {
    for (const x of xValues) {
      if (cancelled?.()) return { cells, xValues, yValues };
      const cellScenario = withParam(withParam(config.scenario, config.xParam, x), config.yParam, y);
      const outputs: number[] = [];
      for (let seed = 0; seed < config.seedsPerCell; seed += 1) {
        const scenario = withParam(cellScenario, 'seed', config.scenario.params.seed + seed);
        const result = runSimulation(scenario);
        const last = result.metrics.at(-1);
        if (!last) continue;
        const firstFailure = result.metrics.find((m) => m.diagnoses.some((d) => d.severity === 'critical'))?.cycle ?? config.scenario.params.cycles;
        outputs.push(
          config.outputMetric === 'finalHealthScore' ? last.economyHealthScore :
          config.outputMetric === 'collapseProbability' ? (result.failed || last.economyHealthScore < 35 ? 1 : 0) :
          config.outputMetric === 'finalPurchasingPower' ? last.purchasingPower :
          config.outputMetric === 'treasurySurvival' ? (last.treasuryBalance > config.scenario.params.treasuryMinimumReserve ? 1 : 0) :
          config.outputMetric === 'validatorSurvival' ? (last.validators >= config.scenario.params.minimumSafeValidators ? 1 : 0) :
          config.outputMetric === 'finalActiveUsers' ? last.activeUsers :
          config.outputMetric === 'realUtilityYield' ? last.realUtilityYield :
          firstFailure,
        );
      }
      cells.push({ x, y, value: outputs.reduce((a, b) => a + b, 0) / Math.max(1, outputs.length), scenario: cellScenario });
      done += 1;
      onProgress?.(done, total);
    }
  }
  return { cells, xValues, yValues };
}

function values(min: number, max: number, steps: number): number[] {
  const count = Math.max(2, Math.round(steps));
  return Array.from({ length: count }, (_, i) => min + ((max - min) * i) / (count - 1));
}

function withParam(scenario: Scenario, key: keyof SimulationParams, value: number): Scenario {
  return { ...scenario, params: { ...scenario.params, [key]: value } };
}
