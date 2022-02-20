/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

PiLot.View.Tools = (function () {
	/**
	 * The very basic page with just tiles
	 * */
	var ToolsOverviewPage = function () {
		this.draw();
	};

	ToolsOverviewPage.prototype = {

		/** Draws the page */
		draw: function () {
			let loader = PiLot.Utils.Loader;
			let pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.toolsOverviewPage);
			loader.getContentArea().appendChild(pageContent);
			pageContent.querySelector('.lnkData').setAttribute('href', loader.createPageLink(loader.pages.system.tools.data));
			const lnkTiles = pageContent.querySelector('.lnkTiles');
			if (PiLot.Permissions.canWrite()) {
				lnkTiles.setAttribute('href', loader.createPageLink(loader.pages.system.tools.tiles));
			} else {
				lnkTiles.remove();
			}			
		}
	};

	/// a form which allows deleting and exporting gps data
	var GpsExportForm = function () {

		this.track = null;
		this.boatTime = null;
		this.exportMode = 'CSV';

		this.pageContent = null;
		this.calStartDate = null;
		this.tbStartTime = null;
		this.calEndDate = null;
		this.tbEndTime = null;
		this.divLoadingData = null;
		this.divDataLoaded = null;
		this.map = null;
		this.mapTrack = null;
		this.divResult = null;
		this.lnkExport = null;
		this.divExport = null;
		this.tbResultText = null;
		this.divResultTable = null;
		this.tblPositions = null;
		this.divDelete = null;
		this.pnlSpeedDiagram = null;
		this.initializeAsync();
	};

	GpsExportForm.prototype = {

		initializeAsync: async function () {
			PiLot.View.Common.setCurrentMainMenuPage(PiLot.Utils.Loader.pages.system.tools.overview);
			this.boatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			await this.drawFormAsync();
			this.setDefaultDates();
			this.loadTrack();
		},

		drawFormAsync: async function () {
			const loader = PiLot.Utils.Loader;
			this.pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.gpsExportForm);
			loader.getContentArea().appendChild(this.pageContent);
			this.pageContent.querySelector('.lnkTools').setAttribute('href', loader.createPageLink(loader.pages.system.tools.overview));
			let tbStartDate = this.pageContent.querySelector('.tbStartDate');
			this.calStartDate = new RC.Controls.Calendar(this.pageContent.querySelector('.divCalStartDate'), tbStartDate, null, null);
			this.tbStartTime = this.pageContent.querySelector('.tbStartTime');
			this.pageContent.querySelector('.lnkStartTimeFromMap').addEventListener('click', this.lnkTimeFromMap_click.bind(this, this.calStartDate, this.tbStartTime));
			var tbEndDate = this.pageContent.querySelector('.tbEndDate');
			this.calEndDate = new RC.Controls.Calendar(this.pageContent.querySelector('.divCalEndDate'), tbEndDate, null, null);
			this.tbEndTime = this.pageContent.querySelector('.tbEndTime');
			this.pageContent.querySelector('.lnkEndTimeFromMap').addEventListener('click', this.lnkTimeFromMap_click.bind(this, this.calEndDate, this.tbEndTime));
			this.pageContent.querySelector('.btnLoadData').addEventListener('click', this.btnLoadData_click.bind(this));
			this.divLoadingData = this.pageContent.querySelector('.divLoadingData');
			this.divDataLoaded = this.pageContent.querySelector('.divDataLoaded');
			this.map = new PiLot.View.Map.Seamap(this.pageContent.querySelector('.divMap'), { persistMapState: false });
			await this.map.showAsync();
			this.mapTrack = new PiLot.View.Map.MapTrack(this.map, this.boatTime, null, { ignoreSettings: true, showTrack: true, autoShowTrack: false })
			this.divResult = this.pageContent.querySelector('.divResult');
			this.lnkExport = this.pageContent.querySelector('.lnkExport');
			this.lnkExport.addEventListener('click', this.lnkExport_click.bind(this));
			this.divExport = this.pageContent.querySelector('.divExport');
			let rblExportFormat = this.pageContent.querySelectorAll('.rbExportFormat');
			rblExportFormat.forEach(function (pRadiobutton) {
				pRadiobutton.addEventListener('change', this.rbExportFormat_Change.bind(this));
				pRadiobutton.checked = pRadiobutton.value === this.exportMode;
			}.bind(this));
			this.divResultText = this.pageContent.querySelector('.divResultText');
			this.tbResultText = this.pageContent.querySelector('.tbResultText');
			this.pageContent.querySelector('.btnCopy').addEventListener('click', this.btnCopy_Click.bind(this));
			this.divResultTable = this.pageContent.querySelector('.divResultTable');
			this.tblPositions = this.pageContent.querySelector('.tblPositions');
			const lnkDelete = this.pageContent.querySelector('.lnkDelete');
			this.divDelete = this.pageContent.querySelector('.divDelete');
			if (PiLot.Permissions.canWrite()) {
				lnkDelete.addEventListener('click', this.lnkDelete_click.bind(this));
				this.pageContent.querySelector('.btnDeleteCurrent').addEventListener('click', this.btnDeleteCurrent_click.bind(this));
				this.pageContent.querySelector('.btnDeleteAll').addEventListener('click', this.btnDeleteAll_click.bind(this));
			} else {
				lnkDelete.remove();
				this.divDelete.remove();
			}			
			this.pageContent.querySelector('.lnkSpeedDiagram').addEventListener('click', this.lnkSpeedDiagram_click.bind(this));
			this.pnlSpeedDiagram = document.querySelector('.pnlSpeedDiagram');
			RC.Utils.selectOnFocus(this.tbStartTime, this.tbEndTime);
		},

		/**
		 * Handles the click on the icons which take the current time slider position
		 * from the map control and enter the date into one of them two calendars, and
		 * the time into one of them two time fields
		 * @param {RC.Controls.Calendar} pCalendar
		 * @param {HTMLElement} pTimeField
		 */
		lnkTimeFromMap_click: function (pCalendar, pTimeField) {
			let position = this.mapTrack.getHistoricPosition();
			if (position) {
				let date = RC.Date.DateHelper.millisToLuxon(position.boatTime);
				pCalendar.date(date);
				pCalendar.showDate();
				pTimeField.value = date.toFormat('HH:mm');
			}
			return false;
		},

		lnkEndTimeFromMap_click: function () { },

		btnLoadData_click: function () {
			this.loadTrack();
		},

		lnkExport_click: function () {
			RC.Utils.showHide(this.divExport);
		},

		lnkDelete_click: function () {
			RC.Utils.showHide(this.divDelete);
		},

		lnkSpeedDiagram_click: function () {
			RC.Utils.showHide(this.pnlSpeedDiagram);
			this.showSpeedChartData();
		},

		btnCopy_Click: function () {
			this.tbResultText.select();
			document.execCommand("copy");
		},

		rbExportFormat_Change: function (pEvent) {
			this.exportMode = pEvent.target.value;
			this.showData();
		},

		btnDeleteCurrent_click: async function (pEvent) {
			var position = this.mapTrack.getHistoricPosition();
			if (position !== null) {
				if (window.confirm(PiLot.Utils.Language.getText('confirmDeletePosition'))) {
					await PiLot.Model.Nav.deleteGPSPositionsAsync(position.getBoatTime(), position.getBoatTime(), true);
					this.loadTrack();
				}
			} 
		},

		btnDeleteAll_click: async function (pEvent) {
			var firstPosition = this.track.getPositionAt(0);
			var lastPosition = this.track.getLastPosition();
			if ((firstPosition !== null) && (lastPosition !== null)) {
				const message = PiLot.Utils.Language.getText('confirmDeletePosition').replace('{{x}}', this.track.getPositionsCount());
				if (window.confirm(message)) {
					await PiLot.Model.Nav.deleteGPSPositionsAsync(firstPosition.getBoatTime(), lastPosition.getBoatTime(), true);
					this.loadTrack();
				}
			}
		},

		setDefaultDates: function () {
			let startDate = PiLot.Utils.Common.parseQsDate(this.boatTime);
			if (startDate !== null) {
				endDate = startDate.addDays(1).toLuxon();
				startDate = startDate.toLuxon();
			} else {
				startDate = RC.Date.DateOnly.fromObject(this.boatTime.now()).toLuxon();
				endDate = this.boatTime.now();
			}
			this.calStartDate.date(startDate);
			this.calStartDate.showDate();
			this.calEndDate.date(endDate);
			this.calEndDate.showDate();
			RC.Utils.setText(this.tbEndTime, endDate.toFormat('HH:mm'));
		},

		loadTrack: function () {
			let startDate = this.calStartDate.date();
			let endDate = this.calEndDate.date();
			if ((startDate !== null) && (endDate !== null)) {
				RC.Utils.showHide(this.divDataLoaded, false);
				RC.Utils.showHide(this.divLoadingData, true);
				startDate = RC.Date.DateHelper.parseTime(this.tbStartTime.value, startDate).date;
				RC.Utils.setText(this.tbStartTime, startDate.toFormat('HH:mm'));
				if (endDate !== null) {
					endDate = RC.Date.DateHelper.parseTime(this.tbEndTime.value, endDate).date;
					RC.Utils.setText(this.tbEndTime, endDate.toFormat('HH:mm'));
				}
				this.mapTrack.setTimeFrame(startDate, endDate, null);
				this.mapTrack.loadAndShowTrackAsync(true).then(track => this.loadTrackSuccess(track));
			} else {
				RC.Utils.showHide(this.divDataLoaded, true);
				RC.Utils.showHide(this.divLoadingData, false);
			}
		},

		loadTrackSuccess: function (pTrack) {
			this.track = pTrack;
			let length = this.track.getPositionsCount();
			this.divDataLoaded.innerText = PiLot.Utils.Language.getText('xPositionsFound').replace('{{x}}', length);
			RC.Utils.showHide(this.divLoadingData, false)
			RC.Utils.showHide(this.divDataLoaded, true);
			RC.Utils.showHide(this.divResult, true);
			this.showData();
		},

		showData: function () {
			RC.Utils.showHide(this.divResultText, this.exportMode !== "Table");
			RC.Utils.showHide(this.divResultTable, this.exportMode === "Table");
			switch (this.exportMode) {
				case "Table":
					this.showTabularData();
					break;
				case "GPX":
					this.showGPXData();
					break;
				case "CSV":
					this.showCSVData();
					break;
				case "JSON":
					this.showJsonData();
					break;
			}
			this.showSpeedChartData();
		},

		showTabularData: function () {
			let row, position;
			let length = this.track.getPositionsCount();
			let dataRows = this.tblPositions.querySelectorAll('tr:not(.dgHeader)');
			dataRows.forEach(function (pRow) {
				this.tblPositions.removeChild(pRow);
			}.bind(this));
			for (var i = 0; i < length; i++) {
				position = this.track.getPositionAt(i);
				row = document.createElement('tr');
				row.insertAdjacentHTML('beforeend', '<td>' + position.getUTC().toString() + '</td>');
				row.insertAdjacentHTML('beforeend', '<td>' + RC.Date.DateHelper.millisToLuxon(position.getUTC()).toFormat('dd. MMM yyyy HH:mm:ss') + '</td>');
				row.insertAdjacentHTML('beforeend', '<td>' + RC.Date.DateHelper.millisToLuxon(position.getBoatTime()).toFormat('dd. MMM yyyy HH:mm:ss') + '</td>');
				row.insertAdjacentHTML('beforeend', '<td>' + PiLot.Utils.Nav.toCoordinateString(position.getLatitude(), true, true) + '</td>');
				row.insertAdjacentHTML('beforeend', '<td>' + PiLot.Utils.Nav.toCoordinateString(position.getLongitude(), false, true) + '</td>');
				this.tblPositions.appendChild(row);
			}
		},

		showGPXData: function () {
			let xmlHeader = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n';
			let xml = '<gpx version="1.1" creator="PiLot"><trk><trkseg></trkseg></trk></gpx>';
			let parser = new DOMParser();
			let doc = parser.parseFromString(xml, "text/xml");
			let trkseg = doc.getElementsByTagName('trkseg')[0];
			let trkpt;
			let timeNode;
			let timeText;
			let position;
			for (let i = 0; i < this.track.getPositionsCount(); i++) {
				position = this.track.getPositionAt(i);
				trkpt = doc.createElement('trkpt');
				trkpt.setAttribute('lat', position.getLatitude());
				trkpt.setAttribute('lon', position.getLongitude());
				timeNode = doc.createElement('time');
				timeText = doc.createTextNode(RC.Date.DateHelper.millisToLuxon(position.getUTC()).toISO());
				timeNode.appendChild(timeText);
				trkpt.appendChild(timeNode);
				trkseg.appendChild(trkpt);
			}
			let serializer = new XMLSerializer();
			xml = serializer.serializeToString(doc);
			this.tbResultText.value = xmlHeader + xml;
		},

		showJsonData: function () {
			this.tbResultText.value = JSON.stringify(this.track.positions, null, 4);
		},

		showCSVData: function () {
			let txt = 'Timestamp UTC	DateTime UTC	Latitude	Longitude\n';
			let dateString;
			for (let i = 0; i < this.track.getPositionsCount(); i++) {
				position = this.track.getPositionAt(i);
				dateString = RC.Date.DateHelper.millisToLuxon(position.getUTC()).toFormat('dd. MMM yyyy HH:mm:ss')
				txt += [position.getUTC(), dateString, position.getLatitude(), position.getLongitude()].join('	') + '\n';
			}
			this.tbResultText.value = txt;
		},

		showSpeedChartData: function () {
			if (RC.Utils.isVisible(this.pnlSpeedDiagram)) {
				new PiLot.View.Tools.SpeedDiagram(this.pnlSpeedDiagram, this.track);
			}
		}

	};

	/// draws a speedDiagram based for a track
	SpeedDiagram = function (pContainer, pTrack) {
		this.track = pTrack;			// the PiLot.Nav.Model.Track
		this.container = pContainer;	// the HTML Element to which this will be added
		this.pnlChart = null;			// the HTML Element representing the canvas for the diagram
		this.chart = null;				// the Chart object, a PiLot.Utils.Chart.DataChart
		this.ddlUnit = null;			// the HMTL Element representing the Unit dropdown
		this.ddlSample = null;			// the HTML Element representing the sample dropdown
		this.samples = null;			// an array holding the samples, which are arrays
		this.boatTimeOffsets = null;	// an array with objects{validFrom, offset}
		this.unit = 'kts';				// default unit to kts
		this.sampleSeconds = 30;		// the (minimal) sample size. Two points used for calculation must be not less than 
										// this.sampleSeconds from each other
		this.initialize(pTrack);
	};

	SpeedDiagram.prototype = {

		/** Just calls draw */
		initialize: function () {
			this.draw();
		},

		/**
		 * Draws the control based on the template, assigns the controls for later use
		 * and processes and shows the data
		 * */
		draw: function () {
			this.container.clear();
			this.container.appendChild(PiLot.Utils.Common.createNode(PiLot.Templates.Tools.speedDiagram));
			this.pnlChart = this.container.querySelector('.pnlChart');
			this.ddlUnit = this.container.querySelector('.ddlUnit');
			this.ddlUnit.value = this.unit;
			this.ddlUnit.addEventListener('change', this.ddlUnit_change.bind(this));
			this.ddlSample = this.container.querySelector('.ddlSample');
			this.ddlSample.value = this.sampleSeconds.toString();
			this.ddlSample.addEventListener('change', this.ddlSample_change.bind(this));
			this.createSamples();
			this.drawChart();
		},

		/** Handles Changes of the unit dropdown */
		ddlUnit_change: function () {
			this.unit = this.ddlUnit.value;
			this.createSamples();
			this.setChartData();
		},

		/** Handles changes of the sample size dropdown */
		ddlSample_change: function () {
			this.setSampleSeconds(Number(this.ddlSample.value));
			this.createSamples();
			this.setChartData();
		},

		// creates an array of arrays representing the speed at a certain time.
		// [0] ist milliseconds from epoc utc, [1] is m/s. It also populates an array, 
		// with boatTimeOffsets valid after a certain time utc
		createSamples: function () {
			this.samples = new Array();
			this.boatTimeOffsets = new Array();
			if (this.track !== null) {
				const positionsCount = this.track.getPositionsCount();
				let position1, position2, latLon1, latLon2;
				let deltaT, deltaTHalf;		// in s
				let speed;					// in m/s
				let utcSeconds;				// s from epoc
				let boatTimeOffset = null;	// boatTime - utc in s
				let lastBoatTimeOffset = null;
				let i = 0;
				while (i < positionsCount - 1) {
					position1 = position1 || this.track.getPositionAt(i);
					boatTimeOffset = position1.getBoatTimeOffset();
					if (lastBoatTimeOffset === null || (boatTimeOffset != lastBoatTimeOffset)) {
						this.boatTimeOffsets.push({ validFrom: position1.getUTCSeconds(), offset: boatTimeOffset });
						lastBoatTimeOffset = boatTimeOffset;
					}
					position2 = this.track.getPositionAt(i + 1);
					deltaT = (position2.getUTC() - position1.getUTC()) / 1000;
					if (deltaT >= this.sampleSeconds) {
						latLon1 = latLon2 || position1.getLatLon();
						latLon2 = position2.getLatLon();
						speed = latLon1.distanceTo(latLon2) / deltaT;
						switch (this.unit) {
							case 'kts':
								speed = PiLot.Utils.Common.mpsToKnots(speed);
								break;
							case 'kmh':
								speed = speed * 3.6;
								break;
						}
						deltaTHalf = (deltaT / 2);
						utcSeconds = Math.round(position1.getUTCSeconds() + deltaTHalf);
						this.samples.push([utcSeconds * 1000, Math.round(speed * 100) / 100]);
						position1 = position2;
					}
					i++;
				}
			}
		},

		/** Creates the chart and shows the data, which must have been processed before */
		drawChart: function () {
			this.chart = new PiLot.Utils.Chart.DataChart({ chart: this.pnlChart }, null, null, null, `HH:mm`);
			this.setChartData();
		},

		/** Assings the data (this.samples, this.boatTimeOffsets) to the chart */
		setChartData: function () {
			this.chart.showChart({ data: this.samples, boatTimeOffsets: this.boatTimeOffsets });
		},

		/** sets the minimal seconds used to calculate one sample */
		setSampleSeconds: function (pSamleSeconds) {
			if (pSamleSeconds > 0) {
				this.sampleSeconds = pSamleSeconds;
				this.page = 0;
			}
		}
	};

	/// a form which allows downloading map tiles by browsing the map.
	var TilesDownloadForm = function () {

		this.tileSources = null;
		this.tilesDownloadHelpers = null;	// map with key = tileSource, value = PiLot.Model.Tools.TilesDownloadHelper
		this.tileSourcesControls = null;	// map with key = tileSource, value = object of {cbShowLayer: Checkbox, cbDownloadTiles: Checkbox, loading: Boolean, tileLayer: Leaflet.tileLayer}
		this.pageContent = null;
		this.ddlIncludeLower = null;		// options to include lower zoom levels
		this.ddlIncludeHigher = null;		// options to include higher zoom levels
		this.cbForceDownload = null;
		this.lblZoom = null;
		this.lblDownloadCount = null;	
		this.lblDownloadKB = null;
		this.lblPendingCount = null;
		this.lblLoading = null;
		this.map = null;					// PiLot.View.Map.Seamap
		this.initializeAsync();
	};

	TilesDownloadForm.prototype = {

		/// checks the container, initializes the tileSourcesControls Array,
		/// reads all TileSources from the server and and calls draw() when done
		initializeAsync: async function () {
			PiLot.View.Common.setCurrentMainMenuPage(PiLot.Utils.Loader.pages.system.tools.overview);
			this.tilesDownloadHelpers = new Map();
			this.tileSourcesControls = new Map();
			this.tileSources = await PiLot.Model.Nav.readAllTileSourcesAsync();
			for (var i = 0; i < this.tileSources.length; i++) {
				let downloadHelper = new PiLot.Model.Tools.TilesDownloadHelper(this.tileSources[i]);
				downloadHelper.on('updateStats', this.tileSource_updateStats.bind(this));
				this.tilesDownloadHelpers.set(this.tileSources[i], downloadHelper);
			}
			this.drawForm();

		},

		/// handles updates of the stats of any tileSource
		tileSource_updateStats: function () {
			let pendingRequestsCount = 0;
			let completedRequestsCount = 0;
			let completedRequestBytes = 0;
			let downloadHelper;
			for (var i = 0; i < this.tileSources.length; i++) {
				downloadHelper = this.tilesDownloadHelpers.get(this.tileSources[i]);
				pendingRequestsCount += downloadHelper.getPendingRequestsCount();
				completedRequestsCount += downloadHelper.getCompletedRequestsCount();
				completedRequestBytes += downloadHelper.getCompletedRequestsBytes();
			}
			RC.Utils.setText(this.lblPendingCount, pendingRequestsCount);
			RC.Utils.setText(this.lblDownloadCount, completedRequestsCount);
			RC.Utils.setText(this.lblDownloadKB, (completedRequestBytes / 1024).toLocaleString('de-ch', { maximumFractionDigits: 0 }));
			this.showLoadingState();
		},

		/// handles changes to the show layer checkbox, adding or removing the corresponding tile layer
		cbShowLayer_change: function (pTileSource) {
			tileSourcesControl = this.tileSourcesControls.get(pTileSource);
			if (tileSourcesControl.cbShowLayer.checked) {
				this.addTileLayer(pTileSource, tileSourcesControl);
			} else {
				this.removeTileLayer(tileSourcesControl);
			}
		},

		/// Handles the tileLoad event of a TileLayer, expecting the TileSource
		/// object plus the parameters passed by the leaflet tileLoad event
		map_tileLoad: function (pTileSource, pTile) {
			if (this.tileSourcesControls.get(pTileSource).cbDownloadTiles.checked) {
				let lowerZooms = Number.parseInt(this.ddlIncludeLower.value);
				if (Number.isNaN(lowerZooms)) {
					lowerZooms = 0;
				}
				let higherZooms = Number.parseInt(this.ddlIncludeHigher.value);
				if (Number.isNaN(higherZooms)) {
					higherZooms = 0;
				}
				this.tilesDownloadHelpers.get(pTileSource).saveTile(pTile, lowerZooms, higherZooms, this.cbForceDownload.checked);
			}
		},

		/// handles the loading event of a tileLayer, indicating that
		/// tiles are being loaded
		mapLayer_loading: function (pTileSource) {
			this.tileSourcesControls.get(pTileSource).loading = true;
			this.showLoadingState();
		},

		/// handles the load end event of a tileLayer, indicating that
		/// all tiles have been loaded
		mapLayer_load: function (pTileSource) {
			this.tileSourcesControls.get(pTileSource).loading = false;
			this.showLoadingState();
		},

		map_zoomend: function () {
			this.showZoom();
		},

		/// draws the form based on the template, using HTMLElements, not jQuery 
		drawForm: function () {
			const loader = PiLot.Utils.Loader;
			this.pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.tilesDownloadForm);
			loader.getContentArea().appendChild(this.pageContent);
			this.pageContent.querySelector('.lnkTools').setAttribute('href', loader.createPageLink(loader.pages.system.tools.overview));
			const divTileSources = this.pageContent.querySelector('.divTileSources');
			const divTileSourceTemplate = divTileSources.querySelector('.divTileSourceTemplate');
			for (let i = 0; i < this.tileSources.length; i++) {
				let rowTileSource = divTileSourceTemplate.cloneNode(true);
				divTileSources.appendChild(rowTileSource);
				rowTileSource.querySelector('.lblName').innerHTML = this.tileSources[i].getName();
				let cbShowLayer = rowTileSource.querySelector('.cbShow');
				cbShowLayer.onchange = this.cbShowLayer_change.bind(this, this.tileSources[i]);
				this.tileSourcesControls.set(this.tileSources[i], {
					cbShowLayer: cbShowLayer,
					cbDownloadTiles: rowTileSource.querySelector('.cbDownload'),
					loading: false,
					tileLayer: null
				});
			}
			divTileSourceTemplate.remove();
			this.ddlIncludeLower = this.pageContent.querySelector('.ddlIncludeLower');
			this.ddlIncludeHigher = this.pageContent.querySelector('.ddlIncludeHigher');
			this.cbForceDownload = this.pageContent.querySelector('#cbForceDownload');
			this.lblZoom = this.pageContent.querySelector('.lblZoom');
			this.lblDownloadCount = this.pageContent.querySelector('.lblDownloadCount');
			this.lblDownloadKB = this.pageContent.querySelector('.lblDownloadKB');
			this.lblPendingCount = this.pageContent.querySelector('.lblPendingCount');
			this.lblLoading = this.pageContent.querySelector('.lblLoading');
			this.pnlChart = this.pageContent.querySelector('.pnlChart');
			this.ddlUnit = this.pageContent.querySelector('.ddlUnit');
			this.drawMapAsync();
		},

		/// draws the map, adds the layers and attaches the handlers
		drawMapAsync: async function () {
			this.map = new PiLot.View.Map.Seamap(this.pageContent.querySelector('.divMap'), { persistMapState: true, showLayers: false });
			await this.map.showAsync();
			this.showZoom();
			this.map.getLeafletMap().on('zoomend', this.map_zoomend.bind(this));
			var tileSourcesControl;
			for (var i = 0; i < this.tileSources.length; i++) {
				tileSourcesControl = this.tileSourcesControls.get(this.tileSources[i]);
				if (tileSourcesControl.cbShowLayer.checked) {
					this.addTileLayer(this.tileSources[i], tileSourcesControl);
				}
			}
		},

		/// adds a tile layer to the map, binds all events, and stores the tileLayer
		/// in tileSourcesControls.tileLayer
		addTileLayer: function (pTileSource, pTileSourcesControl) {
			if (pTileSourcesControl.tileLayer !== null) {
				this.removeTileLayer(pTileSourcesControl);
			}
			pTileSourcesControl.tileLayer = this.map.addTileLayer(pTileSource.onlineUrl)
				.on('tileload', this.map_tileLoad.bind(this, pTileSource))
				.on('loading', this.mapLayer_loading.bind(this, pTileSource))
				.on('load', this.mapLayer_load.bind(this, pTileSource));
		},

		/// removes a tileLayer from the map
		removeTileLayer: function (pTileSourcesControl) {
			if (pTileSourcesControl.tileLayer !== null) {
				pTileSourcesControl.tileLayer.remove();
			}
		},

		/// shows the map's current zoom level in lblZoom
		showZoom: function () {
			RC.Utils.setText(this.lblZoom, this.map.getCurrentZoom());
		},

		showLoadingState: function () {
			var loading = false;
			for (var i = 0; i < this.tileSources.length; i++) {
				if (
					(this.tilesDownloadHelpers.get(this.tileSources[i]).getPendingRequestsCount() > 0) || this.tileSourcesControls.get(this.tileSources[i]).loading
				) {
					loading = true;
					break;
				}
			}
			RC.Utils.toggleClass(this.lblLoading, 'hidden', !loading);
		}
	}

	/// return the classes
	return {
		ToolsOverviewPage: ToolsOverviewPage,
		GpsExportForm: GpsExportForm,
		SpeedDiagram: SpeedDiagram,
		TilesDownloadForm: TilesDownloadForm
	};

})();
