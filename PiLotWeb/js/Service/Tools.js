var PiLot = PiLot || {};
PiLot.Service = PiLot.Service || {};

PiLot.Service.Tools = (function () {

	var ChecklistsService = function () { };

	ChecklistsService.prototype = {

		/** @returns {Object} an array of checklists as it comes from the server, not converted to any class instances */
		loadChecklistsAsync: async function () {
			return await PiLot.Service.Common.ServiceHelper.getFromServerAsync('/Checklists/');
		},

		/** @param {Object} pChecklist - the checklist to save back to the server */
		saveChecklistAsync: async function (pChecklist) {
			const path = `/Checklists/`;
			const result = await PiLot.Service.Common.ServiceHelper.putToServerAsync(path, pChecklist);
			return result.data;
		},

		/**
		 * Saves the checked state of a single item within a checklist 
		 * @param {Number} pChecklistId - the id of the checklist
		 * @param {Number} pIndex - the index of the item
		 * @param {Boolean} pChecked - the checked state of the item 
		 * */
		saveCheckedAsync: async function (pChecklistId, pIndex, pChecked) {
			const path = `/Checklists/${pChecklistId}/checked?index=${pIndex}&isChecked=${pChecked}`;
			return await PiLot.Service.Common.ServiceHelper.putToServerAsync(path, null);
		},

		/** @param {Number} pChecklistId - the id of the checklist to delete */
		deleteChecklistAsync: async function(pChecklistId){
			const path = `/Checklists/${pChecklistId}`;
			return await PiLot.Service.Common.ServiceHelper.deleteFromServerAsync(path);
		}
	};

	return {
		ChecklistsService: ChecklistsService
	};

})();