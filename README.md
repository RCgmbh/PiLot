# PiLot

The PiLot is a Raspberry Pi based system used for boating. It provides functionality in
these areas:
- Offline maps, showing current position and direction, waypoints and track
- Provide current navigation data, such as position, CoG, SoG, VMG, ETA
- Collect and provide historical data about your trips, such as:
  - GPS track
  - Environmental data (temperature, air pressure, humidity)
  - Logbook function recording boat setup, diary texts and photos 

The PiLot sets up a WiFi access point and a web server, and the entire functionality
can be used with any device connected to the access point, using any browser.

## Getting started 
### For users
If you have a bit of time and curiosity, you can set up your own PiLot at no cost (except
the hardware). You will end up having a free and open system to plan, track and relive your
adventures on the water. 

BE AWARE that **the PiLot does in no way replace neither reliable, professional navigation equipment
nor up-to-date charts.** The PiLot might be wrong, or might even fail entirely. 

See [Getting started for Users](docs/user.md) for further details.
### For developers
If you feel like contributing to the PiLot ecosystem, then you are more than welcome. It's just
HTML, vanilla Javascript and dotnet core with C#. No bloat, no frameworks, just straightworward
code. All you need is your favourite IDE, the dotnet SDK, a webserver (such as nginx) and git.
See [Getting started for developers](docs/dev.md) for further details.
