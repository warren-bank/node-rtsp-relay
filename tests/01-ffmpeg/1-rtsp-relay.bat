@echo off

set PATH=%~dp0..\node_modules\.bin;%PATH%
set NODE_PATH=%~dp0..\node_modules

set log="%~dp0.\log.txt"

call rtsp-relay -pport 5554 -cport 6554 --log 5 >%log% 2>&1
