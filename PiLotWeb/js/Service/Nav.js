var PiLot = PiLot || {};
PiLot.Service = PiLot.Service || {};

PiLot.Service.Nav = (function () {

    var poiServiceInstance = null;

    /** Helper class to access all poi related services. Does some caching too. */
    var PoiService = function(){
		this.categories = null;			// Map with key = id, value = category
		this.features = null;			// Map with key = id, value = feature
		this.poisCache = null;			// Array of recently loaded pois
		this.externalPoisCache = null;	// Map with key = source, value = Map with key = sourceId, value = poi
        this.initialize();
    };

    PoiService.prototype = {
        
		initialize: function () {
			this.externalPoisCache = new Map();
			this.poisCache = [];
		},

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
						this.ensureExternalPoiCached(poi);
					}
				}
			} else {
				PiLot.log('Did not get an array from Poi endpoint.', 0);
			}
			this.poisCache = result;
			return result;
		},

		/**
		 * Loads the details for a poi (description, properties) and assigns them
		 * to the poi
		 * @param {PiLot.Model.Nav.Poi} pPoi - not null
		 */
		loadPoiDetailsAsync: async function (pPoi) {
			const url = `/Pois/${pPoi.getId()}`;
			await this.loadPoiAsync(url, pPoi);
		},

		/**
		 * Loads an external poi based on the source and its id. First tries to load
		 * it from the external poi cache, and if it's not there, tries to load it
		 * from the backend.
		 * @param {String} pSource - the name of the source
		 * @param {String} pSourceId - the poi's id in the source
		 */
		loadExternalPoiAsync: async function (pSource, pSourceId) {
			let result = null;
			const sourceMap = this.externalPoisCache.get(pSource);
			if (sourceMap) {
				result = sourceMap.get(pSourceId);
			}
			if (!result) {
				const url = `/Pois/${pSource}/${pSourceId}`;
				result = await this.loadPoiAsync(url, null);
				if (result) {
					this.ensureExternalPoiCached(result);
				}
			}
			return result;
		},

		/**
		 * Loads a poi using a specific url. If a poi is passed as parameter, only description
		 * and properties will be added, if no poi is passed, a new poi will be created based
		 * on the result from the query.
		 * @param {String} pUrl - the url for the query, which will return a poi as array
		 * @param {PiLot.Model.Nav.Poi} pPoi - an existing poi or null
		 */
		loadPoiAsync: async function (pUrl, pPoi) {
			const json = await PiLot.Utils.Common.getFromServerAsync(pUrl);
			let poi = pPoi || this.poiFromArray(json);
			if (poi && json && Array.isArray(json)) {
				poi.setDescription(json[10]);
				poi.setProperties(json[11]);
			}
			return poi;
		},

		/**
		 * Saves a poi to the server and returns its id
		 * @param {PiLot.Model.Nav.Poi} pPoi
		 */
		savePoiAsync: async function (pPoi) {
			return await PiLot.Utils.Common.putToServerAsync('/Pois', pPoi);
		},

		/**
		 * Deletes a poi 
		 * @param {PiLot.Model.Nav.Poi} pPoi
		 */
		deletePoiAsync: async function (pPoi) {
			return await PiLot.Utils.Common.deleteFromServerAsync(`/Pois/${pPoi.getId()}`);
		},

		/**
		 * Creates a Poi from an array, as it is delivered from the server. Returns null,
		 * if pData is null.
		 * @param {Object[]} pData
		 */
		poiFromArray: function (pData) {
			let result = null;
			if (pData) {
				const locale = PiLot.Utils.Language.getLanguage();
				if (Array.isArray(pData)) {
					result = new PiLot.Model.Nav.Poi(
						pData[0],
						pData[1],
						this.categories.get(pData[2]),
						pData[3],
						pData[4],
						pData[5],
						RC.Date.DateHelper.isoToLuxon(pData[6], locale),
						RC.Date.DateHelper.isoToLuxon(pData[7], locale),
						pData[8],
						pData[9]
					);
				} else {
					PiLot.log('Did not get an array for Poi.fromArray.', 0);
				}
			}
			return result;
		},


		/** 
		 * Gets the cached map of all categories
		 * @returns {Map} key: id, value: category
		 * */
		getCategoriesAsync: async function (pForceReload = false) {
			await this.ensureCategoriesLoadedAsync(pForceReload);
            return this.categories;
		},

		/** Makes sure this.categories is populated with the categories from the server */
		ensureCategoriesLoadedAsync: async function (pForceReload = false) {
			if ((this.categories === null) || pForceReload) {
				this.categories = await this.loadCategoriesAsync();
			}
		},

		/** Loads the categories from the server and sets up parent/child relations */
		loadCategoriesAsync: async function () {
			const result = new Map();
			const json = await PiLot.Utils.Common.getFromServerAsync('/PoiCategories');
			if (Array.isArray(json)) {
				for (let i = 0; i < json.length; i++) {
					const poiCategory = new PiLot.Model.Nav.PoiCategory(json[i].id, json[i].name, json[i].labels, json[i].icon);
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
		},

		/**
		 * Saves a poi category to the server and returns its id
		 * @param {PiLot.Model.Nav.PoiCategory} pCategory
		 */
		savePoiCategoryAsync: async function (pCategory) {
			const isNew = !pCategory.id;
			const result = await PiLot.Utils.Common.putToServerAsync('/PoiCategories', pCategory);
			if (isNew) {
				this.ensureCategoriesLoadedAsync(true);
			}
			return result;
		},

		/**
		 * Deletes a poi category
		 * @param {PiLot.Model.Nav.PoiCategory} pPoiCategory
		 * @returns true, if the category was deleted
		 */
		deletePoiCategoryAsync: async function (pPoiCategory) {
			const result = await PiLot.Utils.Common.deleteFromServerAsync(`/PoiCategories/${pPoiCategory.getId()}`);
			return !!result;
		},

		/** 
		 * Gets the cached map of all features
		 * @returns {Map} key: id, value: feature
		 * */
		getFeaturesAsync: async function () {
			await this.ensureFeaturesLoadedAsync();
			return this.features;
		},

		/** Makes sure this.features is populated with the features from the server */
		ensureFeaturesLoadedAsync: async function () {
			if (this.features === null) {
				this.features = await this.loadFeaturesAsync();
			}
		},

		/** Loads the features from the server */
		loadFeaturesAsync: async function () {
			const result = new Map();
			const json = await PiLot.Utils.Common.getFromServerAsync('/PoiFeatures');
			if (Array.isArray(json)) {
				for (let i = 0; i < json.length; i++) {
					const poiFeature = new PiLot.Model.Nav.PoiFeature(json[i].id, json[i].name, json[i].labels);
					result.set(poiFeature.getId(), poiFeature);
				}
			} else {
				PiLot.log('Did not get an array from Poi endpoint.', 0);
			}
			return result;
		},

		/** Returns the list of the most recently loaded pois */
		getRecentPois: function () {
			return this.poisCache;
		},

		/**
		 * Makes sure a poi is added to the external pois cache, if it has a source and sourceId
		 * @param {PiLot.Model.Nav.Poi} pPoi
		 */
		ensureExternalPoiCached: function (pPoi) {
			const source = pPoi.getSource();
			const sourceId = pPoi.getSourceId();
			if (source && sourceId) {
				let sourceMap;
				if (!this.externalPoisCache.has(source)) {
					sourceMap = new Map();
					this.externalPoisCache.set(source, sourceMap);
				} else {
					sourceMap = this.externalPoisCache.get(source);
				}
				sourceMap.set(sourceId, pPoi);
			}
		}
    };

    /** Singleton accessor returning the current instance of the PoiService object */
    PoiService.getInstance = function(){
        if(poiServiceInstance === null){
            poiServiceInstance = new PoiService();
        }
        return poiServiceInstance;
	};

	/**
	 * Loads pois from OSM using overpass turbo
	 * @see {@link https://wiki.openstreetmap.org/wiki/Overpass_API}
	 * @see {@link https://overpass-turbo.eu/#}
	 * */
	var OsmPoiLoader = function () { };
	
	OsmPoiLoader.genericQuery = `
		[out:json][timeout:25][bbox:{box}];
		(
			{tagFilters}
		);
		out body;
		>;
		out skel qt;`;

	OsmPoiLoader.tagFilter = 'nwr["{tagName}" = "{tagValue}"];';

	OsmPoiLoader.tags = {
		marina: [['leisure', 'marina'], ['mooring', 'yes']],
		lock: [['lock', 'yes'], ['waterway', 'lock_gate'], ['waterway', 'boat_lift']],
		fuel: [['wateway', 'fuel'], ['amenity', 'fuel']],
		pump: [['waterway', 'sanitary_dump_station'], ['sanitary_dump_station', 'yes']],
		toilet: [['amenity', 'toilets']]
	};

	OsmPoiLoader.apiUrl = 'https://lz4.overpass-api.de/api/interpreter?data=';

	OsmPoiLoader.prototype = {

		loadDataAsync: async function (pMinLat, pMinLon, pMaxLat, pMaxLon, pTypes) {
			let result = new Map();
			const box = `${pMinLat},${pMinLon},${pMaxLat},${pMaxLon}`;
			for (const type of pTypes) {
				const resultSet = await this.queryOverpassAsync(this.buildQuery(OsmPoiLoader.tags[type]), box);
				for (osmPoi of resultSet) {
					if (!result.has(osmPoi.getId())) {
						result.set(osmPoi.getId(), osmPoi);
					}
				}
			}
			return result;
		},

		buildQuery: function (pTags) {
			let tagFilters = '';
			for (aTag of pTags) {
				tagFilters += OsmPoiLoader.tagFilter.replace('{tagName}', aTag[0]).replace('{tagValue}', aTag[1]);
			}
			return OsmPoiLoader.genericQuery.replace('{tagFilters}', tagFilters);
		},

		queryOverpassAsync: async function (pQuery, pBox) {
			const url = OsmPoiLoader.apiUrl + encodeURIComponent(pQuery.replaceAll('{box}', pBox)).trim();
			const response = await fetch(url);
			const json = await response.json();
			return this.parseResult(json);
		},

		/**
		 * This takes the overpass result and createas an array of pois. Pois must have tags, and can be 
		 * either single nodes, ways or relations. 
		 * @param {Object} pOverpassResult - the raw object returned by overpass
		 * @returns{PiLot.Model.Nav.OsmPoi[]}
		 */
		parseResult: function (pOverpassResult) {
			const nodesMap = new Map();
			if (pOverpassResult.elements) {
				// fill the nodes map. For nodes with tags, create an Osm Poi.
				let isPoi;
				for (anElement of pOverpassResult.elements) {
					if ('id' in anElement) {
						isPoi = ('tags' in anElement);
						if (nodesMap.has(anElement.id)) {
							const element = nodesMap.get(anElement.id).element;
							element.tags = element.tags || anElement.tags;
							element.isPoi = element.isPoi || isPoi;
						} else {
							nodesMap.set(anElement.id, { element: anElement, isPoi: isPoi });
						}						
					}
				}
				// add related nodes to the pois. 
				for (const [nodeId, obj] of nodesMap) {
					if (obj.isPoi) {
						const osmPoi = this.elementToPoi(obj.element);
						this.addChildNodes(obj.element, osmPoi, nodesMap);
						this.addMemberNodes(obj.element, osmPoi, nodesMap);
						obj.osmPoi = osmPoi;
					}
				}
			}
			// fill the result array with all OsmPois for elements marked as pois
			const result = [];
			for (const [nodeId, obj] of nodesMap) {
				if (obj.isPoi) {
					result.push(obj.osmPoi);
				}
			}
			return result;
		},

		/**
		 * For each "node" element within an element, this searches the node in the map 
		 * of all elements, and adds them to poi, so that the poi has the coordinates
		 * of all nodes.
		 * @param {Object} pElement - the raw element representing the osm poi
		 * @param {PiLot.Model.Nav.OsmMoi} pPoi - the poi to which the nodes are added
		 * @param {Map} pNodesMap - the map with all elements (key = node id, value = {element, isPoi, osmPoi})
		 */
		addChildNodes: function (pElement, pPoi, pNodesMap) {
			if ('nodes' in pElement) {
				for (const aNodeId of pElement.nodes) {
					if (pNodesMap.has(aNodeId)) {
						childNode = pNodesMap.get(aNodeId);
						pPoi.addNode(childNode.element);
					} else {
						PiLot.log(`OSM node not found: ${aNodeId}`, 0);
					}
				}
			}
		},

		/**
		 * For each "member" element within an element, this searches the member in the map
		 * of all elements, and adds its nodes to poi, so that the poi has the coordinates
		 * of all nodes. It will probably add child members recursively, if this exists in osm.
		 * @param {Object} pElement - the raw element representing the osm poi
		 * @param {PiLot.Model.Nav.OsmMoi} pPoi - the poi to which the nodes are added
		 * @param {Map} pNodesMap - the map with all elements (key = node id, value = {element, isPoi})
		 */
		addMemberNodes: function (pElement, pPoi, pNodesMap) {
			if ('members' in pElement) {
				for (const member of pElement.members) {
					if (member.ref && pNodesMap.has(member.ref)) {
						refNode = pNodesMap.get(member.ref);
						this.addChildNodes(refNode.element, pPoi, pNodesMap);
						this.addMemberNodes(refNode.element, pPoi, pNodesMap);
					}
				}
			}
		},

		/**
		 * Creates a poi from a raw element as it is returned by overpass
		 * @param {Object} pElement - the raw overpass element
		 */
		elementToPoi: function (pElement) {
			const result = new PiLot.Model.Nav.OsmPoi(pElement.id, pElement.type);
			if (pElement.lat && pElement.lon) {
				result.setLatLng(pElement.lat, pElement.lon);
			}
			if (pElement.tags) {
				result.setTags(pElement.tags);
			}
			return result;
		}
			
	};

    /// Returning the class and static method definitions
	return {
		PoiService: PoiService,
		OsmPoiLoader: OsmPoiLoader
	}

})();