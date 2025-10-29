# PiLot - getting started
## Install Raspberry Pi OS
In this step you install the operating system, and do some basic configuration.

The entire installation is "headless", which means you don't need to connect a screen or keyboard to your Raspberry Pi. Instead, you access it from your computer or laptop over Wi-Fi or ethernet. If you prefer, you can of course screen and keyboard, and work directly on the raspi. The installation process will be the same (though you might want to skip step 3, if you don't need to access the PiLot from other devices).

### Prepare the SD card
Download and install the Raspberry Pi Imager from https://www.raspberrypi.com/software/ and use it to write a Raspberry Pi OS onto your SD card. "Raspberry Pi OS Lite (64 bit)", found under "Raspberry Pi OS (other)" is a good choice for the PiLot. However, if you later want to connect a screen to your Raspberry Pi and wish to have a desktop environment, you might want to install "Raspberry Pi OS (64 bit)" or even "Raspberry Pi OS Full (64 bit)". For the PiLot software to work, it needs to be a **64 bit** System.

Before writing the image, check the settings. Make sure to enter a reasonable name for your PiLot (we will user "pilot" in this tutorial). Keep the username "pi", and enter a password for the user. Also **configure the WiFi** you will use to access your PiLot, if you don't connect it to the ethernet using a cable. Also **enable SSH** with password authentication and finally set the **timezone to Etc/UTC**. 

Be aware that writing the image to your SD card will **overwrite all data**, so make sure there is nothing precious there.

Once finished writing, remove the SD card and insert it into your Raspberry Pi. If you want to access your PiLot over ethernet, connect it to your local netork. Now power it on.

### Connect to your Raspberry Pi
After a minute or so (the first boot can take a while), connect to your PiLot via SSH: Open a command window / terminal window, and enter `ssh pi@pilot.local` (replace "pilot" by the hostname you defined before). You might have to confirm by typing "yes", then enter the password you set before. You should now see `pi@pilot:~ $`. Feel good, as you just brought life to your tiny computer. 

### Update your System
In order to bring your system up to date, run `sudo apt update` which will look for the latest versions of the installed software packages, then run `sudo apt upgrade -y` which will actually install the latest versions. This might take a while, so go get a coffee, as there is some more work waiting.

### Download the Install Scripts
For the next steps, there are a few scripts available to make things easier. So please dowload the archive with all scripts and the actual pilot application before you continue, using these two commands, the first to download and the second to extract the installation package.

```
wget https://roethenmund.biz/pilot/pilotinstall.tar.gz
tar zxf pilotinstall.tar.gz
```
This will create a directory called "pilotinstall", which you can examine by typing `cd pilotinstall` and then `ls`. Have a look around.

### Install Samba
Samba gives you a convenient access to files on your PiLot from within Windows Explorer. If you install samba now, some useful shares will be created automatically in future steps. There is a script which automates the installation. While still in the **pilotinstall** directory, enter this command to run the script (hint: after "00" hit the "tab"-key to autocomplete):
```
sudo sh 00-install-samba.sh
```
Follow the instructions on the screen, and when asked for "New SMB password", enter the samba-password you want for your user "pi", which can be just the same password as you set before. Once the installation is done, open a windows explorer on your Windows machine, and in the address bar, enter **\\\\pilot**, or whatever hostname you defined. Log in with your pi user, and you should now see a share called "Home", which is mapped to the user "pi" his home directory.

\> [Next, set up an access point...](ap.md)

<< [Back to overview](user.md)
