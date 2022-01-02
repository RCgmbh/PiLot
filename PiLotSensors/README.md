# PiLot
## PiLotSensors

This application reads the data from different sensors, and sends the values to the PiLot API to be saved. It is intended to run as a service, such as

```
[Unit]
Description=PiLOT Sensors Logger

[Service]
Type=simple
ExecStart= /home/pi/code/dotnet/sensors/PiLot.Sensors
Restart=always
User=pi

[Install]
WantedBy=default.target
```

A config file defines the available sensors. Sensors are part of devices, and identified by IDs. It's a bit complicated. See the sensors.json files for examples.
