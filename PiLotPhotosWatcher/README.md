# PiLot
## PiLotPhotosWatcher

This is an application which usually runs as a service and observes a directory. As soon as an image is saved, the application creates thumbnails and stores the files in a date based directory structure, which is used by the image gallery within the PiLot web app.

**Configuration**:

The configuration parameters are passed directly to the application, in the form: 
PhotosWatcher (watchDirectory) (outputDirectory) (watch | process) \[verbose\]
with "process", the files in the watchDirectory will be processed once. With "watch", any newly added file will be processed. 

Usually you want to create a service such as

```
[Unit]
Description=PiLOT Photo import

[Service]
Type=simple
ExecStart= /home/pi/code/dotnet/PhotosWatcher/PiLotPhotosWatcher /home/pi/photoimport /var/lib/pilot watch
Restart=always
User=pi
Environment=DOTNET_ROOT=/home/pi/dotnet

[Install]
WantedBy=default.target
```
