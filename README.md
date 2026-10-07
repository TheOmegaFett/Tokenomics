# Tokenomics Lab

Tokenomics Lab is a local-first simulation game for designing and stress-testing fictional token economies before creating a real token. It is not a fiat-backed system, investment platform, exchange, wallet, blockchain node, or live financial application. It never connects to real markets and does not predict actual returns.

## Setup

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. In another terminal, run the checks:

```sh
npm test
npm run test:e2e
npm run build
```

- `npm run dev`: start the Vite development server.
- `npm test`: run Vitest simulation-engine tests.
- `npm run test:e2e`: run Playwright browser tests; the test runner starts a dev server if needed. Install Playwright's Chromium browser first with `npx playwright install chromium` if it is not already available.
- `npm run build`: type-check and build the static app.

## Using the simulator

Choose a preset or edit parameters, then use **Play** to animate one cycle at a time. **Pause** stops playback, **Step** advances one cycle, **Reset** returns to cycle zero, and **Complete** calculates the full run immediately. The speed slider sets the playback rate in cycles per second. After a complete run, Play or Step starts again from the beginning. Scenarios saved in the app stay in your browser's local storage; scenario and result files can also be exported.

## Model Overview

The simulator models a closed fictional service economy. Users hold, spend, stake, become dormant, leave, and re-enter. Providers complete abstract service units. Validators receive protocol rewards and may join or leave according to rewards, operating costs, confidence, and slashing risk. Treasury is a token reserve, not fiat.

The accounting identity enforced after every cycle is:

```text
issuedSupply = liquidActive + liquidDormant + staked + treasury + communityRewardPool
endingIssuedSupply = startingIssuedSupply + mintedThisCycle - burnedThisCycle
```

Utility Purchasing Power is `1 / averageServicePrice`, measured as service units purchasable per token. The Utility Value Index starts near `1.0` and combines purchasing power, service availability, quality, reliability, validator coverage, confidence, liquidity, and volatility. Nominal staking yield is token-denominated; real utility yield adjusts it by purchasing-power change.

## Presets

The app includes Balanced Service Economy, Fee-Funded Equilibrium, Inflationary APY Trap, Treasury-Subsidized Launch, Treasury Exhaustion, Validator Starvation, Over-Burn Deflation, Viral Growth Congestion, Whale-Dominated Economy, No-Utility Collapse, Burn-Replacement Economy, and Utility-Growth-Capped Issuance.

## Structure

- `src/simulation/`: pure TypeScript simulation engine, presets, shocks, diagnostics, invariants, metrics, and sweeps.
- `src/workers/`: Web Worker for long parameter sweeps.
- `src/workspaces/`: Simulator, Compare, Stress Lab, and Model Inspector.
- `src/components/`: reusable controls and charts.
- `src/state/`: localStorage scenario persistence.

## Limitations

Participants are aggregate cohorts rather than individual wallets. Token value is only internal service utility. The model is intentionally simplified for experimentation and education, not forecasting or financial advice.

## License

Licensed under the [MIT License](LICENSE).
