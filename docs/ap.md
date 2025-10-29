# PiLot - getting started
## Set up a wireless access point
The idea of the PiLot is that you connect to it via Wi-Fi and use a browser to interact with it. As you might not always have a wireless network available (especially outdoors), the PiLot simply creates its own wireless network and acts as an access point. Clients then can just connect to the network. As a plus, the PiLot can use its second wireless adapter or the cable to connect to a public Wi-Fi or a local network, and will then pass all internet traffic from its clients through that connection to the internet. A client (your phone, tablet or laptop) connected to the PiLot can then access both, the PiLot's local web application, and the internet.

This step is mandatory, if you want to access the PiLot otuside of any existing network environment. If you intend to only use it in an existing Wi-Fi or LAN, or just want to connect screen, keyboard and mouse directly to the Raspberry Pi, you can skip this step.

The first few settings require some manual actions, while for the second part there is a script, which automates the rest of the setup (but should only be used for a blank installation, as described in the previous chapter). 

First run `sudo raspi-config`, and in **6 Advanced Options** > **A2 Network Interface Names**, select **Yes** to enable predictable network interface names. This will give you a very new understanding of the word "predictable". When asked to reboot, select "yes", so that your changes can take effect.

After a minute, re-connect your ssh session as you did in the last chapter (you can use the arrow-up key in the console, which will bring back the last command in the current context, and this will after the disconnection from the PiLot usually be the ssh command). As soon as you have re-connected, let's have a look at our network devices. Type `ifconfig`, and you will see a list of devices. The cryptic names, such as "enxb827eb356c2a", are the predictable network interface names. Yes, right, they don't seem predictable at first, but they acutally are. Without enabling predictable names, if you have two wireless network adapters, one will be wlan0, and the other wlan1. But every time you boot, they can switch names, so you actually can't predict which physical device will be wlan0, and which will be wlan1. The predictable names however will remain the same, as long as you don't change the hardware. So if you always want to use the network adapter with the huge antenna to access the far away marina Wi-Fi, then you will want the onboard wlan interface for the access point.

But - oh no! The internal interface still has a much too simple name, like "wlan0". We also want to give it a fixed, predictable name. Thats quite simple: First, look at the result of ifconfig for the device called "wlan0" or "wlan1". Now copy the value after "ether", which is of the form b8:27:cb:60:49:6f. See what I have marked in the below picture:

![image](https://user-images.githubusercontent.com/96988699/154531955-c3a32389-374b-4a14-947e-4c49063f433a.png)

Then create a new file by typing 
```
sudo nano /etc/udev/rules.d/10-network-device.rules
```
The file needs to have the following content:
```
SUBSYSTEM=="net", ACTION=="add", ATTR{address}=="xx:xx:xx:xx:xx:xx", NAME="wlxOnboardWiFi"
```
Replace **xx:xx:xx:xx:xx:xx** by the value after "ether" you copied before (7f:27:b8:60:39:7f in our example). As soon as you have replaced and double-checked the text, hit Ctrl + X, then Y, then Enter to save the file. You can reboot now to apply the changes with the command `sudo reboot now` (we just need a bunch of reboots during the network setup, sorry for that!).

After a minute, re-connect your ssh session. Run ifconfig once again, and now you see both wireless interfaces having a name starting with "wlx". Fantastic!

### Scripted setup
There is a script which will install the required packages and change some configuration files. The script isn't particularly sophisticated, but will probably work if you started from a blank setup as described in the previous chapter. If you prefer a manual configuration, scroll down a bit and follow the steps in the section [Manual setup](ap.md#manual-setup).

Using the script is quite easy. You just have to set a few values in the script file first. First, using `ifconfig` once again, get the name of the network adapter you want to use for the accesspoint (like wlxSomething or wlxOnboardWiFi), and copy it somewhere for later use. Then, if, you haven't done yet, change into the pilotinstall directory, and start editing the install script:
```
cd ~/pilotinstall
nano 01-install-ap.sh
```
You will see some empty variables, like **apAdapter=""**. There is a comment for each variable, that tells you what value to set. You have to decide which wireless adapter (if you have two) you want to use for the access point, so just enter the name of that adapter, as found in "ifconfig", between the double quotes. I usually use wlxOnboardWiFi for this, but on Raspberry Pi 3 I had some issues with that, and had to use the other wlx... Adapter. Using the onboard WiFi, you can keep the default **apAdapter="wlxOnboardWiFi"**.

Also enter values for the next two variables, to give your wireless network a **name (SSID)**, and set a reasonable **password** (at least **8 characters!**). The value for staticIp does not need to be changed, but if you understand enough about IP addresses, you can of course change it, basically it will define the static IP and thus the IP range used by the accesspoint. Finally save the file and close it (Ctrl+X, Y, Enter).

Now, run the script as superuser, so enter
``` 
sudo sh 01-install-ap.sh
```
As soon as the script has been executed, should see the "pilot" (or whatever you named it) wireless network from you phone, tablet or computer. And when connected to it (using the wpa_passphrase you defined), the device should be able to access the PiLot's internet connection. Scroll to the end of the page and continue.

### Manual setup
If you don't want to use the script, or the script did not work, you can set up the access point manually, following these steps.
Just enter those commands, replace the SSID (pilot in the example) and the password:
```
sudo nmcli con add con-name hotspot ifname wlxOnboardWiFi type wifi ssid "pilot"
sudo nmcli con modify hotspot wifi-sec.key-mgmt wpa-psk
sudo nmcli con modify hotspot wifi-sec.psk "password"
sudo nmcli con modify hotspot 802-11-wireless.mode ap 802-11-wireless.band bg ipv4.method shared
```
Optionally, if you want to define the IP range to be used by the access point, you can do this using the following command, in this example using 192.168.80.1 for the pilot, and addresses in the 192.168.80.x range for the clients:
```
sudo nmcli con modify hotspot ipv4.addresses 192.168.80.1/24
```
It's time for a sudo reboot now! After the reboot, you should see the "pilot" (or whatever you named it) network from you phone, tablet or computer. And when connected to it (using the wpa_passphrase you defined), the device should be able to access the PiLot's internet connection.

If this all works, you have successfully completed one of the more tricky parts and can move on. 

\> [Install the web application...](web.md)

<< [Back to overview](user.md)
