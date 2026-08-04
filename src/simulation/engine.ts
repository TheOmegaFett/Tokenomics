import { defaultParams } from './defaults';
import { diagnoses, healthComponents, healthScore } from './diagnostics';
import { normalizeFeeShares, invariantText, verifyState } from './invariants';
import { clamp, round, safeDiv, SeededRandom } from './random';
import { applyShocks } from './shocks';
import type { CycleMetrics, Scenario, SimulationParams, SimulationResult, TokenState } from './types';

interface Runtime {
  users: number;
  confidence: number;
  price: number;
  validators: number;
  previousPurchasingPower: number;
  ppHistory: number[];
  completedHistory: number[];
}

export function initialTokenState(p: SimulationParams): TokenState {
  const issued = p.initialLiquidActive + p.initialLiquidDormant + p.initialStaked + p.initialTreasuryAllocation + p.initialCommunityRewardPool;
  if (issued > p.maximumSupply) throw new Error(`Starting categories exceed maximum supply: ${issued} > ${p.maximumSupply}`);
  return {
    liquidActive: p.initialLiquidActive,
    liquidDormant: p.initialLiquidDormant,
    staked: p.initialStaked,
    treasury: p.initialTreasuryAllocation,
    communityRewardPool: p.initialCommunityRewardPool,
    cumulativeMinted: 0,
    cumulativeBurned: 0,
    cumulativeBurnReplaced: 0,
    issuedSupply: issued,
    maximumSupply: p.maximumSupply,
  };
}

export function runSimulation(scenario: Scenario, limitCycles = scenario.params.cycles): SimulationResult {
  const base = normalizeFeeShares({ ...defaultParams, ...scenario.params });
  let state = initialTokenState(base);
  const rng = new SeededRandom(base.seed);
  const runtime: Runtime = {
    users: base.initialUsers,
    confidence: 0.82,
    price: base.initialServicePrice,
    validators: base.initialValidators,
    previousPurchasingPower: 1 / base.initialServicePrice,
    ppHistory: [1 / base.initialServicePrice],
    completedHistory: [],
  };
  const metrics: CycleMetrics[] = [];
  const events: { cycle: number; label: string }[] = [];
  let failed = false;
  let failure: string | undefined;

  for (let cycle = 1; cycle <= limitCycles; cycle += 1) {
    try {
      const m = runCycle(base, scenario, state, runtime, rng, cycle);
      state = m.state;
      metrics.push(m.metrics);
      for (const event of m.metrics.events) events.push({ cycle, label: event });
      if (m.metrics.failureSignals.length > 0) {
        failed = true;
        failure = m.metrics.failureSignals[0];
        break;
      }
    } catch (error) {
      failed = true;
      failure = error instanceof Error ? error.message : String(error);
      break;
    }
  }
  return { scenario, metrics, finalState: state, failed, failure, events };
}

