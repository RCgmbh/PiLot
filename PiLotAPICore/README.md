# PiLot
## PiLotAPICore
This is the REST API which is the main backend for the web application. Its main purpose is to serve data and to save data.
Furthermore, it is responsible for the authenticatication (which is based on a very simple homegrown cookie-based mechanism).

The API is also used by other tools, like the sensors logger who sends sensor data to the api in order to save them. 

The API is usually run as a service (systemd), and made available through a web server (ngingx).

**Configuration**:

In app.config, set these values:
- dataDir: This is the main data directory. On a PiLot it is usually /var/lib/pilot
- logLevel: Use one of these (with decreasing sensitivity): DEBUG, INFO, WARNING, ERROR. Don't use DEBUG in production environments.
- logfilePath: The directories where the logfiles are saved. Usually /var/log/pilot
