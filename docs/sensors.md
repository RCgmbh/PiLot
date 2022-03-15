# PiLot
## Connect Sensors and log Data

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
sudo sh 07-install-sensorsLogger.sh
```
When opening the PiLot web application, in Administration > Services you should now see the "sensorsLogger" service active.

### Connect Sensors
Depending on the sensor, the connection varies a bit. And you will have to enable the respective interface on the PiLot. Again, when connecting wires to your PiLot, make very sure all connections are solid and won't come loose. Don't accept the "it will hold as long as I don't touch" it quality level, get help if needed. Really!

#### Connect an I2C device
All BMP/BME devices are connected over I2C, which is quite easy. First, enable I2C: run `sudo raspi-config`, go to **3 Interface Options** then **P5 I2C** and enable I2C. After that, install the i2c tools, which will come in handy to get your device's ids.
```
sudo apt install -y i2c-tools
```
Now turn off your PiLot and unplug the power cable. Connect the wires from the Sensor like this:
- VND to 3.3V (pin 1 or 17)
- GND to any Ground pin, like 6, 9, 14, 20, 25
- SCL to I2C1 SCL (pin 5, GPIO 3)
- SDA to I2C1 SDA (pin 3, GPIO 2)

That's already it for the wiring. See below how to configure the sensor for the PiLot sensorLogger.

#### Connect a OneWire device
Connecting 1W devices is a bit trickier, as you need a so-called pull-up resistor to pull the data wire up to the 3.3V line. If you duckduckgo "raspberry pi one wire", you will find a bunch of examples.

First, enable 1W: run `sudo raspi-config`, go to **3 Interface Options** then **P7 1-Wire** and enable the one wire interface.

Now turn off your PiLot and unplug the power cable. Connect the wires from the Sensor like this:
- Black is GND and goes to any Ground pin, like 6, 9, 14, 20, 25
- White/Yellow is Data and goes to pin 7 / GPIO 4
- Red is VCC and goes to 3.3V (pin 1 or 17)
- The 4.7 or 10 kΩ connects the Data and VCC line.

If you connect multiple 1W-Sensors, you can connect them all to the same pins and need just one resistor for all.

