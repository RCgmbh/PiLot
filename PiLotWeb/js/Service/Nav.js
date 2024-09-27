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
			const url = `/Pois?minLat=${pMinLat}&minLon=${pMinLon}&maxLat=${pMaxLat}&maxLon=${pMaxLon}&categories=${categories}&features=${features}`;
			await this.ensureCategoriesLoadedAsync();
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
		 * Loads all pois, but only as raw objects! This is used for the export feature only!
		 * @returns {Object[]} an array of raw objects, not Pois
		 * */
		loadRawPoisAsync: async function () {
			return await PiLot.Utils.Common.getFromServerAsync('/Pois/all');
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
						this.processDate(pData[6], locale),
						this.processDate(pData[7], locale),
						pData[8],
						pData[9]
					);
					if (pData.length > 10) {
						result.setDescription(pData[10]);
						result.setProperties(pData[11]);
					}
				} else {
					PiLot.log('Did not get an array for Poi.fromArray.', 0);
				}
			}
			return result;
		},

		/**
		 * converts a value to a date. The value can either be an iso string
		 * or the number of seconds since epoc. Different backends send 
		 * different values, that's why we do this.
		 */
		processDate: function (pDate, pLocale) {
			const type = typeof (pDate);
			let result;
			if (type === 'string') {
				result = RC.Date.DateHelper.isoToLuxon(pDate, pLocale);
			} else if (type === 'number') {
				result = RC.Date.DateHelper.unixToLuxon(pDate, pLocale);
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
					let labels = json[i].labels;
					if (typeof labels === "string") {
						labels = JSON.parse(labels);
					}
					const poiCategory = new PiLot.Model.Nav.PoiCategory(json[i].id, json[i].name, labels, json[i].icon);
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
		 * @param {PiLot.Model.Nav.PoiCategory} pCategory
		 * @returns true, if the category was deleted
		 */
		deletePoiCategoryAsync: async function (pCategory) {
			const result = await PiLot.Utils.Common.deleteFromServerAsync(`/PoiCategories/${pCategory.getId()}`);
			return !!result;
		},

		/** 
		 * Gets the cached map of all features
		 * @returns {Map} key: id, value: feature
		 * */
		getFeaturesAsync: async function (pForceReload = false) {
			await this.ensureFeaturesLoadedAsync(pForceReload);
			return this.features;
		},

		/** Makes sure this.features is populated with the features from the server */
		ensureFeaturesLoadedAsync: async function (pForceReload = false) {
			if ((this.features === null) || pForceReload) {
				this.features = await this.loadFeaturesAsync();
			}
		},

		/** Loads the features from the server */
		loadFeaturesAsync: async function () {
			const result = new Map();
			const json = await PiLot.Utils.Common.getFromServerAsync('/PoiFeatures');
			if (Array.isArray(json)) {
				for (let i = 0; i < json.length; i++) {
					let labels = json[i].labels;
					if (typeof labels === "string") {
						labels = JSON.parse(labels);
					}
					const poiFeature = new PiLot.Model.Nav.PoiFeature(json[i].id, json[i].name, labels);
					result.set(poiFeature.getId(), poiFeature);
				}
			} else {
				PiLot.log('Did not get an array from Poi endpoint.', 0);
			}
			return result;
		},

		/**
		 * Saves a poi feature to the server and returns its id
		 * @param {PiLot.Model.Nav.PoiFeature} pFeature
		 */
		savePoiFeatureAsync: async function (pFeature) {
			const isNew = !pFeature.id;
			const result = await PiLot.Utils.Common.putToServerAsync('/PoiFeatures', pFeature);
			if (isNew) {
				this.ensureFeaturesLoadedAsync(true);
			}
			return result;
		},

		/**
		 * Deletes a poi feature
		 * @param {PiLot.Model.Nav.PoiFeature} pFeature
		 * @returns true, if the feature was deleted
		 */
		deletePoiFeatureAsync: async function (pFeature) {
			const result = await PiLot.Utils.Common.deleteFromServerAsync(`/PoiFeatures/${pFeature.getId()}`);
			return !!result;
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

	var trackServiceInstance = null;

    /** Helper class to access all track related services. Does some caching too. */
    var TrackService = function(){
		this.trackSegmentTypes = null;	// Map with key = id, value = trackSegmentType
		this.initialize();
    };

    TrackService.prototype = {
        
		initialize: function () { },

		/**
		 * Loads all tracks for a specific period, using UTC or BoatTime for start and end time
		 * @param {Number} pStartTime - the start time in milliseconds from epoc, in UTC or BoatTime. Can be null, which means 1.1.1970
		 * @param {Number} pEndTime - the end time in milliseconds from epoc, in UTC or BoatTime. Not null
		 * @param {Boolean} pIsBoatTime - If true, start and end are BoatTime, else UTC
		 * @param {Boolean} pReadTrackPoints - If false, the tracks will be read without track points
		 * @returns {Track[]} - the resulting tracks, can be empty
		 */
		loadTracksAsync: async function (pStartTime, pEndTime, pIsBoatTime, pReadTrackPoints = true) {
			const result = [];
			const startTime = pStartTime || 0;
			const url = `/Tracks?startTime=${Math.round(startTime)}&endTime=${Math.round(pEndTime)}&isBoatTime=${pIsBoatTime}&readTrackPoints=${pReadTrackPoints}`;
			const json = await PiLot.Utils.Common.getFromServerAsync(url);
			for (aTrackData of json) {
				result.push(PiLot.Model.Nav.Track.fromData(aTrackData));
			}
			return result;
		},

		/**
		 * Saves a track to the server, including all track points and the
		 * boat name.
		 * @param {PiLot.Model.Nav.Track} pTrack 
		 */
		saveTrackAsync: async function (pTrack){
			const path = '/Tracks/';
			const obj = this.trackToObject(pTrack);
			return await PiLot.Utils.Common.putToServerAsync(path, obj);
		},

		/** Updates the boat for a track */
		saveTrackBoatAsync: async function(pTrack){
			const path = `/Tracks/${pTrack.getId()}/boat?name=${pTrack.getBoat()}`;
			return await PiLot.Utils.Common.putToServerAsync(path, null)
		},

		/**
		 * Creates a data object that can be sent to the api. An empty track
		 * will be returned as null, as start and end can not be defined.
		 * @param {PiLot.Model.Nav.Track} pTrack 
		 * */
		trackToObject: function (pTrack) {
			let result = null;
			if (pTrack.hasTrackPoints) {
				result = {
					id: pTrack.getId(),
					startUtc: pTrack.getFirstTrackPoint().getUTC(),
					endUtc: pTrack.getLastTrackPoint().getUTC(),
					startBoatTime: pTrack.getFirstTrackPoint().getBoatTime(),
					endBoatTime: pTrack.getLastTrackPoint().getBoatTime(),
					distance: pTrack.getDistance(),
					boat: pTrack.getBoat(),
					trackPointsArray: pTrack.getTrackPoints().map((tp) => tp.toArray())
				};
			}
			return result;
		},
		
		/**
		 * Deletes trackPoint from a track on the server
		 * @param {Number} pTrackId - the id of the track 
		 * @param {Number} pStart - inclusive start time of deletion in ms 
		 * @param {Number} pEnd - inclusive end time of deletion in ms
		 * @param {Boolean} pIsBoatTime - true to trat pStart, pEnd as BoatTime
		 * @returns 
		 */
		deleteTrackPointsAsync: async function(pTrackId, pStart, pEnd, pIsBoatTime){
			const path = `/Tracks/${pTrackId}/TrackPoints?startTime=${pStart}&endTime=${pEnd}&isBoatTime=${pIsBoatTime}`;
			return await PiLot.Utils.Common.deleteFromServerAsync(path);
		},
		
		loadMonthlyTrackSummaryAsync: async function(pYear, pMonth){
			const path = `/Tracks/${pYear}/${pMonth}`;
			return await PiLot.Utils.Common.getFromServerAsync(path);
		},

		/**
		 * Gets the track segments for a certain track. If the track does not exist, null is
		 * returned. Otherwise, an array of TrackSegment is returned, which can be empty.
		 * @param {Number} pTrackId
		 * @returns {PiLot.Model.Nav.TrackSegment[]}
		 * */
		getTrackSegmentsByTrackIdAsync: async function(pTrackId){
			let result = null;
			await this.ensureTrackSegmentTypesLoadedAsync();
			const json = await PiLot.Utils.Common.getFromServerAsync(`/Tracks/${pTrackId}/Segments`);
			const language = PiLot.Utils.Language.getLanguage();
			if (json !== null) {
				if (Array.isArray(json)) {
					result = [];
					for (anItem of json) {
						result.push(this.trackSegmentFromData(anItem, language));
					}
				} else {
					PiLot.log('Did not get an array from TrackSegments endpoint.', 0);
				}
			}
			return result;
		},

		/**
		 * Finds all track segments of a certain type, optionally limited by a timeframe. If start
		 * and end is passed, all segments that overlap with the interval start-end are returned,
		 * so be aware that the resulting segments potentially have start/end outside the interval.
		 * @param {Number} pType - The track segment type id, mandatory
		 * @param {Number} pStart - Start time in milliseconds, can be null
		 * @param {Number} pEnd - timeframe end time in milliseconds, can be null
		 * @param {Boolean} pIsBoatTime - whether start and end is boat time or utc
		 * @param {Number} pPageSize - the number of records to return
		 * */
		findTrackSegmentsAsync: async function (pType, pStart, pEnd, pIsBoatTime, pBoats, pPageSize) {
			let result = null;
			await this.ensureTrackSegmentTypesLoadedAsync();
			const boatsString = pBoats ? pBoats.join(',') : null;
			const url = `/TrackSegments?typeId=${pType}&start=${pStart || ''}&end=${pEnd || ''}&isBoatTime=${pIsBoatTime}&boats=${boatsString}&pageSize=${pPageSize}`
			const json = await PiLot.Utils.Common.getFromServerAsync(url);
			const language = PiLot.Utils.Language.getLanguage();
			if (json !== null) {
				if (Array.isArray(json)) {
					result = [];
					for (anItem of json) {
						result.push(this.trackSegmentFromData(anItem, language));
					}
				} else {
					PiLot.log('Did not get an array from TrackSegments endpoint.', 0);
				}
			}
			return result;
		},

		/**
		 * Converts a data object as delivered by the backend to a TrackSegment object. 
		 * Please make sure to call this.ensureTrackSegmentTypesLoadedAsync before calling
		 * this (we don't want to call it here as this is usually called within a loop).
		 * @param {Object} pData - the data object
		 * @param {String} pLanguage - the language key (DE, EN etc.) used for the luxon object
		 */
		trackSegmentFromData: function (pData, pLanguage) {
			return new PiLot.Model.Nav.TrackSegment(
				anItem.trackId,
				this.trackSegmentTypes.get(pData.typeId),
				RC.Date.DateHelper.millisToLuxon(pData.startUtc, pLanguage),
				RC.Date.DateHelper.millisToLuxon(pData.endUtc, pLanguage),
				RC.Date.DateHelper.millisToLuxon(pData.startBoatTime, pLanguage),
				RC.Date.DateHelper.millisToLuxon(pData.endBoatTime, pLanguage),
				pData.distance,
				pData.speed,
				pData.boat
			);
		},

		/** 
		 * Gets the cached map of all trackSegmentTypes
		 * @returns {Map} key: id, value: trackSegmentType
		 * */
		getTrackSegmentTypesAsync: async function (pForceReload = false) {
			await this.ensureTrackSegmentTypesLoadedAsync(pForceReload);
            return this.trackSegmentTypes;
		},

		/** Makes sure this.trackSegmentTypes is populated with the track segment types from the server */
		ensureTrackSegmentTypesLoadedAsync: async function (pForceReload = false) {
			if ((this.trackSegmentTypes === null) || pForceReload) {
				this.trackSegmentTypes = await this.loadTrackSegmentTypesAsync();
			}
		},

		/** Loads the track segment types from the server */
		loadTrackSegmentTypesAsync: async function () {
			const result = new Map();
			const json = await PiLot.Utils.Common.getFromServerAsync('/TrackSegmentTypes');
			if (Array.isArray(json)) {
				for (let i = 0; i < json.length; i++) {
					let labels = json[i].labels;
					if (typeof labels === "string") {
						labels = JSON.parse(labels);
					}
					const trackSegmentType = new PiLot.Model.Nav.TrackSegmentType(
						json[i].id, 
						json[i].duration,
						json[i].distance,
						labels || {}
					);
					result.set(trackSegmentType.getId(), trackSegmentType);
				}
			} else {
				PiLot.log('Did not get an array from TrackSegmentTypes endpoint.', 0);
			}
			return result;
		},

		/**
		 * Saves a TrackSegmentType to the server and returns its id
		 * @param {PiLot.Model.Nav.TrackSegmentType} pTrackSegmentType
		 */
		saveTrackSegmentTypeAsync: async function (pTrackSegmentType) {
			const isNew = !pTrackSegmentType.id;
			const result = await PiLot.Utils.Common.putToServerAsync('/TrackSegmentTypes', pTrackSegmentType);
			if (isNew) {
				this.ensureTrackSegmentTypesLoadedAsync(true);
			}
			return result;
		},

		/**
		 * Deletes a TrackSegmentType
		 * @param {PiLot.Model.Nav.TrackSegmentType} pTrackSegmentType
		 * @returns true, if the track segment type was deleted
		 */
		deleteTrackSegmentTypeAsync: async function (pTrackSegmentType) {
			const result = await PiLot.Utils.Common.deleteFromServerAsync(`/TrackSegmentTypes/${pTrackSegmentType.getId()}`);
			this.ensureTrackSegmentTypesLoadedAsync(true);
			return !!result;
		}
    };

    /** Singleton accessor returning the current instance of the TrackService object */
    TrackService.getInstance = function(){
        if(trackServiceInstance === null){
            trackServiceInstance = new TrackService();
        }
        return trackServiceInstance;
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

    OsmPoiLoader.tagNameFilter = 'nwr["{tagName}"];';
	OsmPoiLoader.tagKeyValueFilter = 'nwr["{tagName}" ~ "{tagValue}"];';

	OsmPoiLoader.tags = {
		marina: [['leisure', 'marina'], ['mooring', 'yes']],
		lock: [['lock', 'yes'], ['waterway', 'lock_gate'], ['waterway', 'boat_lift']],
		fuel: [['waterway', 'fuel'], ['amenity', 'fuel'], ['seamark:small_craft_facility:category', 'fuel']],
		pump: [['waterway', 'sanitary_dump_station'], ['sanitary_dump_station', 'yes'], ['seamark:small_craft_facility:category', 'pump-out']],
		toilet: [['amenity', 'toilets']],
        shop: [['shop', 'convenience'], ['shop', 'supermarket'], ['shop', 'yes']],
        bridge: [['seamark:type', 'bridge'], ['bridge', 'movable']]
	};

	OsmPoiLoader.apiUrls = [
		'https://lz4.overpass-api.de/api/interpreter',
		'https://z.overpass-api.de/api/interpreter',
		'https://overpass.kumi.systems/api/interpreter',
		'https://overpass.openstreetmap.ru/api/interpreter',
		'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
	];

	OsmPoiLoader.prototype = {

		loadDataAsync: async function (pApiUrl, pMinLat, pMinLon, pMaxLat, pMaxLon, pTypes) {
			let result = new Map();
			const box = `${pMinLat},${pMinLon},${pMaxLat},${pMaxLon}`;
			for (const type of pTypes) {
				const resultSet = await this.queryOverpassAsync(pApiUrl, this.buildQuery(OsmPoiLoader.tags[type]), box);
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
                if (aTag.length === 1) {
                    tagFilters += OsmPoiLoader.tagNameFilter.replace('{tagName}', aTag[0]);
                } else if(aTag.length === 2) {
                    tagFilters += OsmPoiLoader.tagKeyValueFilter.replace('{tagName}', aTag[0]).replace('{tagValue}', aTag[1]);
                }
			}
			return OsmPoiLoader.genericQuery.replace('{tagFilters}', tagFilters);
		},

		queryOverpassAsync: async function (pApiUrl, pQuery, pBox) {
			const apiUrl = pApiUrl || OsmPoiLoader.apiUrls[Math.floor(Math.random() * OsmPoiLoader.apiUrls.length)];
			const url = `${apiUrl}?data=${encodeURIComponent(pQuery.replaceAll('{box}', pBox)).trim()}`;
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

	/** Helper class to access the anchorWatch */
	var AnchorWatchService = function () {
		this.initialize();
	};

	AnchorWatchService.prototype = {

		initialize: function () { },

		/**
		* Loads the current anchorWatch
		* @returns {PiLot.Model.Nav.AnchorWatch};
		* */
		loadAnchorWatchAsync: async function () {
			let result = null;
			const json = await PiLot.Utils.Common.getFromServerAsync('/AnchorWatch');
			if (json) {
				result = new PiLot.Model.Nav.AnchorWatch(
					json.latitude,
					json.longitude,
					json.radius,
					true
				)
			} return result;
		},

		/**
		 * Saves the anchorWatch to the server
		 * @param {PiLot.Model.Nav.AnchorWatch} pAnchorWatch
		 */
		saveAnchorWatchAsync: async function (pAnchorWatch) {
			return await PiLot.Utils.Common.putToServerAsync('/AnchorWatch', pAnchorWatch);
		},

		/**
		 * Deletes the current anchorWatch from the server
		 */
		deleteAnchorWatchAsync: async function () {
			return await PiLot.Utils.Common.deleteFromServerAsync('/AnchorWatch');
		}
	};

    /// Returning the class and static method definitions
	return {
		PoiService: PoiService,
		TrackService: TrackService,
		OsmPoiLoader: OsmPoiLoader,
		AnchorWatchService: AnchorWatchService
	}

})();