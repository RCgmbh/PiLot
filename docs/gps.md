# PiLot - getting started
## Install the GPS reciever

In order to have position data available, you need to connect a GPS reciever and install some software, to read and store the data.

There are many GPS recievers out there. Many of them are connected using the UART GPIO pins. When connecting the GPS reciever, make sure all wires are properly connected. Be very careful with the wires, especially if you attach the connectors on your own. Always do a "pull test", everything must be solid and stay in place, because wires that come loose can easily cause a short circuit and destroy your hardware, or even worse, become very hot, cause fire and thereby raise serious danger to life. So, if you feel like "ok, that will hold as long as I don't touch it", find someone to help you get it done right.

Connect your UART capable GPS reciever to these GPIO pins (see [https://pinout.xyz](pinout.xyz)):
- The VIN or V or + is the positive power input. Depending on the device, it needs 3-5 volts. For 3.3V, connect it to pin 1 or 17, for 5V, connect it to pin 2 or 4
- The GND or G is the ground connection. Connect it to any GND pin, like 6, 9, 14 etc.
- The RX or R is where the device recieves inputs. It must be connected to the TX pin on the raspi, which is number 8.
- The TX or T is where the device sends data to the raspi. It needs to be connected to the RX pin, which is number 10.

That's all you need, any other wires or pins can be ignored.

Now there is some software to be installed. There is a package "gpsd", which reads the data from the gps. A python script takes the data from gpsd and sends it to the pilot API, which saves it and makes it available to the PiLot web application. This needs to be set up in two steps, as a reboot must be made inbetween. Again, there are scripts that should automagically set it all up.

The first script installs gpsd and the python script, and it enables UART. While in the "pilotinstall" directory, start it by typing
```
sudo sh 04-install-pgs-1.sh
```
When asked to do so, reboot (yes, it's still "sudo reboot now"). Then, when back connected to your raspi, and again in the pilotinstall directory, start the second part:
```
sudo sh 05-install-gps-2.sh
```
Now place your PiLot close to a window, and be patient. Depending on your gps reciever and the weather, it can take some time (minutes, tens of minutes) until it has a fix. As soon as you have a fix, you will see your current position on the map in the PiLot web application.
