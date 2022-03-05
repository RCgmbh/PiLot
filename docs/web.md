# PiLot - getting started
## Install nginx and set up the web application

The core of the PiLot is a web application, which provides all data and functionality. The web application is made of different elements. One is the static website, containing the html and javascript files. The other part ist the REST API, which is called by the javascript within the website, and grants reading and writing access to the data. A webserver (nginx, say "engine-X") is used to make all this glory available. Sounds complicated, but actually isn't, as most of the work already has been done for you.

All scripts are in the pilotinstall directory, and some of them only work when called from within this directory, so please make sure you are at the right place:

```
cd ~/pilotinstall
```
We first install the .net core runtime. Just enter 
```
sudo sh 02-install-netcore.sh
```
To check whether the installation was successful, enter 
```
dotnet --list-runtimes
```
This will give you a list of the installed runtimes, and should list Microsoft.AspNetCore.App and Microsoft.NETCore.App.

Next, install nginx and the actual PiLot application components, again by just calling a script:
```
sudo sh 03-install-pilotweb.sh
```
Now, another big moment has come, and your PiLot should already work (at least a bit). On any device, that is connected to the PiLot, open your favourite browser, and in the addess bar, enter the following URL:
- If the device is connected to the PiLot access point, enter http://192.168.80.1/pilot (or, if you changed the static IP, enter the IP address you have set)
- If the device is in the same network as the pilot (e.g. your home WiFi), enter http://pilot/pilot, where the first "pilot" is the hostname you gave to your raspi.
- If you are directly working on your raspberry pi, enter http://localhost/pilot

You will see the PiLot start page, but as you have no map data, no GPS and no sensors yet, this will appear a bit empty, and it might still be a bit difficult to grasp the beauty of it all. But we will work on this.

\> [Connect a GPS device and set up the GPS logging service...](gps.md)

<< [Back to overview](user.md)
