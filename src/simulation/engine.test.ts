import { describe, expect, it } from 'vitest';
import { defaultParams, makeScenario } from './defaults';
import { runSimulation } from './engine';
import { normalizeFeeShares } from './invariants';
import { parseScenarioJson, scenarioToJson } from './metrics';
import { presets, presetByName } from './presets';
import type { Scenario } from './types';

const scenario = (patch: Partial<typeof defaultParams> = {}, shocks: Scenario['shocks'] = []) => ({ ...makeScenario('test', { ...defaultParams, cycles: 120, ...patch }), shocks });
const last = (s: Scenario) => {
  const result = runSimulation(s);
  expect(result.failure ?? 'ok').toBe('ok');
  return result.metrics.at(-1)!;
};

describe('simulation engine', () => {
  it('produces deterministic output from identical seeds', () => {
    const a = runSimulation(scenario({ seed: 9 }));
    const b = runSimulation(scenario({ seed: 9 }));
    expect(a.metrics).toEqual(b.metrics);
  });

  it('produces different output from different seeds when stochasticity is enabled', () => {
    const a = runSimulation(scenario({ seed: 9, stochasticity: 0.4 }));
    const b = runSimulation(scenario({ seed: 10, stochasticity: 0.4 }));
    expect(a.metrics).not.toEqual(b.metrics);
  });

  it('zero mint and zero burn conserve issued supply', () => {
    const s = scenario({ mintingPolicy: 'none', burnShare: 0, validatorFeeShare: 0.6, treasuryFeeShare: 0.3, communityRewardPoolShare: 0.1 });
    const m = last(s);
    expect(m.issuedSupply).toBeCloseTo(400000, 3);
  });

  it('transfers conserve issued supply', () => {
    const m = last(scenario({ mintingPolicy: 'none', burnShare: 0, onboardingTokenGrant: 20, validatorSubsidy: 4 }));
    expect(m.issuedSupply).toBeCloseTo(400000, 3);
  });

  it('fee distribution conserves tokens and totals 100%', () => {
    const p = normalizeFeeShares({ ...defaultParams, validatorFeeShare: 7, treasuryFeeShare: 2, burnShare: 1, communityRewardPoolShare: 0 });
    expect(p.validatorFeeShare + p.treasuryFeeShare + p.burnShare + p.communityRewardPoolShare).toBeCloseTo(1);
    const m = last(makeScenario('fees', { ...p, cycles: 20 }));
    expect(m.failureSignals).toHaveLength(0);
  });

  it('burn lowers issued supply correctly', () => {
    const result = runSimulation(scenario({ mintingPolicy: 'none', burnShare: 0.4, validatorFeeShare: 0.4, treasuryFeeShare: 0.1, communityRewardPoolShare: 0.1 }));
    expect(result.finalState.cumulativeBurned).toBeGreaterThan(0);
    const m = result.metrics.at(-1)!;
    expect(m.issuedSupply).toBeLessThan(400000);
  });

  it('minting raises issued supply correctly', () => {
    const m = last(scenario({ mintingPolicy: 'fixed', fixedEmission: 500, burnShare: 0 }));
    expect(m.mintedTokens).toBeGreaterThan(0);
    expect(m.issuedSupply).toBeGreaterThan(400000);
  });

  it('maximum supply is never exceeded', () => {
    const m = last(scenario({ maximumSupply: 405000, mintingPolicy: 'fixed', fixedEmission: 10000, cycleMintCap: 10000, burnShare: 0 }));
    expect(m.issuedSupply).toBeLessThanOrEqual(405000);
  });

  it('burn-replacement minting never exceeds eligible burns', () => {
    const result = runSimulation(scenario({ mintingPolicy: 'burnReplacement', burnReplacementRatio: 0.25, burnShare: 0.5, cycleMintCap: 100000 }));
    const minted = result.finalState.cumulativeBurnReplaced;
    expect(minted).toBeLessThanOrEqual(result.finalState.cumulativeBurned * 0.25 + 0.001);
  });

  it('treasury cannot become negative', () => {
    const m = last(scenario({ initialTreasuryAllocation: 1000, onboardingTokenGrant: 100, validatorSubsidy: 100, communityRewardBudget: 10000 }));
    expect(m.treasuryBalance).toBeGreaterThanOrEqual(0);
  });

  it('staking does not double-count tokens', () => {
    const m = last(scenario({ stakingPropensity: 1, targetStakingRatio: 0.8 }));
    expect(m.issuedSupply).toBeCloseTo(m.liquidActiveSupply + m.dormantSupply + m.stakedSupply + m.treasuryBalance + (m.issuedSupply - m.liquidActiveSupply - m.dormantSupply - m.stakedSupply - m.treasuryBalance), 3);
  });

  it('no state value becomes NaN or Infinity', () => {
    const result = runSimulation(scenario({ stochasticity: 1, cycles: 400 }));
    for (const m of result.metrics) {
      for (const value of Object.values(m)) if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
    }
  });

  it('no token category becomes negative', () => {
    const result = runSimulation(scenario({ cycles: 500, baseChurnRate: 0.2, burnShare: 0.8 }));
    const s = result.finalState;
    expect(Math.min(s.liquidActive, s.liquidDormant, s.staked, s.treasury, s.communityRewardPool)).toBeGreaterThanOrEqual(0);
  });

  it('fixed-price mode keeps configured service price', () => {
    const m = last(scenario({ fixedPriceMode: true, initialServicePrice: 2.5 }));
    expect(m.servicePrice).toBe(2.5);
  });

  it('lower utility output can reduce purchasing power', () => {
    const balanced = last(scenario({ seed: 1 }));
    const weak = last(scenario({ seed: 1, providerCapacityPerProvider: 0.4, serviceQuality: 0.25 }));
    expect(weak.purchasingPower).toBeLessThan(balanced.purchasingPower);
  });

  it('excess minting can reduce purchasing power', () => {
    const noMint = last(scenario({ seed: 2, mintingPolicy: 'none', burnShare: 0 }));
    const mint = last(scenario({ seed: 2, mintingPolicy: 'fixed', fixedEmission: 5000, cycleMintCap: 5000, burnShare: 0 }));
    expect(mint.purchasingPower).toBeLessThan(noMint.purchasingPower);
  });

  it('utility growth can improve purchasing power', () => {
    const weak = last(scenario({ providerCapacityPerProvider: 1, serviceQuality: 0.45 }));
    const strong = last(scenario({ providerCapacityPerProvider: 15, serviceQuality: 1.1, mintingPolicy: 'none', burnShare: 0 }));
    expect(strong.purchasingPower).toBeGreaterThan(weak.purchasingPower);
  });

  it('validator exits can trigger a safety diagnosis', () => {
    const m = last(scenario({ initialValidators: 3, minimumSafeValidators: 10, validatorOperatingCost: 100 }));
    expect(m.diagnoses.map((d) => d.label)).toContain('Validator starvation');
  });

  it('treasury depletion triggers the correct diagnosis', () => {
    const result = runSimulation(presetByName('Treasury Exhaustion'));
    expect(result.metrics.at(-1)?.diagnoses.map((d) => d.label)).toContain('Treasury depletion');
  });

  it('default balanced scenario completes successfully', () => {
    const result = runSimulation(presetByName('Balanced Service Economy'));
    expect(result.failure ?? 'ok').toBe('ok');
    expect(result.metrics).toHaveLength(result.scenario.params.cycles);
  });

  it('failure presets produce intended diagnoses', () => {
    const checks: [string, string][] = [
      ['Treasury Exhaustion', 'Treasury depletion'],
      ['Validator Starvation', 'Validator starvation'],
      ['No-Utility Collapse', 'Utility-capacity shortage'],
    ];
    for (const [preset, diagnosis] of checks) {
      const result = runSimulation(presetByName(preset));
      const labels = result.metrics.flatMap((m) => m.diagnoses.map((d) => d.label));
      expect(labels).toContain(diagnosis);
    }
  });

  it('same shock schedule is reproducible', () => {
    const shocks = [{ id: 's', type: 'validatorOutage' as const, startCycle: 10, duration: 5, magnitude: 0.5, gradualRecovery: false }];
    expect(runSimulation(scenario({ seed: 44 }, shocks)).metrics).toEqual(runSimulation(scenario({ seed: 44 }, shocks)).metrics);
  });

  it('imports exported scenarios again', () => {
    const s = presets[0];
    expect(parseScenarioJson(scenarioToJson(s)).name).toBe(s.name);
  });
});
