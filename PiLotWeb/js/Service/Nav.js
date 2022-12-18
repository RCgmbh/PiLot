var PiLot = PiLot || {};
PiLot.Service = PiLot.Service || {};

PiLot.Service.Nav = (function () {

    var poiServiceInstance = null;

    /** Helper class to access all poi related services. Does some caching too. */
    var PoiService = function(){
        this.categories = null;
        this.initialize();
    };

    PoiService.prototype = {
        
        initialize: function(){},

		/**
		* Finds Pois for a certain area, categories and features from the server
		* @returns {PiLot.Model.Nav.Poi[]};
		* */
		findPoisAsync: async function (pMinLat, pMinLon, pMaxLat, pMaxLon, pCategories, pFeatures) {
			const result = [];
			const categories = pCategories.join(',');
			const features = pFeatures.join(',');
			await this.ensureCategoriesLoadedAsync();
			const url = `/Pois?minLat=${pMinLat}&minLon=${pMinLon}&maxLat=${pMaxLat}&maxLon=${pMaxLon}&categories=${categories}&features=${features}`;
			const json = await PiLot.Utils.Common.getFromServerAsync(url);
			if (Array.isArray(json)) {
				for (let i = 0; i < json.length; i++) {
					const poi = this.poiFromArray(json[i]);
					if (poi) {
						result.push(poi);
					}
				}
			} else {
				PiLot.log('Did not get an array from Poi endpoint.', 0);
			}
			return result;
		},

		/**
		 * Loads the details for a poi (description, properties) and assigns them
		 * to the poi
		 * @param {PiLot.Model.Nav.Poi} pPoi - not null
		 */
		loadPoiDetailsAsync: async function (pPoi) {
			const url = `/Pois/${pPoi.getId()}`;
			const json = await PiLot.Utils.Common.getFromServerAsync(url);
			if (json && Array.isArray(json)) {
				pPoi.setDescription(json[2]);
				let properties = json[5];
				if (typeof (properties) === 'string') {
					properties = JSON.parse(properties);
				} else {
					properties = null;
				}
				pPoi.setProperties(properties);
			}
		},

		/**
		 * Saves a poi to the server and returns its id
		 * @param {PiLot.Model.Nav.Poi} pPoi
		 */
		savePoi: async function (pPoi) {
			return await PiLot.Utils.Common.putToServerAsync('/Pois', pPoi);
		},

		/**
		 * Deletes a poi 
		 * @param {PiLot.Model.Nav.Poi} pPoi
		 */
		deletePoi: async function (pPoi) {
			return await PiLot.Utils.Common.deleteFromServerAsync(`/Pois/${pPoi.getId()}`);
		},

		/**
		 * Creates a Poi from an array, as it is delivered from the server.
		 * @param {Object[]} pData
		 */
		poiFromArray: function (pData) {
			let result = null;
			if (Array.isArray(pData)) {
				result = new PiLot.Model.Nav.Poi(
					pData[0],
					pData[1],
					this.categories.get(pData[2]),
					pData[3],
					pData[4],
					pData[5],
					RC.Date.DateHelper.isoToLuxon(pData[6]),
					RC.Date.DateHelper.isoToLuxon(pData[7])
				);
			} else {
				PiLot.log('Did not get an array for Poi.fromArray.', 0);
			}
			return result;
		},

		/** 
		 * Gets the cached map of all categories
		 * @returns {Map} key: id, value: category
		 * */
		getCategoriesAsync: async function () {
			await this.ensureCategoriesLoadedAsync();
            return this.categories;
		},

		/** Makes sure this.categories is populated with the categories from the server */
		ensureCategoriesLoadedAsync: async function () {
			if (this.categories === null) {
				this.categories = await this.loadCategoriesAsync();
			}
		},

		/** Loads the categories from the server and sets up parent/child relations */
		loadCategoriesAsync: async function () {
			const result = new Map();
			const json = await PiLot.Utils.Common.getFromServerAsync('/PoiCategories');
			if (Array.isArray(json)) {
				for (let i = 0; i < json.length; i++) {
					const poiCategory = new PiLot.Model.Nav.PoiCategory(json[i].id, json[i].name);
					result.set(poiCategory.getId(), poiCategory);
				}
				for (let i = 0; i < json.length; i++) {
					if (json[i].parentId) {
						result.get(json[i].id).setParent(result.get(json[i].parentId));
					}
				}
			} else {
				PiLot.log('Did not get an array from Poi endpoint.', 0);
			}
			return result;
		}
    };

    /** Singleton accessor returning the current instance of the PoiService object */
    PoiService.getInstance = function(){
        if(poiServiceInstance === null){
            poiServiceInstance = new PoiService();
        }
        return poiServiceInstance;
    };

    /// Returning the class and static method definitions
	return {
		PoiService: PoiService
	}

})();