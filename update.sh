#!/bin/bash
# Usage: ./update.sh <zipfile>
# Example: ./update.sh ~/Downloads/ts-upgrade-advisor-v6.zip
ZIP=$1
TMP=$(mktemp -d)
unzip -o "$ZIP" -d "$TMP"
# Copy all files preserving structure, stripping the leading folder name
rsync -av --exclude='*.DS_Store' "$TMP/ts-upgrade-advisor/" ~/ts-upgrade-advisor/
rm -rf "$TMP"
cd ~/ts-upgrade-advisor
git add .
git status
