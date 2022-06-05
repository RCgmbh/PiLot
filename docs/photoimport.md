# PiLot
## Photo Import Service

The PiLot diary not only shows your track, logbook and notes for a day, but also the photos you've taken. The Photo import service creates the thumbnails showed in the gallery, and assigns the photos to the correct day. 

The installation is again automated by a script. When in the pilotinstall directory, call
``` 
sudo sh 06-install-photoswatcher.sh
```
This will install a service, that runs in the background and observes the directory /home/pi/PhotoImport. It will also create a samba share for this directory. As soon as a jpeg-image is saved to the directory, the service takes it, creates the thumbnails and saves it all to the pilot data directory (/var/opt/pilot/photos). Creating the thumbnails takes a lot of time on a tiny computer like the Raspberry Pi. Try it, by saving a photo to the PhotoImport directory. It will be deleted from the import directory as soon as it's processed. Then launch the PiLot web application, and open the "Diary" page (the icon shows a book). As soon as you select the date the picture was taken from the top-right calendar, you should see the photo in the photo gallery section of the page.

That's already it. Let's move on...

\> [Connect sensors to your PiLot...](sensors.md)

<< [Back to overview](user.md)
