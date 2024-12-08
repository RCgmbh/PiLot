var PiLot = PiLot || {};
PiLot.Service = PiLot.Service || {};

PiLot.Service.Analyze = (function () {

	var TackAnalyzeService = function () { };

	TackAnalyzeService.prototype = {

		loadTackAnalyzerOptionsAsync: async function (pBoat) {
			const response = await fetch(PiLot.Utils.Common.toApiUrl(`/TackAnalyzerOptions/${pBoat}`));
			return await response.json();
		},

		saveTackAnalyzerOptionsAsync: async function (pBoat, pOptions) {
			const path = `/TackAnalyzerOptions/${pBpat}`;
			return await PiLot.Utils.Common.putToServerAsync(path, pOptions);
		}
	};

	return {
		TackAnalyzeService: TackAnalyzeService
	};

})();