var PiLot = PiLot || {};
PiLot.Service = PiLot.Service || {};

PiLot.Service.Tools = (function () {

	var ChecklistsService = function () { };

	ChecklistsService.prototype = {

		/** @returns {Object} an array of checklists as it comes from the server, not converted to any class instances */
		loadChecklistsAsync: async function () {
			const result = await PiLot.Utils.Common.getFromServerAsync('/Checklists/');
		},

		saveChecklistAsync: async function (pChecklist) {
			const path = `/Checklists/`;
			return await PiLot.Utils.Common.putToServerAsync(path, pChecklist);
		},

		saveCheckedAsync: async function (pChecklistId, pIndex, pChecked) {
			const path = `/Checklists/${pChecklistId}/checked?index=${pIndex}&isChecked=${pChecked}`;
			return await PiLot.Utils.Common.putToServerAsync(path, null);
		}
	};

	return {
		ChecklistsService: ChecklistsService
	};

})();