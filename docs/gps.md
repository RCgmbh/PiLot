# PiLot - getting started
## Install the GPS reciever

In order to have position data available, you need to connect a GPS reciever and install some software, to read and store the data.

There are many GPS recievers out there. Many of them are connected using the UART GPIO pins. When connecting the GPS reciever, make sure all wires are properly connected.

**Important**:
Be very careful with the wires, especially if you attach the connectors on your own. Always shut down your Raspberry PI and disconnect it from the power source before connecting any wires. Always do a "pull test" on connected wires, everything must be solid and stay in place, because wires that come loose can easily cause a short circuit and destroy your hardware, or even worse, become very hot, cause fire and thereby raise serious danger to life. So, if you feel like "ok, that will hold as long as I don't touch it", **find someone to help you get it done right**.

After having disconnected your PiLot from power, connect your UART capable GPS reciever to these GPIO pins (see [pinout.xyz](https://pinout.xyz)):
- The VIN or V or + is the positive 3.3 V power input. Connect it to pin 1 or 17 (or to pin 2 or 4 if your device needs 5 V).
- The GND or G is the ground connection. Connect it to any GND pin, like 6, 9, 14 etc.
- The RX or R is where the device recieves inputs. It must be connected to the TX pin on the raspi, which is pin number 8 (GPIO 14).
- The TX or T is where the device sends data to the raspi. It needs to be connected to the RX pin, which is pin number 10 (GPIO 15).

That's all you need, any other wires or pins can be ignored. You can now re-connect your PiLot to the power.

Now there is some software to be installed. There is a package "gpsd", which reads the data from the gps. A python script takes the data from gpsd and sends it to the pilot API, which saves it and makes it available to the PiLot web application. First, we need a few manual steps, the rest will be done by a script.

First, we enable UART and disable bluetooth (which will allow UART to use the better serial port). For this, we need to change a file:
```
sudo nano /boot/firmware/config.txt
```
Add these two lines to the [all] section (usually at the end):
```
enable_uart=1
dtoverlay=disable-bt
```
Then, enable the serial port using raspi-config:
```
sudo raspi-config
> 3 Interface Options
> I6 Serial Port
> Would you like a login shell to be accessible over serial? >> No
> Would you like the serial port hardware to be enabled?: >> Yes
> Finish
> Reboot
```
After the reboot, start the scripted part:
```
cd ~/pilotinstall
sudo sh 04-install-gps.sh
```
Now place your PiLot close to a window, and be patient. Depending on your gps reciever and the weather, it can take some time (minutes, tens of minutes) until it has a fix. As soon as you have a fix, you will see your current position on the map in the PiLot web application. Well done! 

Hint: On the "Services" page you can stop and start the gps service.

Now let's move on, and do some photos stuff...

\> [Install the photos import service...](photoimport.md)

<< [Back to overview](user.md)
