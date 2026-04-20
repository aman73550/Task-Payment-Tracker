#!/usr/bin/env bash
set -euo pipefail

# Enable corepack and install correct pnpm version to match lockfile format 9.0
corepack enable
corepack prepare pnpm@10.26.1 --activate
