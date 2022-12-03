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
		this.observers = null;
		this.initialize();
	};

	/// Route Methods
	Route.prototype = {

		initialize: function () {
			this.waypoints = new Array();
			this.observers = RC.Utils.initializeObservers(['addWaypoint', 'deleteWaypoint', 'moveWaypoint', 'changeWaypoints', 'rename', 'delete']);
		},

		/// calls all observers that registered for pEvent. Passes a custom sender or this
		/// and pArg as parameters.
		notifyObservers: function (pSender, pEvent, pArg) {
			RC.Utils.notifyObservers(pSender || this, this.observers, pEvent, pArg);
		},

		/// registers an observer which will be called when pEvent happens
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		/// the handler for move actions of waypoints
		waypoint_move: function (pWaypoint, pSender) {
			this.totalDistance = null;
			this.notifyObservers(pSender, 'moveWaypoint', pWaypoint);
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

		/// sets a list of waypoints. This will expect the waypoints already
		/// having been added before, and only change the order of the waypoints,
		/// so use it carefully. It will not bind any observers to the waypoints.
		/// fires changeWaypoints
		setWaypoints: function (pWaypoints, pSender) {
			this.waypoints = pWaypoints;
			this.totalDistance = null;
			this.saveToServer(null);
			this.notifyObservers(pSender, 'changeWaypoints', this.waypoints);
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
		addWaypoint: function (pWaypoint, pSuppressSaving, pSender) {
			this.totalDistance = null;
			this.waypoints.push(pWaypoint);
			pWaypoint.on('move', this.waypoint_move.bind(this));
			if (!pSuppressSaving) {
				this.saveToServer(null);
			}
			this.notifyObservers(pSender, 'addWaypoint', pWaypoint);
		},

		/// adds a waypoint pWaypoint before pNextWaypoint
		addBefore: function (pWaypoint, pNextWaypoint, pSender) {
			this.totalDistance = null;
			const index = Math.max(this.waypoints.indexOf(pNextWaypoint), 0);
			this.waypoints.splice(index, 0, pWaypoint);
			pWaypoint.on('move', this.waypoint_move.bind(this));
			this.saveToServer(null);
			this.notifyObservers(pSender, 'addWaypoint', pWaypoint);
		},

		/// swaps two waypoints.
		swapWaypoints: function (pWaypoint1, pWaypoint2) {
			if (this.waypoints.includes(pWaypoint1) && this.waypoints.includes(pWaypoint2)) {
				const index1 = this.waypoints.indexOf(pWaypoint1);
				this.waypoints[this.waypoints.indexOf(pWaypoint2)] = pWaypoint1;
				this.waypoints[index1] = pWaypoint2;
				this.totalDistance = null;
				this.saveToServer(null);
				this.notifyObservers(this, 'changeWaypoints', this.waypoints);
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
		reverse: function (pSender) {
			this.waypoints.reverse();
			this.name = this.name.split(' - ').reverse().join(' - ');
			this.saveToServer(null);
			this.notifyObservers(pSender, 'rename', this);
			this.notifyObservers(pSender, 'changeWaypoints', this.waypoints);
		},

		/// deletes pWaypoint from the list of waypoints
		deleteWaypoint: function (pWaypoint, pSender) {
			this.totalDistance = null;
			let index = this.waypoints.indexOf(pWaypoint);
			if (index > -1) {
				this.waypoints.splice(index, 1);
			}
			this.notifyObservers(pSender, 'deleteWaypoint', pWaypoint);
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
			PiLot.Utils.Common.putToServerAsync(`/Routes`, serverObject).then(r => {
				this.routeId = r.data.routeId;
			});
		},

		/** Deletes the route from the server, and returns true, if deletion succeeded */
		deleteFromServerAsync: async function () {
			return PiLot.Utils.Common.deleteFromServerAsync(`/Routes/${this.routeId}`);
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
					result.addWaypoint(waypoint, true, null);
				}
			});
		}
		return result;
	};

	/**
	 * Loads the activeRouteId from the server
	 * */
	var loadActiveRouteIdAsync = async function () {
		return PiLot.Utils.Common.getFromServerAsync('/Settings/activeRouteId');
	};

	/**
	 * Saves the activeRouteId to the server
	 * @param {number} pRouteId
	 */
	var saveActiveRouteIdAsync = async function (pRouteId) {
		return PiLot.Utils.Common.putToServerAsync(`/Settings/activeRouteId?routeId=${pRouteId}`, null);
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
		const json = await PiLot.Utils.Common.getFromServerAsync(`/Routes/${pRouteId}`);
		const result = Route.fromData(json);
		return result;
	};

	/**
	 * Loads the list of all Routes from the server
	 * @returns {Array} - An array of routes
	 * */
	var loadAllRoutesAsync = async function () {
		const json = await PiLot.Utils.Common.getFromServerAsync(`/Routes`);
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
	 * @param {Number} id - not null
	 * @param {String} pTitle - not null
	 * @param {Number} pCategoryId - The ID of the category, not null
	 * @param {Number[]} pFeatureIds - The ids of all features this has, not null
	 * @param {Number} pLat - Latitude in degrees WGS84, not null
	 * @param {Number} pLon - Longitude in degrees WGS84, not null
	 * @param {DateTime} pValidFrom - Valid from in UTC, Luxon object, nullable
	 * @param {DateTime} pValidTo - Valid to in UTC, Luxon object, nullable
	 */
	var Poi = function (pId, pTitle, pCategoryId, pFeatureIds, pLat, pLon, pValidFrom, pValidTo) {
		this.id = pId;
		this.title = pTitle;
		this.categoryId = pCategoryId;
		this.featureIds = pFeatureIds;
		this.latLng = null;
		this.setLatLng(pLat, pLon);
		this.validFrom = pValidFrom;
		this.validTo = pValidTo;
		this.detailsLoaded = false;
		this.description = null;
		this.properties = null;
	};

	Poi.prototype = {

		initialize: function () { },

		getId: function () { return this.id; },
		setId: function (pId) { this.id = pId; },

		/// gets the Poi position as Leaflet LatLng object
		getLatLng: function () {
			return this.latLng;
		},

		/// sets the Poi coordinates based on latitude and longitude
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

		/** @returns {String} */
		getTitle: function () { return this.title; },

		/**  @param {String} pTitle */
		setTitle: function (pTitle) { this.title = pTitle; },

		/** @returns {Number} */
		getCategoryId: function () { return this.categoryId; },

		/** @param {Number} pCategoryId */
		setCategoryId: function (pCategoryId) { this.categoryId = pCategoryId; },

		/** @returns {Number[]} */
		getFeatureIds: function () { return this.featureIds; },

		/** @param {Number[]} pFeatureIds */
		setFeatureIds: function (pFeatureIds) { this.featureIds = pFeatureIds; },

		/** Loads the details from the server */
		loadDetailsAsync: async function () { },

		/** Saves the Poi back to the server */
		saveAsync: async function () { },

		/** Deletes the Poi */
		deleteAsync: async function () { }

	};

	/**
	 * Creates a Poi from an array, as it is delivered from the server.
	 * @param {Object[]} pData
	 */
	Poi.fromArray = function (pData) {
		let result = null;
		if (Array.isArray(pData)) {
			result = new Poi(
				pData[0],
				pData[1],
				pData[2],
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
	};

	/**
	* Loads Pois for a certain area, category and features from the server
    * @returns {PiLot.Model.Nav.Poi[]};
	* */
	var loadPoisAsync = async function (pMinLat, pMinLon, pMaxLat, pMaxLon, pCategories, pFeatures) {
		const result = [];
		const categories = pCategories.join(',');
		const features = pFeatures.join(',');
		const url = `/Pois?minLat=${pMinLat}&minLon=${pMinLon}&maxLat=${pMaxLat}&maxLon=${pMaxLon}&categories=${categories}&features=${features}`;
		const json = await PiLot.Utils.Common.getFromServerAsync(url);
		if (Array.isArray(json)) {
			for (let i = 0; i < json.length; i++) {
				const poi = Poi.fromArray(json[i]);
				if (poi) {
					result.push(poi);
				}
			}
		} else {
			PiLot.log('Did not get an array from Poi endpoint.', 0);
		}
		return result;
	};

	/// Class Waypoint, representing one waypoint being part of a track.
	/// The constructor expects the route, a geodesy LatLon object as pLatLong,
	/// and a string as title
	var Waypoint = function (pRoute, pLat, pLon, pName, pWaypointId = null) {
		this.route = pRoute;
		this.waypointId = pWaypointId;
		this.name = pName;
		this.latLon = null;
		this.setLatLon(pLat, pLon, true);
		this.observers = null;
		this.initialize();
	};

	Waypoint.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['move', 'delete', 'rename']);
		},

		/// calls all observers that registered for pEvent. Passes a custom sender or this
		/// and pArg as parameters.
		notifyObservers: function (pSender, pEvent, pArg) {
			RC.Utils.notifyObservers(pSender || this, this.observers, pEvent, pArg);
		},

		/// registers an observer which will be called when pEvent happens
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
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

		setName: function (pName, pSender) {
			var isRenamed = (pName !== this.name);
			this.name = pName;
			if (isRenamed) {
				this.notifyObservers(pSender, 'rename', this.name);
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
			this.notifyObservers(pSender, 'move');
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

	/// RouteObserver Class
	/// keeps track of the current leg, ETA, distance and bearings
	/// for waypoints. Options: autoCalculate: set to true, if vmg
	/// etc. should be calculated on each update, false if only on
	/// demand
	var RouteObserver = function(pRoute, pGPSObserver, pBoatTime, pOptions){
		this.route = pRoute;
		this.gpsObserver = pGPSObserver;
		this.boatTime = pBoatTime;
		this.latestPosition = null;
		this.waypointsLiveData = new Map();
		this.observers = null;
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
			var waypoints = this.route.getWaypoints()
			for(var i = 0; i < waypoints.length; i++){
				this.waypointsLiveData.set(waypoints[i], new WaypointLiveData());
			}
			if (this.gpsObserver !== null) {
				this.gpsObserver.on('recieveGpsData', this.gpsObserver_changed.bind(this));
			}
			this.observers = RC.Utils.initializeObservers(['recieveGpsData', 'changeLeg']);
			this.route.on('addWaypoint', this.route_addWaypoint.bind(this));
			this.route.on('moveWaypoint', this.route_moveWaypoint.bind(this));
		},

		/// calls all observers that registered for pEvent. Passes this
		/// and pArg as parameters.
		notifyObservers: function (pEvent, pArg) {
			RC.Utils.notifyObservers(this, this.observers, pEvent, pArg);
		},

		/// registers an observer which will be called when pEvent happens
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		route_addWaypoint: function (pRoute, pWaypoint) {
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
			this.notifyObservers('recieveGpsData', null);
		},

		/// re-calculates all data
		calculate: function () {
			if (this.gpsObserver !== null) {
				this.latestPosition = this.gpsObserver.getLatestPosition(null);
				this.ensureNextWPEvaluated();
				this.calculateVMG();
				this.calculateWaypointLiveData();
				this.calculateXTE();
			}
		},

		/// returns the next waypoint or null, if the next waypoint is unknown
		getNextWaypoint: function(){
			var result = null;
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
			var nextWaypoint = this.getNextWaypoint();
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
			let eta = this.boatTime.now();
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
						legMiles = PiLot.Utils.Common.metersToNauticalMiles(waypoint.distanceTo(this.latestPosition.latLon));
					} else if (i > 0 && !isPastWaypoint) {
						legMiles = PiLot.Utils.Common.metersToNauticalMiles(waypoint.distanceTo(waypoints[i - 1].latLon));
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

		/// gets the current VMG or null.
		getVMG: function () {
			return this.vmg;
		}
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

	/// a data class representing a single GPS Record which consists of a 
	/// UTC timestamp, a BoatTime timestamp (both in ms from epoc), a
	/// latitude and a longitude
	var GPSRecord = function (pUTC, pBoatTime, pLatitude, pLongitude) {
		this.utc = pUTC;
		this.boatTime = pBoatTime;
		this.latitude = pLatitude;
		this.longitude = pLongitude;
		this.latLon = null;
	}

	GPSRecord.prototype = {

		/**
		 * Allows to update all four values, however without further validation
		 * @param {number} pUTC
		 * @param {number} pBoatTime
		 * @param {number} pLatitude
		 * @param {number} pLongitude
		 */
		updateValues: function (pUTC, pBoatTime, pLatitude, pLongitude) {
			this.utc = pUTC;
			this.boatTime = pBoatTime;
			this.latitude = pLatitude;
			this.longitude = pLongitude;
			this.latLon = null;
		},

		/** Creates a duplicate of the record */
		clone: function () {
			return new GPSRecord(this.utc, this.boatTime, this.latitude, this.longitude);
		},

		/**  @returns {number} the utc timestamp in ms */
		getUTC: function () {
			return this.utc;
		},

		/** @returns {number} utc timestamp in seconds as integer */
		getUTCSeconds: function () {
			return Math.round(this.utc / 1000);
		},

		/** @returns {number} BoatTime timestamp in ms */
		getBoatTime: function () {
			return this.boatTime;
		},

		/** @returns {number} BoatTime timestamp in seconds as integer */
		getBoatTimeSeconds: function () {
			return Math.round(this.boatTime / 1000);
		},

		/** @returns {number} The difference between boatTime and utc in minutes */
		getBoatTimeOffset: function () {
			return (this.boatTime - this.utc) / 60000;
		},

		/** @returns {number} The latitude as float */
		getLatitude: function () {
			return this.latitude;
		},

		/** @returns {number} The longitude as float */
		getLongitude: function () {
			return this.longitude;
		},

		/** @returns {Array} an array with latitude, longitude. Useful for leaflet */
		getLatLng: function () {
			return [this.latitude, this.longitude];
		},

		/** @returns {Object} a geodesy LatLon object */
		getLatLon: function () {
			if (this.latLon === null) {
				this.latLon = new LatLon(this.latitude, this.longitude, LatLon.datum.WGS84);
			}
			return this.latLon;
		},
	};

	/**
	 * Creates a GPRRecord from data, which can either be an array wir 
	 * [utc, boatTime, latitude, longitude] or an object with those
	 * fields.
	 * @param {(Object|Array)} pData
	 * @returns	{GPSRecord} the record or null for invalid values
	 */
	GPSRecord.fromData = function (pData) {
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
				result = new GPSRecord(data.utc, data.boatTime, data.latitude, data.longitude);
			} else {
				PiLot.log(`invalid data when reading GPSData: ${pData}, 3`);
			}
		}
		return result;
	};

	/// Class Tack 
	/// A Track consists of historic gps data
	var Track = function () {
		this.positions = null;  // array of GPSRecords
		this.observers = null;
		this.initialize();
	};

	/// Track Methods
	Track.prototype = {

		initialize: function () {
			this.positions = new Array();
			this.observers = RC.Utils.initializeObservers(['addPosition', 'cropPositions', 'changeLastPosition']);
		},

		/// calls all observers that registered for pEvent. Passes this
		/// and pArg as parameters.
		notifyObservers: function (pEvent, pArg) {
			RC.Utils.notifyObservers(this, this.observers, pEvent, pArg);
		},

		/// registers an observer which will be called when pEvent happens
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		/// adds a position to the positions array
		addPosition: function (pGpsRecord, pSuppressNotification) {
			if (pGpsRecord !== null) {
				this.positions.push(pGpsRecord);
				if (!pSuppressNotification) {
					this.notifyObservers('addPosition', this.positions[this.positions.length - 1]);
				}
			}
		},

		/// this updates the last element in the positions list,
		/// if there is any. If not, it adds an item
		updateLastPosition: function (pUTC, pBoatTime, pLatitude, pLongitude) {
			if (this.positions.length > 0) {
				var lastRecord = this.positions[this.positions.length - 1];
				lastRecord.updateValues(pUTC, pBoatTime, pLatitude, pLongitude);
			} else {
				this.addPosition(GPSRecord.fromData([pUTC, pBoatTime, pLatitude, pLongitude]));
			}
			this.notifyObservers('changeLastPosition', this.positions[this.positions.length - 1]);
		},

		/// crops positions before pStartTimeUTC or after pEndTimeUTC
		cropPositions: function (pStartTimeUTC, pEndTimeUTC) {
			var hasChanged = false;
			let utcSeconds;
			for (let i = this.positions.length - 1; i >= 0; i--) {
				utcSeconds = this.positions[i].getUTCSeconds();
				if (
					((pStartTimeUTC !== null) && (utcSeconds < pStartTimeUTC))
					|| ((pEndTimeUTC !== null) && (utcSeconds > pEndTimeUTC))
				) {
					this.positions.splice(i, 1);
					hasChanged = true;
				}
			};
			if (hasChanged) {
				this.notifyObservers('cropPositions', this.positions);
			}
		},

		/// returns an array containing arrays with lat, lng
		getRawPositions: function () {
			return this.positions.map(p => p.getLatLng());
		},

		/// returns the position at pIndex or null, if the
		/// index is out of bounds. The result ist GPSRecord
		getPositionAt: function (pIndex) {
			var result = null;
			if ((pIndex >= 0) && (pIndex < this.positions.length)) {
				result = this.positions[pIndex];
			}
			return result;
		},

		/// returns the last position of the track. The result
		/// is a GPSRecord or null, if the track has zero length
		getLastPosition: function () {
			return this.getPositionAt(this.positions.length - 1);
		},

		/// gets the number of positions in the track
		getPositionsCount: function () {
			return this.positions !== null ? this.positions.length : 0;
		},

		/**
		 * Calculates the total distance of the track in meters
		 * */
		getDistance: function () {
			let result = 0;
			let latLon0, latLon1;
			if (this.positions.length > 0) {
				for (let i = 0; i < this.positions.length - 1; i++) {
					latLon0 = this.positions[i].getLatLon();
					latLon1 = this.positions[i + 1].getLatLon();
					result += latLon0.distanceTo(latLon1);
				}
			}
			return result;
		}
	};

	/**
	 * Creates a track object based on a data object. Returns null, if the 
	 * data object is invalid
	 * @param {any} pData
	 */
	Track.fromData = function (pData) {
		let result = null;
		if (pData) {
			result = new Track();
			if ((pData !== null) && Array.isArray(pData)) {
				pData.forEach((value, index, array) => {
					if (Array.isArray(value) && value.length == 4) {
						let gpsRecord = GPSRecord.fromData(value);
						result.addPosition(gpsRecord, true);
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
	 * Loads a track from the server, using UTC for start and end time
	 * @param {Number} pStartUTC - the start time in milliseconds from epoc, in UTC or BoatTime
	 * @param {Number} pEndUTC - the end time in milliseconds from epoc, in UTC or BoatTime
	 * @param {Boolean} pIsBoatTime - If true, start and end are BoatTime, else UTC
	 */
	var loadTrackAsync = async function (pStartTime, pEndTime, pIsBoatTime) {
		const url = `/Track?startTime=${Math.round(pStartTime)}&endTime=${Math.round(pEndTime)}&isBoatTime=${pIsBoatTime}`;
		const json = await PiLot.Utils.Common.getFromServerAsync(url);
		const result = Track.fromData(json);
		return result;
	};

	/**
	 * Deletes GPS positions within a certain time frame from the server
	 * @param {Number} pStartTime - Begin of deletion interval in seconds, either UTC or BoatTime
	 * @param {Number} pEndTime - End of deletion interval in seconds, either UTC or BoatTime
	 * @param {Boolean} pIsBoatTime - If true, start and end are intepreted as BoatTime, else as UTC
	 */
	var deleteGPSPositionsAsync = async function (pStartTime, pEndTime, pIsBoatTime) {
		const url = PiLot.Utils.Common.toApiUrl(`/Track?startTime=${Math.round(pStartTime)}&endTime=${Math.round(pEndTime)}&isBoatTime=${pIsBoatTime}`);
		await fetch(url, { method: 'DELETE' });
	};

	/// class TrackObserver, takes a track and a GPSObserver, and makes sure
	/// the track is continuously updated by changing/adding the latest positions
	/// and calling crop to remove old positions
	var TrackObserver = function (pTrack, pGPSObserver) {
		this.track = pTrack;
		this.gpsObserver = pGPSObserver;
		this.trackSeconds = null;
		this.addPositionThreshold = { seconds: 9.5, meters: 5 };		// the threshold to add new positions to the track
		this.updatePositionThreshold = { seconds: 0.5, meters: 2 };		// the threshold to update the latest position
		this.lastPosition = null;										// the last GPS Record
		this.cropInterval = null;
		this.cropIntervalMS = 10000;
		this.initialize();
	};

	TrackObserver.prototype = {

		initialize: function () {
			this.gpsObserver.on('recieveGpsData', this.gpsObserver_recieveGpsData.bind(this));
			this.cropInterval = setInterval(this.cropTimer_interval.bind(this), this.cropIntervalMS);
		},

		/// this is fired on the cropInterval timer, and just calls crop on the track
		/// we pass null as end time, which quick-fixes an issue when client- and server
		/// time are not in sync
		cropTimer_interval: function () {
			if ((this.track != null) && (this.trackSeconds !== null)) {
				var utcNowUnix =  RC.Date.DateHelper.utcNowUnix();
				this.track.cropPositions(utcNowUnix - this.trackSeconds, null);
			}
		},

		/// this handles new gps data. If the time/local difference
		/// to the latest position is above threshold, a new position
		/// will be added, otherwise the latest position will be updated
		gpsObserver_recieveGpsData: function (pSender, pGpsRecords) {
			if (this.track != null) {
				for (let i = 0; i < pGpsRecords.length; i++) {
					if ((pGpsRecords[i].latitude !== null) && (pGpsRecords[i].longitude !== null)) {
						var deltaTMs = null;
						if (this.lastPosition !== null && this.lastPosition.utc !== null && pGpsRecords[i].utc !== null) {
							deltaTMs = pGpsRecords[i].utc - this.lastPosition.utc;
						}
						var deltaX = null;
						if (this.lastPosition !== null && this.lastPosition.getLatLon() !== null && pGpsRecords[i].getLatLon() !== null) {
							deltaX = pGpsRecords[i].getLatLon().distanceTo(this.lastPosition.getLatLon());
						}
						if (
							(this.lastPosition === null)
							|| ((deltaTMs > this.addPositionThreshold.seconds * 1000) && (deltaX > this.addPositionThreshold.meters))
						) {
							this.track.addPosition(pGpsRecords[i].clone());
							this.lastPosition = pGpsRecords[i];
						} else {
							PiLot.log('Did not add position to Track. deltaT is ' + deltaTMs.toFixed(1) + ', deltaX is ' + deltaX.toFixed(1), 3);
							if ((deltaTMs > this.updatePositionThreshold.seconds) && (deltaX > this.updatePositionThreshold.meters)) {
								this.track.updateLastPosition(pGpsRecords[i].utc, pGpsRecords[i].boatTime, pGpsRecords[i].latitude, pGpsRecords[i].longitude);
							} else {
								PiLot.log('Did not update latest track position. deltaT is ' + deltaTMs.toFixed(1) + ', deltaX is ' + deltaX.toFixed(1), 3);
							}
						}
					}
				}
			} 
		},

		/// sets the duration in seconds of the track
		setTrackSeconds: function (pTrackSeconds) {
			this.trackSeconds = pTrackSeconds;
		},

		/// sets the track to update with live data
		setTrack: function (pTrack) {
			this.track = pTrack;
		}
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
		this.boatTime = pBoatTime;
		this.interval = null;
		this.autoStart = true;
		this.intervalMs = config.intervalMS;				// the interval for querying the server for data
		this.calculationRange = config.calculationRange;	// the number of seconds to calculate speed / course
		this.latestPositions = new Array();					// will keep GPSRecords for the most recent positions
		this.maxPositions = 10;								// the number of latest positions to keep in memory
		this.maxDataAgeSeconds = config.maxDataAgeSeconds;	// the maximum age of gpsData. If the latest position is older, outdatedGpsData will be fired
		this.currentSOG = null;
		this.currentCOG = null;
		this.observers = null;
		// init
		this.readOptions(pOptions);
		this.initialize();		
	};

	/// GPSObserver methods
	GPSObserver.prototype = {
		
		/// tries to get values from pOptions and uses them to override preset default values.
		/// intervalMs: The interval in miliseconds used to poll data
		/// calculationRange: the interval in seconds to use when calculating speed / cog
		readOptions: function (pOptions) {
			if (pOptions) {
				this.intervalMs = pOptions.intervalMs || this.intervalMs;
				this.calculationRange = pOptions.calculationRange || this.calculationRange;
				if (pOptions.autoStart === false) {
					this.autoStart = false;
				}
			}
		},

		/// prepares everything and starts the data fetching process
		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['recieveGpsData', 'outdatedGpsData']);
			if (this.autoStart) {
				this.start();
			}
		},

		/// calls all observers that registered for pEvent. Passes this
		/// and pArg as parameters.
		notifyObservers: function (pEvent, pArg) {
			RC.Utils.notifyObservers(this, this.observers, pEvent, pArg);
		},

		/// registers an observer which will be called when pEvent happens
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
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

		/// makes sure we have an interval for fetching the data. The Interval is not
		/// started immediately in order to avoid too many requests against a service
		/// which might need some time to wake up
		ensureInterval: function () {
			if (this.interval === null) {
				this.interval = window.setInterval(this.fetchDataAsync.bind(this), this.intervalMs);
			}
		},

		// reads the position data from the API
		fetchDataAsync: async function () {
			this.boatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			const positions = await this.loadLatestPositionsAsync();
			this.fetchDataSuccess(positions);
		},

		/**
		* Loads the latest positions from the server and returns an array of GPSRecords
		* or null (if we don't get any valid data). We use the timestamp of the last
	    * record we got, or just this.maxDataAgeSeconds into the past
		* */
		loadLatestPositionsAsync: async function () {
			let lastTimestamp;
			if (this.latestPositions.length > 0) {
				lastTimestamp = this.latestPositions[0].getUTC();
			} else {
				lastTimestamp = (this.boatTime.utcNowUnix() - this.maxDataAgeSeconds) * 1000;
			}
			const json = await PiLot.Utils.Common.getFromServerAsync(`/Position?startTime=${lastTimestamp.toFixed(0)}`);
			const result = new Array();
			if (Array.isArray(json)) {
				for (let i = 0; i < json.length; i++) {
					result.push(GPSRecord.fromData(json[i]));
				}
			}
			return result;
		},

		/// success handler, adds the latest positions to recentPositions and
		/// calls onGpsDataChanged for all observers, if the data is valid
		fetchDataSuccess: function (pGpsRecords) {
			this.ensureInterval();
			if (pGpsRecords !== null && pGpsRecords.length > 0) {
				for (let i = 0; i < pGpsRecords.length; i++) {
					this.latestPositions.unshift(pGpsRecords[i]);
				} this.cropPositions();
				this.calculateSpeedAndCourse();
				if (!this.checkOutdatedData()) {
					this.notifyObservers('recieveGpsData', pGpsRecords);
				}
			}
			else {
				this.checkOutdatedData();
				PiLot.log('GPSObserver.fetchData: invalid data recieved, gpsRecords was null or empty', 2);
			}
		},

		/// handles ws errors. If we didn't get any valid data for a while, we will 
		/// fire the outdated data event.
		fetchDataError: function () {
			this.checkOutdatedData();
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

		/// returns the latest position record (an GpsRecord),
		/// if it's not older than pMaxSeconds or pMaxAgeSeconds is null. 
		getLatestPosition: function (pMaxAgeSeconds) {
			var result = null;
			if (this.latestPositions.length > 0) {
				const utcNowMs = this.boatTime.utcNowUnix() * 1000;
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
		cropPositions: function () {
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

		/// calculates the VMG towards a target. pTarget must bei LatLon
		/// returns null, if we have no current position data to calculate
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

	/// reads all tile sources from the server
	var readAllTileSourcesAsync = async function () {
		const result = new Array();
		const response = await PiLot.Utils.Common.getFromServerAsync('/TileSources');
		response.forEach(function (pItem) {
			result.push(TileSource.fromData(pItem));
		});
		return result;
	};
	
	/// Returning the class and static method definitions
	return {
		Route: Route,
		Poi: Poi,
		Waypoint: Waypoint,
		Track: Track,
		GPSRecord: GPSRecord,
		TrackObserver: TrackObserver,
		GPSObserver: GPSObserver,
		RouteObserver: RouteObserver,
		TileSource: TileSource,
		readAllTileSourcesAsync: readAllTileSourcesAsync,
		loadAllRoutesAsync: loadAllRoutesAsync,
		loadActiveRouteAsync: loadActiveRouteAsync,
		loadActiveRouteIdAsync: loadActiveRouteIdAsync,
		loadRouteAsync: loadRouteAsync,
		saveActiveRouteIdAsync: saveActiveRouteIdAsync,
		loadPoisAsync: loadPoisAsync,
		loadTrackAsync: loadTrackAsync,
		deleteGPSPositionsAsync: deleteGPSPositionsAsync
	};

})();