# Versioning Protocol

This repository uses Semantic Versioning: `MAJOR.MINOR.PATCH`.

## Current Version

The initial development version is `0.1.0`. Keep the current version in a `VERSION` file when the first application or package artifact is introduced.

## Version Rules

- `MAJOR`: incompatible public API, data format, or workflow changes.
- `MINOR`: backward-compatible features, new modules, or meaningful behavior additions.
- `PATCH`: backward-compatible bug fixes, documentation corrections, and maintenance updates.

Before `1.0.0`, breaking changes may ship as `MINOR` updates, but document them clearly in the commit or release notes.

## When to Commit

Commit after one focused, working change. Good commit boundaries include:

- adding or changing one feature;
- fixing one defect;
- updating documentation or repository policy;
- changing tooling, tests, or configuration.

Do not commit half-finished work, generated build output, secrets, local environment files, or unrelated cleanup bundled with functional changes.

If the change is user-visible, release-relevant, or changes repository policy, update `CHANGELOG.md` in the same commit. Pure typo fixes and internal-only cleanup may skip the changelog with `SKIP_CHANGELOG_CHECK=1`.

## Commit Message Format

Use Conventional Commits:

```text
type(scope): short imperative summary
```

Allowed types:

- `feat`: user-visible feature or capability.
- `fix`: bug fix.
- `docs`: documentation-only change.
- `test`: tests only.
- `refactor`: behavior-preserving code change.
- `style`: formatting only.
- `build`: build system or dependency changes.
- `ci`: automation changes.
- `chore`: repository maintenance.
- `perf`: performance improvement.
- `revert`: revert a previous commit.

Examples:

```text
docs: add repository guidelines
feat(tokens): add tokenizer scaffold
fix(parser): handle empty input
```

Use `!` for breaking changes, for example `feat(api)!: rename token fields`.

## Version Bumps

Bump the version only when a change affects a releasable artifact or documented public behavior. Documentation-only and internal maintenance commits usually do not need a version bump.

When bumping a version:

1. Update the version source (`VERSION`, package manifest, or equivalent).
2. Include the bump in the same commit as the completed change or in a dedicated release commit.
3. Use a commit such as `chore(release): bump version to 0.2.0`.

## Changelog Rules

Maintain `CHANGELOG.md` using a Keep a Changelog style:

- Add new work under `[Unreleased]`.
- Use categories such as `Added`, `Changed`, `Fixed`, `Removed`, `Security`, and `Deprecated`.
- Move unreleased entries into a dated version section when cutting a release.
- Keep entries short and focused on user-visible behavior or project policy.

## Local Enforcement

Commit messages are checked by `.githooks/commit-msg`. Changelog updates are checked by `.githooks/pre-commit`. Enable tracked hooks once per clone:

```sh
git config core.hooksPath .githooks
```
