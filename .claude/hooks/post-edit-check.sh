#!/bin/bash
# Post-edit hook: runs biome check and tsc on edited TypeScript files.

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Skip if no file path or not a TypeScript file
if [[ -z "$FILE_PATH" || "$FILE_PATH" != *.ts ]]; then
  exit 0
fi

# Skip files in excluded directories
if [[ "$FILE_PATH" =~ ^\.claude/ ]]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

ERRORS=""

# 1. Biome format and lint
BIOME_OUTPUT=$(npx @biomejs/biome check --write "$FILE_PATH" 2>&1) || true
if echo "$BIOME_OUTPUT" | grep -q "Found .* error"; then
  ERRORS+="biome issues in $FILE_PATH:\n$BIOME_OUTPUT\n"
fi

# 2. TypeScript type checking
TSC_OUTPUT=$(npx tsc --noEmit 2>&1) || true
if echo "$TSC_OUTPUT" | grep -q "error TS"; then
  ERRORS+="tsc errors:\n$TSC_OUTPUT\n"
fi

# Report results
if [[ -n "$ERRORS" ]]; then
  echo -e "$ERRORS" >&2
  exit 2
fi

exit 0
