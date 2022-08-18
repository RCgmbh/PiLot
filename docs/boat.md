# PiLot - getting started
## Configure Your Boat

Well, this is going to be one last challenge. As you might have seen, the PiLot comes with some boats you can choose from (you do that on the settings page). Probably your boat will not be available yet, so you have to add it. A boat contains two elements:
- an image, which must be in the svg format
- a .json file defining the features of the boat, that can have different states (like the main sail, which can be set, in the first reef, second reef etc., or the engine, which can be on and off).

In each logbook entry, you can select the state of each feature of your boat. When having the sails set, you simply create a logbook entry having headsail and mainsail in the sate "set" and the engine in the state "off". This will show an image with this exact boat setup together with the logbook entry, which really looks nice.

In order to make the boat image show the correct boat setup, the features in the image (e.g. the main sail) need to have ids that are defined in the .json file of the boat. Well, let's just begin, you will grasp it.

<< [Back to overview](user.md)
