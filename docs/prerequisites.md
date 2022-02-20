# PiLot - getting started
## Prerequisites: Get a Raspberry Pi and some hardware
To begin, you need to get some hardware.

Mandatory:
- A Raspberry Pi. Good choices are the models 3 and 4, or probably the Zero 2 W. Older devices with ARMv6 architecture are currently not supported by .net core, which is used by the PiLot (but it might be supported one day).
- A microSD card. 8GB are enough for the PiLot. However, a bit more won't hurt. 32GB is a good choice.
- A USB Wi-Fi dongle. This allows to connect the PiLot to the home or a public WiFi, while the second (the onboard) Wi-Fi is used to set up the local access point. The tiny EDIMAX N150 is a good choice. If you want bigger reach (to connect to the far away and much too weak marina Wi-Fi), take something like the EDIMAX 7811.
- A power adapter for the Raspberry Pi. Don't just take any cheap USB charger, better go for an original Raspberry Pi Power Supply. Check the requirements of the Raspberry Pi you chose, to make sure you have the right plug and enough current.
- For the setup process, you will need a computer (mac, pc, linux) on which you can open a terminal/console window, and which is connected to your home Wi-Fi. Alternatively you can connect a keyboard and a screen directly to your Raspberry Pi.

Optional (but recommended)
- If you want to have a portable PiLot, you will need a powerbank. If you find it, take one with "pass through" charging, which allows charging and powering the PiLot at the same time. For a Raspberry Pi 3, you will get about one hour of independence per 1000 mAh. So there's a tradeoff to find between size/prize and autonomy.
- If you want to have the navigation and tracking features available, you need a GPS reciever. If you search for "UART GPS module" at aliexpress or amazon, you will find devices like from Topgnss for around 10$. The device should support UART connection, be run with 3.3V or 5V, and deliver NMEA 0183. Of course you can take something more sophisticated like the Adafruit Ultimate GPS.
- If you want to see the storm coming, the barograph is a good thing. For this, you need a device to measure the air pressure. The BMP180 or BME280 are good choices, and they are really cheap. Measuring themperature with these devices is possible, but depending on the placement of the sensor (inside or too close to the box), you will not get correct measurements. For the temperature, you might want to take something like the DS18B20, which comes with a cable and has the sensor in a waterproof enclosure. 

As soon as you have the mandatory parts at hand, you can continue with the next step, while waiting for the package from china. 
[Install the os, and basic setup...](basic.md)
