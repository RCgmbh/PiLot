# PiLot - getting started
## Install Raspberry Pi OS
In this step you install the operating system, and do some basic configuration.

Download and install the Raspberry Pi Imager from https://www.raspberrypi.com/software/ and use it to write a Raspberry Pi OS onto your SD card. "Raspberry Pi OS Lite (32 bit)", found under "Raspberry Pi OS (other)" is a good choice for the PiLot. However, if you later want to connect a screen to your Raspberry Pi and wish to have a desktop environment, you might want to install "Raspberry Pi OS (32 bit)" or even "Raspberry Pi OS Full(32 bit)". As said, for the PiLot it doesn't really matter. Be aware that writing the image to your SD card will overwrite all data, so make sure there is nothing precious there.

Once finished writing, keep the card connected to your computer. Using a file explorer, create two files directly in the root (if you don't see the card, unplug it and plug it in again, it will usually be displayed as a drive called "boot"). Create those two files directly in the root directory:
1. Create an empty file called just "SSH" (no extension, no content). This will allow you to connect to your PiLot by ssh.
2. To allow the PiLot to connect to your Wif-Fi, create a file called "wpa_supplicant.conf", and using a text editor, insert this content (you can skip this, if you use a cable to connect the raspi to your network):
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

Connect to your PiLot via SSH: Open a command window / terminal window, and enter `ssh pi@raspberrypi`. You might have to confirm by typing "yes", then enter the password "raspberry". You should now see `pi@raspberrypi:~ $`. Feel good, as you just brought life to your tiny computer. Now the first thing is to change the default password of the user "pi" to something that Google doesn't know. Type `passwd` and follow the instructions.

In order to bring your system up to date, run `sudo apt update` which will look for the latest versions of the installed software packages, then run `sudo apt upgrade -y` which will actually install the latest versions. This might take a while, so go get a coffee, as there is some more work waiting.

Just one more step for our base configuration remains. Run `sudo raspi-config`, and in **System Options** > **Hostname** enter a new hostname, if you don't want your PiLot to be just another "raspberrypi". If you plan to have multiple PiLots, give them all different hostnames.

When asked to reboot, select "yes", so that your changes can take effect. After a minute, try to reconnect, still using the user "pi", but with the new hostname, e.g. ssh pi@pilot. And of course enter the newly set password.

For the next steps, there are a few scripts available to make things easier. So please dowload the archive with all scripts and the actual pilot application before you continue, using these two commands, the first to download and the second to extract the installation package.

```
wget https://roethenmund.biz/pilot/pilotinstall.tar.gz
```

\> [Next, set up an access point...](ap.md)

<< [Back to overview](user.md)
