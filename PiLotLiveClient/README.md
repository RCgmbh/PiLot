# PiLot
## PiLotLiveClient

This is a separate application which allows to send position and logbook data to a remote system (such as a website), so that the pilot can be tracked by whoever is interested. It is usually run as a service, and can be started or stopped from the PiLot web gui. 

**Configuration**: 

App.config: 
- Enter the logLevel (DEBUG, INFO, WARNING, ERROR), while DEBUG will create a huge lot of data
- Enter the logfilePath, which should be the same as in the PiLotAPICore, so that the logfiles can be read from the web gui

config.json: 

- localAPI: the url of the local API, usually http://localhost/pilotapi/api/v1. This API must provide unauthenticated read access.
- remoteAPI: the remote API url, where the data will be sent to. PiLot API and web app need to be installed there too. Example: https://pilot.yourweb.site/pilotapi/api/v1
- interval: the interval in seconds for sending data. Something around 10 makes sense.
- username: the username to authenticate against the remote API
- password: the password to authenticate against the remote API 
