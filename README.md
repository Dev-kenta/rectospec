# RecToSpec

> Transform browser recordings into production-ready test code with AI

[![npm version](https://img.shields.io/npm/v/rectospec.svg)](https://www.npmjs.com/package/rectospec)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

**RecToSpec** is an AI-powered CLI tool that converts Chrome Recorder JSON into Gherkin specifications and Playwright test code.

### Key Features

- 🤖 **AI-Powered Code Generation** - Leverage Google Gemini or Anthropic Claude for intelligent test code creation
- 🔄 **Complete E2E Workflow** - Chrome Recorder → Gherkin → Playwright in a single pipeline
- 🛠️ **Developer-Friendly CLI** - Interactive setup and intuitive commands

---

## Why RecToSpec?

Creating high-quality test automation requires both **test design expertise** and **coding skills** - a rare combination.

- **QA Engineers**: Excel at test design but struggle with code implementation
- **Developers**: Can code but lack systematic test design knowledge

**RecToSpec bridges this gap** by using AI to transform user actions into production-ready test code, enabling both QA and developers to create professional-grade test automation.

---

## Features

- ✅ **Chrome Recorder JSON Parsing** - Converts browser recordings into structured test scenarios
- ✅ **AI-Powered Gherkin Generation** - Creates BDD specifications in Japanese or English
- ✅ **Playwright Code Generation** - Produces TypeScript/JavaScript test code with Page Object Model pattern
- ✅ **Multiple LLM Providers** - Choose between Google Gemini (free tier) or Anthropic Claude (high quality)
- ✅ **Interactive CLI Setup** - Easy configuration with guided prompts
- ✅ **Flexible Output** - Supports both TypeScript and JavaScript

---

## Installation

```bash
npm install -g rectospec
```

**Requirements**: Node.js >= 18.0.0

---

## Quick Start

### 1. Initialize Configuration

```bash
rectospec init
```

Select your LLM provider (Google Gemini or Anthropic Claude) and enter your API key.

### 2. Record Browser Actions

Use Chrome DevTools Recorder to record your test scenario and export as JSON.

1. Open Chrome DevTools (F12)
2. Go to **Recorder** tab
3. Click **Start new recording**
4. Perform your test actions
5. Click **Export** → **Export as JSON**

### 3. Generate Gherkin Specification

```bash
rectospec generate recording.json
```

This creates a `.feature` file with Gherkin specification.

### 4. Generate Playwright Test Code

```bash
rectospec compile test.feature -o ./tests
```

This generates:
- Page Object class (`tests/pages/`)
- Test spec file (`tests/specs/`)
- Test data fixtures (`tests/fixtures/`)

### 5. Run Tests

```bash
cd tests
npx playwright test
```

---

## Usage Examples

### Basic Workflow

```bash
# Setup
rectospec init

# Generate Gherkin from Chrome Recorder
rectospec generate login-recording.json

# Compile to Playwright
rectospec compile login.feature -o ./tests
```

### Advanced Options

```bash
# Use Anthropic Claude instead of Google Gemini
rectospec generate recording.json --provider anthropic

# Generate English Gherkin (default is Japanese)
rectospec generate recording.json --lang en

# Generate JavaScript instead of TypeScript
rectospec compile test.feature --no-typescript

# Specify custom output path
rectospec generate recording.json -o custom-test.feature
rectospec compile test.feature -o ./e2e-tests
```

---

## Commands Reference

### `rectospec init`

Initialize RecToSpec configuration interactively.

**Options:**
- `-f, --force` - Overwrite existing configuration

**Example:**
```bash
rectospec init
```

### `rectospec generate <recording-file>`

Generate Gherkin specification from Chrome Recorder JSON.

**Arguments:**
- `<recording-file>` - Path to Chrome Recorder JSON file

**Options:**
- `-o, --output <path>` - Output file path (default: same directory as input)
- `--lang <language>` - Language (ja/en) (default: "ja")
- `--no-edge-cases` - Do not generate edge case scenarios
- `-p, --provider <provider>` - LLM provider (google/anthropic) (default: "google")
- `-m, --model <model>` - Model name

**Example:**
```bash
rectospec generate login.json -o tests/login.feature --lang en
```

### `rectospec compile <feature-file>`

Generate Playwright test code from Gherkin specification.

**Arguments:**
- `<feature-file>` - Path to Gherkin feature file

**Options:**
- `-o, --output <directory>` - Output directory path (default: "./tests")
- `--no-typescript` - Generate JavaScript instead of TypeScript
- `--framework <framework>` - Test framework (playwright) (default: "playwright")
- `-p, --provider <provider>` - LLM provider (google/anthropic) (default: "google")
- `-m, --model <model>` - Model name

**Example:**
```bash
rectospec compile login.feature -o ./e2e --no-typescript
```

---

## Configuration

### API Key Setup

RecToSpec supports three methods for API key configuration (in priority order):

#### 1. Environment Variables (Recommended for CI/CD)

```bash
# Google Gemini
export GOOGLE_GENERATIVE_AI_API_KEY=your-api-key

# Anthropic Claude
export ANTHROPIC_API_KEY=your-api-key
```

#### 2. `.env` File (Project-local)

Create a `.env` file in your project root:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key
# or
ANTHROPIC_API_KEY=your-api-key
```

#### 3. Global Config File

Run `rectospec init` to store API keys in `~/.rectospec/config.json` (automatically created with secure permissions).

### Supported LLM Providers

#### Google Gemini (Free Tier Available)

- **Default Model**: `gemini-2.0-flash-lite`
- **Pricing**: Free tier with 1,500 requests/day
- **Get API Key**: https://aistudio.google.com/app/apikey

#### Anthropic Claude (High Quality)

- **Default Model**: `claude-sonnet-4`
- **Pricing**: Pay-as-you-go
- **Get API Key**: https://console.anthropic.com/account/keys

---

## Development

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/Dev-kenta/rectospec.git
cd rectospec

# Install dependencies
npm install

# Build
npm run build
```

### Development Commands

```bash
npm run dev        # Build in watch mode
npm test           # Run tests with Vitest
npm run test:coverage # Run tests with coverage
npm run build      # Build with tsup
npm run typecheck  # TypeScript type checking
npm run lint       # Lint with ESLint
npm run format     # Format with Prettier
```

### Testing the CLI Locally

```bash
npm run build
node dist/index.js --help
node dist/index.js generate <recording.json>
```

---

## Project Structure

```
src/
├── cli/                 # CLI entry point and commands
│   ├── index.ts         # Main CLI setup (Commander.js)
│   └── commands/        # Command implementations
│       ├── init.ts      # Interactive configuration setup
│       ├── generate.ts  # Chrome Recorder JSON → Gherkin
│       └── compile.ts   # Gherkin → Playwright code generation
├── parser/              # Chrome Recorder JSON parsing
│   ├── types.ts         # Zod schemas for validation
│   └── chrome-recorder.ts # Parser implementation
├── llm/                 # LLM integration layer
│   ├── provider.ts      # Vercel AI SDK wrapper
│   └── prompts/         # Prompt templates
│       ├── gherkin-prompt.ts
│       └── playwright-prompt.ts
├── config/              # Configuration management
│   ├── types.ts         # Config schemas (Zod)
│   ├── defaults.ts      # Default config values
│   └── manager.ts       # Config CRUD operations
└── utils/               # Shared utilities
    ├── errors.ts        # Custom error classes
    ├── logger.ts        # Colored CLI output
    └── file-system.ts   # File I/O helpers
```

---

## Contributing

Contributions are welcome! Please follow these guidelines:

- **Code Language**: All code, comments, and documentation must be in English
- **Code Style**: Follow the existing code style and formatting
- **Testing**: Add tests for new features
- **Commits**: Write clear, descriptive commit messages

For more details, see [CONTRIBUTING.md](CONTRIBUTING.md) (to be created).

---

## License

MIT License - Copyright (c) 2025 Dev-kenta

See [LICENSE](LICENSE) for details.

---

## Links

- **GitHub Repository**: https://github.com/Dev-kenta/rectospec
- **npm Package**: https://www.npmjs.com/package/rectospec (coming soon)
- **Issues**: https://github.com/Dev-kenta/rectospec/issues
- **Documentation**: https://github.com/Dev-kenta/rectospec/wiki (coming soon)

---

**Built with ❤️ using [Vercel AI SDK](https://sdk.vercel.ai/)**
