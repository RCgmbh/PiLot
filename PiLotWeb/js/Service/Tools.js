var PiLot = PiLot || {};
PiLot.Service = PiLot.Service || {};

PiLot.Service.Tools = (function () {

	var ChecklistsService = function () { };

	ChecklistsService.prototype = {

		/** @returns {Object} a checklist as it comes from the server, not converted to any class instance */
		loadChecklistsAsync: async function () {
			return await PiLot.Utils.Common.getFromServerAsync('/Checklists/');
		},

		saveChecklistAsync: async function (pChecklist) {
			const path = `/Checklists/`;
			return await PiLot.Utils.Common.putToServerAsync(path, pChecklist);
		}
	};

	return {
		ChecklistsService: ChecklistsService
	};

})();