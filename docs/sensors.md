# PiLot
## Attach Sensors and log Data

The PiLot will record sensor data and show you the current and past measurements, as well as for the air pressure the trend. The following hardware is currently supported (but much more can be added if needed, just create an Issue asking for a specific sensor type):

- BMP 180, BMP 280 for temperature and pressure
- BME 280, BME 680 for temperature, pressure and humidity
- OneWire temperature sensors, such as DS18B20 or MAX31820
- Inbuilt CPU temperature sensor
- Another PiLot delivering data

To record sensor measurements with the PiLot, these steps are needed:
1. Install the sensorsLogger service
2. Connect the sensors
2. Update the sensors.json config file

We will go through step-by-step, nice and easy, as always.

### Install the sensorsLogger service
The installation is done by a script, which is found in the pilotinstall directory:
```
cd ~/pilotinstall
sudo sh 
