export type MintingPolicy =
  | 'none'
  | 'fixed'
  | 'burnReplacement'
  | 'targetStakingYield'
  | 'utilityGrowthCapped'
  | 'treasuryRescue';

export type SlashingDestination = 'burn' | 'treasury';
export type ShockType =
  | 'userGrowthSurge'
  | 'userDemandCollapse'
  | 'massChurn'
  | 'whaleDormancy'
  | 'whaleRelease'
  | 'validatorOutage'
  | 'validatorExit'
  | 'networkSlowdown'
  | 'transactionSpam'
  | 'serviceCapacityLoss'
  | 'serviceQualityImprovement'
  | 'feeIncrease'
  | 'feeReduction'
  | 'treasuryLoss'
  | 'treasuryGrant'
  | 'emergencyMint'
  | 'emergencyBurn'
  | 'stakingSurge'
  | 'unstakingWave'
  | 'confidenceShock'
  | 'confidenceRecovery';

export interface SimulationParams {
  cycles: number;
  cycleHours: number;
  seed: number;
  stochasticity: number;
  eventFrequency: number;
  warmupCycles: number;
  maximumSupply: number;
  initialUsers: number;
  fixedNewUsersPerCycle: number;
  percentageGrowthPerCycle: number;
  activeUserRate: number;
  baseChurnRate: number;
  reactivationRate: number;
  providerPercentage: number;
  validatorParticipantPercentage: number;
  onboardingTokenGrant: number;
  contributionReward: number;
  averageInitialTokenBalance: number;
  userBalanceInequality: number;
  whaleConcentration: number;
  spendPropensity: number;
  holdingPropensity: number;
  stakingPropensity: number;
  sensitivityToCongestion: number;
  sensitivityToPurchasingPowerLoss: number;
  confidenceRecoverySpeed: number;
  requestedServiceUnitsPerActiveUser: number;
  providerCapacityPerProvider: number;
  initialServicePrice: number;
  serviceQuality: number;
  demandElasticity: number;
  servicePriceAdjustmentSpeed: number;
  congestionTolerance: number;
  serviceRenewalFrequency: number;
  transactionsRequiredPerService: number;
  maximumServicePriceMovement: number;
  fixedPriceMode: boolean;
  adaptivePriceMode: boolean;
  initialValidators: number;
  minimumSafeValidators: number;
  targetValidators: number;
  requiredValidatorStake: number;
  blockTimeSeconds: number;
  transactionsPerBlock: number;
  validatorUptime: number;
  validatorOperatingCost: number;
  validatorJoiningSensitivity: number;
  validatorLeavingSensitivity: number;
  slashingProbability: number;
  slashingPercentage: number;
  congestionBasedFee: boolean;
  congestionFeeMultiplier: number;
  baseTransactionFee: number;
  serviceProtocolFee: number;
  validatorFeeShare: number;
  treasuryFeeShare: number;
  burnShare: number;
  communityRewardPoolShare: number;
  minimumFeeEnabled: boolean;
  minimumFee: number;
  initialTreasuryAllocation: number;
  treasuryMinimumReserve: number;
  onboardingSubsidy: number;
  validatorSubsidy: number;
  communityRewardBudget: number;
  maximumTreasuryOutflowPerCycle: number;
  subsidyReductionNearReserve: number;
  emergencySpending: boolean;
  initialLiquidActive: number;
  initialLiquidDormant: number;
  initialStaked: number;
  initialCommunityRewardPool: number;
  mintingPolicy: MintingPolicy;
  fixedEmission: number;
  burnReplacementRatio: number;
  cycleMintCap: number;
  targetNominalStakingYield: number;
  utilityGrowthIssuanceMultiplier: number;
  treasuryRescueThreshold: number;
  treasuryRescueMint: number;
  baseValidatorReward: number;
  feeFundedReward: number;
  treasuryFundedReward: number;
  mintFundedReward: number;
  communityReward: number;
  targetStakingRatio: number;
  minimumValidatorReward: number;
  rewardSellSpendPropensity: number;
  unstakingDelay: number;
  slashingDestination: SlashingDestination;
  compounding: boolean;
}

export interface Shock {
  id: string;
  type: ShockType;
  startCycle: number;
  duration: number;
  magnitude: number;
  gradualRecovery: boolean;
}

export interface Scenario {
  version: 1;
  id: string;
  name: string;
  params: SimulationParams;
  shocks: Shock[];
  createdAt: string;
  updatedAt: string;
}

export interface TokenState {
  liquidActive: number;
  liquidDormant: number;
  staked: number;
  treasury: number;
  communityRewardPool: number;
  cumulativeMinted: number;
  cumulativeBurned: number;
  cumulativeBurnReplaced: number;
  issuedSupply: number;
  maximumSupply: number;
}

export interface HealthComponents {
  supplyDiscipline: number;
  treasurySustainability: number;
  validatorSecurity: number;
  serviceFulfilment: number;
  userRetention: number;
  purchasingPowerStability: number;
  circulationHealth: number;
  decentralization: number;
}

export interface Diagnosis {
  label: string;
  severity: 'ok' | 'watch' | 'warning' | 'critical';
  reason: string;
}

export interface CycleMetrics {
  cycle: number;
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  churnedUsers: number;
  dormantUsers: number;
  providers: number;
  validators: number;
  validatorSafetyRatio: number;
  requestedServiceUnits: number;
  completedServiceUnits: number;
  serviceFulfilmentRatio: number;
  transactionDemand: number;
  completedTransactions: number;
  transactionBacklog: number;
  averageFee: number;
  totalFees: number;
  validatorRewards: number;
  treasuryIncome: number;
  treasuryExpenditure: number;
  treasuryBalance: number;
  treasuryRunway: number;
  liquidActiveSupply: number;
  dormantSupply: number;
  stakedSupply: number;
  issuedSupply: number;
  unissuedCapacity: number;
  mintedTokens: number;
  burnedTokens: number;
  netSupplyChange: number;
  stakingRatio: number;
  nominalStakingYield: number;
  realUtilityYield: number;
  servicePrice: number;
  purchasingPower: number;
  utilityValueIndex: number;
  tokenVelocity: number;
  userConfidence: number;
  purchasingPowerVolatility: number;
  giniEstimate: number;
  topHolderShare: number;
  economyHealthScore: number;
  healthComponents: HealthComponents;
  diagnoses: Diagnosis[];
  invariant: string;
  events: string[];
  failureSignals: string[];
  components: Record<string, number>;
}

export interface SimulationResult {
  scenario: Scenario;
  metrics: CycleMetrics[];
  finalState: TokenState;
  failed: boolean;
  failure?: string;
  events: { cycle: number; label: string }[];
}

export interface SweepConfig {
  scenario: Scenario;
  xParam: keyof SimulationParams;
  yParam: keyof SimulationParams;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xSteps: number;
  ySteps: number;
  seedsPerCell: number;
  outputMetric:
    | 'finalHealthScore'
    | 'collapseProbability'
    | 'finalPurchasingPower'
    | 'treasurySurvival'
    | 'validatorSurvival'
    | 'finalActiveUsers'
    | 'realUtilityYield'
    | 'firstFailureCycle';
}

export interface SweepCell {
  x: number;
  y: number;
  value: number;
  scenario: Scenario;
}

export interface SweepResult {
  cells: SweepCell[];
  xValues: number[];
  yValues: number[];
}
