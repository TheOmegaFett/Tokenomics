# Repository Guidelines

## Project Structure & Module Organization

This repository is currently a minimal starting point. Place application source under `src/`, tests under `tests/` or alongside source files as `*.test.*`, and static assets under `assets/` or `public/` depending on the runtime you add. Keep generated output in ignored build directories such as `dist/`, `build/`, or `coverage/`.

## Build, Test, and Development Commands

No project-specific build system is configured yet. When you add one, document the canonical commands here and keep them runnable from the repository root. Common examples:

- `npm install`: install JavaScript dependencies when a `package.json` is added.
- `npm test`: run the full test suite.
- `npm run build`: create a production build.
- `npm run dev`: start a local development server.

Prefer scripts in the project manifest over ad hoc commands so contributors have one stable entry point.

## Coding Style & Naming Conventions

Follow the conventions of the language and framework introduced for this project. Use consistent indentation within each file, descriptive names, and small modules with clear responsibilities. Prefer `kebab-case` for asset and config filenames, `camelCase` for JavaScript variables and functions, and `PascalCase` for classes or UI components.

If formatters or linters are added, commit their configuration and run them before committing. Examples include Prettier, ESLint, Ruff, Black, or language-native formatters.

## Testing Guidelines

Add tests with new behavior. Keep unit tests close to the code they exercise or in a dedicated `tests/` tree, and name files clearly, such as `tokenizer.test.js` or `test_tokenizer.py`. Tests should be deterministic and avoid relying on local machine state. Document any required fixtures or environment variables near the tests that use them.

## Commit & Pull Request Guidelines

This repository has no established Git history yet. Use short, imperative commit subjects such as `Add token parser` or `Document setup commands`. Keep each commit focused on one logical change.

Pull requests should include a concise summary, testing performed, linked issues when applicable, and screenshots for user-facing visual changes. Note any follow-up work or known limitations explicitly.

## Security & Configuration Tips

Do not commit secrets, local credentials, generated keys, or machine-specific configuration. Use ignored local environment files such as `.env` for development settings, and provide safe examples in files like `.env.example` when configuration becomes necessary.
