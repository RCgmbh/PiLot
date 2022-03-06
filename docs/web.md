# PiLot - getting started
## Install the PiLot web application

The core of the PiLot is a web application, which provides all data and functionality. The web application is made of different elements. One is the static website, containing the html and javascript files. The other part ist the REST API, which is called by the javascript within the website, and grants reading and writing access to the data. A webserver (nginx, say "engine-X") is used to make all this glory available. Sounds complicated, but actually isn't, as most of the work already has been done for you, and the entire installation in this chapter is automated with scripts.

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
Now, another big moment has come, and your PiLot should already work (at least a bit). Take a device, that is connected to the PiLot, open your favourite browser, and in the addess bar, enter the following URL:
- If the device is connected to the PiLot access point, enter http://192.168.80.1/pilot (or, if you changed the static IP, enter the IP address you have set)
- If the device is in the same network as the pilot (e.g. your home Wi-Fi), enter http://raspberrypi/pilot, or replace "raspberrypi" by the hostname you gave to your raspi.
- If you are directly working on your raspberry pi, enter http://localhost/pilot

You will see the PiLot start page, but as you have no map data, no GPS and no sensors yet, this will appear a bit empty, and it might still be a bit difficult to grasp the beauty of it all. But we will work on this. For now we just want to download a few map tiles (the images that make the map). There is a page within the PiLot web application to do that:

Click on the "Tools" icon in the left side navigation (on smaller screens, you have to click the "hamburger"-icon (☰) first), looking like a hammer and wrench. From there, select "Local maps". This will show a page containing some options and a map. Move the map to the area you are interested in, then check the two checkboxes below the "download"-icon. In the two dropdown menues, you can choose how many zoom levels you want do download. Select "all" in the first dropdown, and "1" in the second. Now, when you pan or zoom the map, everything you see on the map will be saved locally, as well as all lower and one higher zoom level. As soon as you have downloaded a few tiles, click on the "map"-icon in the left-side navigation. The map you see here (as opposed to the map on the tiles download page) is made up entirely of your local data, and thus will be available offline.

Click on the "home" icon to return to the start page, and save that page to your favourites. On an android device, if you add the page to your start screen, it will then open in a nice fullscreen window.

In later chapters we will customize the boat image and add sensors, so that there will be more meaningful data displayed on the start page. But first, we dive into the gps topic.

\> [Connect a GPS device and set up the GPS logging service...](gps.md)

<< [Back to overview](user.md)
