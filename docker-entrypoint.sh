#!/bin/sh
set -e

yarn install

# Build initial CSS
yarn build:css

# Start tailwind CSS watch in background
yarn dev:css &

# Start esbuild JS watch in foreground (keeps container alive)
exec yarn dev
