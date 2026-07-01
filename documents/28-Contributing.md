# 28 - Contributing

We welcome contributions! To ensure high code quality and smooth collaboration, please follow these guidelines when contributing to BuildTrack.

## Getting Started
1. Review the [Project Workflow](./15-Project-Workflow.md) and [Git Workflow](./16-Git-Workflow.md) documents.
2. Ensure you have the local Docker infrastructure running.
3. Branch off `develop`.

## Commit Message Convention
We strictly follow [Conventional Commits](https://www.conventionalcommits.org/). This allows us to automatically generate changelogs.

Format: `<type>(<scope>): <subject>`

**Types**:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

**Examples**:
- `feat(api): add validation for bank loan repayments`
- `fix(web): correct alignment on finance dashboard cards`
- `docs(readme): update setup instructions`

## Pull Request Guidelines
1. **Title**: Follow the Conventional Commits format for the PR title.
2. **Description**: Clearly explain *what* you changed and *why*. Link any related Jira tickets or GitHub Issues.
3. **Tests**: If you added a feature, you must add a corresponding unit test.
4. **Self-Review**: Review your own PR diff before requesting a review. Remove console.logs and commented-out code.
5. **Approval**: At least one Senior Engineer must approve the PR before it can be merged.
