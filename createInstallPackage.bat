rd /s /q pilotinstall
mkdir pilotinstall
mkdir pilotinstall\backup
xcopy /s /r /i installScripts\* pilotinstall\
mkdir pilotinstall\resources\pilotapi
mkdir pilotinstall\resources\pilotapi\config
mkdir pilotinstall\resources\pilotapi\data\global
mkdir pilotinstall\resources\pilotapi\data\logbook
mkdir pilotinstall\resources\pilotapi\data\routes
dotnet build PiLotApiCore -o pilotinstall\resources\pilotapi -c release --no-self-contained
copy /y pilotinstall\resources\pilotapi\app.default.config pilotinstall\resources\pilotapi\PiLot.API.dll.config
del /s /q pilotinstall\resources\pilotapi\app.*.config
del /s /q pilotinstall\resources\pilotapi\app.config
copy pilotinstall\resources\pilotapi\App_Data\global\app.default.json pilotinstall\resources\pilotapi\data\global\app.json
rd /s /q pilotinstall\resources\pilotapi\App_Data
copy pilotinstall\resources\pilotapi\config\sensors.default.json pilotinstall\resources\pilotapi\config\sensors.json
del  pilotinstall\resources\pilotapi\config\sensors.*.json
copy pilotinstall\resources\pilotapi\config\tileSources.default.json pilotinstall\resources\pilotapi\config\tileSources.json
del  pilotinstall\resources\pilotapi\config\tileSources.*.json
copy pilotinstall\resources\pilotapi\config\publishingTargets.default.json pilotinstall\resources\pilotapi\config\publishingTargets.json
del  pilotinstall\resources\pilotapi\config\publishingTargets.*.json
copy pilotinstall\resources\pilotapi\config\authorization.default.json pilotinstall\resources\pilotapi\config\authorization.json
del  pilotinstall\resources\pilotapi\config\authorization.*.json
copy pilotinstall\resources\pilotapi\config\users.default.json pilotinstall\resources\pilotapi\config\users.json
del  pilotinstall\resources\pilotapi\config\users.*.json


mkdir pilotinstall\resources\pilotphotoswatcher
dotnet build PiLotPhotosWatcher -o pilotinstall\resources\pilotphotoswatcher -c release --no-self-contained
copy /y pilotinstall\resources\pilotphotoswatcher\app.default.config pilotinstall\resources\pilotphotoswatcher\PiLot.PhotosWatcher.dll.config
del /s /q pilotinstall\resources\pilotphotoswatcher\app.*.config
del /s /q pilotinstall\resources\pilotphotoswatcher\app.config

mkdir pilotinstall\resources\pilotsensors
dotnet build PiLotSensors -o pilotinstall\resources\pilotsensors -c release --no-self-contained
copy /y pilotinstall\resources\pilotsensors\app.default.config pilotinstall\resources\pilotsensors\PiLot.Sensors.dll.config
del /s /q pilotinstall\resources\pilotsensors\app.*.config
del /s /q pilotinstall\resources\pilotsensors\app.config
move /y pilotinstall\resources\pilotsensors\sensors.example.json pilotinstall\resources\pilotapi\config\
del /s /q pilotinstall\resources\pilotsensors\sensors.*.json
del /s /q pilotinstall\resources\pilotsensors\sensors.json

mkdir pilotinstall\resources\pilotweb
xcopy /s /r /i  PiLotWeb\* pilotinstall\resources\pilotweb\
rd /s /q pilotinstall\resources\pilotweb\photos
rd /s /q pilotinstall\resources\pilotweb\App_Data
del /s /q pilotinstall\resources\pilotweb\*.publishproj
copy pilotinstall\resources\pilotweb\js\Config.default.js pilotinstall\resources\pilotweb\js\Config.js
del /s /q pilotinstall\resources\pilotweb\js\Config.*.js
del /s /q pilotinstall\resources\pilotweb\test*.html

mkdir pilotinstall\resources\library
xcopy /s /r /i  ..\..\pilot\defaultlibrary\* pilotinstall\resources\library\

copy py\gpsLogger.py pilotinstall\resources\

mkdir pilotinstall\resources\pilotliveclient
dotnet build PiLotLiveClient -o pilotinstall\resources\pilotliveclient -c release --no-self-contained
copy /y pilotinstall\resources\pilotliveclient\app.default.config pilotinstall\resources\pilotliveclient\PiLot.LiveClient.dll.config
del /s /q pilotinstall\resources\pilotliveclient\app.*.config
copy /y pilotinstall\resources\pilotliveclient\config.default.json pilotinstall\resources\pilotliveclient\config.json
del /s /q pilotinstall\resources\pilotliveclient\config.*.json

mkdir pilotinstall\resources\pilotbackupclient
dotnet build PiLotBackupClient -o pilotinstall\resources\pilotbackupclient -c release --no-self-contained
copy /y pilotinstall\resources\pilotbackupclient\app.default.config pilotinstall\resources\pilotbackupclient\PiLot.Backup.Client.dll.config
del /s /q pilotinstall\resources\pilotbackupclient\app.*.config
copy /y pilotinstall\resources\pilotbackupclient\config.default.json pilotinstall\resources\pilotbackupclient\config.json
del /s /q pilotinstall\resources\pilotbackupclient\config.*.json

mkdir pilotinstall\resources\pilotbackupapi
dotnet build PiLotBackupApi -o pilotinstall\resources\pilotbackupapi -c release --no-self-contained
rd /s /q pilotinstall\resources\pilotbackupapi\App_Data
copy /y pilotinstall\resources\pilotbackupapi\app.default.config pilotinstall\resources\pilotbackupapi\PiLot.Backup.API.dll.config
del /s /q pilotinstall\resources\pilotbackupapi\app.*.config
copy pilotinstall\resources\pilotbackupapi\config\authorization.default.json pilotinstall\resources\pilotbackupapi\config\authorization.json
del  pilotinstall\resources\pilotbackupapi\config\authorization.*.json
copy pilotinstall\resources\pilotbackupapi\config\users.default.json pilotinstall\resources\pilotbackupapi\config\users.json
del  pilotinstall\resources\pilotbackupapi\config\users.*.json
copy pilotinstall\resources\pilotbackupapi\config\config.default.json pilotinstall\resources\pilotbackupapi\config\config.json
del  pilotinstall\resources\pilotbackupapi\config\config.*.json

7z a -r -ttar pilotinstall.tar pilotinstall
7z a -r -tgzip -mx9 pilotinstall.tar.gz pilotinstall.tar
rd /s /q pilotinstall
del pilotinstall.tar