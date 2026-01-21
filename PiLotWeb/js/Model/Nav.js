var PiLot = PiLot || {};
PiLot.Model = PiLot.Model || {};

PiLot.Model.Nav = (function () {

	/// Class Route 
	/// A Route defines a set of Waypoints
	var Route = function () {
		this.waypoints = null;				/// an ordered array of waypoints
		this.name = "";
		this.routeId = null;
		this.totalDistance = null;			/// a cached value for the total route distance
		this.observable = null;
		this.initialize();
	};

	/// Route Methods
	Route.prototype = {

		initialize: function () {
			this.waypoints = new Array();
			this.observable = new PiLot.Utils.Common.Observable(['addWaypoint', 'deleteWaypoint', 'moveWaypoint', 'changeWaypoints', 'rename', 'delete']);
		},

		/// calls all observers that registered for pEvent. 
		notifyObservers: function (pEvent, pArgs) {
			this.observable.fire(pEvent, pArgs);
		},

		/// registers an observer which will be called when pEvent happens
		on: function(pEvent, pObserver, pFunction){
			this.observable.addObserver(pEvent, pObserver, pFunction)
		},

		/// the handler for move actions of waypoints
		waypoint_move: function (pArgs) {
			this.totalDistance = null;
			this.notifyObservers('moveWaypoint', pArgs);
		},

		/// returns the name of the route
		getName: function () {
			return this.name;
		},

		/// sets a name to the route
		setName: function (pName) {
			this.name = pName;
			return this;
		},

		/// returns the route ID
		getRouteId: function () {
			return this.routeId;
		},

		/// sets the routeId
		setRouteId: function (pRouteId) {
			this.routeId = pRouteId;
		},

		/// gets a direct reference to the array with all waypoints
		getWaypoints: function(){
			return this.waypoints;
		},
	
		/// gets the waypoint at pIndex
		getWaypoint: function(pIndex){
			var result = null;
			if((pIndex >= 0) && (pIndex < this.waypoints.length)){
				result = this.waypoints[pIndex];
			}
			return result;
		},

		/// adds a Waypoint to this
		addWaypoint: function (pWaypoint, pSuppressSaving) {
			this.totalDistance = null;
			this.waypoints.push(pWaypoint);
			pWaypoint.on('move', this, this.waypoint_move.bind(this));
			if (!pSuppressSaving) {
				this.saveToServer(null);
			}
			this.notifyObservers('addWaypoint', pWaypoint);
		},

		/// adds a waypoint pWaypoint before pNextWaypoint
		addBefore: function (pWaypoint, pNextWaypoint) {
			this.totalDistance = null;
			const index = Math.max(this.waypoints.indexOf(pNextWaypoint), 0);
			this.waypoints.splice(index, 0, pWaypoint);
			pWaypoint.on('move', this, this.waypoint_move.bind(this));
			this.saveToServer(null);
			this.notifyObservers('addWaypoint', pWaypoint);
		},

		/// swaps two waypoints.
		swapWaypoints: function (pWaypoint1, pWaypoint2) {
			if (this.waypoints.includes(pWaypoint1) && this.waypoints.includes(pWaypoint2)) {
				const index1 = this.waypoints.indexOf(pWaypoint1);
				this.waypoints[this.waypoints.indexOf(pWaypoint2)] = pWaypoint1;
				this.waypoints[index1] = pWaypoint2;
				this.totalDistance = null;
				this.saveToServer(null);
				this.notifyObservers('changeWaypoints', { sender:this, waypoints:this.waypoints });
			}
			else {
				PiLot.log(`Invalid arguments in Route.swapWaypoints()`, 0);
			}
		},

		/**
		 * Reverses the waypoints, so that the first becomes the last and so on,
		 * and just for fun it tries to reverse the name of the route, if it's in
		 * the form A - B. Then saves the route and fires the respective events.
		 * */
		reverse: function () {
			this.waypoints.reverse();
			this.name = this.name.split(' - ').reverse().join(' - ');
			this.saveToServer(null);
			this.notifyObservers('rename', this);
			this.notifyObservers('changeWaypoints', { sender: this, waypoints:this.waypoints } );
		},

		/// deletes pWaypoint from the list of waypoints
		deleteWaypoint: function (pWaypoint) {
			this.totalDistance = null;
			let index = this.waypoints.indexOf(pWaypoint);
			if (index > -1) {
				this.waypoints.splice(index, 1);
			}
			this.notifyObservers('deleteWaypoint', pWaypoint);
			this.saveToServer(null);
		},

		/// returns the waypoint just before pWaypoint, if 
		/// pWaypoint is not null an not the first waypoint
		getPreviousWaypoint: function (pWaypoint) {
			let result = null;
			if (pWaypoint != null) {
				const index = this.waypoints.indexOf(pWaypoint);
				if (index > 0) {
					result = this.waypoints[index - 1];
				}
			}
			return result;
		},

		/// returns the waypoint just after pWaypoint, if 
		/// pWaypoint is not null an not the last waypoint
		getNextWaypoint: function (pWaypoint) {
			let result = null;
			if (pWaypoint != null) {
				const index = this.waypoints.indexOf(pWaypoint);
				if (index < this.waypoints.length - 1) {
					result = this.waypoints[index + 1];
				}
			}
			return result;
		},

		/// calculates the total distance of the route
		getTotalDistance: function () {
			if (this.totalDistance === null) {
				this.totalDistance = 0;
				let latLon1 = null;
				let latLon2 = null;
				for (let i = 1; i < this.waypoints.length; i++) {
					latLon1 = this.waypoints[i - 1].getLatLon();
					latLon2 = this.waypoints[i].getLatLon();
					if (latLon1 && latLon2) {
						this.totalDistance += latLon1.distanceTo(latLon2);
					}
				}
			}
			return this.totalDistance;
		},

		/// compares this to another route based on a criterion and
		/// returns a numeric value indicating whether this is bigger, 
		/// equal or less than pOther
		compareTo: function (pOther, pCriterion, pSortAscending) {
			let result = 0;
			if (pOther !== null) {
				switch (pCriterion) {
					case 'name':
						result = this.name.localeCompare(pOther.getName());
						break;
					case 'distance':
						result = this.getTotalDistance() - pOther.getTotalDistance();
						break;
					case 'waypoints':
						result = this.waypoints.length - pOther.getWaypoints().length;
						break;
				}
				if (!pSortAscending) {
					result *= -1;
				}
			}
			return result;
		},

		/**
		 * Saves the Route including all Waypoints to the server.This will create a dummy
		 * object to avoid problems with circular references route.waypoints, waypoint.route
		 */
		saveToServer: function () {
			var waypointsArray = new Array();
			for (var i = 0; i < this.waypoints.length; i++) {
				waypointsArray.push(this.waypoints[i].toServerObject());
			}
			var serverObject = { name: this.name, routeId: this.routeId, waypoints: waypointsArray };
			PiLot.Service.Common.ServiceHelper.putToServerAsync(`/Routes`, serverObject).then(r => {
				this.routeId = r.data.routeId;
			});
		},

		/** Deletes the route from the server, and returns true, if deletion succeeded */
		deleteFromServerAsync: async function () {
			return PiLot.Service.Common.ServiceHelper.deleteFromServerAsync(`/Routes/${this.routeId}`);
		}
	};

	/**
	 * Creates a new Route based on data recieved from the server. If
	 * the data is invalid, null is returned
	 * @param {Object} pData - The rest response from the server
	 */
	Route.fromData = function(pData) {
		let result = null;
		if (pData && ('routeId' in pData) && ('waypoints' in pData) && (Array.isArray(pData.waypoints))) {
			result = new Route();
			result.setName(pData.name);
			result.setRouteId(pData.routeId);
			pData.waypoints.forEach(e => {
				let waypoint = Waypoint.fromData(e, result);
				if (waypoint !== null) {
					result.addWaypoint(waypoint, true);
				}
			});
		}
		return result;
	};

	/**
	 * Loads the activeRouteId from the server
	 * */
	var loadActiveRouteIdAsync = async function () {
		return PiLot.Service.Common.ServiceHelper.getFromServerAsync('/Settings/activeRouteId');
	};

	/**
	 * Saves the activeRouteId to the server
	 * @param {number} pRouteId
	 */
	var saveActiveRouteIdAsync = async function (pRouteId) {
		let qs = (pRouteId === null) ? '' : `routeId=${pRouteId}` 
		return PiLot.Service.Common.ServiceHelper.putToServerAsync(`/Settings/activeRouteId?${qs}`, null);
	}

	/**
	 * returns the currently active route or null, if there is no current route
	 */
	var loadActiveRouteAsync = async function () {
		return loadRouteAsync('current');
	};

	/**
	 * Loads the route with ID pRouteId from the server. Pass "current"
	 * as pRouteId to get the currently active route.
	 * @param {String} pRouteId - The id (usually a number) or "current"
	 * */
	var loadRouteAsync = async function (pRouteId) {
		const json = await PiLot.Service.Common.ServiceHelper.getFromServerAsync(`/Routes/${pRouteId}`);
		const result = Route.fromData(json);
		return result;
	};

	/**
	 * Loads the list of all Routes from the server
	 * @returns {Array} - An array of routes
	 * */
	var loadAllRoutesAsync = async function () {
		const json = await PiLot.Service.Common.ServiceHelper.getFromServerAsync(`/Routes`);
		const result = new Array();
		if (json && Array.isArray(json)) {
			json.forEach(e => {
				let route = Route.fromData(e);
				if (route !== null) {
					result.push(route);
				}
			});
		} else {
			PiLot.log(`Inalid result in loadAllRoutesAsync: ${json}`, 0);
		}
		return result;
	};

	/**
	 * Represents a point of interest
	 * @param {Number} id
	 * @param {String} pTitle
	 * @param {PiLot.Model.Nav.PoiCategory} pCategory - The category
	 * @param {Number[]} pFeatureIds - The ids of all features this has
	 * @param {Number} pLat - Latitude in degrees WGS84
	 * @param {Number} pLon - Longitude in degrees WGS84
	 * @param {DateTime} pValidFrom - Valid from in UTC, Luxon object
	 * @param {DateTime} pValidTo - Valid to in UTC, Luxon object
	 * @param {String} pSource - the name of the source for external pois
	 * @param {String} pSourceId - the poi's id in the source system
	 */
	var Poi = function (pId = null, pTitle = null, pCategory = null, pFeatureIds = null, pLat = null, pLon = null, pValidFrom = null, pValidTo = null, pSource = null, pSourceId = null) {
		this.id = pId;
		this.title = pTitle;
		this.category = pCategory;
		this.setFeatureIds( pFeatureIds);
		this.latLng = null;
		this.latLon = null;
		this.setLatLng(pLat, pLon);
		this.validFrom = pValidFrom;
		this.validTo = pValidTo;
		this.source = pSource;
		this.sourceId = pSourceId;
		this.detailsLoaded = false;
		this.description = null;
		this.properties = null;
	};

	Poi.prototype = {

		initialize: function () { },

		getId: function () { return this.id; },

		setId: function (pId) { this.id = pId; },

		/** @return {L.LatLng} - the Poi position as Leaflet LatLng object */
		getLatLng: function () {
			return this.latLng;
		},

		/**
		 * Sets the Poi coordinates based on latitude and longitude
		 * @param {Number} pLat - Latitude in degrees
		 * @param {Number} pLng - Longitude in degrees
		 * */
		setLatLng: function (pLat, pLng) {
			this.latLon = null;
			if ((pLat !== null) && (pLng !== null)) {
				if (this.latLng === null) {
					this.latLng = new L.LatLng(pLat, pLng);
				} else {
					this.latLng.lat = pLat;
					this.latLng.lng = pLng;
				}
			}
		},

		/** @returns {LatLon} a geodesy LatLon object or null */
		getLatLon: function () {
			if ((this.latLon === null) && (this.latLng !== null)) {
				this.latLon = new LatLon(this.latLng.lat, this.latLng.lng, LatLon.datum.WGS84);
			}
			return this.latLon;
		},

		/** @returns {string} */
		getTitle: function () { return this.title; },

		/**  @param {string} pTitle */
		setTitle: function (pTitle) { this.title = pTitle; },

		/** @returns {PiLot.Model.Nav.PoiCategory} */
		getCategory: function () { return this.category; },

		/** @param {PiLot.Model.Nav.PoiCategory} pCategory */
		setCategory: function (pCategory) { this.category = pCategory; },

		/** @returns {PiLot.Model.Nav.PoiCategory} */
		getRootCategory: function () {
			return this.category.getRootCategory();
		},

		/** @returns {number[]} */
		getFeatureIds: function () { return this.featureIds; },

		/** @param {number[]} pFeatureIds */
		setFeatureIds: function (pFeatureIds) {
			this.featureIds = pFeatureIds || [];
		},

		/** @returns {string} */
		getDescription: function () { return this.description; },

		/**  @param {string} pDescription */
		setDescription: function (pDescription) { this.description = pDescription; },

		/** @returns {Object} */
		getProperties: function () { return this.properties; },

		/** @param {Object} pProperties */
		setProperties: function (pProperties) { this.properties = pProperties; },

		/** @returns {DateTime} */
		getValidFrom: function () { return this.validFrom; },

		/** @param {DateTime} pValidFrom */
		setValidFrom: function (pValidFrom) { this.validFrom = pValidFrom; },

		/** @returns {DateTime} */
		getValidTo: function () { return this.validTo; },

		/** @param {DateTime} pValidTo*/
		setValidTo: function (pValidTo) { this.validTo = pValidTo; },

		/** @returns {String} */
		getSource: function () { return this.source; },

		/** @param {String} pSource */
		setSource: function (pSource) { this.source = pSource; },

		/** @returns {String} */
		getSourceId: function () { return this.sourceId; },

		/** @param {String} pSourceId */
		setSourceId: function (pSourceId) { this.sourceId = pSourceId.toString(); },

		/** Makes sure the (description, properties) have been loaded from the server */
		ensureDetailsAsync: async function () {
			if (!this.detailsLoaded) {
				await PiLot.Service.Nav.PoiService.getInstance().loadPoiDetailsAsync(this);
				this.detailsLoaded = true;
			}
		},

		/** Saves the Poi back to the server */
		saveAsync: async function () {
			const obj = {
				id: this.id,
				title: this.title,
				description: this.description,
				categoryId: this.category.getId(),
				featureIds: this.featureIds,
				properties: null,
				latitude: this.latLng.lat,
				longitude: this.latLng.lng,
				validFrom: this.validFrom ? RC.Date.DateHelper.luxonToUnix(this.validFrom) : null,
				validTo: this.validTo ? RC.Date.DateHelper.luxonToUnix(this.validTo) : null,
				source: this.source,
				sourceId: this.sourceId
			};
			const result = await PiLot.Service.Nav.PoiService.getInstance().savePoiAsync(obj);
			this.id = result.data;
		},

		/** Deletes the Poi */
		deleteAsync: async function () {
			await PiLot.Service.Nav.PoiService.getInstance().deletePoiAsync(this);
		}

	};

	/**
	 * A category for a poi. Has an id, a name and maybe a parent
	 * @param {Number} pId
	 * @param {String} pName
	 * @param {Object} pLabels - labels in different languages as object
	 * @param {String} pIcon - the icon, either with css:(class) or svg:(name of svg file in /img/icons)
	 */
	var PoiCategory = function (pId, pName, pLabels, pIcon) {
		this.id = pId;
		this.name = pName;
		this.labels = pLabels;
		this.icon = pIcon;
		this.parent = null;
		this.children = null;
		this.initialize();
	};

	PoiCategory.prototype = {

		initialize: function () {
			this.children = [];
		},

		getId: function () {
			return this.id;
		},

		setId: function (pId) {
			this.id = pId;	
		},

		getParent: function () {
			return this.parent;
		},

		getParentId: function () {
			return (this.parent === null) ? null : this.parent.getId();
		},

		setParent: function (pParent) {
			if (this.parent !== pParent) {
				if (this.parent) {
					this.parent.removeChild(this);
				}
				this.parent = pParent;
				if (pParent) {
					this.parent.addChild(this);
				}
			}
		},

		getName: function () {
			return this.name;
		},

		setName: function (pName) {
			this.name = pName;
		},

		getLabel: function (pLanguage) {
			if (this.labels && pLanguage in this.labels) {
				return this.labels[pLanguage]
			} else return this.name;
		},

		setLabels: function (pLabels) {
			this.labels = pLabels;
		},

		/** @retuns{String} the raw icon, either css:(class name) or svg:(svg file name) */
		getIcon: function () {
			return this.icon;
		},

		setIcon: function (pIcon) {
			this.icon = pIcon;
		},

		getLevel: function () {
			return (this.parent ? this.parent.getLevel() + 1 : 0);
		},

		addChild: function(pChild){
			this.children.push(pChild);
		},

		removeChild: function (pChild) {
			const index = this.children.indexOf(pChild);
			if (index > -1) {
				this.children.remove(index);
			}
		},

		hasChildren: function () {
			return this.children.length > 0;
		},

		getChildren: function () {
			return this.children;
		},

		isDescendantOf: function (pCategory) {
			let result = false;
			let parent = this.parent;
			while (parent) {
				if (parent.getId() === pCategory.getId()) {
					result = true;
					break;
				} else {
					parent = parent.getParent();
				}
			}
			return result;
		},

		getRootCategory: function () {
			return this.parent ? this.parent.getRootCategory() : this;
		},

		/** Saves the Category back to the server */
		saveAsync: async function () {
			const result = await PiLot.Service.Nav.PoiService.getInstance().savePoiCategoryAsync(this.toObject());
			this.id = result.data;
		},

		/** @returns an easily serializable object with no references to other objects */
		toObject: function () {
			return {
				id: this.id,
				parentId: this.getParentId(),
				name: this.name,
				labels: this.labels,
				icon: this.icon
			};
		},

		/** Tries to delete the category from the server */
		deleteAsync: async function () {
			return await PiLot.Service.Nav.PoiService.getInstance().deletePoiCategoryAsync(this);
		}
	};

	/**
	 * Creates a new PoiCategory based on a data object. Does NOT establish
	 * parent-child relationships! Returns null, if required attributes are missing.
	 * @param {Object} pData - object with id, name
	 */
	PoiCategory.fromData = function (pData) {
		let result = null;
		let labels = pData.labels;
		if (typeof labels === "string") {
			labels = JSON.parse(labels);
		}
		if (pData.id && pData.name) {
			result = new PoiCategory(pData.id, pData.name, labels || {}, pData.icon);
		}
		return result;
	};

	/**
	 * A feature for a poi. 
	 * @param {Number} pId
	 * @param {String} pName
	 * @param {Object} pLabels - labels in different languages as object
	 */
	var PoiFeature = function (pId, pName, pLabels) {
		this.id = pId;
		this.name = pName;
		this.labels = pLabels;
		this.initialize();
	};

	PoiFeature.prototype = {

		initialize: function () { },

		getId: function () {
			return this.id;
		},

		setId: function (pId) {
			this.id = pId;
		},

		getName: function () {
			return this.name;
		},

		setName: function (pName) {
			this.name = pName;
		},

		getLabel: function (pLanguage) {
			if (this.labels && pLanguage in this.labels) {
				return this.labels[pLanguage]
			} else return this.name;

		},

		setLabels: function (pLabels) {
			this.labels = pLabels;
		},

		/** Saves the Feature back to the server */
		saveAsync: async function () {
			const result = await PiLot.Service.Nav.PoiService.getInstance().savePoiFeatureAsync(this.toObject());
			this.id = result.data;
		},

		/** @returns an easily serializable object with no references to other objects */
		toObject: function () {
			return {
				id: this.id,
				name: this.name,
				labels: this.labels
			};
		},

		/** Tries to delete the feature from the server */
		deleteAsync: async function () {
			return await PiLot.Service.Nav.PoiService.getInstance().deletePoiFeatureAsync(this);
		}
	};

	/**
	 * Creates a new PoiFeature based on a data object. Returns null,
	 * if required attributes are missing. Labels can be an object or
	 * a serialized object.
	 * @param {Object} pData - object with id, name, labels
	 */
	PoiFeature.fromData = function (pData) {
		let result = null;
		let labels = pData.labels;
		if (typeof labels === "string") { 
			labels = JSON.parse(labels);
		}
		if (pData.id && pData.name) {
			result = new PoiFeature(pData.id, pData.name, labels || {});
		}
		return result;
	};

	/**
	 * Represents a poi that has been read from osm/overpass. It is used
	 * temporarily to create or update an existing Poi with its data.
	 * @param {Number} pId - the id from osm
	 */
	var OsmPoi = function (pId, pType) {
		this.id = pId;
		this.type = pType;
		this.osmTags = null;			// an object representing the osm tags
		this.nodes = null;				// a map with nodeId, node used to calculat the position of the poi for complex pois
		this.latLng = null;				// directly assigned coordinates for node-pois 
		this.linkedPoi = null;			// the PiLot Poi this is linked to. 
		this.linkedPoiLoaded = false;	// Indicates whether the linked poi has been tried to be loaded
		this.initialize();
	};

	OsmPoi.prototype = {

		initialize: function () {
			this.nodes = new Map();
		},

		/** @returns {Number} the osm id */
		getId: function () {
			return this.id;
		},

		/** @returns {String} the type, e.g. node, way */
		getType: function () {
			return this.type;
		},

		/**
		 * Adds a raw osm node. If the node has coordinates, it will be added to the nodes
		 * map, used to calculate the poi position.
		 * @param {Object} pNode - the raw node element from overpass
		 */
		addNode: function (pNode) {
			if ('id' in pNode) {
				if (('lat' in pNode) && ('lon' in pNode)) {
					this.nodes.set(pNode.id, pNode);
				}
			}			
		},

		/**
		 * Sets the osm tags
		 * @param {Object} pTags
		 */
		setTags: function (pTags) {
			this.osmTags = pTags;
		},

		/** @returns {Object} - the osm tags or an empty object */
		getTags: function () {
			return this.osmTags || {};
		},

		/** @returns {String} - the tags with key: value, one line per tag */
		getTagsString: function () {
			let result = "";
			for (const aTag in this.osmTags) {
				result = result.concat(`${aTag}: ${this.osmTags[aTag]}\n`);
			}
			return result;
		},

		/**
		 * sets the Poi coordinates based on latitude and longitude 
		 * @param{Number} pLat - Latitude
		 * @param{Number} pLng - Longitude
		 * */
		setLatLng: function (pLat, pLng) {
			if ((pLat !== null) && (pLng !== null)) {
				if (this.latLng === null) {
					this.latLng = new L.LatLng(pLat, pLng);
				} else {
					this.latLng.lat = pLat;
					this.latLng.lng = pLng;
				}
			}
		},

		/** @returns {L.LatLng} - either the explicitly set position, or the calculated middle of all nodes, or null  */
		getLatLng: function () {
			let result = null;
			if (this.latLng) {
				result = this.latLng;
			} else if (this.nodes.size > 0) {
				let minLat = null, minLng = null, maxLat = null, maxLng = null;
				for (const [nodeId, node] of this.nodes) {
					minLat = (minLat === null ? node.lat : Math.min(minLat, node.lat));
					minLng = (minLng === null ? node.lon : Math.min(minLng, node.lon));
					maxLat = (maxLat === null ? node.lat : Math.max(maxLat, node.lat));
					maxLng = (maxLng === null ? node.lon : Math.max(maxLng, node.lon));
				}
				result = new L.LatLng((minLat + maxLat) / 2, (minLng + maxLng) / 2);
			}
			return result;
		},

		/** @returns {String} the name tag or type and id */
		getTitle: function () {
			return this.osmTags.lock_name || this.osmTags.name || `${this.type} ${this.id}`;
		},

		/** @returns {PiLot.Model.Nav.Poi} if there is on, the PiLot poi linked to this osm poi */
		getLinkedPoiAsync: async function () {
			if (!this.linkedPoiLoaded) {
				const poiService = PiLot.Service.Nav.PoiService.getInstance();
				this.linkedPoi = await poiService.loadExternalPoiAsync('osm', this.id);
				this.linkedPoiLoaded = true;
			}
			return this.linkedPoi;
		},

		resetLinkedPoi: function () {
			this.linkedPoi = null;
			this.linkedPoiLoaded = false;
		}
	};

	/// Class Waypoint, representing one waypoint being part of a track.
	/// The constructor expects the route, a geodesy LatLon object as pLatLong,
	/// and a string as title
	var Waypoint = function (pRoute, pLat, pLon, pName, pWaypointId = null) {
		this.route = pRoute;
		this.waypointId = pWaypointId;
		this.name = pName;
		this.latLon = null;
		this.observable = null;
		this.initialize(pLat, pLon);
	};

	Waypoint.prototype = {

		initialize: function (pLat, pLon) {
			this.observable = new PiLot.Utils.Common.Observable(['move', 'delete', 'rename']);
			this.setLatLon(pLat, pLon, true);
		},

		/**
		 * calls all observers that registered for pEvent. 
		 * */ 
		notifyObservers: function (pEvent, pArgs) {
			this.observable.fire(pEvent, pArgs);
		},

		/// registers an observer which will be called when pEvent happens
		on: function(pEvent, pObserver, pFunction){ 
			this.observable.addObserver(pEvent, pObserver, pFunction)
		},

		/// gets the rote this waypoint belongs to
		getRoute: function () {
			return this.route;
		},

		/// gets the waypointId, which is null as long as the waypoint
		/// has not been saved
		getWaypointId: function () {
			return this.waypointId;
		},

		/// sets the waypointId
		setWaypointId: function (pWaypointId) {
			this.waypointId = pWaypointId;
		},

		/// sets the name of the waypoint
		/// gets the name of the waypoint
		getName: function(){
			return this.name;
		},

		setName: function (pName) {
			var isRenamed = (pName !== this.name);
			this.name = pName;
			if (isRenamed) {
				this.notifyObservers('rename', this.name);
			}
		},

		/// gets the waypoint position as geodesy LatLon object
		getLatLon: function(){
			return this.latLon;
		},
		
		/// sets the waypoint coordinates based on latitude and longitude
		setLatLon: function (pLat, pLon, pSuppressSave, pSender) {
			if ((pLat !== null) && (pLon !== null)) {
				if (this.latLon === null) {
					this.latLon = new LatLon(pLat, pLon, LatLon.datum.WGS84);
				} else {
					this.latLon.lat = pLat;
					this.latLon.lon = pLon;
				}
			}
			if (!pSuppressSave) {
				this.route.saveToServer(null);
			}
			this.notifyObservers('move', { sender:pSender, waypoint:this });
		},

		/// returns the waypoint corrdinates in Leaflet style (L.LatLng)
		getLatLng: function () {
			var result = null;
			if (this.latLon != null) {
				result = PiLot.Utils.Nav.latLonToLatLng(this.latLon);
			}
			return result;
		},
		
		/// sets the waypoint positions based on a Leaflet L.LatLng object
		setLatLng: function (pLatLng, pSuppressSave, pSender) {
			this.setLatLon(pLatLng.lat, pLatLng.lng, pSuppressSave, pSender);
		},

		/// returns whether the waypoint has a valid position set
		hasPosition: function () {
			return this.latLon !== null;
		},

		/// inserts a waypoint into the route before this
		insertBefore: function (pLatLng) {
			const wpName = PiLot.Utils.Language.getText('waypoint');
			var newWaypoint = new Waypoint(this.route, pLatLng.lat, pLatLng.lng, wpName);
			this.route.addBefore(newWaypoint, this);
		},

		/// returns the Distance to a certain coordinate, if this has a position and pLatLon is not null
		distanceTo: function(pLatLon){
			var result = null;
			if((this.latLon !== null) && (pLatLon !== null)) {
				result = this.latLon.distanceTo(pLatLon);
			}
			return result;
		},

		/// returns an object  {distance, bearing} to the next waypoint, if there is any.
		/// Otherwise returns null.
		getLegToNext: function () {
			var result = null;
			var nextWaypoint = this.route.getNextWaypoint(this);
			if (nextWaypoint !== null) {
				var latLon = nextWaypoint.getLatLon();
				result = {
					distance: this.distanceTo(latLon),
					bearing: this.bearingTo(latLon)
				}
			}
			return result;
		},

		/// returns the bearing to a certain position, if this has a position and pLatLon is not null
		bearingTo: function (pLatLon) {
			var result = null;
			if ((this.latLon !== null) && (pLatLon !== null)) {
				result = this.latLon.initialBearingTo(pLatLon);
			}
			return result;
		},

		/// returns the bearing from a certain position to this, if this has a position and pLatLon ist not null
		bearingFrom: function (pLatLon) {
			var result = null;
			if ((this.latLon !== null) && (pLatLon !== null)) {
				result = pLatLon.initialBearingTo(this.latLon);
			}
			return result;
		},

		/// converts a waypoint into a Waypoint as it is used on the server
		toServerObject: function () {
			var latitude = null;
			var longitude = null;
			if (this.latLon != null) {
				latitude = this.latLon.lat;
				longitude = this.latLon.lon;
			}
			return { waypointId: this.waypointId, name: this.name, latitude: latitude, longitude: longitude };
		}
	};

	/**
	 * Creates a waypoint based on data recieved from the rest service. If 
	 * the data is invalid, it will return null
	 * @param {Object} pData - an object with waypointId, name, latitude, longitude
	 * @param {Route} pRoute - the route to add the waypoint to
	 */
	Waypoint.fromData = function (pData, pRoute) {
		let result = null;
		if (pData && pRoute && ('waypointId' in pData) && pData.latitude && pData.longitude) {
			result = new Waypoint(pRoute, pData.latitude, pData.longitude, pData.name, pData.waypointId);
		}
		return result;
	};

	var routeObserverInstance = null;

	/// RouteObserver Class
	/// keeps track of the current leg, ETA, distance and bearings
	/// for waypoints. Options: autoCalculate: set to true, if vmg
	/// etc. should be calculated on each update, false if only on
	/// demand
	var RouteObserver = function(pRoute, pOptions){
		this.route = pRoute;
		this.gpsObserver = null;
		this.latestPosition = null;
		this.waypointsLiveData = new Map();
		this.observable = null;
		this.xte = {direction: null, distance: null};
		this.vmg = null;
		this.nextWaypointIndex = -1;
		this.evaluateNextWPIntervalSeconds = 5;
		this.nextWPEvaluated = null;
		this.autoCalculate = false;
		this.readOptions(pOptions);
		this.initialize();
	};

	RouteObserver.prototype = {

		readOptions: function(pOptions){
			if (pOptions) {
				this.autoCalculate = pOptions.autoCalculate || this.autoCalculate;
			}
		},
		
		/// initializes the object, fills the waypoints map with key = waypoints,
		/// value = WaypointLiveData, and subscribes to the gps observer
		initialize: function(){
			this.gpsObserver = PiLot.Model.Nav.GPSObserver.getInstance();
			this.observable = new PiLot.Utils.Common.Observable(['recieveGpsData', 'changeLeg']);
			this.ensureRouteAsync();
		},

		/// calls all observers that registered for pEvent. 
		notifyObservers: function (pEvent, pArgs) {
			this.observable.fire(pEvent, pArgs);
		},

		/// registers an observer which will be called when pEvent happens
		on: function(pEvent, pObserver, pFunction){
			this.observable.addObserver(pEvent, pObserver, pFunction)
		},

		/**
		 * @param {String} pEvent 
		 * @param {Object} pObserver 
		 */
		off: function(pEvent, pObserver){
			this.observable.removeObserver(pEvent, pObserver);
		},

		route_addWaypoint: function (pWaypoint) {
			this.waypointsLiveData.set(pWaypoint, new WaypointLiveData());
		},

		/// the handler for move actions of waypoints for this route, resets the
		/// nextWPEvaluated time so it will be evaluated soon
		route_moveWaypoint: function (pWaypoint) {
			this.nextWPEvaluated = null;
		},

		/// handles notification about new GPS Data
		gpsObserver_changed: function(){
			if(this.autoCalculate){
				this.calculate();
			}
			this.notifyObservers('recieveGpsData', this);
		},		

		ensureRouteAsync: async function(){
			this.route = this.route || await loadActiveRouteAsync();
			if(this.route){
				const waypoints = this.route.getWaypoints()
				for(let i = 0; i < waypoints.length; i++){
					this.waypointsLiveData.set(waypoints[i], new WaypointLiveData());
				}
				if (this.gpsObserver !== null) {
					this.gpsObserver.on('recieveGpsData', this, this.gpsObserver_changed.bind(this));
				}
				
				this.route.on('addWaypoint', this, this.route_addWaypoint.bind(this));
				this.route.on('moveWaypoint', this, this.route_moveWaypoint.bind(this));
			}
		},

		/// re-calculates all data
		calculate: function () {
			if (this.gpsObserver !== null && this.route !== null) {
				this.latestPosition = this.gpsObserver.getLatestPosition(null);
				this.ensureNextWPEvaluated();
				this.calculateVMG();
				this.calculateWaypointLiveData();
				this.calculateXTE();
			}
		},

		/// returns the next waypoint or null, if the next waypoint is unknown
		getNextWaypoint: function(){
			let result = null;
			if(this.nextWaypointIndex >= 0){
				result = this.route.getWaypoint(this.nextWaypointIndex);
			}
			return result;
		},

		/// returns the live data for pWaypoint, if we know pWaypoint
		getLiveData: function (pWaypoint) {
			return this.waypointsLiveData.get(pWaypoint);
		},

		/// calculates the VMG to the next Waypoint and assigns it to this.vmg
		calculateVMG: function(){
			const nextWaypoint = this.getNextWaypoint();
			if ((nextWaypoint != null) && nextWaypoint.hasPosition()) {
				this.vmg = this.gpsObserver.getVMG(nextWaypoint.getLatLon());
			} else{
				this.vmg = null;
			}
		},

		/// this does all the calculations based on the current position
		/// It updates all waypointLiveData for the most recent and all
		/// future waypoints
		calculateWaypointLiveData: function(){
			let totalMiles = null;
			let legMiles = null;
			let legHours = 0;
			let eta = PiLot.Utils.Common.BoatTimeHelper.getCurrentBoatTime().now();
			const waypoints = this.route.getWaypoints();
			let waypoint = null;
			let waypointLiveData = null;
			let isNextWaypoint = false;
			let isPastWaypoint = false;
			let isFinalWaypoint = false;
			for (let i = 0; i < waypoints.length; i++) {
				waypoint = waypoints[i];
				waypointLiveData = this.waypointsLiveData.get(waypoint);
				if (this.latestPosition !== null) {
					waypointLiveData.hasData = true;
					isNextWaypoint = (i === this.nextWaypointIndex);
					isPastWaypoint = (i < this.nextWaypointIndex);
					isFinalWaypoint = (i === waypoints.length - 1);
					if (isNextWaypoint) {
						legMiles = PiLot.Utils.Nav.metersToNauticalMiles(waypoint.distanceTo(this.latestPosition.latLon));
					} else if (i > 0 && !isPastWaypoint) {
						legMiles = PiLot.Utils.Nav.metersToNauticalMiles(waypoint.distanceTo(waypoints[i - 1].latLon));
					}
					if (legMiles != null) {
						totalMiles = (totalMiles === null ? 0 : totalMiles) + legMiles;
					}
					if ((this.vmg !== null) && (this.vmg > 0)) {
						legHours = legMiles / this.vmg;
						eta = eta.plus({ hours: legHours });
					} else {
						legHours = null;
					}
					waypointLiveData.eta = ((this.vmg > 0) && !isPastWaypoint ? eta : null);
					waypointLiveData.miles = totalMiles;
					waypointLiveData.bearing = waypoint.bearingFrom(this.latestPosition.latLon);
					waypointLiveData.isNextWaypoint = isNextWaypoint;
					waypointLiveData.isPastWaypoint = isPastWaypoint;
					waypointLiveData.isFinalWaypoint = isFinalWaypoint;
				} else {
					waypointLiveData.hasData = false;
				}
			}
		},

		/// calculates the XTE for the current leg. If the current sog is less than 0.1, we don't pass the
		/// cog, which will result in not getting a xte direction back (as the direction depends on the
		/// cog, which is meaningless for low speed)
		calculateXTE: function(){
			var nextWaypoint = this.getNextWaypoint();
			var previousWaypoint = this.route.getPreviousWaypoint(nextWaypoint);
			var waypoint1 = previousWaypoint || nextWaypoint;
			var waypoint2 = previousWaypoint === null ? null : nextWaypoint;
			var sog = this.gpsObserver.getSOG();
			this.xte = PiLot.Utils.Nav.getXTE(this.latestPosition.latLon, waypoint1, waypoint2, (sog > 0.1) ? this.gpsObserver.getCOG() : null);
		},

		/// the makes sure the evaluation of the next waypoint happens within
		/// reasonable intervals, triggered by changed positions
		ensureNextWPEvaluated: function(){
			if ((this.nextWPEvaluated === null) || (this.nextWPEvaluated < DateTime.utc().minus({ seconds: this.evaluateNextWPIntervalSeconds }))) {
				var index = -1;
				var minXTE = null;
				var xte;
				var waypoints = this.route.getWaypoints();
				if (this.latestPosition != null) {
					for (var i = 0; i < waypoints.length; i++) {
						xte = PiLot.Utils.Nav.getXTE(this.latestPosition.getLatLon(), waypoints[i], (i > 0 ? waypoints[i - 1] : null), null);
						if (xte.distance !== null) {
							var distance = Math.abs(xte.distance);
							if (
								(minXTE === null) // default to the first one
								|| (distance < minXTE) // xte is smaller, we take this, 
								|| ((i > 1) && (distance <= minXTE))	// Before the fist wp, we don't set the current leg to the first leg,
																		// but after the first waypoint we are progressive and switch to the next leg
																		// even if it has the same xte (meaning xte is distance to waypoint). whatever
							) {
								minXTE = distance;
								index = i;
							}
						}
					}
					this.nextWPEvaluated = DateTime.utc();
				}
				if (this.nextWaypointIndex !== index) {
					this.nextWaypointIndex = index;
					this.notifyObservers('changeLeg', index);
				}				
			}
		},

		/// gets the route
		getRoute: function () {
			return this.route;
		},

		/// gets the current XTE, which is always an object with {direction, distance},
		///	where both values can be null. Distance is in meters
		getXTE: function () {
			return this.xte;
		},

		/// gets the current VMG (which actually is the VMC) or null.
		getVMG: function () {
			return this.vmg;
		},

		/** @returns {WaypointLiveData} - the live data of the last waypoint */
		getLastWaypointLiveData: function(){
			let result = null;
			if(this.route){
				const waypoints = this.route.getWaypoints();
				if(waypoints.length > 0){
					result = this.waypointsLiveData.get(waypoints.last());
				}
			}
			return result;
		}
	};

	/** Singleton accessor returning the current instance of the RouteObserver object with auto calculate being true */
	RouteObserver.getInstance = function () {
		if (routeObserverInstance === null) {
			routeObserverInstance = new RouteObserver(null, {autoCalculate:true});
		}
		return routeObserverInstance;
	};

	/// WaypointLiveData class, containing dynamically changing data about a
	/// waypoint which depends on the waypoint, but is not stored /persisted
	/// with the waypoint
	var WaypointLiveData = function(){
		this.hasData = false;			// false if we have no live data
		this.eta = null;				// eta for this waypoint based on miles and vmg
		this.miles = null;				// total distance (based on the route) to this waypoint
		this.bearing = null;			// bearing from the current position
		this.isNextWaypoint = null;		// true, if this is the next waypoint on the route
		this.isPastWaypoint = null;		// true, if this waypoint has been passed already
		this.isFinalWaypoint = null;	// true, if this is the last waypoint of the track
	}

	/** 
	 * Represents an achor watch that fires alarms when the threshold is exceeded
	 * @param {Number} pLatitude - the latitude of the center
	 * @param {Number} pLongitude - the longitude of the center
	 * @param {Number} pRadius - the alarm distance in meters
	 * */
	var AnchorWatch = function (pLatitude, pLongitude, pRadius, pEnabled) {
		this.radius = pRadius;
		this.enabled = pEnabled;									// if not enabled, changes will not be saved
		this.center = null;											// LatLon object representing the center
		this.setCenter(pLatitude, pLongitude, this, true, true);
		this.alarmIndex = null;										// index of AnchorWatch.alarms of the current alarm
		this.gpsObserver = null;
		this.observable = null;
		this.initialize();
	};

	AnchorWatch.alarms = [
		[1.5, PiLot.Utils.Audio.Alarm.panic],
		[1.2, PiLot.Utils.Audio.Alarm.danger],
		[1, PiLot.Utils.Audio.Alarm.attention2],
		[0, null]
	];

	AnchorWatch.prototype = {

		initialize: function () {
			this.observable = new PiLot.Utils.Common.Observable(['change', 'exceedRadius', 'belowRadius', 'enable', 'disable', 'remove']);
			this.gpsObserver = PiLot.Model.Nav.GPSObserver.getInstance();
			this.gpsObserver.on('recieveGpsData', this, this.gpsObserver_recieveGpsData.bind(this));
			this.gpsObserver.on('outdatedGpsData', this, this.gpsObserver_outdatedGpsData.bind(this));
		},

		gpsObserver_recieveGpsData: function (pArgs) {
			if (this.enabled) {
				this.checkDistance();
			}
		},

		gpsObserver_outdatedGpsData: function () { },

		/**
		 * Registers an observer which will be called when pEvent happens.
		 * @param {String} pEvent - 'change', 'exceedRadius', 'belowRadius', 'enable', 'disable', 'remove'
		 * @param {Function} pCallback
		 * */
		on: function(pEvent, pObserver, pFunction){
			this.observable.addObserver(pEvent, pObserver, pFunction);
		},

		/** @returns {LatLon} the center as geodesy LatLon object */
		getCenterLatLon: function () {
			return this.center;
		},

		/** @returns {Array} an array with latitude, longitude. Useful for leaflet */
		getCenterLatLng: function () {
			let result = null;
			if (this.center) {
				result = [this.center.lat, this.center.lon];
			}
			return result;
		},

		/**
		 * Sets the center, which represents the location of the anchor. Fires
		 * the "change" event, if not told to be silent.
		 * @param {Number} pLatitude
		 * @param {Number} pLongitude
		 * @param {Object} pSender - will be returned in the event, to help avoid recursion
		 * @param {Boolean} pSkipSaving - Allows to not save the changes (used for dragging)
		 * @param {Boolean} pSilent - allows to suppress the change event
		 */
		setCenter: function (pLatitude, pLongitude, pSender, pSkipSaving = false, pSilent = false) {
			if ((pLatitude !== null) && (pLongitude !== null)) {
				if (this.center !== null) {
					this.center.lat = pLatitude;
					this.center.lon = pLongitude;
				} else {
					this.center = new LatLon(pLatitude, pLongitude, LatLon.datum.WGS84)
				}
			} else {
				this.latLon = null;
			}
			if (!pSilent) {
				this.observable.fire('change', this);
				if (this.enabled) {
					this.checkDistance();
				} 
			}
			if (!pSkipSaving && this.enabled) {
				this.saveToServer();
			}
		},

		/** @returns {Number} the currently set radius in meters */
		getRadius: function () {
			return this.radius;
		},

		/**
		 * Sets the radius, which is the maximum allowed distance to the
		 * anchor position
		 * @param {Number} pRadius - the radius in meters
		 */
		setRadius: function (pRadius) {
			const changed = this.radius !== pRadius;
			this.radius = pRadius;
			if (changed) {
				this.observable.fire('change', this);
				if (this.enabled) {
					this.saveToServer();
				}
			}			
		},

		/** @returns {Boolean} whether the watch has been enabled */
		getEnabled: function () {
			return this.enabled;
		},

		/** @param {Boolean} pEnabled - enables or disables the watch */
		setEnabled: function (pEnabled) {
			const enabled = !this.enabled && !!pEnabled;
			const disabled = this.enabled && !pEnabled;
			this.enabled = !!pEnabled;
			if (enabled) {
				this.observable.fire('enable', this);
				this.saveToServer();
			}
			if (disabled) {
				this.observable.fire('disable', this);
			}
		},

		/** Removes the anchorWatch and notifies observers */
		removeAsync: async function () {
			this.enabled = false;
			const alarm = PiLot.Utils.Audio.Alarm.getInstance();
			alarm && alarm.stop();
			this.observable.fire('remove', this);
			await new PiLot.Service.Nav.AnchorWatchService().deleteAnchorWatchAsync();
		},

		/**
		 * Checks the distance of the current gps position to the center
		 * and fires the exeedDistance event, if the distance exceeds
		 * the radius. Also starts the alarm, event though I'm not 100%
		 * sure whether this really is the job of the Model.
		 * */
		checkDistance: function () {
			const currentPosition = this.gpsObserver.getLatestPosition();
			if (currentPosition && this.center && this.radius) {
				const distance = this.center.distanceTo(currentPosition.getLatLon());
				const alarmIndex = this.radius !== 0 ? AnchorWatch.alarms.findIndex(a => a[0] < distance / this.radius) : 0;
				if (alarmIndex !== this.alarmIndex) {
					PiLot.Utils.Audio.Alarm.getInstance().start(AnchorWatch.alarms[alarmIndex][1]);
					if (distance > this.radius) {
						this.observable.fire('exceedRadius', this);
					} else {
						this.observable.fire('belowRadius', this);
					}
					this.alarmIndex = alarmIndex;
				}
			}
		},

		saveToServer: function () {
			new PiLot.Service.Nav.AnchorWatchService().saveAnchorWatchAsync({
				latitude: this.center.lat,
				longitude: this.center.lon,
				radius: this.radius
			});
		}
	};

	/**
	 * A class representing a position at a certain time. This is used
	 * both for historic positions within a saved track, but also for
	 * recent ("current") positions, used to calculate current course, 
	 * speed etc.
	 * @param {Number} pUTC - timestamp im ms from epoc utc
	 * @param {Number} pBoatTime - timestamp in ms from epoc boatTime
	 * @param {Number} pLatitude - latitude in degrees
	 * @param {Number} pLongitude - longitude in degrees
	 * @param {Number} pTrackId - optional because it will not be available in all cases
	 * */
	 var TrackPoint = function (pUTC, pBoatTime, pLatitude, pLongitude, pTrackId) {
		this.utc = pUTC;
		this.boatTime = pBoatTime;
		this.latitude = pLatitude;
		this.longitude = pLongitude;
		this.trackId = pTrackId;
		this.latLon = null;
	}

	TrackPoint.prototype = {

		/**
		 * Allows to update all four values, however without further validation
		 * @param {Number} pUTC
		 * @param {Number} pBoatTime
		 * @param {Number} pLatitude
		 * @param {Number} pLongitude
		 */
		updateValues: function (pUTC, pBoatTime, pLatitude, pLongitude) {
			this.utc = pUTC;
			this.boatTime = pBoatTime;
			this.latitude = pLatitude;
			this.longitude = pLongitude;
			this.latLon = null;
		},

		/** Creates a duplicate of the track point */
		clone: function () {
			return new TrackPoint(this.utc, this.boatTime, this.latitude, this.longitude, this.trackId);
		},

		/**  @returns {Number} the utc timestamp in ms */
		getUTC: function () {
			return this.utc;
		},

		/** @returns {Number} utc timestamp in seconds as integer */
		getUTCSeconds: function () {
			return Math.round(this.utc / 1000);
		},

		/** @returns {Number} BoatTime timestamp in ms */
		getBoatTime: function () {
			return this.boatTime;
		},

		/** @returns {Number} BoatTime timestamp in seconds as integer */
		getBoatTimeSeconds: function () {
			return Math.round(this.boatTime / 1000);
		},

		/** @returns {Number} The difference between boatTime and utc in minutes */
		getBoatTimeOffset: function () {
			return (this.boatTime - this.utc) / 60000;
		},

		/** @returns {Number} The latitude as float */
		getLatitude: function () {
			return this.latitude;
		},

		/** @returns {Number} The longitude as float */
		getLongitude: function () {
			return this.longitude;
		},

		/** @returns {Number[]} an array with latitude, longitude. Useful for leaflet */
		getLatLng: function () {
			return [this.latitude, this.longitude];
		},

		/** @returns {LatLon} a geodesy LatLon object */
		getLatLon: function () {
			if (this.latLon === null) {
				this.latLon = new LatLon(this.latitude, this.longitude, LatLon.datum.WGS84);
			}
			return this.latLon;
		},

		/** @returns {Number} the trackID, which can be null for not persisted positions */
		getTrackId: function(){
			return this.trackId;
		},

		/** @returns {Number[]} an array of utc, boatTime, lat, lng */
		toArray: function () {
			return [this.utc, this.boatTime, this.latitude, this.longitude];
		},

		/** @returns {TrackPoint} - a copy of the TrackPoint */
		clone: function(){
			return new TrackPoint(this.utc, this.boatTime, this.latitude, this.longitude);
		}
	};

	/**
	 * Creates a TrackPoint from data, which can either be an array with 
	 * [utc, boatTime, latitude, longitude] or an object with those
	 * fields.
	 * @param {(Object|Array)} pData
	 * @returns	{TrackPoint} the track point or null for invalid values
	 */
	TrackPoint.fromData = function (pData) {
		let result = null;
		if (pData) {
			let data = Array.isArray(pData) ? 
				{
					utc: pData[0],
					boatTime: pData[1],
					latitude: pData[2],
					longitude: pData[3]
				}
				: pData;
			if (
				RC.Utils.isNumeric(data.utc)
				&& RC.Utils.isNumeric(data.boatTime)
				&& RC.Utils.isNumeric(data.latitude)
				&& RC.Utils.isNumeric(data.longitude)
			) {
				result = new TrackPoint(data.utc, data.boatTime, data.latitude, data.longitude, data.trackId);
			} else {
				PiLot.log(`invalid data when reading GPSData: ${pData}, 3`);
			}
		}
		return result;
	};

	/**
	 * Class Tack 
	 * A Track consists of track points
	 * */
	var Track = function () {
		this.id = null;
		this.trackPoints = null;  // array of TrackPoints
		this.boat = null;
		this.startUTC = null;
		this.endUTC = null;
		this.startBoatTime = null;
		this.endBoatTime = null;
		this.distance = null;		// the distance as it was persisted with the track
		this.initialize();
	};

	Track.prototype = {

		initialize: function () {
			this.trackPoints = new Array();
		},

		getId: function () {
			return this.id;
		},

		setId: function (pId) {
			this.id = pId;
		},

		/** @param {String} pBoat */
		setBoat: function(pBoat){
			this.boat = pBoat;
		},

		/** @returns {String} */
		getBoat: function(){
			return this.boat;
		},

		/**
		 * Allows to set start and end explicitly, which is useful if the track
		 * was loaded without trackpoints. If there are trackpoints, getStartUTC
		 * etc. will ignore the values set explicitly but return the effective
		 * start and end as deducted from the trackpoints.
		 * */
		setStartEnd: function (pStartUTC, pEndUTC, pStartBoatTime, pEndBoatTime) {
			this.startUTC = pStartUTC;
			this.endUTC = pEndUTC;
			this.startBoatTime = pStartBoatTime;
			this.endBoatTime = pEndBoatTime;
		},

		/** @returns {Number} the track start in milliseconds or the explicitly set value, if there are no trakpoints */
		getStartUTC: function () {
			return this.hasTrackPoints() ? this.getFirstTrackPoint().getUTC() : this.startUTC;
		},

		/** @returns {Number} the track end in milliseconds or the explicitly set value, if there are no trakpoints */
		getEndUTC: function () {
			return this.hasTrackPoints() ? this.getLastTrackPoint().getUTC() : this.endUTC;
		},

		/** @returns {Number} the boatTime in milliseconds or the explicitly set value, if there are no trakpoints */
		getStartBoatTime: function () {
			return this.hasTrackPoints() ? this.getFirstTrackPoint().getBoatTime() : this.startBoatTime;
		},

		/** @returns {Number} the boatTime milliseconds or the explicitly set value, if there are no trakpoints */
		getEndBoatTime: function () {
			return this.hasTrackPoints() ? this.getLastTrackPoint().getBoatTime() : this.endBoatTime;
		},

		/**
		 * Adds a track point to the trackPoints array
		 * @param {TrackPoint} pTrackPoint
		 * */
		addTrackPoint: function (pTrackPoint) {
			if (pTrackPoint !== null) {
				this.trackPoints.push(pTrackPoint);
				if(this.trackPoints.length > 1){
					this.distance = this.getDistance() + this.trackPoints[this.trackPoints.length - 2].getLatLon().distanceTo(pTrackPoint.getLatLon());
				} else{
					this.distance = 0;
				}
			}
		},

		/**
		 * This updates the last element in the trackPoints list, if there is any. If not, it adds an item.
		 * @param {Number} pUTC
		 * @param {Number} pBoatTime
		 * @param {Number} pLatitude
		 * @param {Number} pLongitude
		 * */
		updateLastTrackPoint: function (pUTC, pBoatTime, pLatitude, pLongitude) {
			if (this.trackPoints.length > 0) {
				const lastTrackPoint = this.getLastTrackPoint();
				let previousLastSegmentLength = null;
				let beforeLastTrackPoint = null;
				if(this.trackPoints.length > 1){
					beforeLastTrackPoint = this.getTrackPointAt(this.trackPoints.length - 2);
					previousLastSegmentLength = lastTrackPoint.getLatLon().distanceTo(beforeLastTrackPoint.getLatLon());
				}
				lastTrackPoint.updateValues(pUTC, pBoatTime, pLatitude, pLongitude);
				if(beforeLastTrackPoint){
					this.distance = this.getDistance() - previousLastSegmentLength + lastTrackPoint.getLatLon().distanceTo(beforeLastTrackPoint.getLatLon());
				} else{
					this.distance = 0;
				}
			} else {
				this.addTrackPoint(TrackPoint.fromData([pUTC, pBoatTime, pLatitude, pLongitude]));
				this.distance = 0;
			}
		},

		/**
		 * Crops positions before pStartTimeUTC or after pEndTimeUTC
		 * @param {Number} pStartTimeUTC - lower limit in seconds from epoc utc
		 * @param {Number} pEndTimeUTC - upper limit in seconds from epoc utc
		 * */
		cropTrackPoints: function (pStartTimeUTC, pEndTimeUTC) {
			let hasChanged = false;
			let utcSeconds;
			for (let i = this.trackPoints.length - 1; i >= 0; i--) {
				utcSeconds = this.trackPoints[i].getUTCSeconds();
				if (
					((pStartTimeUTC !== null) && (utcSeconds < pStartTimeUTC))
					|| ((pEndTimeUTC !== null) && (utcSeconds > pEndTimeUTC))
				) {
					this.trackPoints.splice(i, 1);
					hasChanged = true;
				}
			};
			return hasChanged;
		},

		/** @returns {Boolean} */
		hasTrackPoints: function () {
			return this.trackPoints.length > 0;
		},

		/** @returns {TrackPoint[]} */
		getTrackPoints: function () {
			return this.trackPoints;
		},

		/** @returns {Number} */
		getTrackPointsCount: function(){
			return this.track.length;
		},

		/** @returns {Number[][]} - an array containing arrays with lat, lng */
		getRawPositions: function () {
			return this.trackPoints.map(p => p.getLatLng());
		},

		/** @returns {TrackPoint} - the track point at pIndex or null, if the index is out of bounds. */
		getTrackPointAt: function (pIndex) {
			let result = null;
			if ((this.trackPoints.length > 0) && (pIndex >= 0) && (pIndex < this.trackPoints.length)) {
				result = this.trackPoints[pIndex];
			}
			return result;
		},

		/** @returns {TrackPoint} - the first position of the track or null, if the track has zero length */
		getFirstTrackPoint: function () {
			return this.getTrackPointAt(0);
		},

		/** @returns {TrackPoint} - the last position of the track or null, if the track has zero length */
		getLastTrackPoint: function () {
			return this.getTrackPointAt(this.trackPoints.length - 1);
		},

		/** @returns {Number} - the number of track points in the track */
		getTrackPointsCount: function () {
			return this.trackPoints !== null ? this.trackPoints.length : 0;
		},

		/** @returns {Number} - either the assigned the distance or the calculated distance */
		getDistance: function() {
			return this.distance !== null ? this.distance : this.calculateDistance();
		},

		/** @param {Number} pDistance - the distance in meters */
		setDistance: function (pDistance) {
			this.distance = pDistance;
		},

		/** @returns {Number} - the calculated total distance of the track in meters */
		calculateDistance: function () {
			let result = 0;
			let latLon0, latLon1;
			if (this.trackPoints.length > 0) {
				for (let i = 0; i < this.trackPoints.length - 1; i++) {
					latLon0 = this.trackPoints[i].getLatLon();
					latLon1 = this.trackPoints[i + 1].getLatLon();
					result += latLon0.distanceTo(latLon1);
				}
			}
			return result;
		},

		/**
		 * Compares two tracks for sorting, having the track that ends earlier first
		 * (we need to look at the end, so that we can find the current track by taking
		 * the last one)
		 */
		compareTo: function (pOther) {
			let result;
			if (this.hasTrackPoints()) {
				if (pOther.hasTrackPoints()) {
					result = this.getLastTrackPoint().getUTC() - pOther.getLastTrackPoint().getUTC();
				} else {
					result = 1;
				}
			} else {
				if (pOther.hasTrackPoints()) {
					result = -1;
				} else {
					result = 0;
				}
			}
			return result;
		}
	};

	/**
	 * Creates a track object based on a serialized track object. Returns null, if the 
	 * pData is invalid. Start/end date and distance will only be set explicitly, if
	 * there is no trackPointsArray delivered.
	 * @param {Object} pData - an object with id, boat, distance, startUtc, endUtc, startBoatTime, endBoatTime, trackPointsArray
	 */
	Track.fromData = function (pData) {
		let result = null;
		if (pData) {
			result = new Track();
			result.setId(pData.id || null);
			result.setBoat(pData.boat);
			if (Array.isArray(pData.trackPointsArray) && (pData.trackPointsArray.length > 0)) {
				pData.trackPointsArray.forEach((value, index, array) => {
					if (Array.isArray(value) && value.length == 4) {
						let trackPoint = TrackPoint.fromData(value);
						result.addTrackPoint(trackPoint);
					} else {
						PiLot.log(`invalid data when reading track: ${value}, expected was an array of 4 items`, 0);
					}
				});
			} else {
				result.setDistance(pData.distance);
				result.setStartEnd(pData.startUtc, pData.endUtc, pData.startBoatTime, pData.endBoatTime);
			}
		}
		return result;
	};

	/**
	 * Creates a track object based on an array of arrays. Returns null, if the 
	 * pData is invalid
	 * @param {Number[][]} pData - an array of arrays with utc, boatTime, lat, lon
	 */
	Track.fromArray = function (pData) {
		let result = null;
		if (pData) {
			result = new Track();
			if ((pData !== null) && Array.isArray(pData)) {
				pData.forEach((value, index, array) => {
					if (Array.isArray(value) && value.length == 4) {
						let trackPoint = TrackPoint.fromData(value);
						result.addTrackPoint(trackPoint);
					} else {
						PiLot.log(`invalid data when reading track: ${value}, expected was an array of 4 items`);
					}
				});
			} else {
				PiLot.log('No data returned for Track', 1);
			}
		}
		return result;
	};

	/**
	 * Creates a track from a CSV String
	 * @param {String} pCSVString - One line per record, as created by the CSV Export
	 * @param {Number} pUtcOffset - a utc offset in hours that will be used to overwrite the boatTime.
	 * @param {String} pBoat - the name of the boat
	 * */
	Track.fromCSV = function (pCSVString, pUtcOffset, pBoat) {
		const result = { track: new Track(), success: true, message: '' };
		result.track.setBoat(pBoat);
		const lines = pCSVString.split('\n');
		let valuesArray;
		for (let aLine of lines) {
			valuesArray = aLine.split('\t');
			if (valuesArray.length == 5) {
				if (
					RC.Utils.isNumeric(valuesArray[0])		// UTC
					&& RC.Utils.isNumeric(valuesArray[1])	// BoatTime
					&& RC.Utils.isNumeric(valuesArray[3])	// latitude
					&& RC.Utils.isNumeric(valuesArray[4])	// longitude
				) {
					const utc = Number(valuesArray[0]);
					let boatTime = pUtcOffset !== null ? utc + (pUtcOffset * 3600 * 1000) : Number(valuesArray[1]);
					const trackPoint = new TrackPoint(utc, boatTime, Number(valuesArray[3]), Number(valuesArray[4]));
					result.track.addTrackPoint(trackPoint);
				}
			}
		}
		return result;
	};

	/**
	 * Creates a track from a TCX XML String
	 * @param {String} pTCXString - The xml
	 * @param {Number} pUtcOffset - a utc offset in hours that will be used to set boatTime
	 * @param {String} pBoat - the name of the boat
	 * */
	Track.fromTCX = function (pTCXString, pUtcOffset) {
		const result = { track: new Track(), success: true, message: '' };
		result.track.setBoat(pBoat);
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(pTCXString, "text/xml");
			const trackPoints = doc.documentElement.getElementsByTagName('Trackpoint');
			let elementsLat, elementsLon, elementsTime;
			let lat, lon, timeString, utc, boatTime;
			for (trackPoint of trackPoints) {
				elementsLat = trackPoint.getElementsByTagName("LatitudeDegrees");
				elementsLon = trackPoint.getElementsByTagName("LongitudeDegrees");
				elementsTime = trackPoint.getElementsByTagName("Time");
				if ((elementsLat.length === 1) && (elementsLon.length === 1) && (elementsTime.length === 1)) {
					timeString = elementsTime[0].innerHTML;
					utc = DateTime.fromISO(timeString, { zone: 'utc' });
					if (utc) {
						boatTime = pUtcOffset ? utc.plus({ hours: pUtcOffset }) : utc;
						lat = elementsLat[0].innerHTML;
						lon = elementsLon[0].innerHTML;
						if (RC.Utils.isNumeric(lat) && RC.Utils.isNumeric(lon)) {
							result.track.addTrackPoint(new TrackPoint(utc.toMillis(), boatTime.toMillis(), Number(lat), Number(lon)));
						}
					}
				}
			}
		} catch (ex) {
			result.track = null;
			result.success = false;
			result.message = ex;
		}
		return result;
	};

	/**
	 * A track segment is a specific part of a track, corresponding to a certain 
	 * TrackSegmentType. An example would be the fastest mile of a certain track.
	 * The object does not hold a reference to the track, but only to its id, so
	 * it can exist without the track having been loaded.
	 * @param {Number} pTrackId - the id of the track this belongs to
	 * @param {PiLot.Model.Nav.TrackSegmentType} pType - the type of the segment
	 * @param {DateTime} pStartUTC - the beginning of the segment in UTC
	 * @param {DateTime} pEndUTC - the end of the segment in UTC
	 * @param {DateTime} pStartBoatTime - the beginning of the segment in BoatTime
	 * @param {DateTime} pEndBoatTime - the end of the segment in BoatTime
	 * @param {Number} pDistance - the distance covered in meters
	 */
	var TrackSegment = function (pTrackId, pType, pStartUTC, pEndUTC, pStartBoatTime, pEndBoatTime, pDistance, pSpeed, pBoat, pYearRank, pOverallRank) {
		this.trackId = pTrackId;
		this.type = pType;
		this.startUTC = pStartUTC;
		this.endUTC = pEndUTC;
		this.startBoatTime = pStartBoatTime;
		this.endBoatTime = pEndBoatTime;
		this.distance = pDistance;
		this.speed = pSpeed;
		this.boat = pBoat;
		this.yearRank = pYearRank;
		this.overallRank = pOverallRank;
		this.initialize();
	};

	TrackSegment.prototype = {

		initialize: function () { },

		/** @returns {Number} */
		getTrackId: function () {
			return this.trackId;
		},

		/** @returns {PiLot.Model.Nav.TrackSegmentType} */
		getType: function () {
			return this.type;
		},

		/** @returns {DateTime} */
		getStartUTC: function () {
			return this.startUTC;
		},

		/** @returns {DateTime} */
		getEndUTC: function () {
			return this.endUTC;
		},

		/** @returns {DateTime} */
		getStartBoatTime: function () {
			return this.startBoatTime;
		},

		/** @returns {DateTime} */
		getEndBoatTime: function () {
			return this.endBoatTime;
		},

		/**
		 * @returns {Number} - the total distance in meters. This can be more
		 * than the distance defined by the TrackSegmentType, because it's based
		 * on actual TrackPoints. 
		 * */
		getDistance: function() {
			return this.distance;
		},

		/** @returns {Number} the average speed for the segment in m/s */
		getSpeed: function () {
			return this.speed;
		},

		/** @returns {String} the name of the boat */
		getBoat: function () {
			return this.boat;
		},

		/** @returns {Number} the rank of this section per type, boat and year */
		getYearRank: function(){
			return this.yearRank;
		},

		/** @returns {Number} the rank of this section per type and boat */
		getOverallRank: function(){
			return this.overallRank;
		}
	};

	/**
	 * A track segment type, describing a certain type of track segment, e.g. the fastest mile of a track
	 * @param {Number} pId
	 * @param {Number} pDuration - the minimal duration in seconds, e.g. for fastest 12 minutes
	 * @param {Number} pDistance - the minimal distance in meters, e.g. for fastest mile
	 * @param {Object} pLabels - labels in different languages as object
	 */
	var TrackSegmentType = function (pId, pDuration, pDistance, pLabels) {
		this.id = pId;
		this.duration = pDuration;
		this.distance = pDistance;
		this.labels = pLabels;
		this.initialize();
	};

	TrackSegmentType.prototype = {

		initialize: function () { },

		getId: function () {
			return this.id;
		},

		getDuration: function () {
			return this.duration;
		},

		getDistance: function() {
			return this.distance;
		},

		getLabel: function (pLanguage) {
			if (this.labels && pLanguage in this.labels) {
				return this.labels[pLanguage]
			} else return this.name;
		},

		/** Saves the TrackSegmentType back to the server */
		saveAsync: async function () {
			const result = await PiLot.Service.Nav.TrackService.getInstance().saveTrackSegmentTypeAsync(this);
			this.id = result.data;
		},

		/** Deletes the TrackSegmentType from the server */
		deleteAsync: async function () {
			return await PiLot.Service.Nav.TrackService.getInstance().deleteTrackSegmentTypeAsync(this);
		},

		/** Compares two types for sorting, having the shorter first, and types with distance first */
		compareTo: function (pOther) {
			let result = 0;
			if (this.distance) {
				if (pOther.getDistance()) {
					result = this.distance - pOther.getDistance();
				} else {
					result = -1;
				}
			} else {
				if (pOther.getDuration()) {
					result = this.duration - pOther.getDuration();
				} else {
					result = 1;
				}
			}
			return result;
		}
	};

	/**
	 * Creates a new TrackSegmentType based on a data object. Returns null, if required attributes are missing.
	 * @param {Object} pData - object with at least id, criterion
	 */
	TrackSegmentType.fromData = function (pData) {
		let result = null;
		let labels = pData.labels;
		if (typeof labels === "string") {
			labels = JSON.parse(labels);
		}
		if (pData.id) {
			result = new TrackSegmentType(
				pData.id, 
				pData.duration,
				pData.distance,
				labels || {}
			);
		}
		return result;
	};

	/** 
	 * Class TrackObserver, takes a track, and makes sure the track is continuously 
	 * updated by changing/adding the latest track points and calling crop to remove 
	 * old track points, allowing the track to have a maximum length, which is useful 
	 * when showing it on the map.
	 * Use just one instance and change the track if necessary, as each instance
	 * will add callbacks to the GPSObserver instance (that unfortunately can't be
	 * removed).
	 * @param {PiLot.Model.Nav.Track} pTrack - The track to update. Can be set later. 
	 * @param {PiLot.Model.Nav.GPSObserver} pGpsObserver - A custom GPSObserver, if not the default instance should be used
	 *  */
	var TrackObserver = function (pTrack = null, pGPSObserver = null) {
		this.track = pTrack;
		this.gpsObserver = pGPSObserver;
		this.trackSeconds = null;
		this.addPositionThreshold = { seconds: 9.5, meters: 5 };		// the threshold to add new positions to the track
		this.updatePositionThreshold = { seconds: 0.5, meters: 2 };		// the threshold to update the latest position
		this.lastPosition = null;										// PiLot.Model.Nav.TrackPoint
		this.cropInterval = null;
		this.cropIntervalMS = 10000;
		this.observable = null;
		this.initialize();
	};

	TrackObserver.prototype = {

		initialize: function () {
			this.observable = new PiLot.Utils.Common.Observable(['addTrackPoint', 'cropTrackPoints', 'changeLastTrackPoint', 'loadTrack']);
			this.ensureTrackAsync().then(()=>{
				this.gpsObserver = this.gpsObserver || GPSObserver.getInstance();
				this.gpsObserver.on('recieveGpsData', this, this.gpsObserver_recieveGpsData.bind(this));
				this.start();
			});			
		},

		/**
		 * Calls all observers that registered for pEvent. 
		 * @param {String} pEvent
		 * @param {any} pArgs
		 * */
		notifyObservers: function (pEvent, pArgs) {
			this.observable.fire(pEvent, pArgs);
		},

		/**
		 * Registers an observer which will be called when pEvent happens 
		 * @param {String} pEvent - one of ['addTrackPoint', 'cropTrackPoints', 'changeLastTrackPoint', 'loadTrack']
		 * @param {Function} pCallback
		 * */
		on: function(pEvent, pObserver, pFunction){
			this.observable.addObserver(pEvent, pObserver, pFunction);
		},

		/**
		 * @param {String} pEvent 
		 * @param {Object} pObserver 
		 */
		off: function(pEvent, pObserver){
			this.observable.removeObserver(pEvent, pObserver);
		},

		/// this is fired on the cropInterval timer, and just calls crop on the track
		/// we pass null as end time, which quick-fixes an issue when client- and server
		/// time are not in sync
		cropTimer_interval: function () {
			if ((this.track != null) && (this.trackSeconds !== null)) {
				if(this.track.cropTrackPoints(PiLot.Utils.Common.BoatTimeHelper.getCurrentBoatTime().utcNowUnix() - this.trackSeconds, null)){
					this.notifyObservers('cropTrackPoints', { track:this.track });
				}
			}
		},

		/// this handles new gps data. If the time/local difference
		/// to the latest position is above threshold, a new position
		/// will be added, otherwise the latest position will be updated
		gpsObserver_recieveGpsData: async function (pArgs) {
			await this.ensureTrackAsync(pArgs.trackPoints)
			if (this.track != null) {
				for (let i = 0; i < pArgs.trackPoints.length; i++) {
					if ((pArgs.trackPoints[i].latitude !== null) && (pArgs.trackPoints[i].longitude !== null)) {
						let deltaTMs = null;
						if (this.lastPosition !== null && this.lastPosition.utc !== null && pArgs.trackPoints[i].utc !== null) {
							deltaTMs = pArgs.trackPoints[i].utc - this.lastPosition.utc;
						}
						let deltaX = null;
						if (this.lastPosition !== null && this.lastPosition.getLatLon() !== null && pArgs.trackPoints[i].getLatLon() !== null) {
							deltaX = pArgs.trackPoints[i].getLatLon().distanceTo(this.lastPosition.getLatLon());
						}
						if (
							(this.lastPosition === null)
							|| ((deltaTMs > this.addPositionThreshold.seconds * 1000) && (deltaX > this.addPositionThreshold.meters))
						) {
							this.track.addTrackPoint(pArgs.trackPoints[i].clone());
							this.lastPosition = pArgs.trackPoints[i];
							this.notifyObservers('addTrackPoint', {track:this.track, trackPoint: pArgs.trackPoints[i] });
						} else {
							if ((deltaTMs > this.updatePositionThreshold.seconds) && (deltaX > this.updatePositionThreshold.meters)) {
								this.track.updateLastTrackPoint(pArgs.trackPoints[i].utc, pArgs.trackPoints[i].boatTime, pArgs.trackPoints[i].latitude, pArgs.trackPoints[i].longitude);
								this.notifyObservers('changeLastTrackPoint', { track:this.track, trackPoint:pArgs.trackPoints[i] });
							} 
						}
					}
				}
			} 
		},

		ensureTrackAsync: async function(pTrackPoints = null){
			if(
				(this.track === null)
				|| (pTrackPoints !== null && pTrackPoints.some((tp) => {return (tp.getTrackId() !== null && tp.getTrackId() !== this.track.getId())}))
			){
				this.track = await PiLot.Service.Nav.TrackService.getInstance().loadCurrentTrackAsync();
				this.notifyObservers('loadTrack', { track:this.track });
			}
		},

		/** @param {Number} pTrackSeconds - the maximal duration in seconds of the track to keep when cropping old positions  */
		setTrackSeconds: function (pTrackSeconds) {
			this.trackSeconds = pTrackSeconds;
		},

		/** @param {PiLot.Model.Nav.Track} pTrack - the track to update with live data */ 
		setTrack: function (pTrack) {
			this.track = pTrack;
		},

		/** @returns {PiLot.Model.Nav.Track} */
		getTrack: function(){
			return this.track;
		},

		/** @returns {Boolean} whether we have a track */
		hasTrack: function(){
			return !!this.track;
		},

		/** starts the interval that crops the track if necessary */
		start: function(){
			this.cropInterval = this.cropInterval || setInterval(this.cropTimer_interval.bind(this), this.cropIntervalMS);
		},

		/** stops the crop interval. Call this, as soon as the track observer is unloaded */
		stop: function(){
			this.cropInterval && window.clearInterval(this.cropInterval);
			this.cropInterval = null;
		}
	}

	var trackObserverInstance = null;
	
	TrackObserver.getInstance = function(){
		if(trackObserverInstance === null){
			trackObserverInstance =  new TrackObserver();
		}
		trackObserverInstance.start();
		return trackObserverInstance;
	}

	/** Returns whether there is a TrackObserver instance, without creating one */
	TrackObserver.hasInstance = function () {
		return !!trackObserverInstance;
	}

	/** 
	 *  the GPSObserver observes the gps and notifies anyone who is interested
	 *  as soon as a new gps position is available
	 *  expects a BoatTime, used to fix client offset errors. If none is passed,
	 *  it will be requested directly from BoatTime.
	 *  @param {Object} pOptions: {intervalMs, calculationRange, autoStart}
	 *  @param {Object} pBoatTime: if you have a BoatTime at hand, pass it, otherwise it's ok too
	 *  */
	var GPSObserver = function (pOptions, pBoatTime = null) {
		const config = PiLot.Config.Nav.GPSObserver;
		// fields
		this.interval = null;
		this.autoStart = true;
		this.intervalMs = config.intervalMS;				// the interval for querying the server for data
		this.calculationRange = config.calculationRange;	// the number of seconds to calculate speed / course
		this.latestPositions = new Array();					// will keep GPSRecords for the most recent positions
		this.maxPositions = 10;								// the number of latest positions to keep in memory
		this.maxDataAgeSeconds = config.maxDataAgeSeconds;	// the maximum age of gpsData. If the latest position is older, outdatedGpsData will be fired
		this.currentSOG = null;
		this.currentCOG = null;
		this.observable = null;
		// init
		this.readOptions(pOptions);
		this.initialize();		
	};

	GPSObserver.prototype = {
		
		/**
		 * tries to get values from pOptions and uses them to override preset default values.
		 * intervalMs: The interval in miliseconds used to poll data
		 * calculationRange: the interval in seconds to use when calculating speed / cog
		 * */
		readOptions: function (pOptions) {
			if (pOptions) {
				this.intervalMs = pOptions.intervalMs || this.intervalMs;
				this.calculationRange = pOptions.calculationRange || this.calculationRange;
				if (pOptions.autoStart === false) {
					this.autoStart = false;
				}
			}
		},

		/** prepares everything and starts the data fetching process */
		initialize: function () {
			this.observable = new PiLot.Utils.Common.Observable(['recieveGpsData', 'outdatedGpsData']);
			if (this.autoStart) {
				this.start();
			}
		},

		/** calls all observers that registered for pEvent. */
		notifyObservers: function (pEvent, pArgs) {
			this.observable.fire(pEvent, pArgs);
		},

		/**
		 * Registers an observer which will be called when pEvent happens 
		 * @param {String} pEvent - 'recieveGpsData', 'outdatedGpsData'
		 * @param {Function} pCallback - Callback function(args: {sender, trackPoints})
		 * */
		on: function(pEvent, pObserver, pFunction){
			this.observable.addObserver(pEvent, pObserver, pFunction);
		},

		/**
		 * starts fetching the data. We don't start the inverval yet, as the
		 * first request against the Positions api might take a moment. Therefore 
		 * the interval is crated only in the success handler.
		 * */
		start: function () {
			if (this.interval === null) {
				this.fetchDataAsync();
			}
		},

		/**
		 * Stops fetching data.
		 */
		stop: function(){
			if (this.interval !== null) {
				window.clearInterval(this.interval);
				this.interval = null;
			}
		},

		/**
		 * Removes all observers for all events
		 * */
		clearObservers: function(){
			this.observable.clearObservers();
		},

		/**
		 * makes sure we have an interval for fetching the data. The Interval is not
		 * started immediately in order to avoid too many requests against a service
		 * which might need some time to wake up
		 * */
		ensureInterval: function () {
			if (this.interval === null) {
				this.interval = window.setInterval(this.fetchDataAsync.bind(this), this.intervalMs);
			}
		},

		/** reads the position data from the API */
		fetchDataAsync: async function () {
			const positions = await this.loadLatestTrackPointsAsync();
			this.fetchDataSuccess(positions);
		},

		/**
		* Loads the latest positions from the server and returns an array of GPSRecords
		* or an empty array if we don't get any valid data. We use the timestamp of the
	    * last record we got, or just this.maxDataAgeSeconds into the past
		* */
		loadLatestTrackPointsAsync: async function () {
			let lastTimestamp;
			if (this.latestPositions.length > 0) {
				lastTimestamp = this.latestPositions[0].getUTC();
			} else {
				const boatTime = PiLot.Utils.Common.BoatTimeHelper.getCurrentBoatTime();
				lastTimestamp = (boatTime.utcNowUnix() - this.maxDataAgeSeconds) * 1000;
			}
			const json = await PiLot.Service.Common.ServiceHelper.getFromServerAsync(`/Position?startTime=${lastTimestamp.toFixed(0)}`);
			const result = new Array();
			if (Array.isArray(json)) {
				for (let i = 0; i < json.length; i++) {
					const trackPoint = TrackPoint.fromData(json[i]);
					if(trackPoint){
						result.push(trackPoint);
					}					
				}
			}
			return result;
		},

		/// success handler, adds the latest positions to recentPositions and
		/// calls onGpsDataChanged for all observers, if the data is valid
		fetchDataSuccess: function (pTrackPoints) {
			this.ensureInterval();
			if (pTrackPoints !== null && pTrackPoints.length > 0) {
				for (let i = 0; i < pTrackPoints.length; i++) {
					this.latestPositions.unshift(pTrackPoints[i]);
				}
				this.cropTrackPoints();
				this.calculateSpeedAndCourse();
				if (!this.checkOutdatedData()) {
					this.notifyObservers('recieveGpsData', {sender:this, trackPoints: pTrackPoints});
				}
			}
			else {
				this.checkOutdatedData();
				PiLot.log('GPSObserver.fetchData: invalid data recieved, gpsRecords was null or empty', 2);
			}
		},

		/// this checks wether the oldest valid data is older than maxDataAgeSeconds. If so,
		/// if fires the outdatedGpsData event, passing along the latest data timestamp.
		/// returns true, if the data is outdated.
		checkOutdatedData: function () {
			var result = false;
			var latestPosition = this.getLatestPosition(this.maxDataAgeSeconds);
			if (latestPosition === null) {
				latestPosition = this.getLatestPosition(null);
				var latestTimestamp = latestPosition !== null ? latestPosition.utc : null;
				this.notifyObservers('outdatedGpsData', latestTimestamp);
				result = true;
			}
			return result;
		},

		/**
		 * Returns the latest position record, if it's not older than pMaxSeconds or pMaxAgeSeconds is null. 
		 * @param {Number} pMaxSecondsOld
		 * @returns {PiLot.Model.Nav.TrackPoint}
		 * */
		getLatestPosition: function (pMaxAgeSeconds = null) {
			var result = null;
			if (this.latestPositions.length > 0) {
				const utcNowMs = PiLot.Utils.Common.BoatTimeHelper.getCurrentBoatTime().utcNowMillis();
				if ((pMaxAgeSeconds === null) || (this.latestPositions[0].utc >= utcNowMs - (pMaxAgeSeconds * 1000))) {
					result = this.latestPositions[0];
				}
			}
			return result;
		},

		/// gets the position which is not the latest position, but not more than pPeriodSeconds 
		/// before the latest position. Returns null, if there is no such record
		getRecentPosition: function (pPeriodSeconds) {
			var result = null;
			if (this.latestPositions.length > 1) {
				var minTimeMs = this.latestPositions[0].utc - (pPeriodSeconds * 1000);
				for (var i = 1; i < this.latestPositions.length; i++) {
					if (this.latestPositions[i].utc >= minTimeMs) {
						if (this.latestPositions[i].utc < this.latestPositions[0].utc) {
							result = this.latestPositions[i];
						}
					} else {
						break;
					}
				}
			}
			return result
		},

		/// this makes sure the positions array is not longer than this.maxPositions. If
		/// it's longer, the oldest entries are cropped
		cropTrackPoints: function () {
			while (this.latestPositions.length > this.maxPositions) {
				this.latestPositions.pop();
			}
		},

		/// gets two positions used to calculate speed, course or vmg. returns
		/// an object with oldestPosition and latestPosition or null, if any of
		/// the two are null
		getTwoPositions: function(){
			var result = null;
			var oldestPosition = this.getRecentPosition(this.calculationRange);
			if (oldestPosition !== null) {
				var latestPosition = this.getLatestPosition(null);
				if (latestPosition !== null) {
					result = {oldestPosition: oldestPosition, latestPosition: latestPosition};
				}
			}
			return result;
		},

		/// Calculates SOG and COG based on the recent positions, and assigns them
		/// to respective instance variables
		calculateSpeedAndCourse: function () {
			var twoPositions = this.getTwoPositions();
			if (twoPositions !== null) {
				var p0 = twoPositions.oldestPosition.getLatLon();
				var p1 = twoPositions.latestPosition.getLatLon();
				var x = p0.distanceTo(p1); // distance in meters
				var cog = p0.initialBearingTo(p1);
				if (!Number.isNaN(cog) && (cog !== null)) {
					this.currentCOG = cog;
					PiLot.log('cog: ' + this.currentCOG, 3);
				}				
				var timeMs = twoPositions.latestPosition.utc - twoPositions.oldestPosition.utc;
				if (!Number.isNaN(timeMs) && !Number.isNaN(x)) {
					this.currentSOG = (x / timeMs * 1000) * 3.6 / 1.852;
					PiLot.log('sog: ' + this.currentSOG, 3);
				}
			} else {
				this.currentCOG = null;
				this.currentSOG = null;
			}
		},

		/// returns the latest speed over ground in knots, can be null
		getSOG: function () {
			return this.currentSOG;
		},

		/// returns the latest course over ground
		getCOG: function () {
			return this.currentCOG;
		},

		/**
		 * Calculates the VMC towards a target. 
		 * @param {LatLon} pTarget - Target as geodesy LatLon
		 * @returns {Number} vmc in knots or null, if we have no current position data
		*/ 
		getVMG: function(pTarget) {
			let result = null;
			const twoPositions = this.getTwoPositions();
			if (twoPositions != null) {
				const w0 = twoPositions.oldestPosition.latLon.distanceTo(pTarget);
				const w1 = twoPositions.latestPosition.latLon.distanceTo(pTarget);
				const distanceMadeGood = w0 - w1;
				const timeMs = twoPositions.latestPosition.utc - twoPositions.oldestPosition.utc;
				result = (distanceMadeGood / timeMs * 1000) * 3.6 / 1.852;
			}
			return result;
		}
	};

	var gpsObserverInstance = null;

	/** Singleton accessor returning the current instance of the GPSObserver object with a default settings */
	GPSObserver.getInstance = function () {
		if (gpsObserverInstance === null) {
			gpsObserverInstance = new GPSObserver();
		}
		gpsObserverInstance.start();
		return gpsObserverInstance;
	};

	/** Returns whether there is a GPSObserver instance, without creating one */
	GPSObserver.hasInstance = function () {
		return !!gpsObserverInstance;
	};

	/** 
	 * Stops the current instance of the GPS Observer, if there is any,
	 * and also removes ALL observers
	 * */
	GPSObserver.stopInstance = function(){
		if(gpsObserverInstance){
			gpsObserverInstance.stop();
			gpsObserverInstance.clearObservers();
		}
	};

	/**
	 * TileSource class, containing data about a tile source, having
	 * a local url, but also a remote url, from where the original 
	 * tiles are downloaded
	 * */
	var TileSource = function (pName, pOnlineUrl, pLocalUrl, pMinZoom, pMaxZoom) {
		this.name = pName;					/// the unique name of the tileSource
		this.onlineUrl = pOnlineUrl;		/// the online url where to grab the tiles from
		this.localUrl = pLocalUrl || null;	/// the local url of the tiles
		this.minZoom = pMinZoom;			/// the minimal zoom level for which we download images
		this.maxZoom = pMaxZoom;			/// the maximal zoom level for which we download images

	};

	TileSource.prototype = {

		/// accessors
		getName: function () {
			return this.name;
		},

		getOnlineUrl: function () {
			return this.onlineUrl;
		},

		getLocalUrl: function () {
			return this.localUrl;
		},

		getMinZoom: function () {
			return this.minZoom;
		},

		getMaxZoom: function () {
			return this.maxZoom;
		}

	};

	/**
	 * Creates a tileSource from a data object, expecting it to have 
	 * a Name, OnlineUrl, LocalUrl, MinZoom, MaxZoom (or the same in
	 * lowercase...)
	 * @param {Object} pData
	 */
	TileSource.fromData = function (pData) {
		let result = null;
		if (pData) {
			result = new TileSource(
				pData.Name || pData.name,
				pData.OnlineUrl || pData.onlineUrl,
				pData.LocalUrl || pData.localUrl,
				pData.MinZoom || pData.minZoom,
				pData.MaxZoom || pData.maxZoom
			);
		}
		return result;
	};

	/** @returns {Map} with key = tileSource.name, value = tileSource */
	var readAllTileSourcesAsync = async function () {
		const result = new Map();
		const response = await PiLot.Service.Common.ServiceHelper.getFromServerAsync('/TileSources');
		response.forEach(function (pItem) {
			let tileSource = TileSource.fromData(pItem);
			result.set(tileSource.getName(), tileSource);
		});
		return result;
	};
	
	/// Returning the class and static method definitions
	return {
		Route: Route,
		Poi: Poi,
		PoiCategory: PoiCategory,
		PoiFeature: PoiFeature,
		OsmPoi: OsmPoi,
		Waypoint: Waypoint,
		Track: Track,
		TrackSegment: TrackSegment,
		TrackSegmentType: TrackSegmentType,
		AnchorWatch: AnchorWatch,
		TrackPoint: TrackPoint,
		TrackObserver: TrackObserver,
		GPSObserver: GPSObserver,
		RouteObserver: RouteObserver,
		TileSource: TileSource,
		readAllTileSourcesAsync: readAllTileSourcesAsync,
		loadAllRoutesAsync: loadAllRoutesAsync,
		loadActiveRouteAsync: loadActiveRouteAsync,
		loadActiveRouteIdAsync: loadActiveRouteIdAsync,
		loadRouteAsync: loadRouteAsync,
		saveActiveRouteIdAsync: saveActiveRouteIdAsync
	};

})();