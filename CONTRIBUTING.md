# Contributing to Enterprise HR AI Platform

First off, thank you for considering contributing to the Enterprise HR AI Platform! It's people like you that make open-source such a great community to learn, inspire, and create.

## Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check the Issues tab to see if it's already being discussed. If not, feel free to open a new issue.

## How to Contribute

### 1. Reporting Bugs
- Ensure the bug was not already reported by searching on GitHub under Issues.
- If you're unable to find an open issue addressing the problem, open a new one. Be sure to include a title and clear description, as much relevant information as possible, and a code sample or an executable test case demonstrating the expected behavior that is not occurring.

### 2. Suggesting Enhancements
- Open a new issue with a clear title and description.
- Explain why this enhancement would be useful to most users.

### 3. Pull Requests
1. Fork the repository and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints by running `npm run lint`.
6. Issue that pull request!

## Local Development Setup

To set up the project locally for development:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd enterprise-hr-ai-platform
   ```

2. **Install dependencies:**
   Make sure you have Node.js installed. We recommend using `npm`.
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Copy the example environment file and add your actual keys.
   ```bash
   cp .env.example .env
   ```
   *Note: You will need to add a valid `GEMINI_API_KEY` to the `.env` file for the AI features to work locally.*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will start on `http://localhost:3000`.

## Coding Style Guidelines

*   **Language:** TypeScript is strictly used for both frontend and backend.
*   **Frameworks:** React (Vite) for the frontend, Express.js for the backend.
*   **Styling:** Tailwind CSS. Do not use inline styles unless absolutely necessary.
*   **Linting:** Make sure to run `npm run lint` before committing your changes. We follow standard TypeScript and React linting rules.

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for our commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `chore:` for maintenance tasks, dependencies, etc.
- `refactor:` for code refactoring without adding features or fixing bugs
- `style:` for formatting, missing semi colons, etc; no code change

Example: `feat: add robust redis rate limiting`

Thank you for contributing!
