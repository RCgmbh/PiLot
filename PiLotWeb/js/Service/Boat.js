var PiLot = PiLot || {};
PiLot.Service = PiLot.Service || {};

PiLot.Service.Boat = (function () {

	var boatConfigServiceInstance = null;
	
	var BoatConfigService = function () { 
		this.allBoatConfigs = null;
		this.busy = false;
	};

	/** Gives access to BoatConfigs on the server */
	BoatConfigService.prototype = {

		/**
		 * Gets all boat configs either from cache or from the server. Implements
		 * a simple semaphor meccano in order to avoid parallel requests. Also sorts
		 * the result by displayName
		 * @returns {Object[]} an array of objects with name, displayName, boatImageUrl, sorted by displayName. Uses caching 
		 */
		getBoatConfigsAsync: async function(){
			while(this.busy){
				await PiLot.Utils.Common.sleepAsync(10);
			}
			if(!this.allBoatConfigs){
				this.busy = true;
				this.allBoatConfigs = await this.loadBoatConfigsAsync();
				this.allBoatConfigs.sort((a, b) => a.displayName.localeCompare(b.displayName));
				this.busy = false;
			}
			return this.allBoatConfigs;
		},
		
		/** @returns {Object[]} an array of objects with name, displayName, boatImageUrl. */
		loadBoatConfigsAsync: async function (pBoat) {
			const result = await PiLot.Service.Common.ServiceHelper.getFromServerAsync(`/BoatConfigs`);
			return result;
		},

		/**
		 * Loads a BoatConfig with a given name from the server and return either a BoatConfig or null
		 * @param {string} pConfigName
		 */
		loadConfigAsync: async function (pConfigName) {
			return PiLot.Model.Boat.BoatConfig.fromData(await PiLot.Service.Common.ServiceHelper.getFromServerAsync(`/BoatConfigs/${pConfigName}`));
		},

		/** Loads the current BoatConfig */
		loadCurrentConfigAsync: async function () {
			return PiLot.Model.Boat.BoatConfig.fromData(await PiLot.Service.Common.ServiceHelper.getFromServerAsync(`/BoatConfigs/current`));
		},

		/** Loads the name of the current BoatConfig */
		loadCurrentConfigNameAsync: async function () {
			return PiLot.Service.Common.ServiceHelper.getFromServerAsync('/Settings/currentBoatConfigName');
		},

		/**
		 * Saves the name of the current BoatConfig
		 * @param {string} pName
		 */
		saveCurrentConfigNameAsync: async function (pName) {
			return await PiLot.Service.Common.ServiceHelper.putToServerAsync(`/Settings/currentBoatConfigName?name=${pName}`, null);
		}
	};

	/** Singleton accessor returning the current instance of the BoatConfigService object */
    BoatConfigService.getInstance = function(){
        boatConfigServiceInstance = boatConfigServiceInstance || new BoatConfigService();
        return boatConfigServiceInstance;
	};

	return {
		BoatConfigService: BoatConfigService
	};

})();