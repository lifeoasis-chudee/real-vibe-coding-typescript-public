# TypeScript Coding Convention

## Module System
- Use ESM (`import`/`export`) exclusively. Never use `require()`.
- Use `.js` extension in import paths (TypeScript resolves these to `.ts` at compile time).
- Prefer named exports over default exports.

## Naming Conventions
- **Variables and functions**: `camelCase`
- **Types, interfaces, classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE` for true compile-time constants, `camelCase` for runtime constants
- **File names**: `kebab-case.ts` (e.g., `config-base.ts`, `settings-base.ts`)
- **Test files**: `<module>.test.ts`

## Type Safety
- Enable `strict: true` in tsconfig.json
- Avoid `any` - use `unknown` with type narrowing instead
- Use `noUncheckedIndexedAccess: true`
- Prefer `interface` for object shapes, `type` for unions/intersections

## Code Style (Biome)
- 2-space indentation
- 100 character line width
- Biome handles formatting and import sorting automatically

## Functions
- Prefer arrow functions for callbacks
- Use regular functions for top-level declarations
- Keep functions small and focused

## Error Handling
- Use typed errors when possible
- Avoid swallowing errors silently
- Use `Result` pattern or explicit error types for expected failures
