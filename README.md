
See scripts/run-dev.sh to run a node server that will watch for
changes to game.ts and compile it and serve it up.

See https://showell.github.io/LynRummy/ for a live demo that uses
GH Pages.  We have the GH action .github/workflows/lynrummy.yaml
that builds out the JS from our TS files.  And then it should
be a fairly simple exercise to make sure your repo serves up
GH Pages based on this action.  Unfortunately, we don't have
the exact steps written for that. (When we build this is a network
game, we will probably need to start self-hosting the game
anyway.)
