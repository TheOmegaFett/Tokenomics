import { defaultParams, makeScenario } from './defaults';
import type { Scenario, SimulationParams } from './types';

const p = (patch: Partial<SimulationParams>) => ({ ...defaultParams, ...patch });

export const presets: Scenario[] = [
  makeScenario('Balanced Service Economy', p({})),
  makeScenario('Fee-Funded Equilibrium', p({ mintingPolicy: 'none', baseTransactionFee: 0.045, validatorFeeShare: 0.65, treasuryFeeShare: 0.2, burnShare: 0.05, communityRewardPoolShare: 0.1, validatorSubsidy: 0.1 })),
  makeScenario('Inflationary APY Trap', p({ mintingPolicy: 'targetStakingYield', targetNominalStakingYield: 0.45, cycleMintCap: 3200, requestedServiceUnitsPerActiveUser: 0.45, serviceQuality: 0.65, fixedNewUsersPerCycle: 6 })),
  makeScenario('Treasury-Subsidized Launch', p({ onboardingTokenGrant: 18, onboardingSubsidy: 4, initialTreasuryAllocation: 220000, fixedNewUsersPerCycle: 80, validatorSubsidy: 2.5 })),
  makeScenario('Treasury Exhaustion', p({ initialTreasuryAllocation: 30000, treasuryMinimumReserve: 22000, onboardingTokenGrant: 24, onboardingSubsidy: 10, validatorSubsidy: 6, communityRewardBudget: 700 })),
  makeScenario('Validator Starvation', p({ baseTransactionFee: 0.002, validatorFeeShare: 0.25, validatorSubsidy: 0, baseValidatorReward: 0.2, validatorOperatingCost: 35, initialValidators: 12 })),
  makeScenario('Over-Burn Deflation', p({ mintingPolicy: 'none', burnShare: 0.65, validatorFeeShare: 0.2, treasuryFeeShare: 0.1, communityRewardPoolShare: 0.05, spendPropensity: 0.05, holdingPropensity: 0.85 })),
  makeScenario('Viral Growth Congestion', p({ fixedNewUsersPerCycle: 180, percentageGrowthPerCycle: 0.03, blockTimeSeconds: 15, transactionsPerBlock: 3, requestedServiceUnitsPerActiveUser: 1.6, transactionsRequiredPerService: 5 })),
  makeScenario('Whale-Dominated Economy', p({ whaleConcentration: 0.52, userBalanceInequality: 0.72, holdingPropensity: 0.82, spendPropensity: 0.05 })),
  makeScenario('No-Utility Collapse', p({ requestedServiceUnitsPerActiveUser: 0.2, providerPercentage: 0.05, providerCapacityPerProvider: 0.8, serviceQuality: 0.28, fixedNewUsersPerCycle: 2 })),
  makeScenario('Burn-Replacement Economy', p({ mintingPolicy: 'burnReplacement', burnReplacementRatio: 0.5, burnShare: 0.25, cycleMintCap: 900 })),
  makeScenario('Utility-Growth-Capped Issuance', p({ mintingPolicy: 'utilityGrowthCapped', utilityGrowthIssuanceMultiplier: 0.75, fixedNewUsersPerCycle: 45, providerCapacityPerProvider: 7, serviceQuality: 0.92 })),
].map((scenario) => ({ ...scenario, id: scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }));

export function presetByName(name: string): Scenario {
  return presets.find((scenario) => scenario.name === name) ?? presets[0];
}
