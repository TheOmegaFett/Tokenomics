# Changelog

All notable changes to this repository are documented here.

This project follows Semantic Versioning. Dates use `YYYY-MM-DD`.

## [Unreleased]

### Fixed

- Simulator Play, Pause, Step, Reset, Complete, and speed controls now provide cycle-by-cycle playback.
- Browser tests start their own development server.

### Added

- MIT license for public reuse.
- Complete local-first Tokenomics Lab web application with simulator, compare, stress lab, model inspector, worker-backed sweeps, presets, exports, and simulation-engine tests.
- Repository versioning protocol and local commit-message enforcement.
- Changelog policy for documenting notable changes before release.

### Changed

- Split chart dependencies into a separate build chunk for browser caching.
- Documented playback controls and standalone test commands.
- Refined diagnostics so permanently fixed full issuance is not treated as supply-cap exhaustion and stable zero-growth systems are not labeled healthy growth without a positive growth signal.

## [0.1.0] - 2026-08-05

### Added

- Initial repository contributor guide.
- Baseline Git ignore rules.
