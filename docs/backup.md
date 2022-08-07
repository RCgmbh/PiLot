# PiLot
## Set up backup

As you will collect a lot of data, you will sooner or later want to have that data backed up somewhere. After all it's not impossible to lose your data, be it because the SD card fails, you lose your pilot or you delete some data by mistake.

The PiLot comes with a simple backup tool. It consists of a client application and a server component. The client runs on your PiLot, and sends changed data to the server every few minutes. The server offers a http interface (a REST API), which recieves the data and saves it. The server will save multiple backup sets, so that you will have the the data from before a few minutes, the data from yesterday, before yesterday, last week, last month and last year or so.

### Install the server
In the simplest, but admittedly not the most reasonable setup, you set up the backup server on your PiLot. This will however not help, if your SD card breaks or you lose your device. Giving you some historic data, it might help you recover mistakenly delete data. If you have two PiLots you might want to install the backup client on both of them, and let them backup their data on each other. You can also install the server component on your desktop machine or on a server available online. 

This chapter only describes the installation on a PiLot. However, if you look into the installation script, you will be able to perform the equivalent operations on any other system. You should be able to install the component on any system that has a web server running, and supports .net core.

Installing the backup server (called pilot backup api) is easy. There is - you guessed it - an installation script. Run it with 
```
cd ~/pilotinstall
sudo sh 08-install-backupAPI.sh
```
This will set up the API, which runs as a service. It will also configure nginx to forward calls to the http://hostname/pilotbackupapi url to the port 5002. **Important**: This depends on the line "include locations/\*", which is part of the nginx default config file we created when installing the pilot web application. On a system where the pilot web application has not been installed, you have to make sure to have the following block within the "server"-section of the nginx configuration file '/etc/nginx/sites-enabled/default':

```
location /pilotbackupapi/ {
	proxy_pass http://127.0.0.1:5002;
}
```

Up for more advanced stuff? Why not have a look at the live tracking feature, which will be super easy to set up if you succeeded with the backup thing.

\> [Set up live tracking...](livetracking.md)

<< [Back to overview](user.md)
