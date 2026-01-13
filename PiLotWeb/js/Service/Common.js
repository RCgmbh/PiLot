var PiLot = PiLot || {};
PiLot.Service = PiLot.Service || {};

PiLot.Service.Common = {

    BoatTimeService: {

        /** @returns {Object} an object containing the current boatTime utc offset and server time */
        loadBoatTimeInfoAsync: async function(){
            return json = await PiLot.Utils.Common.getFromServerAsync('/Settings/boatTime');
        },

        /** @param {PiLot.Model.Common.BoatTime} pBoatTime - the boat time to save */
        saveBoatTimeAsync: async function(pBoatTime){
            await PiLot.Utils.Common.putToServerAsync(`/Settings/boatTime?utcOffset=${pBoatTime.getUtcOffsetMinutes()}`);
        },

        /**
         * Sets the current client time to the server and returns the result 
         * @returns {String} the result from the date command
         * */
        setServerTimeAsync: async function () {
            const millisUtc = RC.Date.DateHelper.utcNowMillis() + 50; // we add a tiny bit of milliseconds as it will take some time :-)
            return await PiLot.Utils.Common.putToServerAsync(`/System/date?millisUtc=${millisUtc}`);
        }
    },
}