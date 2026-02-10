# Project Structure and Management

## Overview

This project uses [Yarn v4](https://yarnpkg.com/) (Berry) for Node.js dependency management with workspace monorepo structure.

## Project Structure

```
real-vibe-coding/
├── package.json             # Root workspace config
├── .yarnrc.yml              # Yarn configuration
├── yarn.lock                # Unified lockfile (committed)
├── tsconfig.json            # Root TypeScript config (project references)
├── biome.json               # Linting and formatting config
├── lefthook.yml             # Git hooks config
├── vitest.config.ts         # Root test config
├── Makefile                 # Build and test commands
├── packages/
│   ├── config/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   ├── src/
│   │   └── tests/
│   └── logger/
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsup.config.ts
│       ├── src/
│       └── tests/
```

## Workspace Member Structure

Each workspace member follows this pattern:
```
packages/<member>/
├── package.json             # Member config with dependencies
├── tsconfig.json            # TypeScript config with project references
├── tsup.config.ts           # Build config (esbuild-based)
├── src/
│   ├── index.ts             # Public exports
│   └── *.ts                 # Source files
└── tests/
    └── *.test.ts            # Vitest test files
```

## Key Principles

- **Root defines dev dependencies**: TypeScript, Biome, Vitest, tsup in root
- **Sub-modules declare runtime deps**: Only what each package needs
- **Shared tool config**: Biome and TypeScript rules in root
- **Module-specific tests**: Each package has its own tests/ directory
- **Build system**: Sub-modules use tsup for ESM output with declarations
- **Package naming**: Use `@my/` scope convention (e.g., `@my/config`, `@my/logger`)
- **Inter-package deps**: Use `workspace:*` protocol in dependencies
