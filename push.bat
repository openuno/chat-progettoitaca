git pull
git add .
IF "%1."=="." GOTO:UseDefault

git commit -m %1
GOTO:MyFinish

:UseDefault
git commit -m "update"

:MyFinish
git push
ECHO Done!