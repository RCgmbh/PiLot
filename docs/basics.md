# PiLot - getting started
## Install Raspberry Pi OS
In this step you install the operating system, and do some basic configuration.

### Prepare the SD card
Download and install the Raspberry Pi Imager from https://www.raspberrypi.com/software/ and use it to write a Raspberry Pi OS onto your SD card. "Raspberry Pi OS Lite (32 bit)", found under "Raspberry Pi OS (other)" is a good choice for the PiLot. However, if you later want to connect a screen to your Raspberry Pi and wish to have a desktop environment, you might want to install "Raspberry Pi OS (32 bit)" or even "Raspberry Pi OS Full(32 bit)". As said, for the PiLot it doesn't really matter. Be aware that writing the image to your SD card will overwrite all data, so make sure there is nothing precious there.

Once finished writing, keep the card connected to your computer. If you don't see the card in your file explorer, unplug it and plug it in again, it will usually be displayed as a drive called "boot". Create those two files directly in the root directory:
1. Create an empty text file called just "SSH" (no extension, no content). This will allow you to connect to your PiLot by ssh.
2. If you have a second Wi-Fi adapter on your raspi (the first one is the built-in), you should allow the PiLot to connect to your Wif-Fi. Create a text file called "wpa_supplicant.conf", and using a text editor, insert this content (you can skip this, if you use a cable to connect the raspi to your network):
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
For the country, set your country's 2 letter ISO code. Replace network_name by the name of your Wi-Fi, and password by your Wi-Fi password, then save the file. Now you can safely remove the SD card and insert it into your Raspberry Pi. If you want to access your PiLot over ethernet, connect it to your local netork. Now power it on.

### Connect to your Raspberry Pi
Connect to your PiLot via SSH: Open a command window / terminal window, and enter `ssh pi@raspberrypi`. You might have to confirm by typing "yes", then enter the password "raspberry". You should now see `pi@raspberrypi:~ $`. Feel good, as you just brought life to your tiny computer. Now the first thing is to change the default password of the user "pi" to something that Google doesn't know. Type `passwd` and follow the instructions.

### Update your System
In order to bring your system up to date, run `sudo apt update` which will look for the latest versions of the installed software packages, then run `sudo apt upgrade -y` which will actually install the latest versions. This might take a while, so go get a coffee, as there is some more work waiting.

### Change the Hostname and Timezone
To make things between you and your raspi a bit more personal, run `sudo raspi-config`, and in **1 System Options** > **S4 Hostname** enter a new hostname, if you don't want your PiLot to be just another "raspberrypi". If you plan to have multiple PiLots, give them all different hostnames.

I would also suggest you set the timezone to UTC. The PiLot will offer to set the correct timezone ad hoc, which is useful if you cross timezones frequently. To avoid confusion, the timezone of the device should be UTC. You can select it under **5 Localization Options** > **L2 Timezone**.

When asked to reboot, select "yes", so that your changes can take effect. After a minute, try to reconnect, still using the user "pi", but with the new hostname, e.g. ssh pi@pilot. And of course enter the newly set password.

### Download the Install Scripts
For the next steps, there are a few scripts available to make things easier. So please dowload the archive with all scripts and the actual pilot application before you continue, using these two commands, the first to download and the second to extract the installation package.

```
wget https://roethenmund.biz/pilot/pilotinstall.tar.gz
tar zxf pilotinstall.tar.gz
```
This will create a directory called "pilotinstall", which you can examine by typing `cd pilotinstall` and then `ls`. Have a look around.

### Install Samba
Samba gives you a convenient access to files on your PiLot from within Windows Explorer. If you install samba now, some useful shares will be created automatically  in future steps. There is a script which automates the installation. While still in the **pilotinstall** directory, enter this command to run the script (hint: after "00" hit the "tab"-key to autocomplete):
```
sudo sh 00-install-samba.sh
```
Follow the instructions on the screen, and when asked for "New SMB password", enter the samba-password you want for your user "pi", which can be just the same password as you set before. Once the installation is done, open a windows explorer on your Windows machine, and in the address bar, enter **\\\\raspberrypi**, or if you changed the hostname, the new hostname instead of raspberrypi. Log in with your pi user, and you should now see a share called "Home", which is mapped to the user "pi" his home directory.

\> [Next, set up an access point...](ap.md)

<< [Back to overview](user.md)
