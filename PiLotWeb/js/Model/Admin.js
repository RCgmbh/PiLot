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

	return {
		LogFilesLoader: LogFilesLoader,
		setServerTime: setServerTime
	};

})();