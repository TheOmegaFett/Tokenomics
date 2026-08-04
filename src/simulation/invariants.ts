import type { SimulationParams, TokenState } from './types';

export function normalizeFeeShares(params: SimulationParams): SimulationParams {
  const total = params.validatorFeeShare + params.treasuryFeeShare + params.burnShare + params.communityRewardPoolShare;
  if (Math.abs(total - 1) < 1e-9 || total <= 0) return params;
  return {
    ...params,
    validatorFeeShare: params.validatorFeeShare / total,
    treasuryFeeShare: params.treasuryFeeShare / total,
    burnShare: params.burnShare / total,
    communityRewardPoolShare: params.communityRewardPoolShare / total,
  };
}

export function verifyState(state: TokenState, startIssued: number, minted: number, burned: number): string | undefined {
  const parts = [state.liquidActive, state.liquidDormant, state.staked, state.treasury, state.communityRewardPool];
  if (parts.some((v) => v < -1e-6)) return `negative token category detected: ${parts.join(', ')}`;
  if (parts.some((v) => !Number.isFinite(v))) return 'token category became NaN or Infinity';
  const sum = parts.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - state.issuedSupply) > 1e-4) {
    return `issued supply mismatch: ${state.issuedSupply.toFixed(6)} != categories ${sum.toFixed(6)}`;
  }
  const expectedEnding = startIssued + minted - burned;
  if (Math.abs(expectedEnding - state.issuedSupply) > 1e-4) {
    return `supply transition mismatch: ending ${state.issuedSupply.toFixed(6)} != start ${startIssued.toFixed(6)} + minted ${minted.toFixed(6)} - burned ${burned.toFixed(6)}`;
  }
  if (state.issuedSupply - state.maximumSupply > 1e-3) return `issued supply exceeds maximum supply: ${state.issuedSupply} > ${state.maximumSupply}`;
  return undefined;
}

export function invariantText(state: TokenState): string {
  return `${state.issuedSupply.toFixed(2)} = ${state.liquidActive.toFixed(2)} active + ${state.liquidDormant.toFixed(2)} dormant + ${state.staked.toFixed(2)} staked + ${state.treasury.toFixed(2)} treasury + ${state.communityRewardPool.toFixed(2)} community`;
}
