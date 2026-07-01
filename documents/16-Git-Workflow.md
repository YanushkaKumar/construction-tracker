# 16 - Git Workflow

BuildTrack strictly follows a simplified version of GitFlow to ensure stability in production.

## Branches
- **`main`**: The production branch. Code here is ALWAYS deployable. Commits directly to `main` are strictly forbidden.
- **`develop`**: The primary integration branch. Developers branch off of this.
- **`feature/<name>`**: Used for new features (e.g., `feature/bank-loan-repayments`).
- **`bugfix/<name>`**: Used for fixing non-critical bugs on `develop`.
- **`hotfix/<name>`**: Used for fixing critical bugs directly on `main` that cannot wait for a full release cycle.

## Development Flow
1. Fetch latest changes: `git checkout develop && git pull`.
2. Create a feature branch: `git checkout -b feature/awesome-new-thing`.
3. Commit small, logical chunks with descriptive messages.
   - *Good*: `feat(api): add repayment validation logic`
   - *Bad*: `fixed stuff`
4. Push to remote: `git push origin feature/awesome-new-thing`.

## Pull Request (PR) Process
1. Open a PR targeting the `develop` branch.
2. The GitHub Actions CI pipeline will automatically run type checks and linters.
3. A Senior Engineer must review the code, looking for performance bottlenecks, security flaws, and adherence to clean UI guidelines.
4. Once approved and CI passes, the PR is "Squash and Merged" into `develop`.

## Release Flow
When `develop` has accumulated enough features for a release, a PR is opened from `develop` into `main`. Once merged, the CD pipeline automatically deploys `main` to the production server.
