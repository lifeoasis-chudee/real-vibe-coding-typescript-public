# Development Environment

## Environment Activation
Every agent session must start with dependency install:
```bash
yarn install --immutable
```

## Post-Development Verification
The following scripts force to meet coding conventions and styles. Run this for every task.
```bash
yarn lint
```

After verification passes, run the full test suite:
```bash
yarn test
```

For comprehensive CI validation (lint + typecheck + tests):
```bash
make ci
```

## Update dependency
When add new dependency or change existing, Run this.
```bash
yarn add <package>           # for root
yarn workspace @my/<name> add <package>  # for workspace member
```

## Dev Server
