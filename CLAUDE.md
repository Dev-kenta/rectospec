# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RecToSpec** is a CLI tool that converts Chrome Recorder JSON files into Gherkin test specifications and eventually Playwright test code. The tool is designed as an npm package for global distribution.

**Current Status**: Phase 1 MVP - Basic CLI with `init` and `generate` commands supporting Google Gemini.

## Development Commands

### Build & Development
```bash
npm run build          # Build with tsup (outputs to dist/)
npm run dev            # Build in watch mode
npm run typecheck      # Run TypeScript type checking
npm test               # Run tests with Vitest
npm run test:coverage  # Run tests with coverage
npm run lint           # Lint TypeScript files
npm run format         # Format code with Prettier
```

### Testing the CLI Locally
```bash
npm run build          # Build first
node dist/index.js --help
node dist/index.js generate <recording.json>
```

### Important Build Notes
- **Shebang**: tsup.config.ts adds `#!/usr/bin/env node` via banner. Do NOT add it to src/cli/index.ts.
- The entry point is `src/cli/index.ts`, which gets built to `dist/index.js` with ESM format.
- Build outputs both JS bundle and TypeScript declarations (.d.ts).

## Architecture Overview

### Module Structure
```
src/
├── cli/                 # CLI entry point and commands
│   ├── index.ts         # Main CLI setup (Commander.js)
│   └── commands/        # Command implementations
│       ├── init.ts      # Interactive configuration setup
│       └── generate.ts  # Chrome Recorder JSON → Gherkin
├── parser/              # Chrome Recorder JSON parsing
│   ├── types.ts         # Zod schemas for validation
│   └── chrome-recorder.ts # Parser implementation
├── llm/                 # LLM integration layer
│   ├── provider.ts      # Vercel AI SDK wrapper
│   └── prompts/         # Prompt templates
│       └── gherkin-prompt.ts
├── config/              # Configuration management
│   ├── types.ts         # Config schemas (Zod)
│   ├── defaults.ts      # Default config values
│   └── manager.ts       # Config CRUD operations
└── utils/               # Shared utilities
    ├── errors.ts        # Custom error classes
    ├── logger.ts        # Colored CLI output (chalk + ora)
    └── file-system.ts   # File I/O helpers
```

### Key Design Patterns

**LLM Provider Architecture** (Vercel AI SDK):
- Provider-agnostic interface via `generateGherkin()` in `src/llm/provider.ts`
- Currently supports Google Gemini via `@ai-sdk/google`
- Model: `gemini-2.0-flash-lite` (free tier friendly)
- API key priority: environment variables > .env file > ~/.rectospec/config.json
- The SDK automatically reads from `process.env`, so we set env vars before calling `google()`

**Configuration Management**:
- Global config at `~/.rectospec/config.json` (mode 600 for security)
- Three-tier API key resolution: env var > .env > config file
- Managed by singleton `configManager` in `src/config/manager.ts`
- Uses Zod for schema validation

**Error Handling**:
- Custom error hierarchy extending `RecToSpecError`
- Specific errors: `ParserError`, `LLMError`, `ConfigError`, `FileSystemError`
- All CLI commands catch and format errors consistently

**File Operations**:
- `resolveOutputPath()` handles both relative and absolute paths via `path.resolve()`
- Automatically creates directories when writing files
- Output defaults to input directory with changed extension

## Language and Localization

**⚠️ CRITICAL REQUIREMENT**: This project will be published as an open-source npm package for global distribution. Therefore:

**ALL code comments, log messages, error messages, and console output MUST be written in English.**

This is a non-negotiable requirement for the following reasons:
- The package will be used by developers worldwide
- English is the standard language for international OSS projects
- Global accessibility and maintainability

