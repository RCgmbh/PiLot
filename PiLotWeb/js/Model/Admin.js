var PiLot = PiLot || {};
PiLot.Model = PiLot.Model || {};

PiLot.Model.Admin = (function () {

	var LogFilesLoader = function () { };

	LogFilesLoader.prototype = {

		/**
		 * loads the log file infos, including server side paging 
		 * @param {Number} pStart - the start index, 0 for first page, n* pageSize for page n
		 * @param {Number} pPageSize - the total items to show on a page
		 * */
		loadLogFiles: async function (pStart, pPageSize) {
			const response = await fetch(PiLot.Utils.Common.toApiUrl(`/LogFiles?start=${pStart}&pageSize=${pPageSize}`));
			return await response.json();
		},

		/**
		 * Loads a logfile and returns the content of the file
		 * @param {String} pFilename - usually something in the form of yyyy-mm-dd.txt
		 */
		loadLogFile: async function (pFilename) {
			const data = await PiLot.Utils.Common.getFromServerAsync(`/LogFiles/${this.cropFilename(pFilename)}`);
			return data.content;
		},

		/**
		 * Deletes a logfile
		 * @param {String} pFilename - usually something in the form of yyyy-mm-dd.txt
		 */
		deleteLogFile: async function (pFilename) {
			return await PiLot.Utils.Common.deleteFromServerAsync(`/LogFiles/${this.cropFilename(pFilename)}`);
		},

		/**
		 * Helper to remove the .txt part from the filename, as this would confuse the webserver
		 * @param {any} pFilename
		 */
		cropFilename: function (pFilename) {
			return pFilename.substring(0, pFilename.length - 4);
		},

	};

	/** Sets the current client time to the server and returns the result */
	var setServerTime = async function () {
		const millisUtc = RC.Date.DateHelper.utcNowMillis()
		return await PiLot.Utils.Common.putToServerAsync(`/System/date?millisUtc=${millisUtc}`);
	}

	/**
	 * Gets the list of all services the web gui is allowed to see and manage
	 * @return {String[]}
	 * */
	var getServicesAsync = async function () {
		return await PiLot.Utils.Common.getFromServerAsync ('/Services');
	}

	/** This helps with interacting with the WiFi controller */
	var WiFiHelper = function () {
		this.interface = null;
	};

	WiFiHelper.prototype = {

		setInterface: function (pInterface) {
			this.interface = pInterface;
		},

		/**
		 * Gets the list of known available interfaces
		 * @return {String[]}
		 * */
		getInterfacesAsync: async function () {
			return await PiLot.Utils.Common.getFromServerAsync('/WiFi/interfaces');
			//return ['p2p-dev-wlxOnbo', 'wlxOnboardWiFi1', 'wlxOnboardWiFi2'];
		},

		/**
		 * Gets the list of known or available wireless networks 
		 * @return {Object[]} - objects with ssid, isKnown, isAvailable, number, isConnected, signalStrength
		 * */
		getWiFiInfosAsync: async function () {
			return await PiLot.Utils.Common.getFromServerAsync(`/WiFi/interfaces/${this.interface}/networks`);
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
			return await PiLot.Utils.Common.postToServerAsync(`/WiFi/interfaces/${this.interface}/networks`, pars);
		},

		/**
		 * Selects a known network
		 * @param {Number} pNumber - the network number as returned from getWiFiInfosAsync
		 */
		selectWiFiAsync: async function (pNumber) {
			return await PiLot.Utils.Common.putToServerAsync(`/WiFi/interfaces/${this.interface}/networks/${pNumber}/select`);
		},

		/**
		 * Removes a network from the list of known networks
		 * @param {Number} pNumber - the network number as returned from getWiFiInfosAsync
		 */
		forgetWiFiAsync: async function (pNumber) {
			return await PiLot.Utils.Common.deleteFromServerAsync(`/WiFi/interfaces/${this.interface}/networks/${pNumber}`);
		},
		
		/**
		 * Gets some status information
		 * */
		getWiFiStatus: async function(){
			return await PiLot.Utils.Common.getFromServerAsync(`/WiFi/interfaces/${this.interface}/status`);
		}

	};
	
	return {
		LogFilesLoader: LogFilesLoader,
		setServerTime: setServerTime,
		getServicesAsync: getServicesAsync,
		WiFiHelper: WiFiHelper
	};

})();