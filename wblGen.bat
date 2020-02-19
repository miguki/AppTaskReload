@echo off
REM wblGen.bat - v 1.0.0 - 2015-10-09
REM Description:
REM A simple batch file that automatically generates the wblfolder.wbl for your Qlik Sense visualization extension.
REM 
REM Author: Nate Untiedt - Analytics8 - nuntiedt@analytics8.com
REM
REM Credit to: http://stackoverflow.com/a/8387078

setlocal EnableDelayedExpansion
for /L %%n in (1 1 500) do if "!__cd__:~%%n,1!" neq "" set /a "len=%%n+5"
setlocal DisableDelayedExpansion

echo Deleteing wbfolder.wbl...
del .\src\wbfolder.wbl

echo Generating wbfolder.wbl...
REM Iterate through entire directory recursively
for /r .\src %%g in (*) do (
  set "absPath=%%g"
  echo absPath: %%g
  setlocal EnableDelayedExpansion
REM Trim off the absolute portion of the path
  set "relPath=!absPath:~%len%!"
REM Write each entry to wbfolder.wbl
  echo(!relPath!; >> .\src\wbfolder.wbl
  endlocal
)

Echo Wbfolder.wbl generation completed