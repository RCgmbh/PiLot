@REM prepare directory
cd ..\..
rd /s /q pilotupdatearm64
mkdir pilotupdatearm64
mkdir pilotupdatearm64\temp

@REM build solutions, just keeping relevant files
@REM PiLot API
dotnet build PiLotApiCore -o pilotupdatearm64\temp -c release -r linux-arm64 --no-self-contained
mkdir pilotupdatearm64\pilotapi
xcopy /s /r /i pilotupdatearm64\temp\*.dll pilotupdatearm64\pilotapi\
xcopy /s /r /i pilotupdatearm64\temp\*.deps.json pilotupdatearm64\pilotapi\
rmdir /s /q pilotupdatearm64\temp
@REM PiLot Web
mkdir pilotupdatearm64\pilotweb


@REM create archive

@REM upload to ftp

@REM cleanup
@REM rd /s /q pilotupdatearm64