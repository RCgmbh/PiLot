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
				var xteDistanceMiles = PiLot.Utils.Common.metersToNauticalMiles(xte.distance);
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
				this.gpsObserver = new PiLot.Model.Nav.GPSObserver(this.boatTime);
				if (results[1] !== null) {
					this.routeObserver = new PiLot.Model.Nav.RouteObserver(results[1], this.gpsObserver, this.boatTime, { autoCalculate: true });
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
				this.liveRoute = new LiveRoute($(navPage), this.routeObserver);
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
			//this.control = $(PiLot.Templates.Nav.navOptions).prependTo(this.container);
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Nav.navOptions);
			this.container.insertAdjacentElement('afterbegin', this.control);
			//this.control.find('a.expandCollapse').on('click', this.lnkToggleSettings_click.bind(this));
			this.control.querySelector('a.expandCollapse').addEventListener('click', this.lnkToggleSettings_click.bind(this));
			//this.lnkToggleCoordinates = this.control.find('.lnkToggleCoordinates').on('click', this.lnkToggleCoordinates_click.bind(this));
			this.lnkToggleCoordinates = this.control.querySelector('.lnkToggleCoordinates');
			this.lnkToggleCoordinates.addEventListener('click', this.lnkToggleCoordinates_click.bind(this));
			//this.lnkTogglePastWaypoints = this.control.find('.lnkTogglePastWaypoints').on('click', this.lnkTogglePastWaypoints_click.bind(this));
			this.lnkTogglePastWaypoints = this.control.querySelector('.lnkTogglePastWaypoints');
			this.lnkTogglePastWaypoints.addEventListener('click', this.lnkTogglePastWaypoints_click.bind(this));
			//this.lnkToggleNextWaypoint = this.control.find('.lnkToggleNextWaypoint').on('click', this.lnkToggleNextWaypoint_click.bind(this));
			this.lnkToggleNextWaypoint = this.control.querySelector('.lnkToggleNextWaypoint');
			this.lnkToggleNextWaypoint.addEventListener('click', this.lnkToggleNextWaypoint_click.bind(this));
			//this.lnkToggleAheadWaypoints = this.control.find('.lnkToggleAheadWaypoints').on('click', this.lnkToggleAheadWaypoints_click.bind(this));
			this.lnkToggleAheadWaypoints = this.control.querySelector('.lnkToggleAheadWaypoints');
			this.lnkToggleAheadWaypoints.addEventListener('click', this.lnkToggleAheadWaypoints_click.bind(this));
			//this.lnkToggleFinalWaypoint = this.control.find('.lnkToggleFinalWaypoint').on('click', this.lnkToggleFinalWaypoint_click.bind(this));
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
			contentArea.appendChildren(RC.Utils.stringToNodes(PiLot.Templates.Nav.routesPage));
			const lnkAddRoute = contentArea.querySelector('.lnkAddRoute');
			if (PiLot.Permissions.canWrite()) {
				lnkAddRoute.setAttribute('href', PiLot.Utils.Loader.createPageLink(PiLot.Utils.Loader.pages.nav.routeDetails));
			} else {
				lnkAddRoute.parentNode.removeChild(lnkAddRoute);
			}
			this.plhTable = contentArea.querySelector('.plhTable');
			this.drawTable();
		},

		drawTable: function () {
			this.plhTable.clear();
			let table = RC.Utils.stringToNode(PiLot.Templates.Nav.routesTable);
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
			let distanceNM = PiLot.Utils.Common.metersToNauticalMiles(pRoute.getTotalDistance());
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
			var lastWp = this.route.getWaypoints().last();
			var lat = null;
			var lon = null;
			if ((lastWp !== null) && (lastWp.hasPosition())) {
				lat = lastWp.getLatLon().lat;
				lon = lastWp.getLatLon().lon;
			}
			var newWaypoint = new PiLot.Model.Nav.Waypoint(this.route, lat, lon, null);
			this.route.addWaypoint(newWaypoint, true, this);
			this.saveRoute();
			return false;
		},

		/// click handler for the "activate route" link
		lnkActivateRoute_click: function () {
			this.isActiveRoute = !this.isActiveRoute;
			var activeRouteId = this.isActiveRoute ? this.route.getRouteId() : null;
			PiLot.Model.Nav.saveActiveRouteIdAsync(activeRouteId);
			this.lnkActivate.classList.toggle('active', this.isActiveRoute);
			return false;
		},

		/// click handler for the "delete route" link. Deletes the route, ignoring the result
		lnkDeleteRoute_click: function () {
			if (confirm('Route ' + this.route.getName() + ' wirklich löschen?')) {
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
		},

		/// handles the end of sorting the list. A bit smelly, 
		/// this creates a new waypoints array, ordered by the
		/// order of the divWayoint divs, and assings it to the route
		sortable_stop: function (event, ui) {
			let waypointNodes = Array.from(this.divWaypoints.childNodes);
			let waypoints2 = new Array();
			let waypointForm = null;
			for (var i = 0; i < waypointNodes.length; i++) {
				waypointForm = this.waypointForms.find(pItem => pItem.getHtmlElement() === waypointNodes[i]);
				if (waypointForm !== null) {
					waypoints2.push(waypointForm.waypoint);
				}
			}
			this.route.setWaypoints(waypoints2);
			this.showWaypoints(false);
		},

		/// loads the route from the server, if we have a valid routeId query string,
		/// otherwise calls loadRouteSuccess with null, which will create a new route.
		loadRoute: async function() {
			var qsRouteId = RC.Utils.getUrlParameter('routeId');
			if (qsRouteId) {
				return await PiLot.Model.Nav.loadRouteAsync(qsRouteId);
			} else {
				return new PiLot.Model.Nav.Route().setName('neue Route');
			}
		},

		/// draws the main form based on the template, only needs to
		/// be called once.
		drawFormAsync: async function () {
			let contentArea = PiLot.Utils.Loader.getContentArea();
			contentArea.appendChild(RC.Utils.stringToNode(PiLot.Templates.Nav.routeDetailPage));
			let routeContainer = contentArea.querySelector('#divRoute');
			routeContainer.appendChildren(RC.Utils.stringToNodes(PiLot.Templates.Nav.editRouteForm));
			this.tbRouteName = routeContainer.querySelector('.tbRouteName');
			this.lnkActivate = routeContainer.querySelector('.lnkActivateRoute');
			const lnkAddWaypoint = routeContainer.querySelector('.lnkAddWaypoint');
			const lnkDeleteRoute = routeContainer.querySelector('.lnkDeleteRoute');
			if (PiLot.Permissions.canWrite()) {
				this.tbRouteName.addEventListener('change', this.tbRouteName_changed.bind(this));
				RC.Utils.selectOnFocus(this.tbRouteName);
				lnkAddWaypoint.addEventListener('click', this.lnkAddWaypoint_click.bind(this));
				lnkDeleteRoute.addEventListener('click', this.lnkDeleteRoute_click.bind(this));
			} else {
				this.tbRouteName.setAttribute('readonly', true);
				lnkAddWaypoint.remove();
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
			new PiLot.View.Map.MapRoute(this.map, this.route, { showRoute: true, lockRoute: lockRoute, showOptions: false }).draw().fitMap();
		},

		/// shows the waypoints (create the forms if necessary, refresh all values). Pass
		/// pResetAll to enforce redrawing of all waypoints, which is necessary to reflect
		/// any deleted waypoints
		showWaypoints: function (pResetAll) {
			let waypointFormsChanged = false;
			if (pResetAll) {
				this.divWaypoints.clear();
				this.waypointForms = new Array();
				waypointFormsChanged = true;
			}
			var waypoints = this.route.getWaypoints();
			for (var i = 0; i < waypoints.length; i++) {
				if (!this.waypointForms.find(function (pValue) { return pValue.waypoint === waypoints[i] })){
					this.waypointForms.push(new WaypointForm(waypoints[i], this, this.divWaypoints));
					waypointFormsChanged = true;
				}
			}
			this.waypointForms.forEach(function (pItem) {
				pItem.showWaypoint();
			});
			if (waypointFormsChanged) {
				this.attachSortable();
			}
		},

		/// attaches the jquery ui sortable to the list of waypoints
		attachSortable: function () {
			var sortedHandler = this.sortable_stop.bind(this);
			$(this.divWaypoints).sortable({
				placeholder: "navWaypointPlaceholder",
				forcePlaceholderSize: true,
				opacity: 0.5,
				handle: ".handle",
				tolerance: "intersect",
				stop: sortedHandler
			});
		},

		/// shows the total distance of the route in the label
		showTotalDistance: function () {
			this.lblTotalDistance.innerText = PiLot.Utils.Common.metersToNauticalMiles(this.route.getTotalDistance()).toFixed(1);
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
		lnkDeleteWaypoint_click: function () {
			if (confirm('Wegpunkt ' + this.waypoint.getName() + ' wirklich löschen?')) {
				this.routeDetail.getRoute().deleteWaypoint(this.waypoint, this);
			}
			return false;
		},

		/// change handler for the latitude form
		editLatitude_changeCoordinates: function () {
			this.waypoint.setLatLon(this.editLatitude.getCoordinate(), this.editLongitude.getCoordinate(), false, this);
		},

		/// change handler for the longitude form
		editLongitude_changeCoordinates: function () {
			this.waypoint.setLatLon(this.editLatitude.getCoordinate(), this.editLongitude.getCoordinate(), false, this);
		},

		/// hander for the move event of the waypoint
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
			this.form = RC.Utils.stringToNode(PiLot.Templates.Nav.waypointForm);
			this.container.appendChild(this.form);
			this.tbWaypointName = this.form.querySelector('.tbWaypointName');
			if (PiLot.Permissions.canWrite()) {
				this.tbWaypointName.addEventListener('change', this.tbWaypointName_change.bind(this));
				RC.Utils.selectOnFocus(this.tbWaypointName);
				this.lnkDelete = this.form.querySelector('.lnkDeleteWaypoint');
				this.lnkDelete.addEventListener('click', this.lnkDeleteWaypoint_click.bind(this));
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
				this.lblDistance.innerText = PiLot.Utils.Common.metersToNauticalMiles(leg.distance).toFixed(1);
				this.lblBearing.innerText = RC.Utils.toFixedLength(leg.bearing, 3, 0);
			}
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
			this.container = $(PiLot.Templates.Nav.liveRoute);
			this.container.appendTo(this.parentContainer);
			this.lblRouteName = this.container.find('.lblRouteName');
			if (this.routeObserver !== null) {
				RC.Utils.setText(this.lblRouteName, this.routeObserver.getRoute().getName());
			}
			this.showHideRouteName();
			var divWaypoints = this.container.find('.divWaypoints');
			for (var i = 0; i < this.liveWaypoints.length; i++) {
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

		/// shows or hides the route name bases on the currently set value.
		showHideRouteName: function () {
			this.lblRouteName.toggle(this.showRouteName);
		},

		/// shows or hides the entire control
		showHide: function (pIsVisible) {
			this.container.toggle(pIsVisible);
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
			this.divWaypoint = $(PiLot.Templates.Nav.liveWaypoint);
			this.divWaypoint.appendTo(pPlaceholder);
			this.iconPastWP = this.divWaypoint.find('.iconPastWP');
			this.iconAheadWP = this.divWaypoint.find('.iconAheadWP');
			this.iconNextWP = this.divWaypoint.find('.iconNextWP');
			this.iconFinalWP = this.divWaypoint.find('.iconFinalWP');
			this.lblName = this.divWaypoint.find('.lblName');
			this.pnlLatLon = this.divWaypoint.find('.pnlLatLon');
			this.lblLat = this.divWaypoint.find('.lblLat');
			this.lblLon = this.divWaypoint.find('.lblLon');
			this.lblETA = this.divWaypoint.find('.lblETA');
			this.lblDist = this.divWaypoint.find('.lblDist');
			this.lblBearing = this.divWaypoint.find('.lblBearing');
			this.update(true, true, true);
		},

		/// gets the data from the routeObserver and updates the gui,
		/// also shows/hides this
		update: function (pUpdateStaticData, pUpdateLiveData, pUpdateVisibility) {
			if (pUpdateStaticData) {
				this.lblName.text(this.waypoint.getName());
				if (this.liveRoute.getShowCoordinates()) {
					var latLon = this.waypoint.getLatLon();
					if (latLon !== null) {
						RC.Utils.setText(this.lblLat, PiLot.Utils.Nav.toCoordinateString(latLon.lat, true, true));
						RC.Utils.setText(this.lblLon, PiLot.Utils.Nav.toCoordinateString(latLon.lon, false, true));
					}
					if (!this.pnlLatLon.is(':visible')) {
						this.pnlLatLon.show();
					}
				} else {
					if (this.pnlLatLon.is(':visible')) {
						this.pnlLatLon.hide();
					}
				}
			}
			var liveData = null;
			if (pUpdateLiveData) {
				liveData = this.routeObserver.getLiveData(this.waypoint);
				if (liveData !== null) {
					RC.Utils.setText(this.lblETA, (liveData.eta !== null) ? liveData.eta.toFormat('HH:mm') : '--:--');
					RC.Utils.setText(this.lblDist, (liveData.miles !== null) ? liveData.miles.toFixed(1) : '--');
					RC.Utils.setText(this.lblBearing, (liveData.bearing !== null) ? RC.Utils.toFixedLength(liveData.bearing, 3, 0) : '---');
					this.divWaypoint.toggleClass('active', liveData.isNextWaypoint === true);
					this.divWaypoint.toggleClass('past', liveData.isPastWaypoint === true);
					this.iconPastWP.toggle(liveData.isPastWaypoint === true);
					this.iconAheadWP.toggle(liveData.isPastWaypoint === false && liveData.isNextWaypoint === false && liveData.isFinalWaypoint === false);
					this.iconNextWP.toggle(liveData.isNextWaypoint === true && liveData.isFinalWaypoint === false && liveData.isPastWaypoint === false);
					this.iconFinalWP.toggle(liveData.isFinalWaypoint === true && liveData.isPastWaypoint === false);
				}
			}
			if (pUpdateVisibility) {
				liveData = liveData || this.routeObserver.getLiveData(this.waypoint);
				var waypointsMode = this.liveRoute.getWaypointsMode();
				var doShow;
				if (liveData.hasData) {
					doShow =
						   (liveData.isPastWaypoint === true && waypointsMode.showPastWaypoints)
						|| (liveData.isPastWaypoint === false && waypointsMode.showAheadWaypoints)
						|| (liveData.isNextWaypoint === true && waypointsMode.showNextWaypoint)
						|| (liveData.isFinalWaypoint === true && waypointsMode.showFinalWaypoint);
				} else {
					doShow = !this.hideByDefault;
				}
				if (doShow && !this.divWaypoint.is(':visible')) {
					this.divWaypoint.slideDown('fast');
				} else if (!doShow && this.divWaypoint.is(':visible')) {
					if (this.hideByDefault) {
						this.divWaypoint.hide();
					} else {
						this.divWaypoint.slideUp('fast');
					}
				} 
			}
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
				decideIsVisible: this.decideMotionDisplayVisible.bind(this, 17000, false),
				isVisible: null,
				needsRoute: false,
				updateData: sogIndicator.showValue.bind(sogIndicator, this.gpsObserver.getSOG.bind(this.gpsObserver)),
				showHide: sogIndicator.showHide.bind(sogIndicator)
			});
			const vmgIndicator = new PiLot.View.Nav.MotionDisplay(mainContainer, PiLot.Templates.Nav.vmgIndicator, null, 1);
			this.controls.push({
				control: vmgIndicator,
				decideIsVisible: this.decideMotionDisplayVisible.bind(this, 17000, true),
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
				decideIsVisible: this.decideMotionDisplayVisible.bind(this, 22000, true),
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
		StartPageNav: StartPageNav
	};

})();
