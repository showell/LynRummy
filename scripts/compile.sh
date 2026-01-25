#! /usr/bin/env bash
cp -r static/* dist/

clear;
echo -e "\nTest\n---\n\n";
(npx tsc --lib es2022,dom --outDir dist game.ts && npx prettier game.ts --write && node dist/game.js)