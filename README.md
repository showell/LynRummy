# compile like so:

~~~
clear; echo -e "\nTest\n---\n\n"; (npx tsc game.ts && npx prettier game.ts --write && node game.js)
