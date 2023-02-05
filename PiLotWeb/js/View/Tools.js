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
			PiLot.Utils.Common.bindOrHideEditLink(lnkTiles, null, loader.createPageLink(loader.pages.system.tools.tiles));
			const lnkPois = pageContent.querySelector('.lnkPois');
			PiLot.Utils.Common.bindOrHideEditLink(lnkPois, null, loader.createPageLink(loader.pages.system.tools.pois));
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
			const locale = PiLot.Utils.Language.getLanguage();
			this.calStartDate = new RC.Controls.Calendar(this.pageContent.querySelector('.divCalStartDate'), tbStartDate, null, null, null, locale);
			this.tbStartTime = this.pageContent.querySelector('.tbStartTime');
			this.pageContent.querySelector('.lnkStartTimeFromMap').addEventListener('click', this.lnkTimeFromMap_click.bind(this, this.calStartDate, this.tbStartTime));
			var tbEndDate = this.pageContent.querySelector('.tbEndDate');
			this.calEndDate = new RC.Controls.Calendar(this.pageContent.querySelector('.divCalEndDate'), tbEndDate, null, null, null, locale);
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
				endDate = this.boatTime.now().plus({ minutes: 1 });
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
		this.pnlUnit = null;			// the HTML Element containing the Unit dropdown and its label
		this.ddlUnit = null;			// the HMTL Element representing the Unit dropdown
		this.pnlSample = null;			// the HTML Element containing the Sample dropdown and its label
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
			this.pnlUnit = this.container.querySelector('.pnlUnit');
			this.ddlUnit = this.container.querySelector('.ddlUnit');
			this.ddlUnit.value = this.unit;
			this.ddlUnit.addEventListener('change', this.ddlUnit_change.bind(this));
			this.pnlSample = this.container.querySelector('.pnlSample');
			this.ddlSample = this.container.querySelector('.ddlSample');
			this.ddlSample.value = this.sampleSeconds.toString();
			this.ddlSample.addEventListener('change', this.ddlSample_change.bind(this));
			this.container.querySelector('.lnkSettings').addEventListener('click', this.lnkSettings_click.bind(this));
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

		/** Swaps visibility of the two settings items */
		lnkSettings_click: function () {
			this.pnlSample.hidden = !this.pnlSample.hidden;
			this.pnlUnit.hidden = !this.pnlUnit.hidden;
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

		this.tileSources = null;			// Map with key = tileSource.name, value = tileSource
		this.tilesDownloadHelpers = null;	// map with key = tileSource, value = PiLot.Model.Tools.TilesDownloadHelper
		this.tileSourcesControls = null;	// map with key = tileSource, value = object of {cbShowLayer: Checkbox, cbDownloadTiles: Checkbox, loading: Boolean}
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
			this.tileSources.forEach(function (pTileSource) {
				let downloadHelper = new PiLot.Model.Tools.TilesDownloadHelper(pTileSource);
				downloadHelper.on('updateStats', this.tileSource_updateStats.bind(this));
				this.tilesDownloadHelpers.set(pTileSource, downloadHelper);
			}.bind(this));
			this.drawForm();
		},

		/// handles updates of the stats of any tileSource
		tileSource_updateStats: function () {
			let pendingRequestsCount = 0;
			let completedRequestsCount = 0;
			let completedRequestBytes = 0;
			let downloadHelper;
			this.tileSources.forEach(function (pTileSource) {
				downloadHelper = this.tilesDownloadHelpers.get(pTileSource);
				pendingRequestsCount += downloadHelper.getPendingRequestsCount();
				completedRequestsCount += downloadHelper.getCompletedRequestsCount();
				completedRequestBytes += downloadHelper.getCompletedRequestsBytes();
			}.bind(this));
			RC.Utils.setText(this.lblPendingCount, pendingRequestsCount);
			RC.Utils.setText(this.lblDownloadCount, completedRequestsCount);
			RC.Utils.setText(this.lblDownloadKB, (completedRequestBytes / 1024).toLocaleString('de-ch', { maximumFractionDigits: 0 }));
			this.showLoadingState();
		},

		/// handles changes to the show layer checkbox, adding or removing the corresponding tile layer
		cbShowLayer_change: function (pTileSource) {
			tileSourcesControl = this.tileSourcesControls.get(pTileSource);
			if (tileSourcesControl.cbShowLayer.checked) {
				this.addTileLayer(pTileSource);
			} else {
				this.removeTileLayer(pTileSource);
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

		/// draws the form based on the template
		drawForm: function () {
			const loader = PiLot.Utils.Loader;
			this.pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.tilesDownloadForm);
			loader.getContentArea().appendChild(this.pageContent);
			this.pageContent.querySelector('.lnkTools').setAttribute('href', loader.createPageLink(loader.pages.system.tools.overview));
			const divTileSources = this.pageContent.querySelector('.divTileSources');
			const divTileSourceTemplate = divTileSources.querySelector('.divTileSourceTemplate');
			for (const [tileSourceName, tileSource] of this.tileSources) {
				let rowTileSource = divTileSourceTemplate.cloneNode(true);
				divTileSources.appendChild(rowTileSource);
				rowTileSource.querySelector('.lblName').innerHTML = tileSourceName;
				let cbShowLayer = rowTileSource.querySelector('.cbShow');
				cbShowLayer.onchange = this.cbShowLayer_change.bind(this, tileSource);
				this.tileSourcesControls.set(tileSource, {
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
			for (const [tileSourceName, tileSource] of this.tileSources) {
				tileSourcesControl = this.tileSourcesControls.get(tileSource);
				if (tileSourcesControl.cbShowLayer.checked) {
					this.addTileLayer(tileSource);
				}
			}
		},

		/// adds a tile layer to the map and binds all events
		addTileLayer: function (pTileSource) {
			this.removeTileLayer(pTileSource);
			this.map.addTileLayer(pTileSource, true)
				.on('tileload', this.map_tileLoad.bind(this, pTileSource))
				.on('loading', this.mapLayer_loading.bind(this, pTileSource))
				.on('load', this.mapLayer_load.bind(this, pTileSource));
		},

		/// removes a tileLayer from the map
		removeTileLayer: function (pTileSource) {
			this.map.removeTileLayer(pTileSource.getName());
		},

		/// shows the map's current zoom level in lblZoom
		showZoom: function () {
			RC.Utils.setText(this.lblZoom, this.map.getCurrentZoom());
		},

		showLoadingState: function () {
			var loading = false;
			for (const [tileSourceName, tileSource] of this.tileSources) {
				if (
					(this.tilesDownloadHelpers.get(tileSource).getPendingRequestsCount() > 0)
					|| this.tileSourcesControls.get(tileSource).loading
				) {
					loading = true;
					break;
				}
			}
			RC.Utils.toggleClass(this.lblLoading, 'hidden', !loading);
		}
	};

	/** A page with different poi management functions */
	var PoisManagementPage = function () {
		this.initialize();
	};

	PoisManagementPage.prototype = {

		initialize: function () {
			this.draw();
			PiLot.View.Common.setCurrentMainMenuPage(PiLot.Utils.Loader.pages.system.tools.overview);
		},

		draw: function () {
			const loader = PiLot.Utils.Loader;
			const pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.poisManagementPage);
			loader.getContentArea().appendChild(pageContent);
			pageContent.querySelector('.lnkTools').setAttribute('href', loader.createPageLink(loader.pages.system.tools.overview));
			new PoisOsmImportControl(pageContent);
			new PoisJsonImportForm(pageContent);
		}
	};

	/**
	 * A control which allows to search for osm pois and import them into the pilot database
	 * @param {HTMLElement} pContainer - where the control will be inserted
	 */
	var PoisOsmImportControl = function (pContainer) {
		this.container = pContainer;
		this.mapPois = null;			// PiLot.View.Tools.OsmMapPois
		this.poiDetailControls = null;	// Map with key = osmPoiId, value = OsmPoiDetails control
		this.poiLoader = null;
		this.seamap = null;
		this.cbImportMarinas = null;
		this.cbImportLocks = null;
		this.cbImportFuel = null;
		this.cbImportPump = null;
		this.cbImportToilets = null;
		this.lblLoadingData = null;
		this.plhOsmDetails = null;
		this.initialize();

	};

	PoisOsmImportControl.prototype = {

		initialize: function () {
			this.poiLoader = new PiLot.Service.Nav.OsmPoiLoader();
			this.poiDetailControls = new Map();
			this.draw();
		},

		btnLoad_click: async function (e) {
			e.target.hidden = true;
			this.lblLoadingData.hidden = false;
			await this.loadOsmDataAsync();
			this.lblLoadingData.hidden = true;
			e.target.hidden = false;
		},

		mapPois_selectPoi: function (pSender, pArg) {
			this.highlightPoiDetails(pArg, true);
		},

		poiDetails_select: function (pSender, pArg) {
			this.highlightPoiDetails(pArg, false);
			this.mapPois.highlightPoi(pArg);
		},

		poiDetails_hidePoi: function (pSender, pArg) {
			this.mapPois.togglePoi(pArg, false);
		},

		poiDetails_showPoi: function (pSender, pArg) {
			this.mapPois.togglePoi(pArg, true);
		},

		draw: function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.poisOsmImportForm);
			this.container.appendChild(control);
			this.cbImportMarinas = control.querySelector('.cbImportMarinas');
			this.cbImportLocks = control.querySelector('.cbImportLocks');
			this.cbImportFuel = control.querySelector('.cbImportFuel');
			this.cbImportPump = control.querySelector('.cbImportPump');
			this.cbImportToilets = control.querySelector('.cbImportToilets');
			this.lblLoadingData = control.querySelector('.lblLoadingData');
			control.querySelector('.btnLoad').addEventListener('click', this.btnLoad_click.bind(this));
			this.seamap = new PiLot.View.Map.Seamap(control.querySelector('.pnlMap'));
			this.seamap.showAsync();
			this.mapPois = new OsmMapPois(this.seamap);
			this.mapPois.on('selectPoi', this.mapPois_selectPoi.bind(this));
			this.plhOsmDetails = control.querySelector('.plhOsmDetails');
		},

		/** Loads the osm data based on the selected types */
		loadOsmDataAsync: async function () {
			const types = [];
			if (this.cbImportMarinas.checked) {
				types.push('marina');
			}
			if (this.cbImportLocks.checked) {
				types.push('lock');
			}
			if (this.cbImportFuel.checked) {
				types.push('fuel');
			}
			if (this.cbImportPump.checked) {
				types.push('pump');
			}
			if (this.cbImportToilets.checked) {
				types.push('toilet');
			}
			this.plhOsmDetails.clear();
			const mapBounds = this.seamap.getLeafletMap().getBounds();
			const osmPois = await this.poiLoader.loadDataAsync(mapBounds.getSouth(), mapBounds.getWest(), mapBounds.getNorth(), mapBounds.getEast(), types);
			this.mapPois.showOsmPois(osmPois);
			this.poiDetailControls = new Map();
			for (aPoi of osmPois) {
				const poiDetails = new OsmPoiDetails(aPoi, this.plhOsmDetails);
				poiDetails.on('select', this.poiDetails_select.bind(this));
				poiDetails.on('hidePoi', this.poiDetails_hidePoi.bind(this));
				poiDetails.on('showPoi', this.poiDetails_showPoi.bind(this));
				this.poiDetailControls.set(aPoi.getId(), poiDetails);
			}
		},

		/**
		 * Un-highlights all poi details controls, then highlights the one for the
		 * given poiId, and optionally scrolls to that control.
		 * @param {Number} pPoiId
		 * @param {Boolean} pScrollToControl
		 */
		highlightPoiDetails: function (pPoiId, pScrollToControl) {
			for (const [poiId, poiDetailControl] of this.poiDetailControls) {
				poiDetailControl.toggleHighlight(false);
			}
			const detailsControl = this.poiDetailControls.get(pPoiId)
			detailsControl.toggleHighlight(true);
			if (pScrollToControl) {
				this.plhOsmDetails.scrollTop = detailsControl.getOffsetTop();
			}
		}
	};

	/**
	 * Control to show details for an osm poi
	 * @param {PiLot.Model.Nav.OsmPoi} pOsmPoi
	 * @param {HTMLElement} pContainer
	 */
	var OsmPoiDetails = function (pOsmPoi, pContainer) {
		this.osmPoi = pOsmPoi;
		this.container = pContainer;
		this.control = null;
		this.lnkLink = null;
		this.lnkHide = null;
		this.lnkShow = null;
		this.observers = null;						// Map for observable pattern
		this.initialize();
	};

	OsmPoiDetails.prototype = {
		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['select', 'hidePoi', 'showPoi']);
			this.draw();
		},

		/**
		 * Registers an observer which will be called when pEvent happens.
		 * @param {String} pEvent - "select", "hidePoi", "showPoi"
		 * @param {Function} pCallback
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		control_click: function (pEvent) {
			RC.Utils.notifyObservers(this, this.observers, 'select', this.osmPoi.getId());
		},

		lnkImport_click: function () { },

		lnkLink_click: function () { },

		lnkHide_click: function (pEvent) {
			pEvent.preventDefault();
			pEvent.stopPropagation();
			RC.Utils.notifyObservers(this, this.observers, 'hidePoi', this.osmPoi.getId());
			this.lnkHide.hidden = true;
			this.lnkShow.hidden = false;
		},

		lnkShow_click: function (pEvent) {
			pEvent.preventDefault();
			pEvent.stopPropagation();
			RC.Utils.notifyObservers(this, this.observers, 'showPoi', this.osmPoi.getId());
			this.lnkHide.hidden = false;
			this.lnkShow.hidden = true;
		},

		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.osmPoiDetails);
			this.container.appendChild(this.control);
			this.control.addEventListener('click', this.control_click.bind(this));
			this.control.querySelector('.lblTitle').innerText = this.osmPoi.getTitle();
			const plhTags = this.control.querySelector('.plhTags');
			const tags = this.osmPoi.getTags();
			for (let aTag in tags) {
				const tagControl = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.osmPoiTag);
				tagControl.querySelector('.lblKey').innerText = aTag;
				tagControl.querySelector('.lblValue').innerText = tags[aTag];
				plhTags.appendChild(tagControl);
			}
			this.lnkLink = this.control.querySelector('.lnkLink');
			this.lnkLink.addEventListener('click', this.lnkLink_click.bind(this));
			this.lnkHide = this.control.querySelector('.lnkHide');
			this.lnkHide.addEventListener('click', this.lnkHide_click.bind(this));
			this.lnkShow = this.control.querySelector('.lnkShow');
			this.lnkShow.addEventListener('click', this.lnkShow_click.bind(this));
		},

		/** returns the offset top of this control */
		getOffsetTop: function () {
			return this.control.offsetTop;
		},

		/**
		 * Highlights or un-higlights the control by setting css .active
		 * @param {Boolean} pIsHighlighted
		 */
		toggleHighlight: function (pIsHighlighted) {
			this.control.classList.toggle('active', pIsHighlighted);
		}
	};

	/**
	 * Shows markers for osm pois on the map. This is similar to the normal poi
	 * layer (PiLot.View.Map.MapPois), but yet enough different to implement it
	 * separately. I guess.
	 * @param {PiLot.View.Map.Seamap} pMap
	 */
	var OsmMapPois = function (pMap) {
		this.map = pMap;
		this.pois = null;							// Map with key=poi.id and value={poi, marker}
		this.observers = null;						// Map for observable pattern
		this.activePoiId = null;					// the id of the currently highlighted poi
		this.initialize();
	};

	OsmMapPois.prototype = {

		initialize: function () {
			this.pois = new Map();
			this.observers = RC.Utils.initializeObservers(['selectPoi', 'unselectPoi']);
			this.map.getLeafletMap().on('zoomend', this.leafletMap_zoomend.bind(this));
		},

		/**
		 * Registers an observer which will be called when pEvent happens.
		 * @param {String} pEvent - "selectPoi", "unselectPoi"
		 * @param {Function} pCallback
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		leafletMap_zoomend: function () {
			this.resizeMarkers();
		},

		poiMarker_click: async function (pPoi) {
			RC.Utils.notifyObservers(this, this.observers, 'selectPoi', pPoi.getId());
			this.highlightPoi(pPoi.getId());
		},

		showOsmPois: function (pPois) {
			this.clearPois();
			for (const aPoi of pPois) {
				this.drawMarker(aPoi);
			}
			this.resizeMarkers();
		},

		/**
		 * Shows or hides a poi marker
		 * @param {Number} pPoiId
		 * @param {Boolean} pVisible
		 */
		togglePoi: function (pPoiId, pVisible) {
			if (this.pois.has(pPoiId)) {
				this.pois.get(pPoiId).marker.getElement().hidden = !pVisible;
			}
		},

		/** @param {Number} pPoiId */
		highlightPoi: function (pPoiId) {
			if ((this.activePoiId) && this.pois.has(this.activePoiId)) {
				this.pois.get(this.activePoiId).marker.getElement().classList.toggle('active', false);
			}
			if (this.pois.has(pPoiId)) {
				this.pois.get(pPoiId).marker.getElement().classList.toggle('active', true);
				this.activePoiId = pPoiId;
			}
		},

		/** Remove all pois from the map */
		clearPois: function () {
			this.pois.forEach(function (v, k) {
				v.marker.remove();
			});
			this.pois = new Map();
			this.activePoiId = null;
		},

		/**
		 * Creates a leaflet marker for the poi, and adds the marker to the poi map.
		 * @param {PiLot.Model.Nav.OsmPoi} pPoi
		 * @returns {Object} an object with {poi, marker}
		 */
		drawMarker: function (pPoi) {
			let result;
			const iconHtml = PiLot.Templates.Tools.osmMapMarkerIcon;
			const icon = L.divIcon({
				className: 'osmPoiMarker', iconSize: [null, null], html: iconHtml
			});
			const marker = L.marker(pPoi.getLatLng(), { icon: icon, draggable: false });
			marker.addTo(this.map.getLeafletMap());
			marker.on('click', this.poiMarker_click.bind(this, pPoi));
			result = { poi: pPoi, marker: marker };
			this.pois.set(pPoi.getId(), result);
			return result;
		},

		/**
		 * This implements a specific logic to size the markers a bit bigger on higher zoom levels.
		 * The styles are assigned directly in order to override what was set by leaflet. This might
		 * probably be done a bit more nicely one day. Even worse, it's duplicate code of MapPois...
		 */
		resizeMarkers: function () {
			const iconSize = Math.min(Math.max(this.map.getCurrentZoom() * 5 - 40, 12), 36);
			const lengthWidth = `${iconSize}px`;
			const margin = `${iconSize * -1}px`;
			const fontSize = `${iconSize / 24}em`;
			for (const [poiId, poi] of this.pois) {
				const markerElement = poi.marker.getElement();
				markerElement.style.height = lengthWidth;
				markerElement.style.width = lengthWidth;
				markerElement.style.marginTop = margin;
				markerElement.style.fontSize = fontSize;
			}
		},

	};

	/**
	 * A control which allows to paste some json for categories, features and pois,
	 * and imports the pois into the database. The json should have the same form
	 * as it is created by the backup api.
	 * @param {HTMLElement} pContainer - where the control will be inserted
	 */
	var PoisJsonImportForm = function (pContainer) {
		this.container = pContainer;
		this.poiService = null;				// PiLot.Service.Nav.PoiService
		this.sourcePoiCategories = null;	// map with key = id, value = category
		this.localPoiCategories = null;		// map with key = name(!), value = category
		this.sourcePoiFeatures = null;		// map with key = id, value = feature
		this.localPoiFeatures = null;		// map with key = name(!), value = feature
		this.tbImportCategories = null;		// HTMLTextAreaElement
		this.tbImportFeatures = null;		// HTMLTextAreaElement
		this.tbImportPois = null;			// HTMLTextAreaElement
		this.rblReplaceOptions = null;		// NodeList
		this.plhOutput = null;				// HTMLDivElement

		this.initialize();
	};

	PoisJsonImportForm.prototype = {

		initialize: function () {
			this.poiService = PiLot.Service.Nav.PoiService.getInstance();
			this.draw();
		},

		btnImport_click: function () {
			this.importAsync();
		},

		draw: function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.poisJsonImportForm);
			this.container.appendChild(control);
			this.tbImportCategories = control.querySelector('.tbImportCategories');
			this.tbImportFeatures = control.querySelector('.tbImportFeatures');
			this.tbImportPois = control.querySelector('.tbImportPois');
			this.rblReplaceOptions = document.getElementsByName('rblReplaceOptions')
			control.querySelector('.btnImport').addEventListener('click', this.btnImport_click.bind(this));
			this.plhOutput = control.querySelector('.plhOutput');
		},

		/** Gets the selected radiobutton in the radiobutton-list of replace options */
		getReplaceOption: function () {
			let result = null;
			for (const anOption of this.rblReplaceOptions) {
				if (anOption.checked) {
					result = anOption.value;
					break;
				}
			}
			return result;
		},

		/** Does the import based on the data in the textareas */
		importAsync: async function () {
			this.clearOutput();
			this.writeOutput('Starting import');
			let success = await this.loadCategoriesAsync();
			success &&= await this.loadFeaturesAsync();
			success &&= await this.importPoisAsync();
			this.writeOutput(`Import ${success ? 'succeeded' : 'failed'}`);
		},

		/** 
		 * Reads the categories json, and loads the local categories. Makes sure that for each
		 * category in the json, there is a local category with the same name. This nees to be
		 * done, because we don't import categories, but local categories could have different 
		 * ids (but the same names) as the categories for the imported pois. Fills the maps
		 * sourcePoiCategories and localPoiCategories with k=name, v=feature.
		 * @returns {Boolean} - true, if categories could be parsed an match the existing categories
		 * */
		loadCategoriesAsync: async function () {
			let result;
			this.writeOutput('Reading categories');
			try {
				result = true;
				const rawCategories = JSON.parse(this.tbImportCategories.value);
				if (!Array.isArray(rawCategories)) {
					this.writeOutput('ERROR: categories: input is not an array.');
				} else {
					this.sourcePoiCategories = new Map();
					for (const obj of rawCategories) {
						const poiCategory = PiLot.Model.Nav.PoiCategory.fromData(obj);
						if (poiCategory) {
							this.sourcePoiCategories.set(poiCategory.getId(), poiCategory);
						}
					}
					this.localPoiCategories = new Map();
					const categoriesFromDb = await this.poiService.getCategoriesAsync();
					for (const [categoryId, category] of categoriesFromDb) {
						this.localPoiCategories.set(category.getName(), category);
					}
					for (const [categoryId, category] of this.sourcePoiCategories) {
						if (!this.localPoiCategories.has(category.getName())) {
							this.writeOutput(`Did not find a matching local category with name: ${category.getName()}`);
							result = false;
						}
					}
				}
			} catch (ex) {
				console.error(ex);
				this.writeOutput(`ERROR processing categories: ${ex}`);
				result = false;
			}
			this.writeOutput(`Categories check ${result ? 'succeeded' : 'failed'}`);
			this.writeOutput('--------------------------------');
			return result;
		},

		/** 
		 * Reads the features json, and loads the local features. Makes sure that for each 
		 * features in the json, there is a local feature with the same name. This nees to 
		 * be done, because we don't import features, but local features could have different 
		 * ids (but the same names) as the features for the imported pois. Fills the maps 
		 * sourcePoiFeatures and localPoiFeatures with k=name, v=feature.
		 * @returns {Boolean} - true, if the features could be parsed an match the existing features
		 * */
		loadFeaturesAsync: async function () {
			let result;
			this.writeOutput('Reading features');
			try {
				result = true;
				const rawFeatures = JSON.parse(this.tbImportFeatures.value);
				if (!Array.isArray(rawFeatures)) {
					this.writeOutput('ERROR: features: input is not an array.');
				} else {
					this.sourcePoiFeatures = new Map();
					for (const obj of rawFeatures) {
						const poiFeatures = PiLot.Model.Nav.PoiFeature.fromData(obj);
						if (poiFeatures) {
							this.sourcePoiFeatures.set(poiFeatures.getId(), poiFeatures);
						}
					}
					this.localPoiFeatures = new Map();
					const featuresFromDb = await this.poiService.getFeaturesAsync();
					for (const [featureId, feature] of featuresFromDb) {
						this.localPoiFeatures.set(feature.getName(), feature);
					}
					for (const [featureId, feature] of this.sourcePoiFeatures) {
						if (!this.localPoiFeatures.has(feature.getName())) {
							this.writeOutput(`Did not find a matching local feature with name: ${feature.getName()}`);
							result = false;
						}
					}
				}
			} catch (ex) {
				console.error(ex);
				this.writeOutput(`ERROR processing features: ${ex}`);
				result = false;
			}
			this.writeOutput(`Features check ${result ? 'succeeded' : 'failed'}`);
			this.writeOutput('--------------------------------');
			return result;
		},

		/** Parses the pois json and triggers the import for each element in the array */
		importPoisAsync: async function () {
			let result;
			this.writeOutput('Reading pois');
			const replaceOption = this.getReplaceOption();
			this.writeOutput(`Replace option: ${replaceOption}`);
			try {
				let successCount = 0;
				const pois = JSON.parse(this.tbImportPois.value);
				if (Array.isArray(pois)) {
					for (const poi of pois) {
						if (await this.importPoi(poi, replaceOption)) {
							successCount++;
						}
					}
					this.writeOutput(`${successCount} pois imported.`);
				} else {
					this.writeOutput('ERROR: pois: input is not an array.');
				}
				result = true;
			} catch (ex) {
				console.error(ex);
				this.writeOutput(`ERROR: ${ex}`);
				result = false;
			}
			this.writeOutput('--------------------------------');
			return result;
		},

		/**
		 * Imports a poi, based on a raw object. Depending on the replacement option, existing
		 * pois will be replaced or ignored, or the new poi will just be added.
		 * @param {Object} pObj - raw poi data object
		 * @param {String} pReplaceOption - add, skip or replace
		 */
		importPoi: async function (pObj, pReplaceOption) {
			let result = true;
			const poi = this.createPoi(pObj);
			if (poi) {
				let existingPois;
				switch (pReplaceOption) {
					case 'add':
						poi.saveAsync();
						break;
					case 'skip':
						existingPois = await this.getExistingPoisAsync(poi);
						if (existingPois.length === 0) {
							poi.saveAsync();
						} else {
							this.writeOutput(`Skipping poi ${this.poiToString(poi)}. Conflicts with ${this.poiToString(existingPois[0])}.`);
							result = false;
						}
						break;
					case 'replace':
						existingPois = await this.getExistingPoisAsync(poi);
						for (const existingPoi of existingPois) {
							this.writeOutput(`Delete existing poi ${this.poiToString(existingPoi)} as it conflicts with imported poi ${this.poiToString(poi)}`);
							await existingPoi.deleteAsync();
						}
						poi.saveAsync();
						break;
				}
				if (result) {
					this.writeOutput(`Saving poi ${this.poiToString(poi)}.`);
				}
			} else {
				this.writeOutput(`Poi object could not be parsed. Required attributes are missing.`);
				result = false;
			}
			return result;
		},

		/**
		 * Returns a string with id and title for the output window
		 * @param {PiLot.Model.Nav.Poi} pPoi
		 */
		poiToString: function (pPoi) {
			return pPoi.getId() + ':' + pPoi.getTitle();
		},

		/**
		 * Creates a poi from a raw data object having the same fields as the poi object.
		 * @param {Object} pObj - the data object
		 */
		createPoi: function (pObj) {
			let result = null;
			if (
				pObj
				&& pObj.categoryId
				&& RC.Utils.isNumeric(pObj.latitude)
				&& RC.Utils.isNumeric(pObj.longitude)
			) {
				const category = this.localPoiCategories.get(this.sourcePoiCategories.get(pObj.categoryId).getName());
				const featureIds = [];
				if (pObj.featureIds && Array.isArray(pObj.featureIds)) {
					for (const featureId of pObj.featureIds) {
						if ((featureId !== 0) && this.sourcePoiFeatures.has(featureId)) {
							featureIds.push(this.localPoiFeatures.get(this.sourcePoiFeatures.get(featureId).getName()).getId());
						}
					}
				}
				result = new PiLot.Model.Nav.Poi(
					null,
					pObj.title || '',
					category,
					featureIds,
					pObj.latitude,
					pObj.longitude,
					RC.Date.DateHelper.unixToLuxon(pObj.validFrom),
					RC.Date.DateHelper.unixToLuxon(pObj.validTo)
				);
				result.setDescription(pObj.description || '');
			}
			return result;
		},

		/**
		 * Returns any existing poi close to pPoi (about +/- 10 meters)
		 * @param {PiLot.Model.Nav.Poi} pPoi
		 */
		getExistingPoisAsync: async function (pPoi) {
			const latLng = pPoi.getLatLng();
			const pois = await this.poiService.findPoisAsync(
				latLng.lat - 0.0001,
				latLng.lng - 0.0001,
				latLng.lat + 0.0001,
				latLng.lng + 0.0001,
				[pPoi.getCategory().getId()],
				[]
			);
			return pois;
		},

		/** Clears the output panel */
		clearOutput: function () {
			this.plhOutput.clear();
		},

		/**
		 * Writes pMessage on a new line in the output panel
		 * @param {String} pMessage
		 */
		writeOutput: function (pMessage) {
			this.plhOutput.innerText = `${this.plhOutput.innerText}\n${pMessage}`;
		}

	};

	/// return the classes
	return {
		ToolsOverviewPage: ToolsOverviewPage,
		GpsExportForm: GpsExportForm,
		SpeedDiagram: SpeedDiagram,
		TilesDownloadForm: TilesDownloadForm,
		PoisManagementPage: PoisManagementPage
	};

})();
