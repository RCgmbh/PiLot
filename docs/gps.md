# PiLot - getting started
## Install the GPS reciever

In order to have position data available, you need to connect a GPS reciever and install some software, to read and store the data.

There are many GPS recievers out there. Many of them are connected using the UART GPIO pins. When connecting the GPS reciever, make sure all wires are properly connected.

**Important**:
Be very careful with the wires, especially if you attach the connectors on your own. Always shut down your Raspberry PI and disconnect it from the power source before connecting any wires. Always do a "pull test" on connected wires, everything must be solid and stay in place, because wires that come loose can easily cause a short circuit and destroy your hardware, or even worse, become very hot, cause fire and thereby raise serious danger to life. So, if you feel like "ok, that will hold as long as I don't touch it", **find someone to help you get it done right**.

After having disconnected your PiLot from power, connect your UART capable GPS reciever to these GPIO pins (see [pinout.xyz](https://pinout.xyz)):
- The VIN or V or + is the positive power input. Connect it to pin 1 or 17.
- The GND or G is the ground connection. Connect it to any GND pin, like 6, 9, 14 etc.
- The RX or R is where the device recieves inputs. It must be connected to the TX pin on the raspi, which is pin number 8 (GPIO 14).
- The TX or T is where the device sends data to the raspi. It needs to be connected to the RX pin, which is pin number 10 (GPIO 15).

That's all you need, any other wires or pins can be ignored. You can now re-connect your PiLot to the power.

Now there is some software to be installed. There is a package "gpsd", which reads the data from the gps. A python script takes the data from gpsd and sends it to the pilot API, which saves it and makes it available to the PiLot web application. This needs to be set up in two steps, as a reboot must be made inbetween. Again, there are scripts that should automagically set it all up.

The first script installs gpsd and the python script, and it enables UART. While in the "pilotinstall" directory, start it by typing
```
cd ~/pilotinstall
sudo sh 04-install-gps-1.sh
```
When asked to do so, reboot (yes, it's still "sudo reboot now"). Then, when back connected to your raspi, and again in the pilotinstall directory, start the second part:
```
cd ~/pilotinstall
sudo sh 05-install-gps-2.sh
```
Now place your PiLot close to a window, and be patient. Depending on your gps reciever and the weather, it can take some time (minutes, tens of minutes) until it has a fix. As soon as you have a fix, you will see your current position on the map in the PiLot web application. Well done! 

Hint: On the Administration page, which is close to the Settings page and has an icon looking like a terminal window, there is the "Services" section, where you can stop and start the gps service.

Now let's move on, and do some photos stuff...

\> [Install the photos import service...](photoimport.md)

<< [Back to overview](user.md)
