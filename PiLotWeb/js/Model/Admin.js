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

		loadLogFile: async function (pFilename) {
			const response = await fetch(PiLot.Utils.Common.toApiUrl(`/LogFiles/${pFilename}`));
			const json = await response.json();
			return json.content;
		},
	};

	/** Sets the current client time to the server and returns the result */
	var setServerTime = async function () {
		const millisUtc = RC.Date.DateHelper.utcNowMillis()
		return await PiLot.Utils.Common.putToServerAsync(`/System/date?millisUtc=${millisUtc}`);
	}

	/**
	 * Gets the list of all services the web gui is allowed to see and manage
	 * @returns {String[]}
	 * */
	var getServicesAsync = async function () {
		return await PiLot.Utils.Common.getFromServerAsync ('/Services');
	}

	/**
	 * Gets the list of known or available wireless networks 
	 * @returns {Object[]} - objects with ssid, isKnown, isAvailable, number, isConnected, signalStrength
	 * */
	var getWiFiInfosAsync = async function () {
		//return await PiLot.Utils.Common.getFromServerAsync('/WiFi');
		return JSON.parse(`
			[
				{"ssid":"nda-85236","isKnown":true,"isAvailable":true,"number":0,"isConnected":true,"signalStrength":-47},
				{"ssid":"QL-5746","isKnown":false,"isAvailable":true,"number":null,"isConnected":false,"signalStrength":-33},
				{"ssid":"pilot4","isKnown":false,"isAvailable":true,"number":null,"isConnected":false,"signalStrength":-23},
				{"ssid":"hln-53812","isKnown":false,"isAvailable":true,"number":null,"isConnected":false,"signalStrength":-86},
				{"ssid":"tbo-89550","isKnown":false,"isAvailable":true,"number":null,"isConnected":false,"signalStrength":-79},
				{"ssid":"NTGR_VMB_1500305680","isKnown":false,"isAvailable":true,"number":null,"isConnected":false,"signalStrength":-82},
				{"ssid":"QL-52383","isKnown":false,"isAvailable":true,"number":null,"isConnected":false,"signalStrength":-83}
			]
		`);
	}

	return {
		LogFilesLoader: LogFilesLoader,
		setServerTime: setServerTime,
		getServicesAsync: getServicesAsync,
		getWiFiInfosAsync: getWiFiInfosAsync
	};

})();