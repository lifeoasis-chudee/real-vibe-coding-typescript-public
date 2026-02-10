# Real Vibe Coding

A practice project for learning Claude Code usage with Node.js monorepo structure using Yarn v4 workspaces.

## Prerequisites

- **Node.js** 22 LTS or later
- **Yarn** v4 (Berry) - enabled via corepack

```bash
corepack enable
```

Verify installation:
```bash
node --version   # v22.x.x
yarn --version   # 4.x.x
```

## Setup

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd real-vibe-coding

# Install all dependencies
yarn install --immutable
```

## Project Structure

```
real-vibe-coding/
├── packages/
│   ├── config/      # Shared configuration module (Zod-based)
│   └── logger/      # Structured logging module (pino-based)
├── package.json     # Root workspace configuration
├── tsconfig.json    # Root TypeScript config
├── biome.json       # Linting and formatting
├── yarn.lock        # Locked dependencies
└── Makefile         # Build and test commands
```

## Development

### Running Tests

```bash
# Run all tests
yarn test

# Run tests for specific module
make test-config
make test-logger
```

### Code Quality

```bash
# Run linter and formatter
yarn lint

# Fix lint issues
yarn lint:fix

# Type checking
yarn typecheck

# Full CI check (lint + typecheck + tests)
make ci
```

### Adding Dependencies

```bash
# Add to root (dev dependency)
yarn add -D <package>

# Add to specific workspace package
yarn workspace @my/config add <package>
yarn workspace @my/logger add <package>
```

## License

MIT
