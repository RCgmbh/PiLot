# PiLot - getting started
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

Just a few more step for our base configuration remain. Run `sudo raspi-config`, and in **System Options** > **Hostname** enter the new hostname, if you don't want your pilot to be just another "raspberrypi".

When asked to reboot, select "yes", so that your changes can take effect. After a minute, try to re-connect, still using the user "pi", but with the new hostname, e.g. ssh pi@pilot. And of course enter the newly set password.

Next, we will [set up an access point...](ap.md)
