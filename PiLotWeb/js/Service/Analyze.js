var PiLot = PiLot || {};
PiLot.Service = PiLot.Service || {};

PiLot.Service.Analyze = (function () {

	var TackAnalyzeService = function () { };

	TackAnalyzeService.prototype = {

		loadTackAnalyzerOptionsAsync: async function (pBoat) {
			return await PiLot.Utils.Common.getFromServerAsync(`/TackAnalyzerOptions/${pBoat}`);
		},

		saveTackAnalyzerOptionsAsync: async function (pBoat, pOptions) {
			const path = `/TackAnalyzerOptions/${pBoat}`;
			return await PiLot.Utils.Common.putToServerAsync(path, pOptions);
		}
	};

	return {
		TackAnalyzeService: TackAnalyzeService
	};

})();