rd /s /q pilotinstall
mkdir pilotinstall
xcopy /s /r /i installScripts\* pilotinstall\
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
copy pilotinstall\resources\pilotapi\App_Data\global\app.default.json pilotinstall\resources\pilotapi\App_Data\global\app.json
del  pilotinstall\resources\pilotapi\App_Data\global\app.*.json
copy pilotinstall\resources\pilotapi\App_Data\sensors\sensors.default.json pilotinstall\resources\pilotapi\App_Data\sensors\sensors.json
del  pilotinstall\resources\pilotapi\App_Data\sensors\sensors.*.json
copy pilotinstall\resources\pilotapi\App_Data\tiles\tileSources.default.json pilotinstall\resources\pilotapi\App_Data\tiles\tileSources.json
del  pilotinstall\resources\pilotapi\App_Data\tiles\tileSources.*.json
copy pilotinstall\resources\pilotapi\App_Data\authorization.default.json pilotinstall\resources\pilotapi\App_Data\authorization.json
del  pilotinstall\resources\pilotapi\App_Data\authorization.*.json
copy pilotinstall\resources\pilotapi\App_Data\users.default.json pilotinstall\resources\pilotapi\App_Data\users.json
del  pilotinstall\resources\pilotapi\App_Data\users.*.json


mkdir pilotinstall\resources\pilotphotoswatcher
dotnet build PiLotPhotosWatcher -o pilotinstall\resources\pilotphotoswatcher -c release -r linux-arm --no-self-contained

mkdir pilotinstall\resources\pilotsensors
dotnet build PiLotSensors -o pilotinstall\resources\pilotsensors -c release -r linux-arm --no-self-contained
copy /y pilotinstall\resources\pilotsensors\app.default.config pilotinstall\resources\pilotsensors\PiLot.Sensors.dll.config
del /s /q pilotinstall\resources\pilotsensors\app.*.config
del /s /q pilotinstall\resources\pilotsensors\app.config
move /y pilotinstall\resources\pilotsensors\sensors.example.json pilotinstall\resources\pilotapi\App_Data\sensors\

mkdir pilotinstall\resources\pilotweb
xcopy /s /r /i  PiLotWeb\* pilotinstall\resources\pilotweb\
rd /s /q pilotinstall\resources\pilotweb\photos
copy pilotinstall\resources\pilotweb\js\Config.default.js pilotinstall\resources\pilotweb\js\Config.js
del /s /q pilotinstall\resources\pilotweb\js\Config.*.js

mkdir pilotinstall\resources\library
xcopy /s /r /i  ..\..\pilot\defaultlibrary\* pilotinstall\resources\library\

copy py\gpsLogger.py pilotinstall\resources\

mkdir pilotinstall\resources\pilotliveclient
dotnet build PiLotLiveClient -o pilotinstall\resources\pilotliveclient -c release -r linux-arm --no-self-contained
copy /y pilotinstall\resources\pilotliveclient\app.default.config pilotinstall\resources\pilotliveclient\PiLot.LiveClient.dll.config
del /s /q pilotinstall\resources\pilotliveclient\app.*.config
copy /y pilotinstall\resources\pilotliveclient\config.default.json pilotinstall\resources\pilotliveclient\config.json
del /s /q pilotinstall\resources\pilotliveclient\config.*.json

7z a -r -ttar pilotinstall.tar pilotinstall
7z a -r -tgzip -mx9 pilotinstall.tar.gz pilotinstall.tar
del pilotinstall.tar