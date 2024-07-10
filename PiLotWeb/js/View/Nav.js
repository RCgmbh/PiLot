var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

PiLot.View.Nav = (function () {

	/// a form to enter a coordinate (prefix, Degrees, Minutes). Expects
	/// a Container which is unique to this (no container can be used
	/// for multiple CoordinateForms)
	var CoordinateForm = function (pContainer, pIsLatitude) {

		this.container = pContainer;
		this.isLatitude = pIsLatitude;
		this.coordinate = null;

		/// controls
		this.tbPrefix = null;
		this.tbDeg = null;
		this.tbMin = null;

		this.initialize();
	};

	CoordinateForm.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['changeCoordinates']);
			this.drawForm();
			this.showCoordinate();
		},

		/// registers an observer which will be called when pEvent happens
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
			return this;
		},

		tb_changed: function () {
			this.parseForm();
			this.showCoordinate();
			RC.Utils.notifyObservers(this, this.observers, 'changeCoordinates', null);
		},

		drawForm: function () {
			this.container.clear();
			this.container.appendChildren(RC.Utils.stringToNodes(PiLot.Templates.Nav.coordinateForm));
			this.tbPrefix = this.container.querySelector('.tbPrefix');
			this.tbDeg = this.container.querySelector('.tbDeg');
			this.tbMin = this.container.querySelector('.tbMin');
			this.tbPrefix.addEventListener('change', this.tb_changed.bind(this));
			this.tbDeg.addEventListener('change', this.tb_changed.bind(this));
			this.tbMin.addEventListener('change', this.tb_changed.bind(this));
			RC.Utils.selectOnFocus(this.tbPrefix, this.tbDeg, this.tbMin);
			return this;
		},

		showCoordinate: function () {
			if (this.coordinate !== null) {
				var coordinateArray = PiLot.Utils.Nav.toCoordinateArray(this.coordinate, this.isLatitude);
				this.tbPrefix.value = coordinateArray[0];
				this.tbDeg.value = coordinateArray[1];
				this.tbMin.value = coordinateArray[2];
			}
			return this;
		},

		parseForm: function () {
			var result = null;
			var maxValue = this.isLatitude ? 90 : 180;
			var negativePrefix = this.isLatitude ? PiLot.Utils.Language.getText('directionS') : PiLot.Utils.Language.getText('directionW');
			var prefix = this.tbPrefix.value;
			var deg = this.tbDeg.value;
			var min = this.tbMin.value;
			if (RC.Utils.isNumeric(deg)) {
				result = Number(deg);
				if (RC.Utils.isNumeric(min)) {
					result += Number(min) / 60;
				}
				result = result % maxValue;
				if (prefix.toLowerCase() == negativePrefix.toLowerCase()) {
					result = Math.abs(result) * -1;
				}
			}
			this.coordinate = result;
		},

		setCoordinate: function (pCoordinate) {
			this.coordinate = pCoordinate;
			return this;
		},

		getCoordinate: function () {
			return this.coordinate;
		}

	};

	/// a control to display a coordinate (prefix, Degrees, Minutes). Expects
	/// a Container which is unique to this (no container can be used
	/// for multiple CoordinateDisplays)
	var CoordinateDisplay = function (pContainer, pIsLatitude) {

		this.container = pContainer;
		this.isLatitude = pIsLatitude;
		this.coordinate = null;
		this.initialize();
	};

	CoordinateDisplay.prototype = {

		initialize: function () {
			this.showCoordinate();
		},

		showCoordinate: function () {
			if (this.coordinate !== null) {
				this.container.innerText = PiLot.Utils.Nav.toCoordinateString(this.coordinate, this.isLatitude, true);
			} else {
				this.container.innerText = '';
			}
			return this;
		},

		setCoordinate: function (pCoordinate) {
			this.coordinate = pCoordinate;
			return this;
		},
	};

	/// Displays a speed or course, based on a template. The template
	/// is expected to have an element with class "lblValue" and exactly
	/// one top-level element, which can be hidden or shown
	/// @param pParent: The HTMLElement where this will be added as child
	/// @param pTemplate: A HTMLString used to create the elements, having one top-level element
	/// @param pFixedPreComma: if set, the value will have leading zeroes for fixed length of the pre-comma part
	/// @param pFixedPostComma: if set, the value will have a fixed post-comma length
	var MotionDisplay = function (pParent, pTemplate, pFixedPreComma = null, pFixedPostComma = 0) {
		this.container = null;
		this.lblValue = null;
		this.fixedPreComma = pFixedPreComma;
		this.fixedPostComma = pFixedPostComma;
		this.draw(pParent, pTemplate);
	};

	MotionDisplay.prototype = {

		/// creates the control from the template and appends it
		/// to pParent. The template must have on top level node.
		draw: function (pParent, pTemplate) {
			this.container = PiLot.Utils.Common.createNode(pTemplate);
			pParent.appendChild(this.container);
			this.lblValue = this.container.querySelector('.lblValue');
		},

		/// shows or hides the control, returning itself to facilitate chaining
		showHide: function (pVisible) {
			this.container.classList.toggle('hidden', !pVisible);
			return this;
		},

		/// shows the value or defaults to '---' if pValue is null;
		/// @param pValue: a function, which will be called without
		/// any additional parameters, or a numeric value
		showValue: function (pValue) {
			var text;
			if (typeof pValue === 'function') {
				pValue = pValue();
			}
			if (pValue !== null && !isNaN(pValue)) {
				if (this.fixedPreComma !== null) {
					text = RC.Utils.toFixedLength(pValue, this.fixedPreComma, this.fixedPostComma);
				} else {
					text = pValue.toFixed(this.fixedPostComma);
				}
			} else {
				text = '---';
			}
			this.lblValue.innerText = text;
		}
	};

	/// represents a control which displays the cross track error (XTE), consisting
	/// of an arrow indicator and a distance
	var XTEIndicator = function (pParent) {
		this.container = null;
		this.lblXTE = null;			// the xte distance label
		this.lblXTELeft = null;		// the left arrow icon
		this.lblXTERight = null;	// the right arrow icon
		this.draw(pParent);
	};

	XTEIndicator.prototype = {

		draw: function (pParent) {
			this.container = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.xteIndicator);
			pParent.appendChild(this.container);
			this.lblXTE = this.container.querySelector('.lblXTE');
			this.lblXTELeft = this.container.querySelector('.lblXTELeft');
			this.lblXTERight = this.container.querySelector('.lblXTERight');
		},

		/// shows the current value taken from pRouteObserver
		showValue: function (pRouteObserver) {
			let distanceText;
			if (pRouteObserver) {
				var xte = pRouteObserver.getXTE();
				var xteDistanceMiles = PiLot.Utils.Nav.metersToNauticalMiles(xte.distance);
				if (RC.Utils.isNumeric(xteDistanceMiles)) {
					xteDistanceMiles = Math.abs(xteDistanceMiles);
					if (xteDistanceMiles > 9.9) {
						distanceText = '>9.9';
					} else {
						distanceText = xteDistanceMiles.toFixed(2);
					}
				} else {
					distanceText = '---';
				}

				this.lblXTELeft.classList.toggle('hidden', xte.direction !== 'L');
				this.lblXTERight.classList.toggle('hidden', xte.direction !== 'R');
			} else {
				distanceText = '---';
			}
			this.lblXTE.innerText = distanceText;
		},

		/// shows or hides the control, returning the control for easy chaining
		showHide: function (pVisible) {
			this.container.classList.toggle('hidden', !pVisible);
			return this;
		},

	};

	var PositionIndicator = function (pParent) {
		this.parent = pParent;
		this.control = null;
		this.lblLatPrefix = null;
		this.lblLatDegrees = null;
		this.lblLatMinutes = null;
		this.lblLonPrefix = null;
		this.lblLonDegrees = null;
		this.lblLonMinutes = null;
		this.draw();
	};

	PositionIndicator.prototype = {

		/// draws the control as child of pParent
		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.positionIndicator);
			this.parent.appendChild(this.control);
			this.lblLatPrefix = this.control.querySelector('.lblLatPrefix');
			this.lblLatDegrees = this.control.querySelector('.lblLatDegrees');
			this.lblLatMinutes = this.control.querySelector('.lblLatMinutes');
			this.lblLonPrefix = this.control.querySelector('.lblLonPrefix');
			this.lblLonDegrees = this.control.querySelector('.lblLonDegrees');
			this.lblLonMinutes = this.control.querySelector('.lblLonMinutes');
		},

		/// shows the current position, expecting an object with {lat, lon}
		/// or {lat, lng}
		showValue: function (pLatLon) {
			if (pLatLon) {
				const lat = pLatLon.lat;
				const lon = pLatLon.lon || pLatLon.lng;
				if (lat && lon) {
					const latArray = PiLot.Utils.Nav.toCoordinateArray(lat, true);
					this.lblLatPrefix.innerText = latArray[0];
					this.lblLatDegrees.innerText = latArray[1];
					this.lblLatMinutes.innerText = latArray[2];
					const lonArray = PiLot.Utils.Nav.toCoordinateArray(lon, false);
					this.lblLonPrefix.innerText = lonArray[0];
					this.lblLonDegrees.innerText = lonArray[1];
					this.lblLonMinutes.innerText = lonArray[2];
				}
			}
		},

		/// shows or hides the control
		showHide: function (pVisible) {
			this.control.classList.toggle('hidden', !pVisible);
		},

	};

	/// The page where motion data and live waypoint data is displayed.
	var NavPage = function () {
		this.gpsObserver = null;
		this.routeObserver = null;
		this.boatTime = null;
		this.outdatedGpsWarning = null;
		this.sogIndicator = null;
		this.cogIndicator = null;
		this.vmgIndicator = null;
		this.xteIndicator = null;
		this.divPosition = null;
		this.positionIndicator = null;
		this.liveRoute = null;
		this.outdatedGpsWarning = null;
		this.initialize();
	};

	NavPage.prototype = {

		/// initializes stuffs, requests data from the server and calls draw()
		initialize: function () {
			Promise.all([
				PiLot.Model.Common.getCurrentBoatTimeAsync(),
				PiLot.Model.Nav.loadActiveRouteAsync()
			]).then(results => {
				this.boatTime = results[0];
				this.gpsObserver = PiLot.Model.Nav.GPSObserver.getInstance();
				if (results[1] !== null) {
					this.routeObserver = new PiLot.Model.Nav.RouteObserver(results[1], this.boatTime, { autoCalculate: true });
				}
				this.draw();
				this.gpsObserver.on('recieveGpsData', this.gpsObserver_recieveGpsData.bind(this));
				this.gpsObserver.on('outdatedGpsData', this.gpsObserver_outdatedGpsData.bind(this));
			});
		},

		gpsObserver_recieveGpsData: function () {
			this.outdatedGpsWarning.classList.toggle('hidden', true);
			this.cogIndicator.showValue(this.gpsObserver.getCOG());
			this.xteIndicator.showValue(this.routeObserver);
			this.sogIndicator.showValue(this.gpsObserver.getSOG());
			if (this.routeObserver !== null) {
				this.vmgIndicator.showValue(this.routeObserver.getVMG());
			}
			this.positionIndicator.showValue(this.gpsObserver.getLatestPosition(null).latLon);
		},

		gpsObserver_outdatedGpsData: function () {
			this.outdatedGpsWarning.classList.toggle('hidden', false);
			this.cogIndicator.showValue(null);
			this.xteIndicator.showValue(null);
			this.sogIndicator.showValue(null);
			this.vmgIndicator.showValue(null);
		},

		draw: function () {
			const navPage = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.navPage);
			const contentArea = PiLot.Utils.Loader.getContentArea();
			contentArea.appendChild(navPage);
			this.outdatedGpsWarning = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.outdatedGpsWarning);
			navPage.insertAdjacentElement('afterbegin', this.outdatedGpsWarning);
			const divData = navPage.querySelector('.divData');
			const divDirection = divData.querySelector('.divDirection');
			const divSpeed = divData.querySelector('.divSpeed');
			this.divPosition = divData.querySelector('.divPosition');
			this.cogIndicator = new PiLot.View.Nav.MotionDisplay(divDirection, PiLot.Templates.Nav.cogIndicator, 3, 0).showHide(true);
			this.xteIndicator = new PiLot.View.Nav.XTEIndicator(divDirection).showHide(true);
			this.sogIndicator = new PiLot.View.Nav.MotionDisplay(divSpeed, PiLot.Templates.Nav.sogIndicator, null, 1).showHide(true);
			this.vmgIndicator = new PiLot.View.Nav.MotionDisplay(divSpeed, PiLot.Templates.Nav.vmgIndicator, null, 1).showHide(true);
			this.positionIndicator = new PositionIndicator(this.divPosition);
			if (this.routeObserver !== null) {
				this.liveRoute = new LiveRoute(navPage, this.routeObserver);
			}
			new NavOptions(contentArea, this, this.liveRoute);
		},

		setShowCoordinates: function (pShow) {
			this.divPosition.classList.toggle('hidden', !pShow);
		}
	};

	/// a panel showing options to be applied to the nav panel
	/// as well as to the LiveRoute. Both can be null (which would not
	/// make too much sense, would it?
	var NavOptions = function (pContainer, pNavPanel, pLiveRoute) {
		this.container = pContainer;
		this.navPanel = pNavPanel || null;
		this.liveRoute = pLiveRoute || null;
		this.liveRouteSettings = null;
		this.showCoordinates = true;
		this.control = null;
		this.lnkToggleCoordinates = null;
		this.lnkTogglePastWaypoints = null;
		this.lnkToggleNextWaypoint = null;
		this.lnkToggleAheadWaypoints = null;
		this.lnkToggleFinalWaypoint = null;
		this.initialize();
	};

	NavOptions.prototype = {

		initialize: function () {
			this.loadSettings();
			this.draw();
			this.updateButtons();
		},

		/// loads the user settings and applies them
		loadSettings: function () {
			this.liveRouteSettings = PiLot.Utils.Common.loadUserSetting('PiLot.Nav.liveRouteSettings')
				|| { showPastWaypoints: true, showNextWaypoint: true, showAheadWaypoints: true, showFinalWaypoint: true };
			this.applyLiveRouteSettings();
			var showCoordinates = PiLot.Utils.Common.loadUserSetting('PiLot.Nav.showCoordinates');
			if (showCoordinates !== null) {
				this.showCoordinates = showCoordinates;
			}
			this.applyCoordinatesSetting();
		},

		/// draws the control based on the template and
		/// assigns the control variables
		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.navOptions);
			this.container.insertAdjacentElement('afterbegin', this.control);
			this.control.querySelector('a.expandCollapse').addEventListener('click', this.lnkToggleSettings_click.bind(this));
			this.lnkToggleCoordinates = this.control.querySelector('.lnkToggleCoordinates');
			this.lnkToggleCoordinates.addEventListener('click', this.lnkToggleCoordinates_click.bind(this));
			this.lnkTogglePastWaypoints = this.control.querySelector('.lnkTogglePastWaypoints');
			this.lnkTogglePastWaypoints.addEventListener('click', this.lnkTogglePastWaypoints_click.bind(this));
			this.lnkToggleNextWaypoint = this.control.querySelector('.lnkToggleNextWaypoint');
			this.lnkToggleNextWaypoint.addEventListener('click', this.lnkToggleNextWaypoint_click.bind(this));
			this.lnkToggleAheadWaypoints = this.control.querySelector('.lnkToggleAheadWaypoints');
			this.lnkToggleAheadWaypoints.addEventListener('click', this.lnkToggleAheadWaypoints_click.bind(this));
			this.lnkToggleFinalWaypoint = this.control.querySelector('.lnkToggleFinalWaypoint');
			this.lnkToggleFinalWaypoint.addEventListener('click', this.lnkToggleFinalWaypoint_click.bind(this));
		},

		/// sets the buttons class to active if the corresponding option is enabled
		updateButtons: function () {
			var className = 'active';
			this.lnkToggleCoordinates.classList.toggle(className, this.showCoordinates);
			this.lnkTogglePastWaypoints.classList.toggle(className, this.liveRouteSettings.showPastWaypoints);
			this.lnkToggleNextWaypoint.classList.toggle(className, this.liveRouteSettings.showNextWaypoint);
			this.lnkToggleAheadWaypoints.classList.toggle(className, this.liveRouteSettings.showAheadWaypoints);
			this.lnkToggleFinalWaypoint.classList.toggle(className, this.liveRouteSettings.showFinalWaypoint);
		},

		lnkToggleSettings_click: function () {
			this.control.classList.toggle('expanded');
		},

		lnkToggleCoordinates_click: function () {
			this.showCoordinates = !this.showCoordinates;
			this.updateButtons();
			this.applyCoordinatesSetting();
			this.saveCoordinatesSetting();
		},

		lnkTogglePastWaypoints_click: function () {
			this.liveRouteSettings.showPastWaypoints = !this.liveRouteSettings.showPastWaypoints;
			this.changeLiveRouteSettings();
		},

		lnkToggleNextWaypoint_click: function () {
			this.liveRouteSettings.showNextWaypoint = !this.liveRouteSettings.showNextWaypoint;
			this.changeLiveRouteSettings();
		},

		lnkToggleAheadWaypoints_click: function () {
			this.liveRouteSettings.showAheadWaypoints = !this.liveRouteSettings.showAheadWaypoints;
			this.liveRouteSettings.showNextWaypoint = this.liveRouteSettings.showNextWaypoint || this.liveRouteSettings.showAheadWaypoints;
			this.liveRouteSettings.showFinalWaypoint = this.liveRouteSettings.showFinalWaypoint || this.liveRouteSettings.showAheadWaypoints;
			this.changeLiveRouteSettings();
		},

		lnkToggleFinalWaypoint_click: function () {
			this.liveRouteSettings.showFinalWaypoint = !this.liveRouteSettings.showFinalWaypoint;
			this.changeLiveRouteSettings();
		},

		/// applies the liveRouteSettings, saves them, and updates the buttons
		changeLiveRouteSettings: function () {
			this.updateButtons();
			this.applyLiveRouteSettings();
			this.saveLiveRouteSettings();
		},

		/// saves the current liveRouteSettings back to the user settings
		saveLiveRouteSettings: function () {
			PiLot.Utils.Common.saveUserSetting('PiLot.Nav.liveRouteSettings', this.liveRouteSettings);
		},

		/// saves the current coordinate settings back to the user settings
		saveCoordinatesSetting: function () {
			PiLot.Utils.Common.saveUserSetting('PiLot.Nav.showCoordinates', this.showCoordinates);
		},

		/// changes which waypoints are displayed by the LiveRoute. For any value
		/// you don't want to change, set null.
		applyLiveRouteSettings: function () {
			if (this.liveRoute !== null) {
				this.liveRoute.setWaypointsMode(this.liveRouteSettings);
			}
		},

		/// applies the setting about wheter to show coordinates or not to
		/// the telemetry panel and the live route
		applyCoordinatesSetting: function () {
			if (this.liveRoute !== null) {
				this.liveRoute.setShowCoordinates(this.showCoordinates);
			}
			if (this.navPanel !== null) {
				this.navPanel.setShowCoordinates(this.showCoordinates);
			}
		}
	};

	/// A control which shows a list of all available routes
	var RoutesList = function () {
		this.routes = null;
		this.activeRouteId = null;
		this.sortKey = 'name'; //name, distance, waypoints
		this.sortAsc = true;
		this.plhTable = null; // HTMLElement where the table is drawn (and re-drawn)
		this.initialize();
	};

	/// RoutesList methods
	RoutesList.prototype = {

		initialize: function () {
			Promise.all([
				PiLot.Model.Nav.loadAllRoutesAsync(),
				PiLot.Model.Nav.loadActiveRouteIdAsync()
			]).then(results => {
				this.routes = results[0];
				this.activeRouteId = results[1];
				this.applySortOrder();
				this.draw();
			});
		},

		draw: function () {
			let contentArea = PiLot.Utils.Loader.getContentArea();
			contentArea.appendChild(PiLot.Utils.Common.createNode(PiLot.Templates.Nav.routesPage));
			const lnkAddRoute = contentArea.querySelector('.lnkAddRoute');
			PiLot.Utils.Common.bindOrHideEditLink(lnkAddRoute, null, PiLot.Utils.Loader.createPageLink(PiLot.Utils.Loader.pages.nav.routeDetails))
			this.plhTable = contentArea.querySelector('.plhTable');
			this.drawTable();
		},

		drawTable: function () {
			this.plhTable.clear();
			let table = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.routesTable);
			this.setSortHeader(table.querySelector('th.headerName'), table.querySelector('.lnkHeaderName'), 'name');
			this.setSortHeader(table.querySelector('th.headerDistance'), table.querySelector('.lnkHeaderDistance'), 'distance');
			this.setSortHeader(table.querySelector('th.headerWaypoints'), table.querySelector('.lnkHeaderWaypoints'), 'waypoints');
			const tableBody = table.querySelector('tbody');
			const allowActivate = PiLot.Permissions.canChangeSettings();
			for (var i = 0; i < this.routes.length; i++) {
				this.drawRow(tableBody, this.routes[i], allowActivate);
			}
			this.plhTable.appendChild(table);
		},

		setSortHeader: function (pHeader, pSortLink, pSortKey) {
			pHeader.classList.toggle('sortAsc', this.sortKey === pSortKey && this.sortAsc);
			pHeader.classList.toggle('sortDesc', this.sortKey === pSortKey && !this.sortAsc);
			pSortLink.addEventListener('click', this.setSortKey.bind(this, pSortKey));
		},

		drawRow: function (pTableBody, pRoute, pAllowActivate) {
			let row = RC.Utils.stringToNode(PiLot.Templates.Nav.routesTableRow);
			let routeId = pRoute.getRouteId();
			let lnkActivate = row.querySelector('.lnkActivate');
			lnkActivate.classList.toggle('active', this.activeRouteId === routeId);
			if (pAllowActivate) {
				lnkActivate.addEventListener('click', this.swapActiveRoute.bind(this, routeId));
			} else {
				lnkActivate.removeAttribute('href');
			}
			let lnkName = row.querySelector('.lnkName');
			lnkName.innerText = pRoute.getName();
			let detailUrl = PiLot.Utils.Loader.createPageLink(PiLot.Utils.Loader.pages.nav.routeDetails);
			lnkName.setAttribute('href', `${detailUrl}&routeId=${routeId}`);
			let distanceNM = PiLot.Utils.Nav.metersToNauticalMiles(pRoute.getTotalDistance());
			row.querySelector('.tdDistance').innerText = distanceNM.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
			row.querySelector('.tdWaypoints').innerText = pRoute.getWaypoints().length;
			pTableBody.appendChild(row);
		},

		applySortOrder: function () {
			var sortKey = this.sortKey;
			var sortAsc = this.sortAsc;
			this.routes.sort(function (x, y) {
				return x.compareTo(y, sortKey, sortAsc);
			});
		},

		/// sets the active route to pRouteId, if it isn't already. Otherwise
		/// sets the active route to null
		swapActiveRoute: function (pRouteId) {
			if (pRouteId !== this.activeRouteId) {
				this.activeRouteId = pRouteId;
			} else {
				this.activeRouteId = null;
			}
			PiLot.Model.Nav.saveActiveRouteIdAsync(this.activeRouteId);
			this.drawTable();
		},

		setSortKey: function (pSortKey) {
			if (pSortKey === this.sortKey) {
				this.sortAsc = !this.sortAsc;
			} else {
				this.sortKey = pSortKey;
				this.sortAsc = true;
			}
			this.applySortOrder();
			this.drawTable();
		}
	};

	/// the details page for a route. Contains the title, the list of waypoints
	/// (draggable) and a map which allows to show / edit / add waypoints.
	/// This will load the routeId based on the url parameter "routeId"
	var RouteDetail = function () {
		this.route = null;
		this.map = null;
		this.mapRoute = null;
		this.isActiveRoute = false;
		this.waypointForms = null // an array with all waypoint forms
		this.tbRouteName = null;
		this.lblTotalDistance = null;
		this.divWaypoints = null;
		this.lnkActivate = null;
		this.initialize();
	};

	/// RouteDetail methods
	RouteDetail.prototype = {

		initialize: async function () {
			this.waypointForms = new Array();
			await this.drawFormAsync();
			this.route = await this.loadRoute();
			this.route.on('addWaypoint', this.route_addWaypoint.bind(this));
			this.route.on('deleteWaypoint', this.route_deleteWaypoint.bind(this));
			this.route.on('moveWaypoint', this.route_moveWaypoint.bind(this));
			this.route.on('changeWaypoints', this.route_changeWaypoints.bind(this));
			this.route.on('rename', this.route_rename.bind(this));
			this.showRoute();
		},

		/// change handler for the Name textbox
		tbRouteName_changed: function () {
			this.route.setName(this.tbRouteName.value.trim());
			this.saveRoute();
		},

		/// click handler for the "add waypoint" link, adds a new 
		/// waypoint to the route, copying the coordinates of the
		/// last waypoint
		lnkAddWaypoint_click: function () {
			const lastWp = this.route.getWaypoints().last();
			let lat = null;
			let lon = null;
			if ((lastWp !== null) && (lastWp.hasPosition())) {
				lat = lastWp.getLatLon().lat;
				lon = lastWp.getLatLon().lon;
			}
			let wpName = `${PiLot.Utils.Language.getText('waypoint')} ${this.route.getWaypoints().length + 1}`;
			const newWaypoint = new PiLot.Model.Nav.Waypoint(this.route, lat, lon, wpName);
			this.route.addWaypoint(newWaypoint, true, this);
			this.saveRoute();
			return false;
		},

		/// click handler for the "activate route" link
		lnkActivateRoute_click: function (pEvent) {
			pEvent.preventDefault();
			this.isActiveRoute = !this.isActiveRoute;
			var activeRouteId = this.isActiveRoute ? this.route.getRouteId() : null;
			PiLot.Model.Nav.saveActiveRouteIdAsync(activeRouteId);
			this.lnkActivate.classList.toggle('active', this.isActiveRoute);
		},

		/** click handler for the "reverse route" link */
		lnkReverseRoute_click: function (pEvent) {
			pEvent.preventDefault();
			this.route.reverse(this);
		},

		/** click handler for the "copy" link */
		lnkCopyRoute_click: function () {
			this.route.setRouteId(null);
			this.route.setName(`${this.route.getName()}-Copy`);
			this.showRoute();
			this.saveRoute();
		},

		/// click handler for the "delete route" link. Deletes the route, ignoring the result
		lnkDeleteRoute_click: function (pEvent) {
			if (confirm(PiLot.Utils.Language.getText('confirmDeleteRoute'))) {
				this.route.deleteFromServerAsync().then(r => {
					window.location = PiLot.Utils.Loader.createPageLink(PiLot.Utils.Loader.pages.nav.routes);
				});
			}
		},

		/// handles the addWaypoint event of the route
		route_addWaypoint: function (pSender, pArg) {
			this.showTotalDistance();
			this.showWaypoints(true);
		},

		/// handles the deleteWaypoint event of the route
		route_deleteWaypoint: function (pSender, pArg) {
			this.showTotalDistance();
			this.showWaypoints(true);
		},

		/// handles the moveWaypoint event of the route
		route_moveWaypoint: function (pSender, pArg) {
			this.showTotalDistance();
		},

		/// handles the changeWaypoints event of the route
		route_changeWaypoints: function (pSender, pArg) {
			this.showTotalDistance();
			this.showWaypoints(true);
		},

		/// handles the rename event of the route
		route_rename: function (pSender, pArg) {
			this.tbRouteName.value = this.route.getName();
		},

		/** Handlers selecting a waypoint on the map by highlighting the corresponding form element */
		mapRoute_selectWaypoint: function (pSender, pArg) {
			this.highlightWaypoint(pArg);
		},

		/** Handlers unselecting a waypoint on the map by de-highlighting all form elements */
		mapRoute_unselectWaypoint: function (pSender, pArg) {
			this.highlightWaypoint(null);
		},

		/** 
		 *  Loads the route from the server, if we have a valid routeId query string,
		 *  otherwise returns a new route.
		 */
		loadRoute: async function() {
			var qsRouteId = RC.Utils.getUrlParameter('routeId');
			if (qsRouteId) {
				return await PiLot.Model.Nav.loadRouteAsync(qsRouteId);
			} else {
				return new PiLot.Model.Nav.Route().setName(PiLot.Utils.Language.getText('newRoute'));
			}
		},

		/// draws the main form based on the template, only needs to
		/// be called once.
		drawFormAsync: async function () {
			let contentArea = PiLot.Utils.Loader.getContentArea();
			contentArea.appendChild(PiLot.Utils.Common.createNode(PiLot.Templates.Nav.routeDetailPage));
			let routeContainer = contentArea.querySelector('#divRoute');
			routeContainer.appendChild(PiLot.Utils.Common.createNode(PiLot.Templates.Nav.editRouteForm));
			this.tbRouteName = routeContainer.querySelector('.tbRouteName');
			this.lnkActivate = routeContainer.querySelector('.lnkActivateRoute');
			const lnkAddWaypoint = routeContainer.querySelector('.lnkAddWaypoint');
			const lnkReverseRoute = routeContainer.querySelector('.lnkReverseRoute');
			const lnkCopyRoute = routeContainer.querySelector('.lnkCopyRoute');
			const lnkDeleteRoute = routeContainer.querySelector('.lnkDeleteRoute');
			if (PiLot.Permissions.canWrite()) {
				this.tbRouteName.addEventListener('change', this.tbRouteName_changed.bind(this));
				RC.Utils.selectOnFocus(this.tbRouteName);
				lnkAddWaypoint.addEventListener('click', this.lnkAddWaypoint_click.bind(this));
				lnkReverseRoute.addEventListener('click', this.lnkReverseRoute_click.bind(this));
				lnkCopyRoute.addEventListener('click', this.lnkCopyRoute_click.bind(this));
				lnkDeleteRoute.addEventListener('click', this.lnkDeleteRoute_click.bind(this));
			} else {
				this.tbRouteName.setAttribute('readonly', true);
				lnkAddWaypoint.remove();
				lnkReverseRoute.remove();
				lnkCopyRoute.remove();
				lnkDeleteRoute.remove();
			}
			if (PiLot.Permissions.canChangeSettings) {
				this.lnkActivate.addEventListener('click', this.lnkActivateRoute_click.bind(this));
			} else {
				this.lnkActivate.remove();
			}
			if (!(PiLot.Permissions.canChangeSettings() || PiLot.Permissions.canWrite())) {
				routeContainer.querySelector('.divActions').remove();
			}
			this.lblTotalDistance = routeContainer.querySelector('.lblTotalDistance');
			this.divWaypoints = routeContainer.querySelector('.divWaypoints');
			let mapContainer = contentArea.querySelector('#divMap');
			this.map = new PiLot.View.Map.Seamap(mapContainer);
			await this.map.showAsync();
		},

		/// shows the route data and refreshes all waypoints
		showRoute: function () {
			this.tbRouteName.value = this.route.getName();
			this.showTotalDistance();
			this.showWaypoints();
			this.showActiveState();
			const lockRoute = !PiLot.Permissions.canWrite();
			if(this.mapRoute !== null){
				this.mapRoute.setRoute(this.route).draw().fitMap();
			} else{
				this.mapRoute = new PiLot.View.Map.MapRoute(this.map, this.route, { showRoute: true, lockRoute: lockRoute, showOptions: false }).draw().fitMap();
			}
			this.mapRoute.on('selectWaypoint', this.mapRoute_selectWaypoint.bind(this));
			this.mapRoute.on('unselectWaypoint', this.mapRoute_unselectWaypoint.bind(this));
		},

		/// shows the waypoints (create the forms if necessary, refresh all values). Pass
		/// pResetAll to enforce redrawing of all waypoints, which is necessary to reflect
		/// any deleted waypoints
		showWaypoints: function (pResetAll) {
			if (pResetAll) {
				this.divWaypoints.clear();
				this.waypointForms = new Array();
			}
			var waypoints = this.route.getWaypoints();
			for (var i = 0; i < waypoints.length; i++) {
				if (!this.waypointForms.find(function (pValue) { return pValue.waypoint === waypoints[i] })){
					this.waypointForms.push(new WaypointForm(waypoints[i], this, this.divWaypoints));
				}
			}
			this.waypointForms.forEach(function (pItem) {
				pItem.showWaypoint();
			});
		},

		highlightWaypoint: function (pIndex) {
			for (let i = 0; i < this.waypointForms.length; i++) {
				this.waypointForms[i].highlight(i == pIndex);
			}
		},

		/// shows the total distance of the route in the label
		showTotalDistance: function () {
			this.lblTotalDistance.innerText = PiLot.Utils.Nav.metersToNauticalMiles(this.route.getTotalDistance()).toFixed(1);
		},

		/// highlights the activate route link if this is the active route
		showActiveState: function () {
			if (this.lnkActivate) {
				PiLot.Model.Nav.loadActiveRouteIdAsync().then(routeId => {
					this.isActiveRoute = routeId === this.route.getRouteId();
					this.lnkActivate.classList.toggle('active', this.isActiveRoute);
				});
			}
		},

		/// returns the route
		getRoute: function () {
			return this.route;
		},

		/// saves the route back to the server
		saveRoute: function () {
			this.route.saveToServer(null);
		}

	};

	/// a form to edit a waypoint (title, coordinates)
	var WaypointForm = function (pWaypoint, pRouteDetail, pContainer) {
		this.waypoint = pWaypoint;
		this.routeDetail = pRouteDetail;
		this.container = pContainer;
		this.tbWaypointName = null;
		this.editLatitude = null;
		this.editLongitude = null;
		this.lnkDelete = null;
		this.divLeg = null;
		this.lblDistance = null;
		this.lblBearing = null;
		this.form = null;
		this.initialize();
	};

	WaypointForm.prototype = {

		initialize: function () {
			this.waypoint.on('move', this.waypoint_move.bind(this));
			this.bindNextWaypoint();
			this.routeDetail.getRoute().on('changeWaypoints', this.bindNextWaypoint.bind(this));
			this.drawForm();
		},

		/// binds the handler for observing movements of the next waypoint. 
		/// this needs to be done initially, and whenever the order of 
		/// waypoints changes
		bindNextWaypoint: function () {
			var nextWaypoint = this.routeDetail.getRoute().getNextWaypoint(this.waypoint);
			if (nextWaypoint != null) {
				nextWaypoint.on('move', this.nextWaypoint_move.bind(this));
			}
		},

		/// handles changes to the waypoint name textbox
		tbWaypointName_change: function () {
			this.waypoint.setName(this.tbWaypointName.value.trim());
			this.routeDetail.saveRoute();
		},

		/// click handler for the delete waypoint link
		lnkDeleteWaypoint_click: function (pEvent) {
			pEevent.preventDefault();
			const message = PiLot.Utils.Language.getText('confirmDeleteWaypoint').replace("{{waypointName}}", this.waypoint.getName());
			if (confirm(message)) {
				this.routeDetail.getRoute().deleteWaypoint(this.waypoint, this);
			}
			return false;
		},

		lnkMoveUp_click: function (pEvent) {
			pEvent.preventDefault();
			const route = this.routeDetail.getRoute();
			route.swapWaypoints(this.waypoint, route.getPreviousWaypoint(this.waypoint));
		},

		lnkMoveDown_click: function (pEvent) {
			pEvent.preventDefault();
			const route = this.routeDetail.getRoute();
			route.swapWaypoints(this.waypoint, route.getNextWaypoint(this.waypoint));
		},

		/// change handler for the latitude form
		editLatitude_changeCoordinates: function () {
			this.waypoint.setLatLon(this.editLatitude.getCoordinate(), this.editLongitude.getCoordinate(), false, this);
		},

		/// change handler for the longitude form
		editLongitude_changeCoordinates: function () {
			this.waypoint.setLatLon(this.editLatitude.getCoordinate(), this.editLongitude.getCoordinate(), false, this);
		},

		/// handler for the move event of the waypoint
		waypoint_move: function (pSender, pArg) {
			if (pSender !== this) {
				this.showWaypoint();
			}
			this.showLeg();
		},

		/// handler for move event of the next waypoint, updates the leg data
		nextWaypoint_move: function () {
			this.showLeg();
		},

		/// draws the form based on the template, only needs to be called once
		drawForm: function () {
			const waypoints = this.routeDetail.getRoute().getWaypoints();
			const index = waypoints.indexOf(this.waypoint);
			const isLast = (index == waypoints.length - 1);
			this.form = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.waypointForm);
			this.container.appendChild(this.form);
			this.tbWaypointName = this.form.querySelector('.tbWaypointName');
			if (PiLot.Permissions.canWrite()) {
				this.tbWaypointName.addEventListener('change', this.tbWaypointName_change.bind(this));
				RC.Utils.selectOnFocus(this.tbWaypointName);
				this.lnkDelete = this.form.querySelector('.lnkDeleteWaypoint');
				this.lnkDelete.addEventListener('click', this.lnkDeleteWaypoint_click.bind(this));
				const lnkMoveUp = this.form.querySelector('.lnkMoveUp');
				if (index != 0) {
					lnkMoveUp.addEventListener('click', this.lnkMoveUp_click.bind(this));
				}
				lnkMoveUp.classList.toggle('invisible', index == 0);
				const lnkMoveDown = this.form.querySelector('.lnkMoveDown');
				if (!isLast) {
					lnkMoveDown.addEventListener('click', this.lnkMoveDown_click.bind(this));
				}
				lnkMoveDown.classList.toggle('invisible', isLast);
				this.editLatitude = new PiLot.View.Nav.CoordinateForm(this.form.querySelector('.plhLatitude'), true).on('changeCoordinates', this.editLatitude_changeCoordinates.bind(this));
				this.editLongitude = new PiLot.View.Nav.CoordinateForm(this.form.querySelector('.plhLongitude'), false).on('changeCoordinates', this.editLongitude_changeCoordinates.bind(this));

			} else {
				this.form.querySelector('.divButtons').remove();
				this.editLatitude = new CoordinateDisplay(this.form.querySelector('.plhLatitude'), true);
				this.editLongitude = new CoordinateDisplay(this.form.querySelector('.plhLongitude'), false);
			}
			this.divLeg = this.form.querySelector('.divLeg');
			this.lblDistance = this.form.querySelector('.lblDistance');
			this.lblBearing = this.form.querySelector('.lblBearing');
		},

		/// shows the actual data of the waypoint in the form
		showWaypoint: function () {
			if (this.waypoint !== null) {
				this.tbWaypointName.value = this.waypoint.getName();
				var latLon = this.waypoint.getLatLon();
				if (latLon !== null) {
					this.editLatitude.setCoordinate(latLon.lat);
					this.editLongitude.setCoordinate(latLon.lon);
				}
				this.editLatitude.showCoordinate();
				this.editLongitude.showCoordinate();
				this.showLeg();
			}
		},

		/// shows the leg data in the form, also shows/hides
		/// the leg part of the form as necessary
		showLeg: function () {
			const leg = this.waypoint.getLegToNext();
			RC.Utils.showHide(this.divLeg, leg !== null);
			if (leg !== null) {
				this.lblDistance.innerText = PiLot.Utils.Nav.metersToNauticalMiles(leg.distance).toFixed(1);
				this.lblBearing.innerText = RC.Utils.toFixedLength(leg.bearing, 3, 0);
			}
		},

		/**
		 * Allows to highlight a waypoint, by making the title bold, or
		 * to reset the highlight.
		 * @param {Boolean} pIsHighlight - true: highlight, false: reset
		 */
		highlight: function (pIsHighlight) {
			this.tbWaypointName.classList.toggle('bold', pIsHighlight);
		},

		/// returns the outmost html element representing
		/// this waypoint form
		getHtmlElement: function () {
			return this.form;
		}
	};

	/// class LiveRoute, represents a list presentation of a route
	/// which is constantly being updated based on the current
	/// position and movement
	/// @param pOptions: {hideWaypoints: boolean, showCoordinates: boolean, showRouteName: boolean} 
	var LiveRoute = function (pParentContainer, pRouteObserver, pOptions = null) {

		this.parentContainer = pParentContainer;
		this.routeObserver = pRouteObserver;
		this.container = null;
		this.lblRouteName = null;
		this.showWaypointsMode = null;
		this.showCoordinates = true;
		this.showRouteName = false;
		this.liveWaypoints = null;
		this.initialize(pOptions);
	};

	LiveRoute.prototype = {

		initialize: function (pOptions) {
			this.showWaypointsMode = { showPastWaypoints: true, showNextWaypoint: true, showAheadWaypoints: true, showFinalWaypoint: true };
			const hideByDefault = ((pOptions !== null) && (pOptions.hideWaypoints === true));
			this.showCoordinates = ((pOptions !== null) && (pOptions.showCoordinates === true));
			this.showRouteName = ((pOptions !== null) && (pOptions.showRouteName === true));
			this.createLiveWaypoints(hideByDefault);
			this.draw();
		},

		/// populates the list of LiveWaypoints
		createLiveWaypoints: function (pHideByDefault) {
			this.liveWaypoints = new Array();
			if (this.routeObserver !== null) {
				var route = this.routeObserver.getRoute();
				if (route !== null) {
					var waypoints = this.routeObserver.getRoute().getWaypoints();
					for (var i = 0; i < waypoints.length; i++) {
						this.liveWaypoints.push(new LiveWaypoint(waypoints[i], this, this.routeObserver, pHideByDefault));
					}
				}
			}
		},

		/// draws the show/hide links and creates the Waypoints placeholder,
		/// tells the LiveWaypoints to draw themeselves to the Waypoints 
		/// placeholder
		draw: function () {
			this.container = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.liveRoute);
			this.parentContainer.appendChild(this.container);
			this.lblRouteName = this.container.querySelector('.lblRouteName');
			if (this.routeObserver !== null) {
				this.lblRouteName.innerText = this.routeObserver.getRoute().getName();
			}
			this.showHideRouteName();
			const divWaypoints = this.container.querySelector('.divWaypoints');
			for (let i = 0; i < this.liveWaypoints.length; i++) {
				this.liveWaypoints[i].draw(divWaypoints);
			}
		},

		/// updates the visibility for each LiveWaypoint
		updateWaypointsVisibility: function () {
			for (var i = 0; i < this.liveWaypoints.length; i++) {
				this.liveWaypoints[i].update(false, false, true);
			}
		},

		/// sets the waypointsMode, expecting pMode being an object with
		/// { showPastWaypoints: bool, showNextWaypoint: bool, showAheadWaypoints: bool, showFinalWaypoint: bool }
		setWaypointsMode: function (pMode) {
			this.showWaypointsMode = pMode;
			this.updateWaypointsVisibility();
		},

		/// returns the current waypointsMode, an object like
		/// { showPastWaypoints: bool, showNextWaypoint: bool, showAheadWaypoints: bool, showFinalWaypoint: bool }
		getWaypointsMode: function () {
			return this.showWaypointsMode;
		},

		/// sets whether the coordinates for each waypoint should be displayed
		setShowCoordinates: function (pShowCoordinates) {
			this.showCoordinates = pShowCoordinates;
			for (var i = 0; i < this.liveWaypoints.length; i++) {
				this.liveWaypoints[i].update(true, false, false);
			}
		},

		/// gets whether the coordinates for each waypoint should be displayed
		getShowCoordinates: function () {
			return this.showCoordinates;
		},

		/// sets whether the routName sould be visible
		setShowRouteName: function (pShowRouteName) {
			this.showRouteName = pShowRouteName;
			this.showHideRouteName();
		},

		/// shows or hides the route name based on the currently set value.
		showHideRouteName: function () {
			this.lblRouteName.hidden = !this.showRouteName;
		},

		/// shows or hides the entire control
		showHide: function (pIsVisible) {
			this.container.hidden = !pIsVisible;
		}
	};

	/// Represents a single waypoint within the LiveRoute, which automatically
	/// listens to a RouteObserver and updates its content as appropriate
	var LiveWaypoint = function (pWaypoint, pLiveRoute, pRouteObserver, pHideByDefault) {

		this.waypoint = pWaypoint;
		this.liveRoute = pLiveRoute;
		this.routeObserver = pRouteObserver;
		this.hideByDefault = pHideByDefault;
		this.divWaypoint = null;
		this.iconPastWP = null;
		this.iconNextWP = null;
		this.iconAheadWP = null;
		this.iconFinalWP = null;
		this.lblName = null;
		this.lblLat = null;
		this.lblLon = null;
		this.lblETA = null;
		this.lblDist = null;
		this.lblBearing = null;

		this.initialize();

	};

	LiveWaypoint.prototype = {

		initialize: function () {
			this.routeObserver.on('recieveGpsData', this.routObserver_recieveGpsData.bind(this));
		},

		/// handles changed data from the route observer
		routObserver_recieveGpsData: function (pSender, pData) {
			this.update(false, true, true);
		},

		/// draws the control base on the template into pPlaceholder
		draw: function (pPlaceholder) {
			this.divWaypoint = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.liveWaypoint);
			pPlaceholder.appendChild(this.divWaypoint);
			this.iconPastWP = this.divWaypoint.querySelector('.iconPastWP');
			this.iconAheadWP = this.divWaypoint.querySelector('.iconAheadWP');
			this.iconNextWP = this.divWaypoint.querySelector('.iconNextWP');
			this.iconFinalWP = this.divWaypoint.querySelector('.iconFinalWP');
			this.lblName = this.divWaypoint.querySelector('.lblName');
			this.pnlLatLon = this.divWaypoint.querySelector('.pnlLatLon');
			this.lblLat = this.divWaypoint.querySelector('.lblLat');
			this.lblLon = this.divWaypoint.querySelector('.lblLon');
			this.lblETA = this.divWaypoint.querySelector('.lblETA');
			this.lblDist = this.divWaypoint.querySelector('.lblDist');
			this.lblBearing = this.divWaypoint.querySelector('.lblBearing');
			this.update(true, true, true);
		},

		/// gets the data from the routeObserver and updates the gui,
		/// also shows/hides this
		update: function (pUpdateStaticData, pUpdateLiveData, pUpdateVisibility) {
			if (pUpdateStaticData) {
				this.lblName.innerText = this.waypoint.getName();
				if (this.liveRoute.getShowCoordinates()) {
					const latLon = this.waypoint.getLatLon();
					if (latLon !== null) {
						this.lblLat.innerText = PiLot.Utils.Nav.toCoordinateString(latLon.lat, true, true);
						this.lblLon.innerText = PiLot.Utils.Nav.toCoordinateString(latLon.lon, false, true);
					}
					this.pnlLatLon.hidden = false;
				} else {
					this.pnlLatLon.hidden = true;
				}
			}
			let liveData = null;
			if (pUpdateLiveData) {
				liveData = this.routeObserver.getLiveData(this.waypoint);
				if (liveData !== null) {
					this.lblETA.innerText = ((liveData.eta !== null) ? liveData.eta.toFormat('HH:mm') : '--:--');
					this.lblDist.innerText = ((liveData.miles !== null) ? liveData.miles.toFixed(1) : '--');
					this.lblBearing.innerText = ((liveData.bearing !== null) ? RC.Utils.toFixedLength(liveData.bearing, 3, 0) : '---');
					this.divWaypoint.classList.toggle('active', liveData.isNextWaypoint);
					this.divWaypoint.classList.toggle('past', liveData.isPastWaypoint);
					this.iconPastWP.hidden = (!liveData.isPastWaypoint);
					this.iconAheadWP.hidden = (liveData.isPastWaypoint || liveData.isNextWaypoint || liveData.isFinalWaypoint);
					this.iconNextWP.hidden = (!liveData.isNextWaypoint || liveData.isFinalWaypoint || liveData.isPastWaypoint);
					this.iconFinalWP.hidden = (!liveData.isFinalWaypoint || liveData.isPastWaypoint);
				}
			}
			if (pUpdateVisibility) {
				liveData = liveData || this.routeObserver.getLiveData(this.waypoint);
				const waypointsMode = this.liveRoute.getWaypointsMode();
				let doShow;
				if (liveData.hasData) {
					doShow =
						   (liveData.isPastWaypoint === true && waypointsMode.showPastWaypoints)
						|| (liveData.isPastWaypoint === false && waypointsMode.showAheadWaypoints)
						|| (liveData.isNextWaypoint === true && waypointsMode.showNextWaypoint)
						|| (liveData.isFinalWaypoint === true && waypointsMode.showFinalWaypoint);
				} else {
					doShow = !this.hideByDefault;
				}
				this.divWaypoint.hidden = !doShow;
			}
		}
	};

	/**
	 * Shows a list of tracks and allows to select one track
	 * */
	var TracksList = function (pContainer) {
		this.container = pContainer;
		this.plhTracks = null;
		this.observers = null;
		this.initialize();
	};

	TracksList.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['trackSelected']);
			this.draw();
		},

		/** 
		 * Registers an observer which will be called when pEvent happens 
		 * @param {String} pEvent: trackSelected
		 * @param {function} pCallback: the function to call when pEvent happens
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
			return this;
		},

		trackInfo_select: function (pSender) {
			RC.Utils.notifyObservers(this, this.observers, 'trackSelected', pSender.getTrack());
		},

		draw: function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.tracksList);
			this.container.appendChild(control);
			this.plhTracks = control.querySelector('.plhTracks');
		},

		showTracks: function (pTracks) {
			this.plhTracks.clear();
			for (let aTrack of pTracks) {
				new TrackInfo(this.plhTracks, aTrack).on("selected", this.trackInfo_select.bind(this));
			}
		}
	};

	/** Shows basic information about a track, and informs others when it's been clicked */
	var TrackInfo = function (pContainer, pTrack) {
		this.container = pContainer;
		this.track = pTrack;
		this.control = null;
		this.observers = null;
		this.selectedTrack = null;
		this.initialize();
	};

	TrackInfo.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['selected']);
			this.draw();
		},

		/** 
		 * Registers an observer which will be called when pEvent happens 
		 * @param {String} pEvent: selected
		 * @param {function} pCallback: the function to call when pEvent happens
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
			return this;
		},

		control_click: function (pSender) {
			RC.Utils.notifyObservers(this, this.observers, 'selected', pSender.getTrack());
		},

		draw: async function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.trackInfo);
			this.control.addEventListener('click', this.control_click.bind(this));
			this.container.appendChild(this.control);
			this.loadAndShowBoatAsync();
		},

		loadAndShowBoatAsync: async function () {
			const boatConfig = await PiLot.Model.Boat.loadConfigAsync(this.track.getBoat());
			const boatImageConfig = new PiLot.View.Boat.BoatImageConfig(boatConfig);
			this.control.querySelector('.imgBoat').setAttribute('data', boatImageConfig.getBoatImageUrl());
		}
	};

	/** A control showing statistics for a track */
	var TrackStatistics = function (pContainer) {
		this.container = pContainer;
		this.plhDistanceSegments = null;
		this.plhDurationSegments = null;
		this.divNoData = null;
		this.trackService = null;
		this.initialize();
	};

	TrackStatistics.prototype = {

		initialize: function () {
			this.trackService = PiLot.Service.Nav.TrackService.getInstance();
			this.draw();
		},

		draw: function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.trackStatistics);
			this.container.appendChild(control);
			this.plhDistanceSegments = control.querySelector('.plhDistanceSegments');
			this.plhDurationSegments = control.querySelector('.plhDurationSegments');
			this.divNoData = control.querySelector('.divNoData');
		},

		showTrackStatisticsAsync: async function (pTrack) {
			this.clear();
			await this.loadAndShowDataAsync(pTrack.getId()); 
		},

		loadAndShowDataAsync: async function (pTrackId) {
			this.container.hidden = false;
			const trackSegments = await this.trackService.getTrackSegmentsByTrackIdAsync(pTrackId);
			trackSegments.sort((a, b) => a.getType().compareTo(b.getType()));
			const currentLanguage = PiLot.Utils.Language.getLanguage();
			this.plhDistanceSegments.hidden = true;
			this.plhDurationSegments.hidden = true;
			for (const trackSegment of trackSegments) {
				this.showSegment(trackSegment, currentLanguage);
			}
			this.divNoData.hidden = trackSegments.length > 0;
		},

		showSegment: function (pSegment, pLanguage) {
			const isDistance = pSegment.getType().getDistance();
			const control = PiLot.Utils.Common.createNode(
				isDistance ? PiLot.Templates.Nav.trackStatisticsDistanceSegment : PiLot.Templates.Nav.trackStatisticsDurationSegment
			); 
			const segmentType = pSegment.getType();
			const label = segmentType.getLabel(pLanguage);
			control.querySelector('.lblLabel').innerHTML = label;
			const effectiveDurationMS = pSegment.getEndUtc().toMillis() - pSegment.getStartUtc().toMillis();
			const speed = pSegment.getDistance() / (effectiveDurationMS / 1000); // speed in m/s
			if (isDistance) {
				let duration = luxon.Duration.fromObject({ seconds: segmentType.getDistance() / speed });
				control.querySelector('.lblDuration').innerHTML = this.durationToHHMMSS(duration);
				this.plhDistanceSegments.appendChild(control);
				this.plhDistanceSegments.hidden = false;
			} else {
				let distance = speed * segmentType.getDuration();
				let friendlyDistance = PiLot.Utils.Nav.metersToNauticalMiles(distance).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 3 });
				control.querySelector('.lblDistance').innerHTML = friendlyDistance;
				this.plhDurationSegments.appendChild(control);
				this.plhDurationSegments.hidden = false;
			}
			control.querySelector('.lblSpeed').innerHTML = PiLot.Utils.Nav.mpsToKnots(speed).toFixed(2);
			control.querySelector('.lblStartTime').innerHTML = pSegment.getStartBoatTime().toLocaleString(DateTime.TIME_WITH_SECONDS);
			control.querySelector('.lblEndTime').innerHTML = pSegment.getEndBoatTime().toLocaleString(DateTime.TIME_WITH_SECONDS);
		},

		durationToHHMMSS: function (pDuration) {
			const duration = pDuration.rescale();
			const hours = Math.floor(duration.toMillis() / 3600000);
			let result = "";
			if (hours) {
				result = hours + ' h';
			}
			if (hours || duration.minutes) {
				result += ' ' + duration.minutes + "'";
			}
			const seconds = duration.seconds + Math.round(duration.milliseconds / 1000);
			result += seconds + "''";
			return result.trim();
		},

		hide: function () {
			this.container.hidden = true;
		},

		clear: function () {
			this.plhDistanceSegments.clear();
			this.plhDurationSegments.clear();
		}
	};

	/** The form used to configure the anchor watch, and to activate/deactivate it */
	var AnchorWatchForm = function () {
		this.control = null;			// HTMLElement representing the entire control
		this.pnlDialog = null;			// HTMLElement representing the actual dialog
		this.tbRadius = null;
		this.btnActivate = null;
		this.btnCancel = null;
		this.btnDeactivate = null;
		this.btnClose = null;
		this.anchorWatch = null;
		this.initialize();
	};

	AnchorWatchForm.prototype = {

		initialize: function () {
			this.draw();
		},

		/** handles clicks on the dark background by closing the dialog */
		pnlOverlay_click: function () {
			this.hide();
		},

		/** makes sure that clicks are not bubbled to the background, which would close the window */
		pnlDialog_click: function (pEvent) {
			pEvent.stopPropagation();
		},

		tbRadius_keyup: function (pEvent) {
			const val = this.tbRadius.value;
			if (RC.Utils.isNumeric) {
				this.anchorWatch.setRadius(Number(val));
			}
		},

		lnkRadiusPlus_click: function (pEvent) {
			this.changeRadius(5);
		},

		lnkRadiusMinus_click: function (pEvent) {
			this.changeRadius(-5);
		},

		btnActivate_click: function (pEvent) {
			pEvent.preventDefault();
			this.anchorWatch.setEnabled(true);
			this.hide();
		},

		btnCancel_click: function (pEvent) {
			pEvent.preventDefault();
			this.anchorWatch.removeAsync();
			this.hide();
		},

		btnDeactivate_click: function (pEvent) {
			pEvent.preventDefault();
			this.anchorWatch.removeAsync();
			this.hide();
		},

		btnClose_click: function (pEvent) {
			pEvent.preventDefault();
			this.hide();
		},

		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.anchorWatchForm);
			document.body.insertAdjacentElement('afterbegin', this.control);
			PiLot.Utils.Common.bindKeyHandlers(this.control, this.hide.bind(this), null);
			this.control.addEventListener('click', this.pnlOverlay_click.bind(this));
			this.pnlDialog = this.control.querySelector('.pnlDialog');
			this.pnlDialog.addEventListener('click', this.pnlDialog_click.bind(this));
			this.tbRadius = this.pnlDialog.querySelector('.tbRadius');
			this.tbRadius.addEventListener('keyup', this.tbRadius_keyup.bind(this));
			this.control.querySelector('.lnkRadiusMinus').addEventListener('click', this.lnkRadiusMinus_click.bind(this));
			this.control.querySelector('.lnkRadiusPlus').addEventListener('click', this.lnkRadiusPlus_click.bind(this));
			this.btnActivate = this.pnlDialog.querySelector('.btnActivate');
			this.btnActivate.addEventListener('click', this.btnActivate_click.bind(this));
			this.btnCancel = this.pnlDialog.querySelector('.btnCancel');
			this.btnCancel.addEventListener('click', this.btnCancel_click.bind(this));
			this.btnDeactivate = this.pnlDialog.querySelector('.btnDeactivate');
			this.btnDeactivate.addEventListener('click', this.btnDeactivate_click.bind(this));
			this.btnClose = this.pnlDialog.querySelector('.btnClose');
			this.btnClose.addEventListener('click', this.btnClose_click.bind(this));
		},

		/**
		 * Shows the dialog for a certain anchorWatch, making sure the right
		 * data is displayed and the right buttons are visible.
		 * @param {PiLot.Model.Nav.AnchorWatch} pAnchorWatch - the anchorWatch to display, not null
		 */
		showAnchorWatch: function (pAnchorWatch) {
			if (pAnchorWatch) {
				this.anchorWatch = pAnchorWatch;
				this.show();
				const enabled = this.anchorWatch.getEnabled();
				this.tbRadius.value = this.anchorWatch.getRadius();
				this.btnActivate.hidden = enabled;
				this.btnCancel.hidden = enabled;
				this.btnDeactivate.hidden = !enabled;
				this.btnClose.hidden = !enabled;
			} else {
				PiLot.log('Can not show the AnchorWatchForm without an AnchorWatch', 0);
			}
		},

		/** @param {Number} pAmount - The amount to change the radius by. */
		changeRadius: function (pAmount) {
			const radius = this.anchorWatch.getRadius();
			this.anchorWatch.setRadius(Math.max(0, radius + pAmount));
			this.tbRadius.value = this.anchorWatch.getRadius();
		},

		/** Shows the control */
		show: function () {
			document.body.classList.toggle('overflowHidden', true);
			this.control.hidden = false;
			this.pnlDialog.scrollTop = 0;
		},

		/** Hides the entire control */
		hide: function () {
			document.body.classList.toggle('overflowHidden', false);
			this.control.hidden = true;
		}
	};

	/**
	 * This represents the control which is used to show all details about one specific
	 * Point of interest. It can be created once and then be reused to show different pois.
	 * @param {PiLot.View.Nav.PoiForm} pPoiForm - The edit form to use when editing this poi
	 * @param {PiLot.View.Map.MapPois} pMapPois - Connecting this to a map will allow moving the poi
	 */
	var PoiDetails = function(pPoiForm, pMapPois = null){
		this.poiForm = pPoiForm;
		this.mapPois = pMapPois;
		this.boatTime = null;			// PiLot.Model.Common.BoatTime to calculate ETA
		this.poi = null;				// PiLot.Model.Nav.Poi
		this.control = null;			// HTMLElement representing the entire control
		this.pnlDialog = null;			// HTMLElement representing the actual dialog
		this.plhCategoryIcon = null;	// HTMLElement where the icon is inserted
		this.lblCategoryName = null;	// HTMLSpanElement showing the category name
		this.lblTitle = null;			// HTMLSpanElement showing the poi title
		this.pnlLiveData = null;		// HTMLDivElement for current live data (eta etc.)
		this.lblEta = null;				// HTMLSpanElement for the ETA time
		this.lblEtaDuration = null;		// HTMLSpanElement for the duration to arrival
		this.lblDistance = null;		// HTMLSpanElement for the distance to the poi
		this.lblBearing = null;			// HTMLSpanElement for the bearing of the poi
		this.pnlNoLiveData = null;		// HTMLSpanElement for missing live data
		this.lnkShowLiveData = null;	// HTMLAnchorElement for showing the live data
		this.lnkHideLiveData = null;	// HTMLAnchorElement for hiding the live data
		this.pnlFeatures = null;		// HTMLDivElement for label and values of features
		this.ulFeatures = null;			// HTMLUListElement listing all features of this poi
		this.pnlDescription = null;		// HTMLDivElement for label and values of description
		this.lblDescription = null;		// HTMLSpanElement showing the description text
		this.pnlProperties = null;		// HTMLDivElement for label and value of properties
		this.lblProperties = null;		// HTMLSpanElement containing the properties
		this.pnlValidFrom = null;		// HTMLDivElement for label and value of valid from
		this.lblValidFrom = null;		// HTMLSpanElement showing the valid from value
		this.pnlValidTo = null;			// HTMLDivElement for label and value of valid to
		this.lblValidTo = null;			// HTMLSpanElement showing the valid to value
		this.initialize();
	};

	PoiDetails.prototype = {

		initialize: function(){
			this.draw();
			PiLot.Model.Common.getCurrentBoatTimeAsync().then(function (pBoatTime) {
				this.boatTime = pBoatTime;
				gpsObserver = PiLot.Model.Nav.GPSObserver.getInstance();
				gpsObserver.on('recieveGpsData', this.gpsObserver_recieveGpsData.bind(this));
				gpsObserver.on('outdatedGpsData', this.gpsObserver_outdatedGpsData.bind(this));
			}.bind(this));			
		},

		/** handles new data from the gps observer */
		gpsObserver_recieveGpsData: function (pSender, pRecords) {
			if (!this.control.hidden && !this.lnkHideLiveData.hidden) {
				this.showGpsData(pSender);
			}
		},

		/** handles messages form the gps observer that there is no data */
		gpsObserver_outdatedGpsData: function (pSender, pTimeStamp) {
			this.hideGpsData(pSender);
		},

		/** handles clicks on the dark background by closing the dialog */
		pnlOverlay_click: function () {
			this.hide();
		},

		/** makes sure that clicks are not bubbled to the background, which would close the window */
		pnlDialog_click: function (pEvent) {
			pEvent.stopPropagation();
		},

		lnkShowLiveData_click: function (pEvent) {
			pEvent.preventDefault();
			this.showHideLiveData(true);
		},

		lnkHideLiveData_click: function (pEvent) {
			pEvent.preventDefault();
			this.showHideLiveData(false);
		},

		lnkClose_click: function (e) {
			!!e && e.preventDefault();
			this.mapPois.showPoi(this.poi, true, false);
			this.hide();
		},

		lnkEdit_click: function (e) {
			!!e && e.preventDefault();
			this.poiForm.showPoi(this.poi);
			this.hide();
		},

		lnkMove_click: function (e) {
			!!e && e.preventDefault();
			this.mapPois.showPoi(this.poi, true, true);
			this.hide();
		},

		lnkDelete_click: function (e) {
			!!e && e.preventDefault();
			const message = PiLot.Utils.Language.getText('confirmDeletePoi');
			if (window.confirm(message)) {
				this.poi.deleteAsync();
				if (this.mapPois) {
					this.mapPois.removePoi(this.poi);
				}
				this.hide();
			}
		},

		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.poiDetails);
			document.body.insertAdjacentElement('afterbegin', this.control);
			PiLot.Utils.Common.bindKeyHandlers(this.control, this.hide.bind(this), null);
			this.control.addEventListener('click', this.pnlOverlay_click.bind(this));
			this.pnlDialog = this.control.querySelector('.pnlDialog');
			this.pnlDialog.addEventListener('click', this.pnlDialog_click.bind(this));
			this.control.querySelector('.lnkClose').addEventListener('click', this.lnkClose_click.bind(this));
			this.plhCategoryIcon = this.control.querySelector('.plhCategoryIcon');
			this.lblCategoryName = this.control.querySelector('.lblCategoryName');
			this.lblTitle = this.control.querySelector('.lblTitle');
			this.pnlLiveData = this.control.querySelector('.pnlLiveData');
			this.lblEta = this.control.querySelector('.lblEta');
			this.lblEtaDuration = this.control.querySelector('.lblEtaDuration');
			this.lblDistance = this.control.querySelector('.lblDistance');
			this.lblBearing = this.control.querySelector('.lblBearing');
			this.pnlNoLiveData = this.control.querySelector('.pnlNoLiveData');
			this.lnkShowLiveData = this.control.querySelector('.lnkShowLiveData');
			this.lnkShowLiveData.addEventListener('click', this.lnkShowLiveData_click.bind(this));
			this.lnkHideLiveData = this.control.querySelector('.lnkHideLiveData');
			this.lnkHideLiveData.addEventListener('click', this.lnkHideLiveData_click.bind(this));
			this.pnlFeatures = this.control.querySelector('.pnlFeatures');
			this.ulFeatures = this.control.querySelector('.ulFeatures');
			this.pnlDescription = this.control.querySelector('.pnlDescription');
			this.lblDescription = this.control.querySelector('.lblDescription');
			this.pnlProperties = this.control.querySelector('.pnlProperties');
			this.lblProperties = this.control.querySelector('.lblProperties');
			this.pnlValidFrom = this.control.querySelector('.pnlValidFrom');
			this.lblValidFrom = this.control.querySelector('.lblValidFrom');
			this.pnlValidTo = this.control.querySelector('.pnlValidTo');
			this.lblValidTo = this.control.querySelector('.lblValidTo');
			const lnkMove = this.control.querySelector('.lnkMove');
			PiLot.Utils.Common.bindOrHideEditLink(this.control.querySelector('.lnkEdit'), this.lnkEdit_click.bind(this));
			PiLot.Utils.Common.bindOrHideEditLink(lnkMove, this.lnkMove_click.bind(this));
			PiLot.Utils.Common.bindOrHideEditLink(this.control.querySelector('.lnkDelete'), this.lnkDelete_click.bind(this));
			lnkMove.hidden = lnkMove.hidden || !this.mapPois;
			
		},

		/**
		 * Shows the data of a poi.
		 * @param {PiLot.Model.Nav.Poi} pPoi - the Poi to show, not null  
		 */
		showPoi: function (pPoi) {
			this.poi = pPoi;
			this.show();
			const category = this.poi.getCategory();
			this.plhCategoryIcon.innerHTML = PiLot.View.Nav.getPoiCategoryIcon(category.getIcon()); //PiLot.Templates.Nav[`poi_${categoryName}`];
			this.lblCategoryName.innerText = category.getLabel(PiLot.Utils.Language.getLanguage()); //PiLot.Utils.Language.getText(categoryName);
			this.lblTitle.innerText = this.poi.getTitle();
			this.showFeaturesAsync();
			this.showDescription();
			// todo: show properties
			this.showDate(this.poi.getValidFrom(), this.pnlValidFrom, this.lblValidFrom);
			this.showDate(this.poi.getValidTo(), this.pnlValidTo, this.lblValidTo);
		},

		/** Shows the poi features in the current language, or hides the row if there are no features */
		showFeaturesAsync: async function () {
			this.ulFeatures.clear();
			const poiFeatureIds = this.poi.getFeatureIds();
			if (poiFeatureIds.length > 0) {
				this.pnlFeatures.hidden = false;
				const currentLanguage = PiLot.Utils.Language.getLanguage();
				const allFeatures = await PiLot.Service.Nav.PoiService.getInstance().loadFeaturesAsync();
				poiFeatureIds.forEach(function (aFeatureId) {
					const li = document.createElement('li');
					li.innerHTML = allFeatures.get(aFeatureId).getLabel(currentLanguage);
					this.ulFeatures.appendChild(li);
				}.bind(this));
			} else {
				this.pnlFeatures.hidden = true;
			}
		},

		/** Shows the description, replacing links. Hides the row, if there is no description */
		showDescription: function () {
			let description = this.poi.getDescription();
			description = PiLot.Utils.Common.createLinks(description);
			this.lblDescription.innerHTML = description;
			this.pnlDescription.hidden = description.length === 0;
		},

		showHideLiveData: function (pDoShow) {
			if (!pDoShow) {
				this.pnlLiveData.hidden = true;
			}
			this.pnlNoLiveData.hidden = !pDoShow;
			this.lnkHideLiveData.hidden = !pDoShow;
			this.lnkShowLiveData.hidden = pDoShow;
		},

		showGpsData: function (pGpsObserver) {
			const gpsLatLon = pGpsObserver.getLatestPosition().getLatLon();
			const poiLatLon = this.poi.getLatLon();
			const vmg = pGpsObserver.getVMG(poiLatLon);
			const distance = poiLatLon.distanceTo(gpsLatLon);
			const distanceNm = PiLot.Utils.Nav.metersToNauticalMiles(distance);
			const now = this.boatTime.now().setLocale(PiLot.Utils.Language.getLanguage());
			if (vmg > 0) {
				const deltaT = distanceNm / vmg;
				const eta = now.plus({ hours: deltaT });
				const fullHours = Math.floor(deltaT);
				const minutes = Math.floor((deltaT - fullHours) * 60);
				const minutesString = minutes < 10 ? `0${minutes}` : minutes.toString();
				this.lblEtaDuration.innerHTML = `${fullHours}:${minutesString}&thinsp;h`;
				this.lblEta.innerText = eta.toLocaleString(DateTime.TIME_SIMPLE);
			} else {
				this.lblEta.innerText = '--:--';
				this.lblEtaDuration.innerText = '--:--';
			}
			const bearing = gpsLatLon.initialBearingTo(poiLatLon);
			this.lblDistance.innerText = ((distanceNm * 100) / 100).toFixed(2);
			this.lblBearing.innerText = Math.round(bearing);
			this.pnlNoLiveData.hidden = true;
			this.pnlLiveData.hidden = false;
		},

		hideGpsData: function () {
			this.pnlLiveData.hidden = true;
			this.pnlNoLiveData.hidden = false;
		},

		/**
		 * Shows a date or hides the entire panel, if there is no date
		 * @param {Luxon.DateTime} pDate
		 * @param {HTMLElement} pPanel
		 * @param {HTMLElement} pLabel
		 */
		showDate: function (pDate, pPanel, pLabel) {
			if (pDate !== null) {
				pPanel.hidden = false;
				pLabel.innerText = pDate.toLocaleString(DateTime.DATE_SHORT);
			} else {
				pPanel.hidden = true;
			}
		},

		/** Shows the control */
		show: function () {
			document.body.classList.toggle('overflowHidden', true);
			this.control.hidden = false;
			this.pnlDialog.scrollTop = 0;
		},

		/** Hides the entire control */
		hide: function () {
			document.body.classList.toggle('overflowHidden', false);
			this.hideGpsData();
			this.control.hidden = true;
		}
	};

	/**
	 * Creates the poi category icon based on the icon information stored with the poi.
	 * Starting with "css:", an i element with the given class is returned, 
	 * starting with "img:", an image with its source in /img/icons and the given filename is returned,
	 * else the raw value is returned
	 * @param {String} pRawIcon - css:icon, svg:icon; see method description
	 */
	var getPoiCategoryIcon = function (pRawIcon) {
		let result;
		if (!pRawIcon) {
			result = '';
		}
		else if (pRawIcon.startsWith('css:')) {
			result = PiLot.Templates.Nav.poiCategoryIconCss.replace("{{icon}}", pRawIcon.substring(4));
		}
		else if (pRawIcon.startsWith('svg:')) {
			result = PiLot.Templates.Nav.poiCategoryIconSvg.replace("{{icon}}", pRawIcon.substring(4));
		}
		else result = pRawIcon;
		return result;
	};

	/**
	 * Represents the form that is used to enter or edit a point of interest 
	 * @param {PiLot.View.Map.MapPois} pMapPois - to ensure markers are added/updated, can be null
	 * @param {HTMLElement} pContainer - the container that will contain the form. Null will show it as modal dialog.
	 * */
	var PoiForm = function (pMapPois, pContainer) {
		this.poi = null;				
		this.mapPois = pMapPois;
		this.container = pContainer;
		this.control = null;
		this.lblTitleAddPoi = null;
		this.lblTitleEditPoi = null;
		this.tbTitle = null;
		this.ddlCategory = null;
		this.tbDescription = null;
		this.poiFeaturesSelector = null;		// PiLot.View.Nav.PoiFeaturesSelector
		this.editLatitude = null;
		this.editLongitude = null;
		this.lblAllowDrag = null;
		this.calValidFrom = null;
		this.calValidTo = null;
		this.pnlSource = null;
		this.tbSource = null;
		this.tbSourceId = null;
		this.observers = null;					// Map for observable pattern
		this.initializeAsync();
	};

	PoiForm.prototype = {

		initializeAsync: async function () {
			this.observers = RC.Utils.initializeObservers(['save', 'cancel']);
			await this.drawAsync();
		},

		/**
		 * Registers an observer which will be called when pEvent happens.
		 * @param {String} pEvent - "save", "cancel"
		 * @param {Function} pCallback
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		lnkClearValidFrom_click: function (e) {
			e.preventDefault();
			this.calValidFrom.date(null);
			this.calValidFrom.showDate();
		},

		lnkClearValidTo_click: function (e) {
			e.preventDefault();
			this.calValidTo.date(null);
			this.calValidTo.showDate();
		},

		btnSave_click: async function (e) {
			!!e && e.preventDefault();
			if (await this.saveDataAsync()) {
				RC.Utils.notifyObservers(this, this.observers, 'save', this.poi);
				this.hide();
			}
		},

		btnCancel_click: function (e) {
			!!e && e.preventDefault();
			RC.Utils.notifyObservers(this, this.observers, 'cancel', this.poi);
			this.hide();
		},

		drawAsync: async function () {
			if (!this.container) {
				this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.editPoiDialog);
				this.control.querySelector('.pnlDialog').appendChild(PiLot.Utils.Common.createNode(PiLot.Templates.Nav.poiForm));
				document.body.insertAdjacentElement('afterbegin', this.control);
				PiLot.Utils.Common.bindKeyHandlers(this.control, this.btnCancel_click.bind(this), this.btnSave_click.bind(this));
			} else {
				this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.poiForm);
				this.container.appendChild(this.control);
			}
			this.lblTitleAddPoi = this.control.querySelector('.lblTitleAddPoi');
			this.lblTitleEditPoi = this.control.querySelector('.lblTitleEditPoi');
			this.tbTitle = this.control.querySelector('.tbTitle');
			this.ddlCategory = this.control.querySelector('.ddlCategory');
			this.tbDescription = this.control.querySelector('.tbDescription');
			this.editLatitude = new CoordinateForm(this.control.querySelector('.plhLatitude'), true);
			this.editLongitude = new CoordinateForm(this.control.querySelector('.plhLongitude'), false);
			this.lblAllowDrag = this.control.querySelector('.lblAllowDrag');
			const locale = PiLot.Utils.Language.getLanguage();
			this.calValidFrom = new RC.Controls.Calendar(this.control.querySelector('.calValidFrom'), this.control.querySelector('.tbValidFrom'), null, null, null, locale);
			this.control.querySelector('.lnkClearValidFrom').addEventListener('click', this.lnkClearValidFrom_click.bind(this));
			this.calValidTo = new RC.Controls.Calendar(this.control.querySelector('.calValidTo'), this.control.querySelector('.tbValidTo'), null, null, null, locale);
			this.control.querySelector('.lnkClearValidTo').addEventListener('click', this.lnkClearValidTo_click.bind(this));
			this.calValidFrom.setMaxDateCalendar(this.calValidTo);
			this.calValidTo.setMinDateCalendar(this.calValidFrom);
			this.pnlSource = this.control.querySelector('.pnlSource');
			this.tbSource = this.control.querySelector('.tbSource');
			this.tbSourceId = this.control.querySelector('.tbSourceId');
			this.control.querySelector('.btnSave').addEventListener('click', this.btnSave_click.bind(this));
			this.control.querySelector('.btnCancel').addEventListener('click', this.btnCancel_click.bind(this));
			await Promise.all([this.populateCategoriesAsync(), this.addFeaturesSelectorAsync()]);

		},

		/** Populates the category dropdown with a hierarchic, ordered list of categories */
		populateCategoriesAsync: async function () {
			await new CategoriesDropDown(this.ddlCategory).populateDropdownAsync();
		},

		addFeaturesSelectorAsync: async function () {
			this.poiFeaturesSelector = new PoiFeaturesSelector();
			await this.poiFeaturesSelector.addControlAsync(this.control.querySelector('.plhFeatures'));
		},

		/**
		 * Shows the form for entering a new poi
		 * @param {LatLng} pLatLng - optionally pass a position
		 * @param {String} pSource - optionally pass a source for external pois
		 * @param {String} pSourceId - optionally pass a source id for external pois
		 * @param {String} pTitle - optionally pass a title
		 * @param {String} pDescription - optionally pass a description
		 */
		showEmpty: function (pLatLng = null, pSource = null, pSourceId = null, pTitle = null, pDescription = null) {
			this.poi = null;
			this.show();
			this.populateFields(pLatLng, pSource, pSourceId, pTitle, pDescription);
		},

		/**
		 * Shows the form to edit a poi
		 * @param {PiLot.Model.Nav.Poi} pPoi
		 */
		showPoi: function (pPoi) {
			this.poi = pPoi;
			this.show();
			this.populateFields();
		},

		/**
		 * Populates the form fields with the current poi, or empties them, if there
		 * is no poi. For creating new pois, a position can be passed.
		 * @param {LatLng} pLatLng - optionally pass a position to pre-set
		 * @param {String} pSource - optionally pass a source for external pois
		 * @param {String} pSourceId - optionally pass a source id for external pois
		 * @param {String} pTitle - optionally pass a title
		 * @param {String} pDescription - optionally pass a description
		 */
		populateFields: function (pLatLng = null, pSource = null, pSourceId = null, pTitle = null, pDescription = null) {
			this.lblTitleAddPoi.hidden = this.poi !== null;
			this.lblTitleEditPoi.hidden = this.poi === null;
			let latLng;
			if (this.poi !== null) {
				this.tbTitle.value = this.poi.getTitle();
				this.ddlCategory.value = this.poi.getCategory().getId();
				this.tbDescription.value = this.poi.getDescription();
				this.poiFeaturesSelector.setSelectedFeatureIds(this.poi.getFeatureIds());
				latLng = this.poi.getLatLng();
				this.calValidFrom.date(this.poi.getValidFrom());
				this.calValidTo.date(this.poi.getValidTo());
				this.tbSource.value = this.poi.getSource();
				this.tbSourceId.value = this.poi.getSourceId();
			} else {
				this.tbTitle.value = pTitle || "";
				this.ddlCategory.value = "";
				this.tbDescription.value = pDescription || "";
				this.poiFeaturesSelector.setSelectedFeatureIds([]);
				latLng = pLatLng;
				this.calValidFrom.date(null);
				this.calValidTo.date(null);
				this.tbSource.value = pSource;
				this.tbSourceId.value = pSourceId;
			}
			this.editLatitude.setCoordinate(latLng ? latLng.lat : null).showCoordinate();
			this.editLongitude.setCoordinate(latLng ? latLng.lng : null).showCoordinate();
			this.calValidFrom.showDate(this.calValidFrom.date());
			this.calValidTo.showDate(this.calValidTo.date());
			this.pnlSource.hidden = !this.tbSource.value;
			this.tbTitle.focus();
		},

		/** Reads the data from the form, assigns the fields to the existing or a new poi, and saves it. */
		saveDataAsync: async function () {
			let result = false;
			const allCategories = await PiLot.Service.Nav.PoiService.getInstance().getCategoriesAsync();
			let category = null;
			if (RC.Utils.isNumeric(this.ddlCategory.value)){
				category = allCategories.get(Number(this.ddlCategory.value));
			}
			const lat = this.editLatitude.getCoordinate();
			const lon = this.editLongitude.getCoordinate();
			if (category && lat && lon) {
				this.poi = this.poi || new PiLot.Model.Nav.Poi();
				this.poi.setTitle(this.tbTitle.value);
				this.poi.setCategory(category);
				this.poi.setDescription(this.tbDescription.value);
				this.poi.setFeatureIds(this.poiFeaturesSelector.getSelectedFeatureIds());
				this.poi.setLatLng(lat, lon);
				this.poi.setValidFrom(this.calValidFrom.date());
				this.poi.setValidTo(this.calValidTo.date());
				this.poi.setSource(this.tbSource.value);
				this.poi.setSourceId(this.tbSourceId.value);
				await this.poi.saveAsync();
				if (this.mapPois) {
					this.mapPois.showPoi(this.poi, true, false);
				}
				result = true;
			} else {
				alert(PiLot.Utils.Language.getText('mandatoryPoiFields'));
			}
			return result;
		},

		/** Shows the control */
		show: function () {
			document.body.classList.toggle('overflowHidden', true);
			this.control.hidden = false;
		},

		/** Hides the entire control */
		hide: function () {
			if (!this.container) {
				document.body.classList.toggle('overflowHidden', false);
				this.control.hidden = true;
			}
		}
	};

	/**
	 * This creates a list of poi ategories to be used in guis, where the 
	 * hierarchy of categories should be visible. The list is sorted by 
	 * translated title, and the children are always shown directly after the parent.
	 * @param {Map} pCategoriesMap - Map with key = id, value = category
	 * @param {Boolean} pSortByName - Set true, if the list should be sorted by name instad of label.
	 */
	var CategoriesList = function (pCategoriesMap, pSortByName = false) {
		this.categoriesMap = pCategoriesMap;
		this.sortByName = pSortByName;
		this.categoriesList = null;
		this.initialize();
	};

	CategoriesList.prototype = {

		initialize: function () {
			this.buildList();
		},

		/** Gets the root categories, and starts building the list by passing them to the recursion */
		buildList: function () {
			this.categoriesList = [];
			const rootCategories = [];
			this.categoriesMap.forEach(function (v, k) {
				if (v.getLevel() === 0) {
					rootCategories.push(v);
				}
			});
			this.addChildCategoriesRec(rootCategories);
		},

		/**
		 * Takes an array of categories, translates them titles, and sorts them by title. Then
		 * adds each category (and recursively its children) to an array of {title, category}
		 * @param {PiLot.Model.Nav.PoiCategory[]} pCategories - the list of categories
		 */
		addChildCategoriesRec: function (pCategories) {
			const categoriesWithTitle = [];
			const language = PiLot.Utils.Language.getLanguage();
			pCategories.forEach(function (c) {
				const title = this.sortByName ? c.getName() : c.getLabel(language);
				categoriesWithTitle.push({ title: title, category: c });
			}.bind(this));
			categoriesWithTitle.sort((a, b) => a.title.localeCompare(b.title));
			for (let i = 0; i < categoriesWithTitle.length; i++) {
				category = categoriesWithTitle[i].category;
				this.categoriesList.push(categoriesWithTitle[i])
				this.addChildCategoriesRec(category.getChildren());
			}			
		},

		/** @returns {Object[]} with {title, category} sorted by parent-child and title */
		getSortedList: function () {
			return this.categoriesList;
		}
	};

	/**
	 * Helper for Categories dropdowns. Allows to fill a dropdown with categories, showing
	 * the hierarchiy by indenting the elements. You will have to call populateDropDownAsync
	 * in order to fill the dropdown
	 * @param {HTMLSelectElement} pDropDown - the dropdown to fill
	 * @param {PiLot.Model.Nav.PoiCategory} pIgnoreBranch - if set, the category and all its descendants will be ignored (useful for the "parent" ddl)
	 */
	var CategoriesDropDown = function (pDropDown, pIgnoreBranch = null) {
		this.dropDown = pDropDown;
		this.ignoreBranch = pIgnoreBranch;
	};

	CategoriesDropDown.prototype = {

		/** populates the dropdown with the categories */
		populateDropdownAsync: async function () {
			const poiService = PiLot.Service.Nav.PoiService.getInstance();
			const allCategories = await poiService.getCategoriesAsync();
			const sortedList = new CategoriesList(allCategories).getSortedList();
			const ddlCategories = [];
			let ddlTitle;
			let category;
			for (let i = 0; i < sortedList.length; i++) {
				category = sortedList[i].category;
				if (
					!this.ignoreBranch
					|| (category.getId() !== this.ignoreBranch.getId() && !category.isDescendantOf(this.ignoreBranch))
				) {
					ddlTitle = "";
					for (let j = 0; j < category.getLevel(); j++) {
						ddlTitle += "- "
					}
					ddlTitle += sortedList[i].title;
					ddlCategories.push([category.getId(), ddlTitle]);
				}
			}
			RC.Utils.fillDropdown(this.dropDown, ddlCategories, "");
		}

	}

	/**
	 * The list of features, each with a checkbox. Plus a search textbox which allows
	 * to search for specific items, and a show all / show selected option. To be used
	 * wherever there is a need to select poi features.
	 * */
	var PoiFeaturesSelector = function () {
		this.control = null;
		this.showAll = false;
		this.checkboxMap = null;			// Map with key: feature, value: {checkboxControl, checkbox}
		this.currentLanguage = null;
		this.lnkShowAll = null;
		this.lnkShowSelected = null;
		this.tbSearch = null;
		this.initialize();
	};

	PoiFeaturesSelector.prototype = {

		initialize: function () {
			this.checkboxMap = new Map();
			this.currentLanguage = PiLot.Utils.Language.getLanguage();
		},

		tbSearch_keyUp: function (e) {
			this.filterFeatures(e.target.value);
		},

		lnkShowAll_click: function (e) {
			e.preventDefault();
			this.toggleShowAll(true);
		},

		lnkShowSelected_click: function (e) {
			e.preventDefault();
			this.toggleShowAll(false);
		},

		lnkClear_click: function (e) {
			e.preventDefault();
			this.tbSearch.value = '';
			this.filterFeatures('');
			this.tbSearch.focus();
		},

		cbFeature_change: function (pCheckboxObj, pFeature) {
			const key = this.tbSearch.value.toLowerCase();
			this.decideCheckboxVisible(pCheckboxObj, pFeature, key);
		},

		drawAsync: async function (pContainer) {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.poiFeaturesSelector);
			pContainer.appendChild(this.control);
			this.tbSearch = this.control.querySelector('.tbSearch');
			this.tbSearch.addEventListener('keyup', this.tbSearch_keyUp.bind(this));
			this.control.querySelector('.lnkClear').addEventListener('click', this.lnkClear_click.bind(this));
			this.lnkShowAll = this.control.querySelector('.lnkShowAll');
			this.lnkShowAll.addEventListener('click', this.lnkShowAll_click.bind(this));
			this.lnkShowSelected = this.control.querySelector('.lnkShowSelected');
			this.lnkShowSelected.addEventListener('click', this.lnkShowSelected_click.bind(this));
			const plhFeatureCheckboxes = this.control.querySelector('.plhFeatureCheckboxes');
			const sortedFeatures = await this.getSortedFeaturesAsync();
			sortedFeatures.forEach(function (pFeature) {
				const cbControl = PiLot.Utils.Common.createNode(PiLot.Templates.Common.checkbox);
				const cbCheckbox = cbControl.querySelector('.cbCheckbox');
				const lblLabel = cbControl.querySelector('.lblLabel');
				const cbObj = { checkboxControl: cbControl, checkbox: cbCheckbox };
				this.checkboxMap.set(pFeature.feature, cbObj);
				lblLabel.innerText = pFeature.label;
				plhFeatureCheckboxes.appendChild(cbControl);
				this.decideCheckboxVisible(cbObj, pFeature.feature, '');
				cbCheckbox.addEventListener('change', this.cbFeature_change.bind(this, cbObj, pFeature.feature));
			}.bind(this));
		},

		/**
		 * Call this to add the control (and actually draw it) to a containing element
		 * @param {HTMLDivElement} pContainer - The container where this will be added
		 * @returns {Promise} - The promise that will resolve once the control is drawn.
		 */
		addControlAsync: function (pContainer) {
			return this.drawAsync(pContainer);
		},

		/**
		 * Toggles between showing all features, or only those that are selected or
		 * matching the search criteria
		 * @param {Boolean} pShowAll
		 */
		toggleShowAll: function (pShowAll) {
			this.tbSearch.value = '';
			this.showAll = pShowAll;
			this.lnkShowAll.hidden = pShowAll;
			this.lnkShowSelected.hidden = !pShowAll;
			this.filterFeatures(this.tbSearch.value);
		},

		/** 
		 *  Creates an array with objects {label, feature}, using the label in the
		 *  current language and ordered by that label.
		 *  @returns {Array} - Array of objects { label, feature }
		 * */
		getSortedFeaturesAsync: async function () {
			const result = [];
			const allFeatures = await PiLot.Service.Nav.PoiService.getInstance().getFeaturesAsync();
			allFeatures.forEach(function (pFeature) {
				const label = pFeature.getLabel(this.currentLanguage);
				result.push({ label: label, feature: pFeature });
			}.bind(this));
			result.sort((a, b) => a.label.localeCompare(b.label));
			return result;
		},

		/**
		 * Decides for each checkbox and label whether it should be visisble, based
		 * on the search key and the current setting for "show all". Checked checkboxes
		 * are always visible.
		 * @param {String} pKey - the search key
		 */
		filterFeatures: function (pKey) {
			const key = pKey.toLowerCase();
			this.checkboxMap.forEach(function (pCheckboxObj, pFeature) {
				this.decideCheckboxVisible(pCheckboxObj, pFeature, key);
			}.bind(this));
		},

		/**
		 * Decides for a single feature checkbox wheather it should be visible or not
		 * @param {Object} pCheckboxObj - Object with {cbControl, cbCheckbox}
		 * @param {PiLot.Model.Nav.PoiFeature} pFeature
		 * @param {String} pKey - The search key. Saves a handful of toLower operations...
		 */
		decideCheckboxVisible: function (pCheckboxObj, pFeature, pKey) {
			pCheckboxObj.checkboxControl.hidden = (
				(
					!pFeature.getLabel(this.currentLanguage).toLowerCase().includes(pKey)
					|| ((pKey === '') && !this.showAll)
				)
				&& !pCheckboxObj.checkbox.checked
			);
		},

		/**
		 * Sets the selected features, based on id. This should only be called 
		 * after the control has been drawn.
		 * @param {Array} pFeatureIds - Array of numbers
		 */
		setSelectedFeatureIds: function (pFeatureIds) {
			this.checkboxMap.forEach(function (pObjCheckbox, pFeature) {
				pObjCheckbox.checkbox.checked = pFeatureIds.includes(pFeature.getId())
			});
			this.filterFeatures('');
		},

		/** 
		 * Gets the ids of the features for which the checkboxes are checked.
		 * @returns {Array} - Array of numbers
		 * */
		getSelectedFeatureIds: function () {
			const result = [];
			this.checkboxMap.forEach(function (pObjCheckbox, pFeature) {
				if (pObjCheckbox.checkbox.checked) {
					result.push(pFeature.getId());
				}
			});
			return result;
		}
	};

	/// The control to be used on the start page, showing telemetry and
	/// route information
	var StartPageNav = function (pContainer, pStartPage, pBoatTime, pGpsObserver) {
		this.container = pContainer;
		this.startPage = pStartPage;
		this.boatTime = pBoatTime;
		this.gpsObserver = pGpsObserver;
		this.routeObserver = null;
		this.controls = null;
		this.initialize();
	};

	StartPageNav.prototype = {

		initialize: function () {
			this.controls = new Array();
			this.gpsObserver.on('recieveGpsData', this.gpsObserver_recieveGpsData.bind(this));
			this.gpsObserver.on('outdatedGpsData', this.gpsObserver_outdatedGpsData.bind(this));
			this.startPage.on('changingLayout', this.startPage_changingLayout.bind(this));
			this.startPage.on('changedLayout', this.startPage_changedLayout.bind(this));
			this.startPage.on('resize', this.startPage_resize.bind(this));
			PiLot.Model.Nav.loadActiveRouteAsync().then(pRoute => this.activeRouteLoaded(pRoute));
		},

		/// before a layout change is applied, we hide everything because
		/// otherwise it can break the layout
		startPage_changingLayout: function (pSender, pEventArgs) {
			this.hideAll();
		},

		/// ensures the right click handler and control visibility
		/// after the layout has changed
		startPage_changedLayout: function (pSender, pEventArgs) {
			var isMinimized = (!pEventArgs.sameSize && (pEventArgs.mainControl !== this));
			this.setContainerClick(isMinimized);
			this.decideControlsVisible();
		},

		startPage_resize: function () {
			this.decideControlsVisible();
		},

		/// handles recieving new data from the gps
		gpsObserver_recieveGpsData: function (pSender, pData) {
			this.updateControlsData(false);
		},

		/// shows a warning if we have no current gps data
		gpsObserver_outdatedGpsData: function () {
			this.updateControlsData(false);
		},

		routeObserver_recieveGpsData: function () {
			this.updateControlsData(true);
		},

		/// creates the routeObservers and binds its handlers
		/// as soon as we have a current route
		activeRouteLoaded: function (pRoute) {
			if (pRoute !== null) {
				this.routeObserver = new PiLot.Model.Nav.RouteObserver(pRoute, this.gpsObserver, this.boatTime, { autoCalculate: true });
				this.routeObserver.on('recieveGpsData', this.routeObserver_recieveGpsData.bind(this));
			} else {
				this.routeObserver = null;
			}
			this.draw();
		},

		/// draws the controls, and adds them to the controls array
		draw: function () {
			const mainContainer = RC.Utils.stringToNode(PiLot.Templates.Nav.startPageNav);
			this.container.appendChild(mainContainer);
			const sogIndicator = new PiLot.View.Nav.MotionDisplay(mainContainer, PiLot.Templates.Nav.sogIndicator, null, 1);
			this.controls.push({
				control: sogIndicator,
				decideIsVisible: this.decideMotionDisplayVisible.bind(this, 8000, false),
				isVisible: null,
				needsRoute: false,
				updateData: sogIndicator.showValue.bind(sogIndicator, this.gpsObserver.getSOG.bind(this.gpsObserver)),
				showHide: sogIndicator.showHide.bind(sogIndicator)
			});
			const vmgIndicator = new PiLot.View.Nav.MotionDisplay(mainContainer, PiLot.Templates.Nav.vmgIndicator, null, 1);
			this.controls.push({
				control: vmgIndicator,
				decideIsVisible: this.decideMotionDisplayVisible.bind(this, 8000, true),
				isVisible: null,
				needsRoute: true,
				updateData: vmgIndicator.showValue.bind(vmgIndicator, this.routeObserver !== null ? this.routeObserver.getVMG.bind(this.routeObserver) : null),
				showHide: vmgIndicator.showHide.bind(vmgIndicator)
			});
			const cogIndicator = new PiLot.View.Nav.MotionDisplay(mainContainer, PiLot.Templates.Nav.cogIndicator, 3, 0); 
			this.controls.push({
				control: cogIndicator,
				decideIsVisible: this.decideMotionDisplayVisible.bind(this, 17000, false),
				isVisible: null,
				needsRoute: false,
				updateData: cogIndicator.showValue.bind(cogIndicator, this.gpsObserver.getCOG.bind(this.gpsObserver)),
				showHide: cogIndicator.showHide.bind(cogIndicator)
			});
			const xteIndicator = new PiLot.View.Nav.XTEIndicator(mainContainer);
			this.controls.push({
				control: xteIndicator,
				decideIsVisible: this.decideMotionDisplayVisible.bind(this, 30000, true),
				isVisible: null,
				needsRoute: true,
				updateData: xteIndicator.showValue.bind(xteIndicator, this.routeObserver),
				showHide: xteIndicator.showHide.bind(xteIndicator)
			});
			const liveRoute = new PiLot.View.Nav.LiveRoute(mainContainer, this.routeObserver, { hideWaypoints: true, showCoordinates:false });
			liveRoute.showHide(false);
			this.controls.push({
				control: liveRoute,
				decideIsVisible: this.decideLiveRouteVisible.bind(this, liveRoute),
				isVisible: false,
				needsRoute: true,
				updataData: null,
				showHide: liveRoute.showHide.bind(liveRoute)
			});
			this.decideControlsVisible();
			this.setContainerClick(this.startPage.isMinimized(this));
		},

		/// checks for each control if it should be visible under the given circumstances, 
		/// and shows/hides it accordingly.
		decideControlsVisible: function () {
			const height = this.container.clientHeight;
			const width = this.container.clientWidth;
			const magicFactor = Math.pow((Math.max(height, width) / Math.min(height, width)), 0.5)
			var areaAvailable = height * width / magicFactor;
			var isVisibleResult;
			this.controls.forEach(function (aControl) {
				isVisibleResult = aControl.decideIsVisible(areaAvailable);
				if (isVisibleResult.visible) {
					areaAvailable = isVisibleResult.areaRemaining;
					if (!aControl.isVisible) {
						aControl.showHide(true);
						aControl.isVisible = true;
					}
				} else {
					if ((aControl.isVisible == null) || (aControl.isVisible)) {
						aControl.showHide(false);
						aControl.isVisible = false;
					}
				}
			}.bind(this));
		},

		/// decides whether a certain telemetry display should be displayed,
		/// based on the area available / needed and whether a route is available.
		/// returns whether the control should be shown and the remaining available area
		/// @returns object {visible, areaRemaining}
		decideMotionDisplayVisible: function (pAreaNeeded, pNeedsRoute, pAreaAvailable) {
			var result = { visible: false, areaRemaining: pAreaAvailable };
			if ((pAreaAvailable >= pAreaNeeded) && (!pNeedsRoute || this.routeObserver !== null)) {
				result.visible = true;
				result.areaRemaining = pAreaAvailable - pAreaNeeded;
			}
			return result;
		},

		/// decides whether the liveRout should be visible, and already sets the waypoints
		/// mode, defining which waypoints should be visible based on the space available
		decideLiveRouteVisible: function (pLiveRoute, pAreaAvailable) {
			var result = { visible: false, areaRemaining: pAreaAvailable };
			if (this.routeObserver !== null) {
				var showRouteName = false;
				var mode = { showPastWaypoints: false, showNextWaypoint: false, showAheadWaypoints: false, showFinalWaypoint: true };
				if (result.areaRemaining > 45000) {
					result.visible = true;
					result.areaRemaining -= 45000;
				}
				if (result.areaRemaining > 45000) {
					mode.showNextWaypoint = true;
					result.areaRemaining -= 45000;
				}
				if (result.areaRemaining > 30000) {
					showRouteName = true;
					result.areaRemaining -= 30000;
				}
				pLiveRoute.setShowRouteName(showRouteName);
				pLiveRoute.setWaypointsMode(mode);
			}
			return result;
		},

		/// hides all controls. This is needed, as otherwise the bounding rectangle
		/// is too big, which will result in an wrong calculation of what to show.
		hideAll: function () {
			this.controls.forEach(function (aControl) {
				if (aControl.isVisible || aControl.isVisible === null) {
					aControl.showHide(false);
					aControl.isVisible = false;
				}
			}.bind(this));
		},

		/// updates the data on all visible controls by calling the
		/// updateData function of each control
		/// @param pIsRouteData: true, if the event was triggered by the routeObserver, false
		/// if it was triggered by the gpsObserver
		updateControlsData: function (pIsRouteData) {
			this.controls.forEach(function (aControl) {
				if (aControl.isVisible && (typeof aControl.updateData === 'function') && (aControl.needsRoute === pIsRouteData)) {
					aControl.updateData();
				}
			}.bind(this));
		},

		/// this sets the appropriate onclick handler to the container, either
		/// just doing nothing, or setting this as main control
		setContainerClick: function (pIsMinimized) {
			if (pIsMinimized) {
				this.container.onclick = function (e) {
					e.stopPropagation();
					this.startPage.setMainControl(this);
				}.bind(this);
			} else {
				this.container.onclick = null;
			}
		},

	};

	/// return the classes
	return {
		CoordinateForm: CoordinateForm,
		MotionDisplay: MotionDisplay,
		XTEIndicator: XTEIndicator,
		NavPage: NavPage,
		NavOptions: NavOptions,
		RoutesList: RoutesList,
		RouteDetail: RouteDetail,
		LiveRoute: LiveRoute,
		TracksList: TracksList,
		TrackStatistics: TrackStatistics,
		AnchorWatchForm: AnchorWatchForm,
		PoiDetails: PoiDetails,
		getPoiCategoryIcon: getPoiCategoryIcon,
		PoiForm: PoiForm,
		PoiFeaturesSelector: PoiFeaturesSelector,
		CategoriesList: CategoriesList,
		CategoriesDropDown: CategoriesDropDown,
		StartPageNav: StartPageNav
	};

})();
