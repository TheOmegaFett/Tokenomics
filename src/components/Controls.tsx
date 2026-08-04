import type { SimulationParams } from '../simulation/types';

interface Field {
  key: keyof SimulationParams;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  tooltip: string;
}

export const sections: { title: string; fields: Field[] }[] = [
  { title: 'Simulation', fields: [
    { key: 'cycles', label: 'Cycles', min: 1, max: 10000, step: 1, tooltip: 'Number of cycles to simulate.' },
    { key: 'cycleHours', label: 'Cycle hours', min: 1, max: 168, step: 1, tooltip: 'Duration of each cycle.' },
    { key: 'seed', label: 'Seed', min: 1, max: 999999, step: 1, tooltip: 'Deterministic random seed.' },
    { key: 'stochasticity', label: 'Stochasticity', min: 0, max: 1, step: 0.01, tooltip: 'Noise level applied to behaviour.' },
    { key: 'eventFrequency', label: 'Event frequency', min: 0, max: 1, step: 0.01, tooltip: 'Reserved probability for endogenous events.' },
    { key: 'warmupCycles', label: 'Warm-up cycles', min: 0, max: 1000, step: 1, tooltip: 'Cycles treated as model settling period.' },
  ] },
  { title: 'Population', fields: [
    { key: 'initialUsers', label: 'Initial users', min: 1, max: 100000, step: 10, tooltip: 'Starting user count.' },
    { key: 'fixedNewUsersPerCycle', label: 'New users/cycle', min: 0, max: 10000, step: 1, tooltip: 'Baseline new users each cycle.' },
    { key: 'percentageGrowthPerCycle', label: 'Growth %/cycle', min: 0, max: 0.2, step: 0.001, tooltip: 'Compounded user growth rate.' },
    { key: 'activeUserRate', label: 'Active user rate', min: 0, max: 1, step: 0.01, tooltip: 'Share of users likely to be active.' },
    { key: 'baseChurnRate', label: 'Base churn', min: 0, max: 0.5, step: 0.001, tooltip: 'Baseline user exit rate.' },
    { key: 'reactivationRate', label: 'Reactivation', min: 0, max: 0.5, step: 0.001, tooltip: 'Dormant users returning per cycle.' },
    { key: 'providerPercentage', label: 'Providers', min: 0.01, max: 1, step: 0.01, tooltip: 'Active users providing services.' },
    { key: 'validatorParticipantPercentage', label: 'Validator participants', min: 0.001, max: 0.3, step: 0.001, tooltip: 'Maximum validators as active-user share.' },
    { key: 'onboardingTokenGrant', label: 'Onboarding grant', min: 0, max: 100, step: 0.5, tooltip: 'Tokens granted from treasury to new users.' },
    { key: 'contributionReward', label: 'Contribution reward', min: 0, max: 10, step: 0.1, tooltip: 'Service provider reward modifier.' },
    { key: 'averageInitialTokenBalance', label: 'Average balance', min: 1, max: 10000, step: 1, tooltip: 'Reference balance used by behaviour model.' },
    { key: 'userBalanceInequality', label: 'Inequality', min: 0, max: 1, step: 0.01, tooltip: 'Estimated token distribution inequality.' },
    { key: 'whaleConcentration', label: 'Whale concentration', min: 0, max: 0.95, step: 0.01, tooltip: 'Top-holder control estimate.' },
    { key: 'spendPropensity', label: 'Spend propensity', min: 0, max: 1, step: 0.01, tooltip: 'Active liquid tokens spent on utility.' },
    { key: 'holdingPropensity', label: 'Holding propensity', min: 0, max: 1, step: 0.01, tooltip: 'Tendency to move tokens dormant.' },
    { key: 'stakingPropensity', label: 'Staking propensity', min: 0, max: 1, step: 0.01, tooltip: 'Tendency to move liquid tokens into staking.' },
    { key: 'sensitivityToCongestion', label: 'Congestion sensitivity', min: 0, max: 2, step: 0.01, tooltip: 'Confidence penalty from backlog.' },
    { key: 'sensitivityToPurchasingPowerLoss', label: 'PP loss sensitivity', min: 0, max: 2, step: 0.01, tooltip: 'Confidence penalty from purchasing-power loss.' },
    { key: 'confidenceRecoverySpeed', label: 'Confidence recovery', min: 0, max: 1, step: 0.01, tooltip: 'Mean-reversion speed for confidence.' },
  ] },
  { title: 'Utility Economy', fields: [
    { key: 'requestedServiceUnitsPerActiveUser', label: 'Demand/user', min: 0, max: 20, step: 0.1, tooltip: 'Service units requested by each active user.' },
    { key: 'providerCapacityPerProvider', label: 'Provider capacity', min: 0, max: 100, step: 0.1, tooltip: 'Service units each provider can produce.' },
    { key: 'initialServicePrice', label: 'Service price', min: 0.001, max: 100, step: 0.01, tooltip: 'Initial tokens per service unit.' },
    { key: 'serviceQuality', label: 'Service quality', min: 0, max: 1.5, step: 0.01, tooltip: 'Utility quality multiplier.' },
    { key: 'demandElasticity', label: 'Demand elasticity', min: 0.05, max: 2, step: 0.01, tooltip: 'Demand response to price.' },
    { key: 'servicePriceAdjustmentSpeed', label: 'Price adjust speed', min: 0, max: 1, step: 0.01, tooltip: 'Speed toward market-clearing price.' },
    { key: 'congestionTolerance', label: 'Congestion tolerance', min: 0, max: 1, step: 0.01, tooltip: 'Backlog tolerated before confidence loss.' },
    { key: 'serviceRenewalFrequency', label: 'Renewal frequency', min: 0, max: 10, step: 0.1, tooltip: 'Repeated service demand multiplier.' },
    { key: 'transactionsRequiredPerService', label: 'Tx/service', min: 1, max: 100, step: 1, tooltip: 'Transactions required per service unit.' },
    { key: 'maximumServicePriceMovement', label: 'Max price move', min: 0, max: 1, step: 0.01, tooltip: 'Maximum service-price move per cycle.' },
  ] },
  { title: 'Network', fields: [
    { key: 'initialValidators', label: 'Initial validators', min: 1, max: 10000, step: 1, tooltip: 'Starting validators.' },
    { key: 'minimumSafeValidators', label: 'Min safe validators', min: 1, max: 1000, step: 1, tooltip: 'Minimum validator safety threshold.' },
    { key: 'targetValidators', label: 'Target validators', min: 1, max: 10000, step: 1, tooltip: 'Target validator count.' },
    { key: 'requiredValidatorStake', label: 'Required stake', min: 1, max: 100000, step: 10, tooltip: 'Tokens required per validator.' },
    { key: 'blockTimeSeconds', label: 'Block time sec', min: 1, max: 600, step: 1, tooltip: 'Affects throughput.' },
    { key: 'transactionsPerBlock', label: 'Tx/block', min: 1, max: 10000, step: 1, tooltip: 'Network capacity per block.' },
    { key: 'validatorUptime', label: 'Validator uptime', min: 0, max: 1, step: 0.01, tooltip: 'Network uptime factor.' },
    { key: 'validatorOperatingCost', label: 'Validator cost', min: 0, max: 1000, step: 1, tooltip: 'Token-equivalent validator operating cost.' },
    { key: 'validatorJoiningSensitivity', label: 'Join sensitivity', min: 0, max: 1, step: 0.01, tooltip: 'Validator response to profitable operation.' },
    { key: 'validatorLeavingSensitivity', label: 'Leave sensitivity', min: 0, max: 1, step: 0.01, tooltip: 'Validator response to unprofitable operation.' },
    { key: 'slashingProbability', label: 'Slashing prob.', min: 0, max: 1, step: 0.001, tooltip: 'Cycle slashing probability.' },
    { key: 'slashingPercentage', label: 'Slashing %', min: 0, max: 1, step: 0.01, tooltip: 'Staked tokens removed on slash.' },
    { key: 'congestionFeeMultiplier', label: 'Congestion fee x', min: 0, max: 20, step: 0.1, tooltip: 'Fee multiplier from congestion.' },
  ] },
  { title: 'Fees', fields: [
    { key: 'baseTransactionFee', label: 'Base tx fee', min: 0, max: 10, step: 0.001, tooltip: 'Per-transaction fee in tokens.' },
    { key: 'serviceProtocolFee', label: 'Service fee', min: 0, max: 1, step: 0.001, tooltip: 'Protocol fee on service payments.' },
    { key: 'validatorFeeShare', label: 'Validator share', min: 0, max: 1, step: 0.01, tooltip: 'Fee share to validator rewards.' },
    { key: 'treasuryFeeShare', label: 'Treasury share', min: 0, max: 1, step: 0.01, tooltip: 'Fee share to treasury.' },
    { key: 'burnShare', label: 'Burn share', min: 0, max: 1, step: 0.01, tooltip: 'Fee share burned.' },
    { key: 'communityRewardPoolShare', label: 'Community share', min: 0, max: 1, step: 0.01, tooltip: 'Fee share to community reward pool.' },
    { key: 'minimumFee', label: 'Minimum fee', min: 0, max: 1, step: 0.001, tooltip: 'Optional fee floor.' },
  ] },
  { title: 'Treasury, Minting, Rewards', fields: [
    { key: 'initialTreasuryAllocation', label: 'Initial treasury', min: 0, max: 1000000, step: 100, tooltip: 'Starting treasury token reserve.' },
    { key: 'treasuryMinimumReserve', label: 'Treasury reserve', min: 0, max: 1000000, step: 100, tooltip: 'Minimum target reserve.' },
    { key: 'onboardingSubsidy', label: 'Onboarding subsidy', min: 0, max: 100, step: 0.1, tooltip: 'Extra treasury subsidy per new user.' },
    { key: 'validatorSubsidy', label: 'Validator subsidy', min: 0, max: 100, step: 0.1, tooltip: 'Treasury subsidy per validator.' },
    { key: 'communityRewardBudget', label: 'Community budget', min: 0, max: 10000, step: 10, tooltip: 'Community rewards per cycle.' },
    { key: 'maximumTreasuryOutflowPerCycle', label: 'Max outflow', min: 0, max: 100000, step: 100, tooltip: 'Treasury spend cap per cycle.' },
    { key: 'subsidyReductionNearReserve', label: 'Reserve reduction', min: 0, max: 1, step: 0.01, tooltip: 'Subsidy cut when reserve is low.' },
    { key: 'fixedEmission', label: 'Fixed emission', min: 0, max: 10000, step: 10, tooltip: 'Tokens minted under fixed emission.' },
    { key: 'burnReplacementRatio', label: 'Burn replacement', min: 0, max: 1, step: 0.01, tooltip: 'Proportion of eligible burns replaceable.' },
    { key: 'cycleMintCap', label: 'Mint cap/cycle', min: 0, max: 100000, step: 100, tooltip: 'Maximum tokens minted in one cycle.' },
    { key: 'targetNominalStakingYield', label: 'Target nominal yield', min: 0, max: 2, step: 0.01, tooltip: 'Nominal annualized staking target.' },
    { key: 'utilityGrowthIssuanceMultiplier', label: 'Utility issuance x', min: 0, max: 5, step: 0.1, tooltip: 'Issuance cap from real service growth.' },
    { key: 'treasuryRescueThreshold', label: 'Rescue threshold', min: 0, max: 1000000, step: 100, tooltip: 'Treasury level that triggers rescue minting.' },
    { key: 'treasuryRescueMint', label: 'Rescue mint', min: 0, max: 100000, step: 100, tooltip: 'Tokens minted by treasury-rescue policy.' },
    { key: 'baseValidatorReward', label: 'Base validator reward', min: 0, max: 1000, step: 0.1, tooltip: 'Baseline validator reward.' },
    { key: 'feeFundedReward', label: 'Fee reward x', min: 0, max: 10, step: 0.1, tooltip: 'Fee reward emphasis.' },
    { key: 'treasuryFundedReward', label: 'Treasury reward', min: 0, max: 1000, step: 0.1, tooltip: 'Treasury reward per validator.' },
    { key: 'mintFundedReward', label: 'Mint reward share', min: 0, max: 1, step: 0.01, tooltip: 'Minted tokens routed to liquid rewards.' },
    { key: 'communityReward', label: 'Community reward/user', min: 0, max: 100, step: 0.01, tooltip: 'Community reward budget per active user.' },
    { key: 'targetStakingRatio', label: 'Target stake ratio', min: 0, max: 1, step: 0.01, tooltip: 'Desired issued supply staked.' },
    { key: 'minimumValidatorReward', label: 'Min validator reward', min: 0, max: 1000, step: 0.1, tooltip: 'Minimum validator reward target.' },
    { key: 'rewardSellSpendPropensity', label: 'Reward spend', min: 0, max: 1, step: 0.01, tooltip: 'Reward portion becoming liquid spend.' },
    { key: 'unstakingDelay', label: 'Unstaking delay', min: 0, max: 365, step: 1, tooltip: 'Behavioural delay reference.' },
  ] },
];

