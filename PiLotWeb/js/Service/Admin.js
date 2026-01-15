var PiLot = PiLot || {};
PiLot.Service = PiLot.Service || {};

PiLot.Service.Admin = (function () {

	var LogFilesService = function () { };

	LogFilesService.prototype = {

		/**
		 * loads the log file infos, including server side paging 
		 * @param {Number} pStart - the start index, 0 for first page, n* pageSize for page n
		 * @param {Number} pPageSize - the total items to show on a page
		 * */
		loadLogFilesAsync: async function (pStart, pPageSize) {
			return await PiLot.Service.Common.ServiceHelper.getFromServerAsync(`/LogFiles?start=${pStart}&pageSize=${pPageSize}`);
		},

		/**
		 * Loads a logfile and returns the content of the file
		 * @param {String} pFilename - usually something in the form of yyyy-mm-dd.txt
		 */
		loadLogFileAsync: async function (pFilename) {
			const data = await PiLot.Service.Common.ServiceHelper.getFromServerAsync(`/LogFiles/${this.cropFilename(pFilename)}`);
			return data.content;
		},

		/**
		 * Deletes a logfile
		 * @param {String} pFilename - usually something in the form of yyyy-mm-dd.txt
		 */
		deleteLogFileAsync: async function (pFilename) {
			return await PiLot.Service.Common.ServiceHelper.deleteFromServerAsync(`/LogFiles/${this.cropFilename(pFilename)}`);
		},

		/**
		 * Helper to remove the .txt part from the filename, as this would confuse the webserver
		 * @param {any} pFilename
		 */
		cropFilename: function (pFilename) {
			return pFilename.substring(0, pFilename.length - 4);
		},

	};

	/** This helps with interacting with the WiFi controller */
	var WiFiService = function () {
		this.interface = null;
	};

	WiFiService.prototype = {

		setInterface: function (pInterface) {
			this.interface = pInterface;
		},

		/**
		 * Gets the list of known available interfaces
		 * @return {String[]}
		 * */
		getInterfacesAsync: async function () {
			return await PiLot.Service.Common.ServiceHelper.getFromServerAsync('/WiFi/interfaces');
			//return ['p2p-dev-wlxOnbo', 'wlxOnboardWiFi1', 'wlxOnboardWiFi2'];
		},

		/**
		 * Gets the list of known or available wireless networks 
		 * @return {Object[]} - objects with ssid, isKnown, isAvailable, number, isConnected, signalStrength
		 * */
		getWiFiInfosAsync: async function () {
			return await PiLot.Service.Common.ServiceHelper.getFromServerAsync(`/WiFi/interfaces/${this.interface}/networks`);
			/*return JSON.parse(`
				[
					{"ssid":"nda-85236","isKnown":true,"isAvailable":true,"number":0,"isConnected":true,"signalStrength":-47},
					{"ssid":"QL-5746","isKnown":false,"isAvailable":true,"number":null,"isConnected":false,"signalStrength":-33},
					{"ssid":"pilot4","isKnown":true,"isAvailable":false,"number":null,"isConnected":false,"signalStrength":null},
					{"ssid":"hln-53812","isKnown":false,"isAvailable":true,"number":null,"isConnected":false,"signalStrength":-86},
					{"ssid":"tbo-89550","isKnown":false,"isAvailable":false,"number":null,"isConnected":false,"signalStrength":null},
					{"ssid":"NTGR_VMB_1500305680","isKnown":false,"isAvailable":true,"number":null,"isConnected":false,"signalStrength":-82},
					{"ssid":"QL-52383","isKnown":false,"isAvailable":true,"number":null,"isConnected":false,"signalStrength":-83},
					{"ssid":"pilot2","isKnown":false,"isAvailable":false,"number":null,"isConnected":false,"signalStrength":null}
				]
			`);*/
		},

		/**
		 * Adds a new network and selects it
		 * @param {String} pName - the SSID
		 * @param {String} pKey - the network key
		 */
		addWiFiAsync: async function (pName, pKey) {
			const pars = { ssid: pName, passphrase: pKey };
			return await PiLot.Service.Common.ServiceHelper.postToServerAsync(`/WiFi/interfaces/${this.interface}/networks`, pars);
		},

		/**
		 * Selects a known network
		 * @param {Object} pIdentifier - the network identifier as returned from getWiFiInfosAsync
		 */
		selectWiFiAsync: async function (pIdentifier) {
			return await PiLot.Service.Common.ServiceHelper.putToServerAsync(`/WiFi/interfaces/${this.interface}/networks/${pIdentifier}/select`);
		},

		/**
		 * Removes a network from the list of known networks
		 * @param {Object} pIdentifier - the network identifier as returned from getWiFiInfosAsync
		 */
		forgetWiFiAsync: async function (pIdentifier) {
			return await PiLot.Service.Common.ServiceHelper.deleteFromServerAsync(`/WiFi/interfaces/${this.interface}/networks/${pIdentifier}`);
		},
		
		/**
		 * Gets some status information for the current interface. 
		 * */
		getWiFiStatusAsync: async function(){
			return await PiLot.Service.Common.ServiceHelper.getFromServerAsync(`/WiFi/interfaces/${this.interface}/status`);
		},

		/**
		 * Gets overall wifi / internet information. This does not neet the interface to be set.
		 * @returns {Object} with connected:Boolean, internetAccess:boolean, details:String
		 */
		getOverallStatusAsync: async function () {
			return await PiLot.Service.Common.ServiceHelper.getFromServerAsync(`/WiFi/status`);
		}

	};

	var SystemService = function(){};

	SystemService.prototype = {

		/**
		 * Gets the list of all services the web gui is allowed to see and manage
		 * @return {String[]}
		 * */
		getServicesAsync: async function(){
			return await PiLot.Service.Common.ServiceHelper.getFromServerAsync ('/Services');
		}
	};
	
	return {
		LogFilesService: LogFilesService,
		SystemService: SystemService,
		WiFiService: WiFiService
	};

})();