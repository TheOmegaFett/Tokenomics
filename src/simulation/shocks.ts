import { clamp } from './random';
import type { Shock, SimulationParams } from './types';

export function shockMultiplier(shock: Shock, cycle: number): number {
  if (cycle < shock.startCycle || cycle >= shock.startCycle + shock.duration) return 0;
  if (!shock.gradualRecovery || shock.duration <= 1) return shock.magnitude;
  const progress = (cycle - shock.startCycle) / Math.max(1, shock.duration - 1);
  return shock.magnitude * (1 - progress);
}

export function applyShocks(params: SimulationParams, shocks: Shock[], cycle: number): { params: SimulationParams; events: string[]; emergencyMint: number; emergencyBurn: number } {
  let p = { ...params };
  const events: string[] = [];
  let emergencyMint = 0;
  let emergencyBurn = 0;

  for (const shock of shocks) {
    const mag = shockMultiplier(shock, cycle);
    if (mag === 0) continue;
    events.push(`${shock.type} (${mag.toFixed(2)})`);
    switch (shock.type) {
      case 'userGrowthSurge':
        p.fixedNewUsersPerCycle *= 1 + mag;
        p.percentageGrowthPerCycle *= 1 + mag;
        break;
      case 'userDemandCollapse':
        p.requestedServiceUnitsPerActiveUser *= clamp(1 - mag, 0, 2);
        p.spendPropensity *= clamp(1 - mag, 0, 2);
        break;
      case 'massChurn':
        p.baseChurnRate = clamp(p.baseChurnRate + mag, 0, 0.95);
        break;
      case 'whaleDormancy':
        p.whaleConcentration = clamp(p.whaleConcentration + mag, 0, 0.95);
        p.holdingPropensity = clamp(p.holdingPropensity + mag / 2, 0, 1);
        break;
      case 'whaleRelease':
        p.whaleConcentration = clamp(p.whaleConcentration - mag, 0, 0.95);
        p.spendPropensity = clamp(p.spendPropensity + mag / 3, 0, 1);
        break;
      case 'validatorOutage':
        p.validatorUptime = clamp(p.validatorUptime - mag, 0.05, 1);
        break;
      case 'validatorExit':
        p.initialValidators = Math.max(0, Math.round(p.initialValidators * clamp(1 - mag, 0, 1)));
        p.validatorLeavingSensitivity += mag;
        break;
      case 'networkSlowdown':
        p.blockTimeSeconds *= 1 + mag;
        break;
      case 'transactionSpam':
        p.transactionsRequiredPerService *= 1 + mag;
        break;
      case 'serviceCapacityLoss':
        p.providerCapacityPerProvider *= clamp(1 - mag, 0.05, 1);
        break;
      case 'serviceQualityImprovement':
        p.serviceQuality = clamp(p.serviceQuality + mag, 0, 1.5);
        break;
      case 'feeIncrease':
        p.baseTransactionFee *= 1 + mag;
        p.serviceProtocolFee *= 1 + mag;
        break;
      case 'feeReduction':
        p.baseTransactionFee *= clamp(1 - mag, 0, 1);
        p.serviceProtocolFee *= clamp(1 - mag, 0, 1);
        break;
      case 'treasuryLoss':
        p.maximumTreasuryOutflowPerCycle += p.initialTreasuryAllocation * mag;
        break;
      case 'treasuryGrant':
        p.treasuryRescueMint += p.initialTreasuryAllocation * mag;
        break;
      case 'emergencyMint':
        emergencyMint += mag;
        break;
      case 'emergencyBurn':
        emergencyBurn += mag;
        break;
      case 'stakingSurge':
        p.stakingPropensity = clamp(p.stakingPropensity + mag, 0, 1);
        break;
      case 'unstakingWave':
        p.stakingPropensity = clamp(p.stakingPropensity - mag, 0, 1);
        break;
      case 'confidenceShock':
        p.activeUserRate = clamp(p.activeUserRate - mag, 0, 1);
        p.baseChurnRate = clamp(p.baseChurnRate + mag / 2, 0, 0.95);
        break;
      case 'confidenceRecovery':
        p.confidenceRecoverySpeed = clamp(p.confidenceRecoverySpeed + mag, 0, 1);
        break;
    }
  }

  return { params: p, events, emergencyMint, emergencyBurn };
}

export const shockLabels: Record<Shock['type'], string> = {
  userGrowthSurge: 'Sudden user-growth surge',
  userDemandCollapse: 'User-demand collapse',
  massChurn: 'Mass churn',
  whaleDormancy: 'Whale token dormancy',
  whaleRelease: 'Whale token release',
  validatorOutage: 'Validator outage',
  validatorExit: 'Validator exit',
  networkSlowdown: 'Temporary network slowdown',
  transactionSpam: 'Transaction spam load',
  serviceCapacityLoss: 'Service-capacity loss',
  serviceQualityImprovement: 'Service-quality improvement',
  feeIncrease: 'Fee increase',
  feeReduction: 'Fee reduction',
  treasuryLoss: 'Treasury loss',
  treasuryGrant: 'Treasury grant',
  emergencyMint: 'Emergency mint',
  emergencyBurn: 'Emergency burn',
  stakingSurge: 'Staking surge',
  unstakingWave: 'Unstaking wave',
  confidenceShock: 'Confidence shock',
  confidenceRecovery: 'Confidence recovery campaign',
};
