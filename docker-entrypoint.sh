#!/bin/sh
set -e

# Install JS dependencies
yarn install

# Build initial assets
yarn build:css

# Start esbuild JS watch in background
yarn dev &

# Start tailwind CSS watch in background
yarn dev:css &

# DB setup
bundle exec rails db:create db:migrate 2>/dev/null || true

# Start Rails server in foreground
exec bundle exec rails server -b 0.0.0.0
