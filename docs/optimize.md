# PiLot - getting started
## Optimize your system
There are some things that can be done, to make the PiLot a bit more stable and performing.

### Disable Syslog
While the Syslog is a great thing when it comes to analyzing problems, it does create a lot of input/output operations, and increases the risk of leaving a corrupted memory card after an unexpected power loss. So, if you can live without the logs, you can disable syslog like this:
```
sudo service syslog stop
sudo systemctl disable syslog
sudo service rsyslog stop
sudo systemctl disable rsyslog
```
If you ever would want to reactivate it, just run 'sudo systemctl enable rsyslog'.

### Disable fsck on boot
By default, fsck ckecks your disk at startup, to find potentially corrupted filesystems. It can happen that fsck thinks it finds a problem when booting, and it will then show a message, and wait for a keyboard input. In a headless setup, when you connect with nothing than a browser to your Raspberry Pi, this will block the system. So you can disable fsck, which of course will result in your disk (memory card) not being checked, so it will just run until it breaks completely (which however is surprisingly rare). To disable it, enter
```
sudo nano /etc/fstab
```
Now make sure you have all zeroes in the last column, resulting in something like this:
```
proc            /proc           proc    defaults          0       0
PARTUUID=54a29bfc-01  /boot           vfat    defaults          0       0
PARTUUID=54a29bfc-02  /               ext4    defaults,noatime  0       0
```
Save and close nano.

Well, that's basically it. Tataa, you now have an up and running PiLot. To make it ready to be used outside, it's time to use your hands, and...

\> [Build a nice case...](case.md)

<< [Back to overview](user.md)
