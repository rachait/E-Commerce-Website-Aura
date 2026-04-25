# Contributing to AURA

Thanks for contributing.

## Development Setup

1. Fork and clone the repository.
2. Install dependencies from the project root:

```powershell
npm install
```

3. Install backend Python dependencies:

```powershell
cd backend
pip install -r requirements.txt
cd ..
```

4. Run full stack locally:

```powershell
npm run dev
```

## Branching

- Create feature branches from main.
- Use clear branch names such as feat/catalog-filters or fix/cart-total.

## Commit Style

Use meaningful commit messages, for example:

- feat: add women catalog filters
- fix: prevent cart quantity underflow
- docs: improve setup steps

## Pull Requests

1. Keep PR scope focused.
2. Link related issues in PR description.
3. Include screenshots or short recordings for UI changes.
4. Ensure tests/build pass before requesting review.

## Code Quality

- Preserve existing code style.
- Avoid unrelated refactors in feature/fix PRs.
- Add comments only where logic is non-obvious.

## Security

Please do not open public issues for security vulnerabilities.
Report them using SECURITY.md.
