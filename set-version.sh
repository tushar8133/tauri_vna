#!/bin/bash

##########################################
# to run this file, follow below example #
#         sh set-version.sh 3.1.0        #
##########################################

NEW_VERSION=$1
if [ -z "$NEW_VERSION" ]; then
  echo "Usage: ./update-version.sh <new-version>"
  exit 1
fi

rm -f package-lock.json
rm -rf node_modules
rm -f src-tauri/Cargo.lock
rm -rf src-tauri/target

# Update Cargo.toml
sed -i '' "s/^version = \"[0-9.]*\"/version = \"$NEW_VERSION\"/" src-tauri/Cargo.toml

# Update tauri.conf.json
sed -i '' "s/\"version\": \"[0-9.]*\"/\"version\": \"$NEW_VERSION\"/" src-tauri/tauri.conf.json

# Update package.json
sed -i '' "s/\"version\": \"[0-9.]*\"/\"version\": \"$NEW_VERSION\"/" package.json

sed -i '' "s/<div>Version [0-9.]*<\/div>/<div>Version $NEW_VERSION<\/div>/" src/index.html

echo "Version updated to $NEW_VERSION in all files."
