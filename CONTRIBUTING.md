# Contributing to RecToSpec

Thank you for your interest in contributing to RecToSpec! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

By participating in this project, you agree to:

- Be respectful and constructive in all interactions
- Welcome newcomers and help them get started
- Focus on what is best for the project and community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/YOUR-USERNAME/rectospec.git
cd rectospec

# Add upstream remote
git remote add upstream https://github.com/Dev-kenta/rectospec.git

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Testing Your Changes Locally

```bash
# Build the project
npm run build

# Test CLI commands
node dist/index.js --help
node dist/index.js init
node dist/index.js generate tests/fixtures/recordings/login.json
```

---

## Development Workflow

### 1. Create a Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
# or for bug fixes
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Write clear, concise code
- Follow the coding standards below
- Add tests for new features
- Update documentation if needed

### 3. Run Tests and Linters

```bash
# Run all checks
npm run typecheck  # TypeScript type checking
npm run lint       # ESLint
npm run format     # Prettier formatting
npm test           # Unit tests
npm run build      # Ensure build succeeds
```

### 4. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: Add new feature description"
# or
git commit -m "fix: Fix bug description"
# or
git commit -m "docs: Update documentation"
```

**Commit Message Format:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

---

## Coding Standards

### Language Requirements

**CRITICAL**: All code, comments, logs, and documentation MUST be in English.

❌ **Incorrect:**
```typescript
// ファイルを読み込む
logger.info('ファイルを読み込んでいます...');
```

✅ **Correct:**
```typescript
// Read file
logger.info('Loading file...');
```

This is a non-negotiable requirement for global OSS distribution.

### TypeScript Guidelines

- Use TypeScript strict mode
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

```typescript
/**
 * Generate Gherkin specification from Chrome Recorder JSON
 */
export async function generateGherkin(
  recording: ParsedRecording,
  options: GherkinGenerationOptions
): Promise<string> {
  // Implementation
}
```

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Use async/await over promises
- Prefer const over let

The project uses ESLint and Prettier to enforce code style automatically.

### Error Handling

- Use custom error classes from `src/utils/errors.ts`
- Provide clear, actionable error messages
- Never expose sensitive information in error messages

```typescript
throw new ConfigError(
  `API key not found for ${provider}. Please set it using:\n` +
  `1. Environment variable: export ${envVarName}=your-key\n` +
  `2. Setup command: rectospec init`
);
```

### Testing

- Write unit tests for new features using Vitest
- Place test files next to source files with `.test.ts` suffix
- Aim for high code coverage (>80%)
- Test both success and error cases

```typescript
// src/utils/file-system.test.ts
import { describe, it, expect } from 'vitest';
import { readJsonFile } from './file-system.js';

describe('readJsonFile', () => {
  it('should read and parse JSON file', async () => {
    const result = await readJsonFile('test.json');
    expect(result).toBeDefined();
  });

  it('should throw error for non-existent file', async () => {
    await expect(readJsonFile('missing.json')).rejects.toThrow();
  });
});
```

---

## Submitting Changes

### Pull Request Process

1. **Update Your Branch**

```bash
git checkout main
git pull upstream main
git checkout your-feature-branch
git rebase main
```

2. **Push to Your Fork**

```bash
git push origin your-feature-branch
```

3. **Create Pull Request**

- Go to https://github.com/Dev-kenta/rectospec
- Click "New Pull Request"
- Select your fork and branch
- Fill in the PR template with:
  - Description of changes
  - Related issue number (if applicable)
  - Testing performed
  - Screenshots (if UI changes)

4. **PR Review**

- Address review feedback promptly
- Keep discussions constructive
- Make requested changes in new commits
- Once approved, a maintainer will merge your PR

### PR Title Format

- `feat: Add support for custom prompts`
- `fix: Resolve path resolution issue on Windows`
- `docs: Update installation instructions`

---

## Reporting Issues

### Before Creating an Issue

- Search existing issues to avoid duplicates
- Check if the issue is already fixed in the latest version
- Gather relevant information (OS, Node.js version, error messages)

### Issue Template

When creating a new issue, include:

**Bug Report:**
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, Node.js version, RecToSpec version)
- Error messages and stack traces

**Feature Request:**
- Description of the feature
- Use case and motivation
- Proposed solution (if any)
- Alternatives considered

---

## Development Commands

```bash
npm run dev        # Build in watch mode
npm run build      # Build with tsup
npm test           # Run tests with Vitest
npm run test:coverage # Run tests with coverage
npm run typecheck  # TypeScript type checking
npm run lint       # Lint with ESLint
npm run format     # Format with Prettier
```

---

## Project Structure

Understanding the codebase structure will help you contribute effectively:

```
src/
├── cli/                 # CLI entry point and commands
│   ├── index.ts         # Main CLI setup (Commander.js)
│   └── commands/        # Command implementations
│       ├── init.ts      # Interactive setup
│       ├── generate.ts  # JSON → Gherkin
│       └── compile.ts   # Gherkin → Playwright
├── parser/              # Chrome Recorder JSON parsing
│   ├── types.ts         # Zod schemas
│   └── chrome-recorder.ts
├── llm/                 # LLM integration
│   ├── provider.ts      # Vercel AI SDK wrapper
│   └── prompts/         # Prompt templates
├── config/              # Configuration management
│   ├── types.ts
│   ├── defaults.ts
│   └── manager.ts
└── utils/               # Shared utilities
    ├── errors.ts
    ├── logger.ts
    └── file-system.ts
```

---

## Adding a New LLM Provider

If you want to add support for a new LLM provider (e.g., OpenAI GPT, xAI Grok):

1. Install the provider package:
   ```bash
   npm install @ai-sdk/openai
   ```

2. Update `src/llm/provider.ts`:
   - Add provider to `DEFAULT_MODELS`
   - Add environment variable to `ENV_VAR_NAMES`
   - Add API key URL to `API_KEY_URLS`
   - Update `getModel()` function

3. Update `src/config/types.ts`:
   - Add provider to `ProviderName` type

4. Update CLI commands to include new provider option

5. Update documentation (README.md, CLAUDE.md)

---

## Getting Help

If you need help or have questions:

- Open a [GitHub Discussion](https://github.com/Dev-kenta/rectospec/discussions)
- Create an issue with the "question" label
- Check existing documentation in CLAUDE.md

---

## License

By contributing to RecToSpec, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to RecToSpec! 🎉**
