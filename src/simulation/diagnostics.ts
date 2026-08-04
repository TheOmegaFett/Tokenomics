import { clamp, safeDiv } from './random';
import type { CycleMetrics, Diagnosis, HealthComponents, SimulationParams, TokenState } from './types';

export function healthComponents(p: SimulationParams, state: TokenState, m: Partial<CycleMetrics>, ppVol: number): HealthComponents {
  const validatorRatio = safeDiv(m.validators ?? p.initialValidators, p.minimumSafeValidators, 10);
  const treasuryRunway = m.treasuryRunway ?? 99;
  const stakingRatio = safeDiv(state.staked, state.issuedSupply, 0);
  return {
    supplyDiscipline: clamp(100 - Math.abs((m.netSupplyChange ?? 0) / Math.max(1, state.issuedSupply)) * 6000 - safeDiv(state.issuedSupply, state.maximumSupply, 0) * 20, 0, 100),
    treasurySustainability: clamp(treasuryRunway * 6, 0, 100),
    validatorSecurity: clamp(validatorRatio * 50, 0, 100),
    serviceFulfilment: clamp((m.serviceFulfilmentRatio ?? 0) * 100, 0, 100),
    userRetention: clamp(100 - safeDiv(m.churnedUsers ?? 0, Math.max(1, m.totalUsers ?? 1), 0) * 900, 0, 100),
    purchasingPowerStability: clamp(100 - ppVol * 450, 0, 100),
    circulationHealth: clamp((1 - Math.abs(stakingRatio - p.targetStakingRatio) * 2 - safeDiv(state.liquidDormant, state.issuedSupply, 0)) * 100, 0, 100),
    decentralization: clamp((1 - p.whaleConcentration) * 100 - Math.max(0, p.requiredValidatorStake / Math.max(1, state.staked) - 0.02) * 200, 0, 100),
  };
}

export function healthScore(c: HealthComponents): number {
  return Object.values(c).reduce((a, b) => a + b, 0) / 8;
}

export function diagnoses(p: SimulationParams, state: TokenState, m: CycleMetrics): Diagnosis[] {
  const d: Diagnosis[] = [];
  const add = (label: string, severity: Diagnosis['severity'], reason: string) => d.push({ label, severity, reason });
  if (m.economyHealthScore >= 78 && m.serviceFulfilmentRatio > 0.85 && m.validatorSafetyRatio >= 1.5) add('Sustainable equilibrium', 'ok', 'Health, validator coverage, and service fulfilment are all strong.');
  if (m.activeUsers > p.initialUsers * 0.8 && m.utilityValueIndex >= 0.95 && m.economyHealthScore >= 70) add('Healthy growth', 'ok', 'Active usage remains high while utility value is stable.');
  if (state.treasury < p.treasuryMinimumReserve || m.treasuryRunway < 8) add('Treasury depletion', 'critical', `Treasury runway is ${m.treasuryRunway.toFixed(1)} cycles and reserve is ${state.treasury.toFixed(0)}.`);
  if (m.validatorRewards < p.validatorOperatingCost || m.validators < p.minimumSafeValidators) add('Validator starvation', 'critical', 'Validator rewards or validator count are below safe operating thresholds.');
  if (m.validators < p.targetValidators * 0.45 || p.requiredValidatorStake * m.validators > state.staked * 0.9) add('Validator centralization', 'warning', 'Validator participation is concentrated relative to target security.');
  if (m.netSupplyChange > state.issuedSupply * 0.015 && m.purchasingPower < 0.75) add('Inflationary utility collapse', 'critical', 'Supply is expanding while purchasing power is weak.');
  if (m.tokenVelocity < 0.02 && m.stakingRatio + safeDiv(state.liquidDormant, state.issuedSupply, 0) > 0.55) add('Deflationary circulation freeze', 'warning', 'Too many tokens are dormant or staked and velocity is low.');
  if (safeDiv(state.liquidDormant, state.issuedSupply, 0) > 0.35) add('Excessive token dormancy', 'warning', 'Dormant liquid tokens exceed 35% of issued supply.');
  if (m.nominalStakingYield > 0.08 && m.realUtilityYield < 0) add('Nominal-yield illusion', 'critical', 'Nominal rewards are positive but purchasing-power adjusted yield is negative.');
  if (m.burnedTokens > m.mintedTokens * 2 && m.tokenVelocity < 0.05) add('Over-burning', 'warning', 'Burns are outpacing issuance while circulation is slowing.');
  if (m.treasuryExpenditure > m.treasuryIncome * 2 && p.onboardingSubsidy > 0) add('Onboarding-subsidy dependency', 'warning', 'Growth depends on treasury-funded onboarding more than fee income.');
  if (m.transactionBacklog > m.completedTransactions * 0.5) add('Congestion collapse', 'critical', 'Backlog is more than half of completed transactions.');
  if (m.churnedUsers > m.newUsers * 1.5 && m.userConfidence < 0.45) add('User-exodus feedback loop', 'critical', 'Churn exceeds acquisition and confidence is low.');
  if (m.serviceFulfilmentRatio < 0.55) add('Utility-capacity shortage', 'warning', 'Completed service units are far below requested service units.');
  if (m.completedServiceUnits < p.initialUsers * 0.15 && m.utilityValueIndex < 0.8) add('Low-utility stagnation', 'warning', 'Real service output and utility index are both weak.');
  if (m.topHolderShare > 0.3 || m.giniEstimate > 0.7) add('Whale concentration', 'warning', 'Top-holder share or Gini estimate indicate concentrated ownership.');
  if (state.maximumSupply - state.issuedSupply < state.maximumSupply * 0.02) add('Supply-cap exhaustion', 'warning', 'Unissued capacity is below 2% of maximum supply.');
  if (m.netSupplyChange > 0 && m.purchasingPower < 0.9) add('Reward dilution', 'warning', 'New token rewards are coinciding with weaker utility purchasing power.');
  if (d.length === 0) add('Sustainable equilibrium', 'ok', 'No critical imbalance crossed a diagnosis threshold.');
  return d;
}
