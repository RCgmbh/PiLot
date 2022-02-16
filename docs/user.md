# PiLot
# Getting started for Users
## Get a Raspberry Pi and some hardware
To begin, you should get some hardware.

Mandatory:
- A Raspberry Pi. Good choices are the models 3 and 4, or probably the Zero 2 W. Although I do have a PiLot application for older Raspis (1, Zero), I don't invest much into keeping them up-to-date.
- A microSD card. 8GB are enough for the PiLot. However, a bit more won't hurt. 64GB is a good choice.
- A USB WiFi dongle. This allows to connect the PiLot to the home or a public WiFi, while the second (the onboard) Wi-Fi is used to set up the local access point. The tiny EDIMAX N150 is a good choice. If you want bigger reach (to connect to the much too weak marina Wi-Fi), take something like the EDIMAX 7811.
- A power adapter for the Raspberry Pi. Don't just take any cheap usb charger, better go for an original Raspberry Pi Power Supply. Check the requirements of the Raspberry Pi you chose, to make sure you have the right plug and enough current.

Optional (but recommended)
- If you want to have a portable PiLot, you will need a powerbank. If you find it, take one with "pass through" charging, which allows charging and powering the PiLot at the same time. For a Raspberry Pi 3, you will get about one hour of independence per 1000 mAh. So there's a tradeoff to find between size/prize and autonomy.
- If you want to have the navigation and tracking features available, you will need a GPS reviever. If you search for "UART GPS module" at aliexpress or amazon, you will find devices like from Topgnss for around 10$. The device should support UART (the connection), be run with 3.3V or 5V, and deliver NMEA 0183. Of course you can take something more sophisticated like the Adafruit Ultimate GPS.
- If you want to see the storm coming, the barograph is a good thing. For this, you need a device to measure the air pressure. The BMP180 or BME280 are good choices, and they are really cheap. Measuring themperature with these devices is possible, but depending on the placement of the sensor (inside or too close to the box), you will not get correct measurements. For the temperature, you might want to take something like the DS18B20, which comes with a cable and has the sensor in a waterproof enclosure. 
## Install Raspberry Pi OS
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

Connect to your PiLot via SSH: Open a command window / terminal window, and enter `ssh pi@raspberrypi`. You might have to confirm by typing "yes", the enter the password "raspberry". You should now see `pi@raspberrypi:~ $`. Feel good, as you just brought life to your tiny computer. Let's move on. First thing is to change the default password of the user "pi" to something more secure. Type `passwd` and follow the instructions.

In order to bring your system up to date, run `sudo apt update` which will look for the latest versions of your software, then run `sudo apt upgrade -y` which will actually install them. This might take a while, so go get a coffee, as there is some more work waiting.

Just a few more steps for our base configuration remain. Run `sudo raspi-config`, and 
- in System Options > Hostname enter the new hostname, if you don't want to be your pilot just another "raspberrypi".
- in Advanced Options > Network Interface Names, enable "predictable network interface names", which will give you a very new understanding of "predictable"

When asked to reboot, select "yes", so that your changes can take effect. After a minute, try to re-connect, still using the user "pi", but with the new hostname, e.g. ssh pi@pilot. And of course enter the newly set password.
## Set up a wireless access point using hostapd and dnsmasq
## Connect a GPS device and set up the GPS logging service
## Install the photos import service
### Install Samba to upload photos from Windows
## Connect environmental sensors and set up the sensors logger service
## Install nginx and set up the web application
## Download your first offline maps
## Optimize your system
## Optionally set up the live tracking service
## Optionally set up the backup service
## Optionally set up a local OSM server (only the brave)
## Build a nice case
