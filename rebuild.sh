#!/bin/bash

# Rebuild script for iointerface project

set -e

PROJECT_DIR="/Users/tushar/Developer/iointerface"

cd "$PROJECT_DIR"

echo ">>>>> STEP-1"
rm -f package-lock.json

echo ">>>>> STEP-2"
rm -rf node_modules

echo ">>>>> STEP-3"
rm -f src-tauri/Cargo.lock

echo ">>>>> STEP-4"
rm -rf src-tauri/target

echo ">>>>> STEP-5"
npm i

echo ">>>>> STEP-6"
npm run build

echo ">>>>> REBUILD COMPLETE"
