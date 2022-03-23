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
- The 4.7 kΩ or 10 kΩ resistor connects the Data and VCC line.

If you connect multiple 1W-Sensors, you can connect them all to the same pins and need just one resistor for all.

### Update the sensors.json config file
There is one single configuration file, which holds all information about the sensors to be logged. You need to update the file so that it represents the sensors you have actually connected to your PiLot. There is an example file coming with the installation, so you best start by copying the example file and replace the empty default file.
```
cd /var/opt/pilot/sensors
sudo cp sensors.example.json sensors.json
```
The file contains devices, and every device contains one or more sensors. A BMP180, as an example, is one device, but contains two sensors: One for the temperature, and one for the air pressure. So this is represented as follows:
```
{
	"deviceType": "BMP180",
	"id": "119",
	"interval": 60,
	"sensors": [
		{
			"sensorType": "temperature",
			"name": "temperature1",
			"displayName": "Innentemperatur",
			"tags": [ "meteo", "startPage" ],
			"sortOrder": 10
		},
		{
			"sensorType": "pressure",
			"name": "pressure1",
			"displayName": "Luftdruck",
			"tags": [ "meteo", "logbook", "startPage" ],
			"sortOrder": 20
		}
	]
}
```
Let's have a closer look at the content:
- **deviceType**: This must be one of these values listed in [DeviceTypes.cs](../PiLotModel/Sensors/DeviceTypes.cs). Note that "BMP180" is used for just this type, while "BMXX80" is used for BMP280, BME280 and BME680.
- **id**: A unique identifier for the program to find the device. Depending on the deviceType, there are specific ways to find the correct value. See below for details.
- **interval**: the interval in seconds, how often the device is queried for data. As the program repeats only every 5 seconds, values should be multiples of five. 
- **sensors**: the list of sensors on the device. The list is an array, so it must be in \[brackets\]. Each sensor is an object, so it's in its own {curly brackets}. Multiple sensors are separated by a colon.

Each sensor has these attributes:
- **sensorType**: One of the values "temperature", "pressure" or "humidity".
- **name**: here you set the internal name of the sensor. The recorded data will be saved in /var/opt/pilot/{name}, therefore the name must be unique.
- **displayName**: the name of the sensor how it will be displayed in the PiLot. If you measure water temperature, call it "Water temperature" for example.
- **tags**: The tags define, where the sensor data will be used. These values are supported: *meteo*: the data will be displayed on the meteo page, *logbook* the data will be used as proposed temperature and air pressure for logbook entries (only set this tag for one temperature and one pressure sensor), *startPage*: the sensor data will be displayed on the start page.
- **sortOrder**: This defines the order of the sensors on the meteo page. 

For the different sensor types, there are some specific points to consider:
#### I2C devices
You find the id of an I2C device using the i2cdetect tool. You need to install the i2c-tools and then run i2cdetect:
```
sudo apt install i2c-tools
sudo i2cdetect -y 1
```
This will show you the id of the i2c devices. The id is in HEX, but we need it in decimal. Therefore, if you get 76, enter 118, for 77 enter 119. For any other value, duckduckgo for "hexadecimal to decimal converter" or use something very smart like [Wolfram Alpha](https://www.wolframalpha.com/input?i=77+hexadecimal+to+decimal) to convert the hex value from i2cdetect into the dec value for sensors.json.