export function ParameterControls({ params, onChange, onReset }: { params: SimulationParams; onChange: (patch: Partial<SimulationParams>) => void; onReset: (title: string) => void }) {
  return (
    <div className="param-sections">
      {sections.map((section) => (
        <details key={section.title} open>
          <summary>{section.title}<button type="button" onClick={(e) => { e.preventDefault(); onReset(section.title); }}>Reset</button></summary>
          <div className="fields">
            {section.fields.map((field) => (
              <label key={String(field.key)} title={field.tooltip}>
                <span>{field.label}</span>
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={Number(params[field.key])}
                  onChange={(event) => onChange({ [field.key]: Number(event.target.value) } as Partial<SimulationParams>)}
                />
              </label>
            ))}
            {section.title === 'Utility Economy' && (
              <>
                <label className="check"><input type="checkbox" checked={params.fixedPriceMode} onChange={(e) => onChange({ fixedPriceMode: e.target.checked })} /> Fixed price</label>
                <label className="check"><input type="checkbox" checked={params.adaptivePriceMode} onChange={(e) => onChange({ adaptivePriceMode: e.target.checked })} /> Adaptive price</label>
              </>
            )}
            {section.title === 'Network' && (
              <label className="check"><input type="checkbox" checked={params.congestionBasedFee} onChange={(e) => onChange({ congestionBasedFee: e.target.checked })} /> Congestion fees</label>
            )}
            {section.title === 'Fees' && (
              <label className="check"><input type="checkbox" checked={params.minimumFeeEnabled} onChange={(e) => onChange({ minimumFeeEnabled: e.target.checked })} /> Minimum fee</label>
            )}
            {section.title === 'Treasury, Minting, Rewards' && (
              <>
                <label><span>Minting policy</span><select value={params.mintingPolicy} onChange={(e) => onChange({ mintingPolicy: e.target.value as SimulationParams['mintingPolicy'] })}>
                  <option value="none">No minting</option><option value="fixed">Fixed emission</option><option value="burnReplacement">Burn replacement only</option><option value="targetStakingYield">Target nominal staking yield</option><option value="utilityGrowthCapped">Utility-growth-capped issuance</option><option value="treasuryRescue">Treasury-rescue issuance</option>
                </select></label>
                <label><span>Slashing destination</span><select value={params.slashingDestination} onChange={(e) => onChange({ slashingDestination: e.target.value as SimulationParams['slashingDestination'] })}><option value="burn">Burn</option><option value="treasury">Treasury</option></select></label>
                <label className="check"><input type="checkbox" checked={params.emergencySpending} onChange={(e) => onChange({ emergencySpending: e.target.checked })} /> Emergency spending</label>
                <label className="check"><input type="checkbox" checked={params.compounding} onChange={(e) => onChange({ compounding: e.target.checked })} /> Compounding</label>
              </>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
