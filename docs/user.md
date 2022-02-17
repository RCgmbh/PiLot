# PiLot - getting started
This guide will lead you through the steps of building up your own Raspberry Pi based boating system - the PiLot. You don't need any special knowledge - if you can do basic stuff with a computer, you should be fine. Some of the steps are optional, so don't worry if the guide at first appears quite long. If everything goes well, you should be done within an afternoon. But better reserve a full weekend.
## Prerequisites: Get a Raspberry Pi and some hardware
To begin, you need to get some hardware.

Mandatory:
- A Raspberry Pi. Good choices are the models 3 and 4, or probably the Zero 2 W. Although I do have a PiLot application for older Raspis (1, Zero), I don't invest much into keeping them up-to-date.
- A microSD card. 8GB are enough for the PiLot. However, a bit more won't hurt. 64GB is a good choice.
- A USB WiFi dongle. This allows to connect the PiLot to the home or a public WiFi, while the second (the onboard) Wi-Fi is used to set up the local access point. The tiny EDIMAX N150 is a good choice. If you want bigger reach (to connect to the much too weak marina Wi-Fi), take something like the EDIMAX 7811.
- A power adapter for the Raspberry Pi. Don't just take any cheap usb charger, better go for an original Raspberry Pi Power Supply. Check the requirements of the Raspberry Pi you chose, to make sure you have the right plug and enough current.
- For the setup process, you will need a computer (mac, pc, linux) on which you can open a terminal/console window, and which is connected to your home Wi-Fi. Alternatively you can connect a keyboard and a screen directly to your Raspberry Pi.

Optional (but recommended)
- If you want to have a portable PiLot, you will need a powerbank. If you find it, take one with "pass through" charging, which allows charging and powering the PiLot at the same time. For a Raspberry Pi 3, you will get about one hour of independence per 1000 mAh. So there's a tradeoff to find between size/prize and autonomy.
- If you want to have the navigation and tracking features available, you will need a GPS reviever. If you search for "UART GPS module" at aliexpress or amazon, you will find devices like from Topgnss for around 10$. The device should support UART (the connection), be run with 3.3V or 5V, and deliver NMEA 0183. Of course you can take something more sophisticated like the Adafruit Ultimate GPS.
- If you want to see the storm coming, the barograph is a good thing. For this, you need a device to measure the air pressure. The BMP180 or BME280 are good choices, and they are really cheap. Measuring themperature with these devices is possible, but depending on the placement of the sensor (inside or too close to the box), you will not get correct measurements. For the temperature, you might want to take something like the DS18B20, which comes with a cable and has the sensor in a waterproof enclosure. 
## Install Raspberry Pi OS
In this step you install the operating system, and do some basic configuration.

Download and install the Raspberry Pi Imager from https://www.raspberrypi.com/software/ and use it to write a Raspberry Pi OS onto your SD card. "Raspberry Pi OS Lite (32 bit)", found under "Raspberry Pi OS (other)" is a good choice for the PiLot. However, if you later want to connect a screen to your Raspberry Pi and wish to have a desktop environment, you might want to install "Raspberry Pi OS (32 bit)" or even "Raspberry Pi OS Full(32 bit)". As said, for the PiLot it doesn't really matter. Be aware that writing the image to your SD card will overwrite all data, so make sure there is nothing precious there.