function runCycle(base: SimulationParams, scenario: Scenario, state: TokenState, runtime: Runtime, rng: SeededRandom, cycle: number): { state: TokenState; metrics: CycleMetrics } {
  const startIssued = state.issuedSupply;
  const shocked = applyShocks(base, scenario.shocks, cycle);
  const p = normalizeFeeShares(shocked.params);
  const shockEvents = shocked.events;
  const randomFactor = rng.normalish(p.stochasticity);
  const blocksPerCycle = (p.cycleHours * 3600) / Math.max(1, p.blockTimeSeconds);
  const transactionCapacity = blocksPerCycle * p.transactionsPerBlock * p.validatorUptime;

  const newUsers = Math.max(0, Math.round((p.fixedNewUsersPerCycle + runtime.users * p.percentageGrowthPerCycle) * runtime.confidence * randomFactor));
  const reactivated = Math.round(Math.max(0, runtime.users * (1 - p.activeUserRate) * p.reactivationRate * runtime.confidence));
  runtime.users += newUsers + reactivated;
  const activeRate = clamp(p.activeUserRate * (0.45 + runtime.confidence * 0.7), 0.02, 0.98);
  const activeUsers = Math.round(runtime.users * activeRate);
  const dormantUsers = Math.max(0, runtime.users - activeUsers);
  const providers = Math.max(1, Math.round(activeUsers * p.providerPercentage * runtime.confidence));
  const requestedServiceUnits = Math.max(0, activeUsers * p.requestedServiceUnitsPerActiveUser * p.serviceRenewalFrequency * p.demandElasticity ** Math.max(0, runtime.price - p.initialServicePrice));
  const providerCapacity = providers * p.providerCapacityPerProvider * p.serviceQuality;
  const networkServiceCapacity = transactionCapacity / Math.max(1, p.transactionsRequiredPerService);
  const completedServiceUnits = Math.max(0, Math.min(requestedServiceUnits, providerCapacity, networkServiceCapacity));
  const serviceFulfilmentRatio = safeDiv(completedServiceUnits, requestedServiceUnits, 1);
  const unmetDemand = Math.max(0, requestedServiceUnits - completedServiceUnits);
  const transactionDemand = requestedServiceUnits * p.transactionsRequiredPerService;
  const completedTransactions = Math.min(transactionDemand, transactionCapacity);
  const transactionBacklog = Math.max(0, transactionDemand - completedTransactions);
  const congestion = clamp(safeDiv(transactionBacklog, Math.max(1, transactionDemand), 0), 0, 1);
  const activeLiquidTokens = state.liquidActive;
  const desiredTokenSpend = activeLiquidTokens * p.spendPropensity * runtime.confidence;
  const clearingPrice = safeDiv(desiredTokenSpend, Math.max(completedServiceUnits, 1e-6), runtime.price);
  const movementLimit = Math.max(0.001, p.maximumServicePriceMovement);
  let servicePrice = runtime.price;
  if (p.fixedPriceMode) {
    servicePrice = p.initialServicePrice;
  } else if (p.adaptivePriceMode) {
    const target = servicePrice + (clearingPrice - servicePrice) * p.servicePriceAdjustmentSpeed;
    const maxMove = servicePrice * movementLimit;
    servicePrice = clamp(target, Math.max(0.0001, servicePrice - maxMove), servicePrice + maxMove);
  }
  const servicePayments = Math.min(activeLiquidTokens, completedServiceUnits * servicePrice);
  const protocolServiceFees = servicePayments * p.serviceProtocolFee;
  let averageFee = p.baseTransactionFee * (p.congestionBasedFee ? 1 + congestion * p.congestionFeeMultiplier : 1);
  if (p.minimumFeeEnabled) averageFee = Math.max(averageFee, p.minimumFee);
  const txFees = completedTransactions * averageFee;
  const totalFees = Math.min(state.liquidActive, protocolServiceFees + txFees);
  const validatorFeeIncome = totalFees * p.validatorFeeShare;
  const treasuryIncome = totalFees * p.treasuryFeeShare;
  const feeBurn = totalFees * p.burnShare;
  let emergencyBurn = Math.min(shocked.emergencyBurn, state.liquidActive + state.treasury);
  let burnedTokens = feeBurn + emergencyBurn;
  const communityIncome = totalFees * p.communityRewardPoolShare;

  state.liquidActive -= totalFees;
  const emergencyBurnFromActive = Math.min(state.liquidActive, emergencyBurn);
  state.liquidActive -= emergencyBurnFromActive;
  emergencyBurn -= emergencyBurnFromActive;
  state.treasury -= Math.min(state.treasury, emergencyBurn);
  state.treasury += treasuryIncome;
  state.communityRewardPool += communityIncome;
  state.issuedSupply -= burnedTokens;
  state.cumulativeBurned += burnedTokens;

  const rewardNeed = Math.max(p.minimumValidatorReward * runtime.validators, p.baseValidatorReward * runtime.validators);
  const subsidyScale = state.treasury < p.treasuryMinimumReserve * 2 ? 1 - p.subsidyReductionNearReserve : 1;
  const treasuryRewards = Math.min(state.treasury, Math.min(p.validatorSubsidy * runtime.validators + p.treasuryFundedReward * runtime.validators, p.maximumTreasuryOutflowPerCycle) * subsidyScale);
  const communityRewards = Math.min(state.communityRewardPool, p.communityRewardBudget + p.communityReward * activeUsers);
  let mintedTokens = shocked.emergencyMint;
  const remainingSupply = Math.max(0, state.maximumSupply - state.issuedSupply);
  const unreplacedBurns = Math.max(0, state.cumulativeBurned * p.burnReplacementRatio - state.cumulativeBurnReplaced);
  if (p.mintingPolicy === 'fixed') mintedTokens += Math.min(p.fixedEmission, p.cycleMintCap, remainingSupply);
  if (p.mintingPolicy === 'burnReplacement') {
    const replacement = Math.min(unreplacedBurns, p.cycleMintCap, remainingSupply);
    mintedTokens += replacement;
    state.cumulativeBurnReplaced += replacement;
  }
  if (p.mintingPolicy === 'targetStakingYield') {
    const targetReward = state.staked * safeDiv(p.targetNominalStakingYield, 365, 0);
    mintedTokens += Math.min(Math.max(0, targetReward - validatorFeeIncome), p.cycleMintCap, remainingSupply);
  }
  if (p.mintingPolicy === 'utilityGrowthCapped') {
    const prev = runtime.completedHistory.at(-30) ?? Math.max(1, completedServiceUnits);
    const growth = Math.max(0, safeDiv(completedServiceUnits - prev, prev, 0));
    mintedTokens += Math.min(state.issuedSupply * growth * p.utilityGrowthIssuanceMultiplier, p.cycleMintCap, remainingSupply);
  }
  if (p.mintingPolicy === 'treasuryRescue' && state.treasury < p.treasuryRescueThreshold) {
    mintedTokens += Math.min(p.treasuryRescueMint, p.cycleMintCap, remainingSupply);
  }
  mintedTokens = Math.min(mintedTokens, Math.max(0, state.maximumSupply - state.issuedSupply));
  const mintRewardBudget = mintedTokens * p.mintFundedReward;
  state.issuedSupply += mintedTokens;
  state.cumulativeMinted += mintedTokens;
  state.treasury += mintedTokens - mintRewardBudget;

  const validatorRewards = validatorFeeIncome + treasuryRewards + mintRewardBudget;
  state.treasury -= treasuryRewards;
  state.communityRewardPool -= communityRewards;
  state.liquidActive += validatorRewards * p.rewardSellSpendPropensity + communityRewards;
  state.staked += p.compounding ? validatorRewards * (1 - p.rewardSellSpendPropensity) : 0;

  const treasuryGrants = Math.min(state.treasury, Math.min(p.onboardingSubsidy * newUsers + p.onboardingTokenGrant * newUsers, p.maximumTreasuryOutflowPerCycle));
  state.treasury -= treasuryGrants;
  state.liquidActive += treasuryGrants;

  const stakingGap = p.targetStakingRatio - safeDiv(state.staked, state.issuedSupply, 0);
  const stakeMove = clamp(stakingGap * p.stakingPropensity * state.liquidActive, -state.staked * 0.08, state.liquidActive * 0.08);
  if (stakeMove >= 0) {
    state.liquidActive -= stakeMove;
    state.staked += stakeMove;
  } else {
    state.staked += stakeMove;
    state.liquidActive -= stakeMove;
  }

  const slash = rng.next() < p.slashingProbability * p.stochasticity ? state.staked * p.slashingPercentage : 0;
  if (slash > 0) {
    state.staked -= slash;
    if (p.slashingDestination === 'burn') {
      burnedTokens += slash;
      state.issuedSupply -= slash;
      state.cumulativeBurned += slash;
    } else {
      state.treasury += slash;
    }
    shockEvents.push(`validator slashing ${slash.toFixed(2)}`);
  }

  const pp = 1 / servicePrice;
  const ppChange = safeDiv(pp - runtime.previousPurchasingPower, runtime.previousPurchasingPower, 0);
  const confidenceDelta =
    (serviceFulfilmentRatio - 0.82) * 0.18 -
    Math.max(0, congestion - p.congestionTolerance) * p.sensitivityToCongestion -
    Math.max(0, -ppChange) * p.sensitivityToPurchasingPowerLoss +
    (p.serviceQuality - 0.75) * 0.04 +
    (safeDiv(runtime.validators, p.minimumSafeValidators, 0) - 1) * 0.025 +
    p.confidenceRecoverySpeed * (0.82 - runtime.confidence);
  runtime.confidence = clamp(runtime.confidence + confidenceDelta, 0.02, 0.99);
  const churnRate = clamp(p.baseChurnRate * (1 + (1 - runtime.confidence) * 3 + congestion), 0, 0.9);
  const churnedUsers = Math.round(runtime.users * churnRate * rng.normalish(p.stochasticity));
  runtime.users = Math.max(1, runtime.users - churnedUsers);

  const expectedValidatorReward = safeDiv(validatorRewards, Math.max(1, runtime.validators), 0);
  const validatorSignal = (expectedValidatorReward * pp - p.validatorOperatingCost) * p.validatorJoiningSensitivity + (runtime.confidence - 0.6) * 2;
  runtime.validators = Math.round(clamp(runtime.validators + validatorSignal - p.validatorLeavingSensitivity * Math.max(0, p.validatorOperatingCost - expectedValidatorReward * pp), 1, Math.max(1, activeUsers * p.validatorParticipantPercentage)));

  const rawDormantMove = clamp((p.holdingPropensity + p.whaleConcentration - runtime.confidence) * 0.01, -0.04, 0.06) * state.liquidActive;
  const dormantMove = clamp(rawDormantMove, -state.liquidDormant, state.liquidActive);
  if (dormantMove > 0) {
    state.liquidActive -= dormantMove;
    state.liquidDormant += dormantMove;
  } else {
    state.liquidDormant += dormantMove;
    state.liquidActive -= dormantMove;
  }

  const ppHistory = [...runtime.ppHistory.slice(-29), pp];
  const avgPp = ppHistory.reduce((a, b) => a + b, 0) / ppHistory.length;
  const ppVol = Math.sqrt(ppHistory.reduce((a, b) => a + (b - avgPp) ** 2, 0) / ppHistory.length) / Math.max(0.0001, avgPp);
  runtime.ppHistory = ppHistory;
  runtime.completedHistory.push(completedServiceUnits);
  runtime.previousPurchasingPower = pp;
  runtime.price = servicePrice;

  const treasuryExpenditure = treasuryRewards + communityRewards + treasuryGrants;
  const partial: Partial<CycleMetrics> = {
    validators: runtime.validators,
    serviceFulfilmentRatio,
    churnedUsers,
    totalUsers: runtime.users,
    treasuryRunway: safeDiv(state.treasury - p.treasuryMinimumReserve, Math.max(1, treasuryExpenditure - treasuryIncome), 99),
    netSupplyChange: mintedTokens - burnedTokens,
  };
  const components = healthComponents(p, state, partial, ppVol);
  const score = healthScore(components);
  const utilityValueIndex = clamp(pp / (1 / p.initialServicePrice) * serviceFulfilmentRatio * p.serviceQuality * (1 - congestion * 0.45) * safeDiv(runtime.validators, p.targetValidators, 1) ** 0.15 * runtime.confidence * (1 - safeDiv(state.liquidDormant, state.issuedSupply, 0) * 0.35) * (1 - ppVol), 0, 3);
  const nominalStakingYield = safeDiv(validatorRewards * 365, Math.max(1, state.staked), 0);
  const realUtilityYield = nominalStakingYield + ppChange;
  const topHolderShare = clamp(p.whaleConcentration + p.userBalanceInequality * 0.2 + safeDiv(state.liquidDormant, state.issuedSupply, 0) * 0.15, 0, 0.95);

  const metrics: CycleMetrics = {
    cycle,
    totalUsers: runtime.users,
    activeUsers,
    newUsers,
    churnedUsers,
    dormantUsers,
    providers,
    validators: runtime.validators,
    validatorSafetyRatio: safeDiv(runtime.validators, p.minimumSafeValidators, 0),
    requestedServiceUnits,
    completedServiceUnits,
    serviceFulfilmentRatio,
    transactionDemand,
    completedTransactions,
    transactionBacklog,
    averageFee,
    totalFees,
    validatorRewards,
    treasuryIncome,
    treasuryExpenditure,
    treasuryBalance: state.treasury,
    treasuryRunway: partial.treasuryRunway ?? 0,
    liquidActiveSupply: state.liquidActive,
    dormantSupply: state.liquidDormant,
    stakedSupply: state.staked,
    issuedSupply: state.issuedSupply,
    unissuedCapacity: state.maximumSupply - state.issuedSupply,
    mintedTokens,
    burnedTokens,
    netSupplyChange: mintedTokens - burnedTokens,
    stakingRatio: safeDiv(state.staked, state.issuedSupply, 0),
    nominalStakingYield,
    realUtilityYield,
    servicePrice,
    purchasingPower: pp,
    utilityValueIndex,
    tokenVelocity: safeDiv(servicePayments + totalFees, state.issuedSupply, 0),
    userConfidence: runtime.confidence,
    purchasingPowerVolatility: ppVol,
    giniEstimate: clamp(p.userBalanceInequality + p.whaleConcentration * 0.7, 0, 0.95),
    topHolderShare,
    economyHealthScore: score,
    healthComponents: components,
    diagnoses: [],
    invariant: invariantText(state),
    events: shockEvents,
    failureSignals: [],
    components: {
      liquidSupplyEffect: safeDiv(state.liquidActive - p.initialLiquidActive, p.initialLiquidActive, 0),
      velocityEffect: safeDiv(servicePayments, Math.max(1, state.issuedSupply), 0),
      serviceOutputEffect: safeDiv(completedServiceUnits - (runtime.completedHistory.at(-2) ?? completedServiceUnits), Math.max(1, runtime.completedHistory.at(-2) ?? completedServiceUnits), 0),
      congestionEffect: -congestion,
      stakingOffset: safeDiv(state.staked, Math.max(1, state.issuedSupply), 0),
      unmetDemand,
      marketClearingPrice: clearingPrice,
      providerCapacity,
      transactionCapacity,
    },
  };
  metrics.diagnoses = diagnoses(p, state, metrics);
  const invariantError = verifyState(state, startIssued, mintedTokens, burnedTokens);
  if (invariantError) metrics.failureSignals.push(invariantError);
  if (Object.values(metrics).some((v) => typeof v === 'number' && !Number.isFinite(v))) metrics.failureSignals.push('metric became NaN or Infinity');
  for (const key of ['liquidActive', 'liquidDormant', 'staked', 'treasury', 'communityRewardPool'] as const) state[key] = round(Math.max(0, state[key]));
  state.issuedSupply = round(state.liquidActive + state.liquidDormant + state.staked + state.treasury + state.communityRewardPool);
  const excess = Math.max(0, state.issuedSupply - state.maximumSupply);
  if (excess > 0) {
    const treasuryReduction = Math.min(state.treasury, excess);
    state.treasury = round(state.treasury - treasuryReduction);
    state.issuedSupply = round(state.liquidActive + state.liquidDormant + state.staked + state.treasury + state.communityRewardPool);
  }
  return { state, metrics };
}
