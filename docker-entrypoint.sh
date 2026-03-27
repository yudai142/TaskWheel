#!/bin/sh
set -e

# Install JS dependencies
npm install

# Build initial assets
npm run build:css

# Start esbuild JS watch in background with error handling
npm run dev > /tmp/esbuild.log 2>&1 &
ESBUILD_PID=$!

# Start tailwind CSS watch in background with error handling
npm run dev:css > /tmp/tailwind.log 2>&1 &
TAILWIND_PID=$!

# DB setup
bundle exec rails db:create db:migrate 2>/dev/null || true

# Trap to ensure child processes are cleaned up on exit
trap "kill $ESBUILD_PID $TAILWIND_PID" EXIT

# Start Rails server in foreground
exec bundle exec rails server -b 0.0.0.0