### Language Requirements:
- ✅ **Code comments**: English only (JSDoc, inline comments)
- ✅ **CLI output messages**: English only (info, success, error messages)
- ✅ **Error messages**: English only (all custom error classes)
- ✅ **Variable names**: English only
- ✅ **Function names**: English only
- ⚠️ **Gherkin prompt content**: Can be Japanese/English based on `--lang` option
  - The prompt template itself should be in English
  - The generated Gherkin output can be in Japanese or English (user's choice)

### Example of Correct vs Incorrect:

❌ **Incorrect** (Japanese comments/logs):
```typescript
// ファイルを読み込む
logger.info('ファイルを読み込んでいます...');
```

✅ **Correct** (English comments/logs):
```typescript
// Read file
logger.info('Loading file...');
```

## Technology Stack

- **Runtime**: Node.js 18+ (ESM modules, `type: "module"`)
- **Language**: TypeScript (strict mode, target ES2022)
- **Build**: tsup (esbuild-based bundler)
- **CLI**: Commander.js
- **AI SDK**: Vercel AI SDK (`ai` package + `@ai-sdk/google`)
- **Schema Validation**: Zod
- **Testing**: Vitest
- **Interactive Prompts**: inquirer
- **CLI UI**: chalk (colors), ora (spinners)

## Working with LLM Integration

### Adding a New Provider (Future)
1. Install provider package: `npm install @ai-sdk/anthropic`
2. Add to `src/llm/provider.ts`:
   - Import the provider
   - Add to `DEFAULT_MODELS` map
   - Update `ProviderName` type in `src/config/types.ts`
   - Add API key env var to `getApiKey()` function
3. Update CLI options in `src/cli/commands/generate.ts`
4. Update init command in `src/cli/commands/init.ts`

### Prompt Engineering
- Prompts are in `src/llm/prompts/gherkin-prompt.ts`
- `buildGherkinPrompt()` returns different prompts based on language option
- Prompts include instructions to output only Gherkin code without explanation
- Gherkin is extracted from markdown code blocks via `extractGherkinFromResponse()`

## Configuration System

### Config File Location
- Global: `~/.rectospec/config.json` (mode 600)
- No project-local config yet (planned for Phase 3 knowledge features)

### API Key Priority
1. Environment variables (e.g., `GOOGLE_GENERATIVE_AI_API_KEY`)
2. `.env` file in current directory
3. Config file `~/.rectospec/config.json`

### Environment Variable Names
- Google Gemini: `GOOGLE_GENERATIVE_AI_API_KEY`
- Anthropic Claude: `ANTHROPIC_API_KEY` (not yet implemented)

## Chrome Recorder JSON Format

The parser in `src/parser/chrome-recorder.ts` handles the Chrome Recorder export format:
- Validates with Zod schema in `src/parser/types.ts`
- Supported step types: navigate, click, change, keyDown, scroll, etc.
- Converts to simplified `ParsedAction` format for LLM consumption
- Extracts start URL from first navigate step
- Generates human-readable descriptions for each action

## Development Workflow

### Adding a New Command
1. Create command file in `src/cli/commands/<command-name>.ts`
2. Export `setup<CommandName>Command(program: Command)` function
3. Import and call in `src/cli/index.ts`
4. Follow error handling pattern from existing commands
5. Use `logger` for consistent CLI output

### Code Style
- **All code must be in English** (comments, logs, variable names, function names)
  - **Reason**: This is an OSS project for global distribution
  - Never use Japanese or any non-English language in code
- Use Zod for runtime validation
- Prefer async/await over promises
- Use singleton pattern for managers (e.g., `configManager`)
- Handle errors with try-catch and custom error classes
- Use path.resolve() for all file paths

### Testing
- Test fixtures in `tests/fixtures/recordings/`
- Example: `login.json` contains a sample Chrome Recorder export
- Add unit tests in same directory with `.test.ts` suffix
- Use Vitest for testing

## Roadmap Context

**Current Phase**: Phase 1 MVP
- ✅ CLI foundation with Commander.js
- ✅ Google Gemini integration
- ✅ Chrome Recorder JSON parsing
- ✅ Gherkin generation
- ✅ Configuration management (init command)
- ⏳ Anthropic Claude support (planned)
- ⏳ Playwright code generation (compile command - Phase 1)

**Future Phases**:
- Phase 2: Additional LLM providers (xAI Grok, OpenAI GPT) + Web editor
- Phase 3: Knowledge base system (glossary, business rules, learning from edits)
- Phase 4: Multi-framework support (Cypress, Selenium)

See `docs/RecToSpec_Requirements.md` for complete roadmap.

## Common Pitfalls

1. **❌ NEVER use Japanese in code** - This is an OSS project for global distribution. All comments, logs, error messages, variable names must be in English only.
2. **Do not add shebang to src/cli/index.ts** - tsup adds it via banner
3. **Use path.resolve() for all file paths** - handles both relative and absolute paths
4. **Set environment variables before calling LLM SDK** - the SDK reads from process.env
5. **Use mode 600 for config files** - security requirement for API keys
6. **Import with .js extension** - required for ESM modules even though files are .ts

## API Key Security

- Config file is created with mode 600 (read/write by owner only)
- API keys are never logged or exposed in error messages
- .env files must be in .gitignore
- Prefer environment variables over config file for CI/CD environments
