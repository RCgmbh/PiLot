# PiLot
## GPSDataCreator

This is a development/testing tool, which allows to generate GPS data for the PiLot. The data is sent to the PiLot API, which saves it and feeds the web client.

**Getting started**

- Copy app.example.config to app.config, and enter the settings suitable for your setup. The user needs write-permissions for the API.
- Start the application.
- The application will load the last position (within a few days), or allow to enter latitude and longitude to start at manually.
- Use the arrow-keys to accelerate (up/down) or turn (left/right).
