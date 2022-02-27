mkdir pilotinstall
mkdir pilotinstall\resources\pilotapi
dotnet build PiLotApiCore -o pilotinstall\resources\pilotapi -c release -r linux-arm --no-self-contained
copy /y pilotinstall\resources\pilotapi\app.default.config pilotinstall\resources\pilotapi\PiLot.API.dll.config
del /s /q pilotinstall\resources\pilotapi\app.*.config
del /s /q pilotinstall\resources\pilotapi\app.config
rd /s /q pilotinstall\resources\pilotapi\App_Data\log
rd /s /q pilotinstall\resources\pilotapi\App_Data\gps
rd /s /q pilotinstall\resources\pilotapi\App_Data\logbook
rd /s /q pilotinstall\resources\pilotapi\App_Data\photos
rd /s /q pilotinstall\resources\pilotapi\App_Data\publishing
rd /s /q pilotinstall\resources\pilotapi\App_Data\routes
copy pilotinstall\resources\pilotapi\App_Data\sensors\sensors.default.json pilotinstall\resources\pilotapi\App_Data\sensors\sensors.json
del  pilotinstall\resources\pilotapi\App_Data\sensors\sensors.*.json
copy pilotinstall\resources\pilotapi\App_Data\tiles\tileSources.default.json pilotinstall\resources\pilotapi\App_Data\tiles\tileSources.json
del  pilotinstall\resources\pilotapi\App_Data\tiles\tileSources.*.json
copy pilotinstall\resources\pilotapi\App_Data\authorization.default.json pilotinstall\resources\pilotapi\App_Data\authorization.json
del  pilotinstall\resources\pilotapi\App_Data\authorization.*.json
copy pilotinstall\resources\pilotapi\App_Data\users.default.json pilotinstall\resources\pilotapi\App_Data\users.json
del  pilotinstall\resources\pilotapi\App_Data\users.*.json

mkdir pilotinstall\resources\pilotweb
xcopy /s /r /i  PiLotWeb\* pilotinstall\resources\pilotweb\
rd /s /q pilotinstall\resources\pilotweb\photos
copy pilotinstall\resources\pilotweb\js\Config.default.js pilotinstall\resources\pilotweb\js\Config.js
del /s /q pilotinstall\resources\pilotweb\js\Config.*.js

mkdir pilotinstall\resources\library
xcopy /s /r /i  ..\..\pilot\defaultlibrary\* pilotinstall\resources\library\

xcopy /s /r /i installScripts\* pilotinstall\
7z a -r -ttar pilotinstall.tar pilotinstall
7z a -r -tgzip pilotinstall.tar.gz pilotinstall.tar
del pilotinstall.tar