Once finished writing, keep the card connected to your computer. Using a file explorer, create two files directly in the root (if you don't see the card, unplug it and plug it in again, it will usually be displayed as a drive called "boot"). Create those two filed directly in the root directory:
1. Create an empty file called just "SSH" (no extension, no content). This will allow you to connect to your PiLot by ssh.
2. To allow the PiLot to connect to your Wif-Fi, create a file called "wpa_supplicant.conf", and using a text editor, insert this content:
```
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=CH

network={
       ssid="network_name"
       scan_ssid=1
       psk="password"
}
```
For the country, set your country's 2 letter ISO code. Replace network_name by the name of your Wi-Fi, and password by your Wi-Fi password, then save the file. Now you can insert the SD card into your Raspberry Pi and power it on.

Connect to your PiLot via SSH: Open a command window / terminal window, and enter `ssh pi@raspberrypi`. You might have to confirm by typing "yes", the enter the password "raspberry". You should now see `pi@raspberrypi:~ $`. Feel good, as you just brought life to your tiny computer. Let's move on. First thing is to change the default password of the user "pi" to something google doesn't know. Type `passwd` and follow the instructions.

In order to bring your system up to date, run `sudo apt update` which will look for the latest versions of your software, then run `sudo apt upgrade -y` which will actually install them. This might take a while, so go get a coffee, as there is some more work waiting.

Just a few more steps for our base configuration remain. Run `sudo raspi-config`, and... 
- in **System Options** > **Hostname** enter the new hostname, if you don't want your pilot to be just another "raspberrypi".
- in **Advanced Options** > **Network Interface Names**, enable "predictable network interface names", which will give you a very new understanding of "predictable"

When asked to reboot, select "yes", so that your changes can take effect. After a minute, try to re-connect, still using the user "pi", but with the new hostname, e.g. ssh pi@pilot. And of course enter the newly set password.
## Set up a wireless access point using hostapd and dnsmasq
The idea of the PiLot is that you connect to it via Wi-Fi and use a browser to interact with it. As you might not always have a wireless network available (especially outdoors), the PiLot simply creates its own Wi-Fi and acts as an access point. Clients can then just connect to the network. As a plus, the PiLot can use its second network interface to connect to a public Wi-Fi, and will then pass all internet traffic from its clients through that connection to the internet. A client (your phone, tablet or laptop) connected to the PiLot can then access both, the PiLot's local web application, and the internet.

First, let's have a look at our network devices. Type `ifonfig`, and you will see a list of devices. The cryptic names, such as "enxb827eb356c2a", are the predictable network interface names. Yes, right, they don't seem predictable at first, but they acutally are. Without enabling predictable names, if you have two wireless network interfaces, one will be wlan0, and the other wlan1. But every time you boot, they can switch names, so you actually can't predict, which physical device will be wlan0, and which will be wlan1. The predictable names however will remain the same, as long as you don't change the hardware. So if you always want to use the network adapter with the huge antenna to access the far away marina Wi-Fi, then you will want the onboard wlan interface for the access point. But - oh no! The internal interface still has a much too simple name, like "wlan1". We also want to give it a fixed, predictable name. Thats quite simple: First, look at the result of ifconfig for the device called "wlan0" or "wlan1". Now copy the value after "ether", which is of the form b8:27:cb:60:49:6f. Then create a new file by typing 
```
sudo nano /etc/udev/rules.d/10-network-device.rules
```
The file needs to have the following content:
```
SUBSYSTEM=="net", ACTION=="add", ATTR{address}=="b8:27:cb:60:49:6f", NAME="wlxOnboardWiFi"
```
The value after ATTR{address} is of course the value for "ether" you copied before. Push Ctrl + X, then Y, then Enter to save the file. You can reboot now to apply the changes with the command `sudo reboot now`.

After a minute, re-connect your ssh session as you did at the end of the last chapter (you can use the arrow-up key in the console, which will bring back the last command in the current context, and this will after the disconnection from the PiLot usually be the ssh command). Run ifconfig once again, and now you see both wireless interfaces having a name starting with "wlx". Fantastic!

We now need two services: hostapd, which creates the local access point, and dnsmasq which provides IP adresses to the clients. So we just install them both like this:
```
sudo apt install -y dnsmasq hostapd
```
In order to configure the services, we need to stop them:
```
sudo systemctl stop dnsmasq
sudo systemctl stop hostapd
```
No we give our PiLot a static IP address for the network interface used by hostapd.
## Install nginx and set up the web application
## Connect a GPS device and set up the GPS logging service
## Install the photos import service
### Install Samba to upload photos from Windows
## Connect environmental sensors and set up the sensors logger service
## Download your first offline maps
## Optimize your system
## Optionally set up the live tracking service
## Optionally set up the backup service
## Optionally set up a local OSM server (only the brave)
## Build a nice case
