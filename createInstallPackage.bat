mkdir pilotinstall
mkdir pilotinstall\pilotapi
dotnet build PiLotApiCore -o pilotinstall\pilotapi -c release -r linux-arm --no-self-contained
copy /y pilotinstall\pilotapi\app.default.config pilotinstall\pilotapi\app.config
del /s /q pilotinstall\pilotapi\app.*.config
rd /s /q pilotinstall\pilotapi\App_Data\log
rd /s /q pilotinstall\pilotapi\App_Data\gps
rd /s /q pilotinstall\pilotapi\App_Data\logbook
rd /s /q pilotinstall\pilotapi\App_Data\photos
rd /s /q pilotinstall\pilotapi\App_Data\publishing
rd /s /q pilotinstall\pilotapi\App_Data\routes
copy pilotinstall\pilotapi\App_Data\sensors\sensors.default.json pilotinstall\pilotapi\App_Data\sensors\sensors.json
del  pilotinstall\pilotapi\App_Data\sensors\sensors.*.json
copy pilotinstall\pilotapi\App_Data\tiles\tileSources.default.json pilotinstall\pilotapi\App_Data\tiles\tileSources.json
del  pilotinstall\pilotapi\App_Data\tiles\tileSources.*.json
copy pilotinstall\pilotapi\App_Data\authorization.default.json pilotinstall\pilotapi\App_Data\authorization.json
del  pilotinstall\pilotapi\App_Data\authorization.*.json
copy pilotinstall\pilotapi\App_Data\users.default.json pilotinstall\pilotapi\App_Data\users.json
del  pilotinstall\pilotapi\App_Data\users.*.json

mkdir pilotinstall\pilotweb
xcopy /s /r /i  PiLotWeb\* pilotinstall\pilotweb\
rd /s /q pilotinstall\pilotweb\photos
copy pilotinstall\pilotweb\js\Config.default.js pilotinstall\pilotweb\js\Config.js
del /s /q pilotinstall\pilotweb\js\Config.*.js

xcopy /s /r /i installScripts\* pilotinstall\
7z a -r -ttar pilotinstall.tar pilotinstall
7z a -r -tgzip pilotinstall.tar.gz pilotinstall.tar
del pilotinstall.tar