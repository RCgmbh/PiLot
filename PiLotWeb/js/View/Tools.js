/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

PiLot.View.Tools = (function () {

	/// a form which allows deleting, importing and exporting gps data
	var GpsImportExportForm = function () {

		this.track = null;
		this.exportMode = 'CSV';
		this.importMode = 'CSV'

		this.pageContent = null;
		this.calStartDate = null;
		this.tbStartTime = null;
		this.calEndDate = null;
		this.tbEndTime = null;
		this.divLoadingData = null;
		this.tracksList = null;
		this.divDataLoaded = null;
		this.map = null;
		this.mapTrack = null;
		this.ddlBoats = null;
		this.divResult = null;
		this.tbResultText = null;
		this.divResultTable = null;
		this.tblPositions = null;
		this.pnlSpeedDiagram = null;
		this.tbImport = null;
		this.tbImportUtcOffset = null;
		this.ddlImportBoats = null;
		this.pnlImportSuccess = null;
		this.pnlImportError = null;
		this.lblImportErrorMessage = null;
		this.initializeAsync();
	};

	GpsImportExportForm.prototype = {

		initializeAsync: async function () {
			await this.drawFormAsync();
			this.setDefaultDates();
			await this.loadTracksAsync();
		},

		drawFormAsync: async function () {
			const loader = PiLot.Utils.Loader;
			this.pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.gpsImportExportForm);
			loader.getContentArea().appendChild(this.pageContent);
			const locale = PiLot.Utils.Language.getLanguage();
			let tbStartDate = this.pageContent.querySelector('.tbStartDate');
			this.calStartDate = new RC.Controls.Calendar(this.pageContent.querySelector('.divCalStartDate'), tbStartDate, null, null, null, locale);
			this.tbStartTime = this.pageContent.querySelector('.tbStartTime');
			this.pageContent.querySelector('.lnkStartTimeFromMap').addEventListener('click', this.lnkTimeFromMap_click.bind(this, this.calStartDate, this.tbStartTime));
			let tbEndDate = this.pageContent.querySelector('.tbEndDate');
			this.calEndDate = new RC.Controls.Calendar(this.pageContent.querySelector('.divCalEndDate'), tbEndDate, null, null, null, locale);
			this.tbEndTime = this.pageContent.querySelector('.tbEndTime');
			this.pageContent.querySelector('.lnkEndTimeFromMap').addEventListener('click', this.lnkTimeFromMap_click.bind(this, this.calEndDate, this.tbEndTime));
			this.pageContent.querySelector('.btnLoadData').addEventListener('click', this.btnLoadData_click.bind(this));
			this.pageContent.querySelector('.btnLoadWholeDay').addEventListener('click', this.btnLoadWholeDay_click.bind(this));
			this.divLoadingData = this.pageContent.querySelector('.divLoadingData');
			this.tracksList = new PiLot.View.Nav.TracksList(this.pageContent.querySelector('.divTracksList'));
			this.tracksList.on('trackSelected', this, this.tracksList_trackSelected.bind(this));
			this.divDataLoaded = this.pageContent.querySelector('.divDataLoaded');
			this.map = new PiLot.View.Map.Seamap(this.pageContent.querySelector('.divMap'), { persistMapState: false });
			await this.map.showAsync();
			this.mapTrack = new PiLot.View.Map.MapTrack(this.map, true);
			this.ddlEditBoats = this.pageContent.querySelector('.ddlEditBoats');
			this.divResult = this.pageContent.querySelector('.divResult');
			new PiLot.View.Common.ExpandCollapse(this.pageContent.querySelector('.lnkExport'), this.pageContent.querySelector('.divExport'));
			this.pageContent.querySelectorAll('.rbExportFormat').forEach(function (pRadiobutton) {
				pRadiobutton.addEventListener('change', this.rbExportFormat_Change.bind(this));
				pRadiobutton.checked = pRadiobutton.value === this.exportMode;
			}.bind(this));
			this.divResultText = this.pageContent.querySelector('.divResultText');
			this.tbResultText = this.pageContent.querySelector('.tbResultText');
			this.pageContent.querySelector('.btnCopy').addEventListener('click', this.btnCopy_Click.bind(this));
			this.divResultTable = this.pageContent.querySelector('.divResultTable');
			this.tblPositions = this.pageContent.querySelector('.tblPositions');
			const lnkEdit = this.pageContent.querySelector('.lnkEdit');
			const divEdit = this.pageContent.querySelector('.divEdit');
			if (PiLot.Permissions.canWrite()) {
				new PiLot.View.Common.ExpandCollapse(lnkEdit, divEdit);
				this.pageContent.querySelector('.btnSaveTrack').addEventListener('click', this.btnSaveTrack_click.bind(this));
			} else {
				lnkEdit.hidden = true;
			}			
			const lnkDelete = this.pageContent.querySelector('.lnkDelete');
			const divDelete = this.pageContent.querySelector('.divDelete');
			if (PiLot.Permissions.canWrite()) {
				new PiLot.View.Common.ExpandCollapse(lnkDelete, divDelete);
				this.pageContent.querySelector('.btnDeleteCurrent').addEventListener('click', this.btnDeleteCurrent_click.bind(this));
				this.pageContent.querySelector('.btnDeleteAll').addEventListener('click', this.btnDeleteAll_click.bind(this));
			} else {
				lnkDelete.hidden = true;
			}			
			this.pnlSpeedDiagram = document.querySelector('.pnlSpeedDiagram');
			new PiLot.View.Common.ExpandCollapse(this.pageContent.querySelector('.lnkSpeedDiagram'), this.pnlSpeedDiagram).on('expand', this, this.showSpeedChartData.bind(this));
			const lnkImport = this.pageContent.querySelector('.lnkImport');
			if (PiLot.Permissions.canWrite()){
				new PiLot.View.Common.ExpandCollapse(lnkImport, this.pageContent.querySelector('.divImport'));
				this.pnlImportSuccess = this.pageContent.querySelector('.pnlImportSuccess');
				this.pnlImportError = this.pageContent.querySelector('.pnlImportError');
				this.lblImportErrorMessage = this.pageContent.querySelector('.lblImportErrorMessage');
				this.pageContent.querySelectorAll('.rbImportFormat').forEach(function (pRadiobutton) {
					pRadiobutton.addEventListener('change', this.rbImportFormat_Change.bind(this));
					pRadiobutton.checked = pRadiobutton.value === this.ImportMode;
				}.bind(this));	
				this.tbImport = this.pageContent.querySelector('.tbImport');
				this.tbImportUtcOffset = this.pageContent.querySelector('.tbImportUtcOffset');
				this.ddlImportBoats = this.pageContent.querySelector('.ddlImportBoats');
				this.fillDdlBoatsAsync();
				this.pageContent.querySelector('.btnImportPreview').addEventListener('click', this.btnImportPreview_click.bind(this));
				this.pageContent.querySelector('.btnImport').addEventListener('click', this.btnImport_click.bind(this));
			} else {
				lnkImport.hidden = true;
			}
			
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
				let date = RC.Date.DateHelper.millisToLuxon(position.getBoatTime());
				pCalendar.date(date);
				pCalendar.showDate();
				pTimeField.value = date.toFormat('HH:mm');
			}
			return false;
		},

		btnLoadData_click: function () {
			this.loadTracksAsync();
		},

		btnLoadWholeDay_click: function () {
			this.setDefaultDates();
			this.loadTracksAsync();
		},

		tracksList_trackSelected: function (pTrack) {
			this.showTrack(pTrack);
		},
		
		btnSaveTrack_click: async function(){
			if(this.track){
				this.track.setBoat(this.ddlEditBoats.value);
				await PiLot.Service.Nav.TrackService.getInstance().saveTrackBoatAsync(this.track);
				this.loadTracksAsync();
			}
		},
		
		btnDeleteCurrent_click: async function (pEvent) {
			const position = this.mapTrack.getHistoricPosition();
			if (position !== null) {
				if (window.confirm(PiLot.Utils.Language.getText('confirmDeletePosition'))) {
					await PiLot.Service.Nav.TrackService.getInstance().deleteTrackPointsAsync(this.track.getId(), position.getUTC(), position.getUTC(), false);
					this.loadTracksAsync();
				}
			} 
		},

		btnDeleteAll_click: async function (pEvent) {
			const firstPosition = this.track.getTrackPointAt(0);
			const lastPosition = this.track.getLastTrackPoint();
			if ((firstPosition !== null) && (lastPosition !== null)) {
				const message = PiLot.Utils.Language.getText('confirmDeleteXPositions').replace('{{x}}', this.track.getTrackPointsCount());
				if (window.confirm(message)) {
					await PiLot.Service.Nav.TrackService.getInstance().deleteTrackPointsAsync(this.track.getId(), firstPosition.getUTC(), lastPosition.getUTC(), false);
					this.loadTracksAsync();
				}
			}
		},

		btnCopy_Click: function () {
			this.tbResultText.select();
			document.execCommand("copy");
		},

		rbExportFormat_Change: function (pEvent) {
			this.exportMode = pEvent.target.value;
			this.showData();
		},		

		rbImportFormat_Change: function (pEvent) {
			this.ImportMode = pEvent.target.value;
		},
		
		btnImportPreview_click: function () {
			this.pnlImportSuccess.hidden = true;
			let result = this.processImportData();
		},

		btnImport_click: async function () {
			const processImportDataResult = this.processImportData();
			if (processImportDataResult.success) {
				const saveResult = await PiLot.Service.Nav.TrackService.getInstance().saveTrackAsync(this.track);
				if (saveResult.ok) {
					this.pnlImportSuccess.hidden = false;
					this.pnlImportError.hidden = true;
				} else {
					this.pnlImportError.hidden = false;
					this.pnlImportSuccess.hidden = true;
					this.lblImportErrorMessage.innerText = saveResult.data;
				}
			}
		},

		setDefaultDates: function () {
			const boatTime = PiLot.Utils.Common.BoatTimeHelper.getCurrentBoatTime();
			let startDate = PiLot.Utils.Common.parseQsDate(boatTime);
			if (startDate !== null) {
				endDate = startDate.addDays(1).toLuxon();
				startDate = startDate.toLuxon();
			} else {
				startDate = RC.Date.DateOnly.fromObject(boatTime.now()).toLuxon();
				endDate = boatTime.now().plus({ minutes: 1 });
			}
			this.calStartDate.date(startDate);
			this.calStartDate.showDate();
			RC.Utils.setText(this.tbStartTime, startDate.toFormat('HH:mm'));
			this.calEndDate.date(endDate);
			this.calEndDate.showDate();
			RC.Utils.setText(this.tbEndTime, endDate.toFormat('HH:mm'));
		},

		fillDdlBoatsAsync: async function () {
			const boatInfos = await PiLot.Service.Boat.BoatConfigService.getInstance().getBoatConfigsAsync();
			const boatNames = boatInfos.map((b) => [b.name, b.displayName]);
			RC.Utils.fillDropdown(this.ddlEditBoats, boatNames);
			RC.Utils.fillDropdown(this.ddlImportBoats, boatNames);
		},

		loadTracksAsync: async function () {
			let startDate = this.calStartDate.date();
			let endDate = this.calEndDate.date();
			if ((startDate !== null) && (endDate !== null)) {
				this.divDataLoaded.hidden = true;
				this.divLoadingData.hidden = false;
				startDate = RC.Date.DateHelper.parseTime(this.tbStartTime.value, startDate).date;
				RC.Utils.setText(this.tbStartTime, startDate.toFormat('HH:mm'));
				if (endDate !== null) {
					endDate = RC.Date.DateHelper.parseTime(this.tbEndTime.value, endDate).date;
					RC.Utils.setText(this.tbEndTime, endDate.toFormat('HH:mm'));
				}
				const startMillis = RC.Date.DateHelper.luxonToMillisLocal(startDate);
				const endMillis = RC.Date.DateHelper.luxonToMillisLocal(endDate);
				const tracks = await PiLot.Service.Nav.TrackService.getInstance().loadTracksAsync(startMillis, endMillis, true);
				this.divLoadingData.hidden = true;
				this.tracksList.showTracks(tracks);
			} else {
				this.divDataLoaded.hidden = false;
				this.divLoadingData.hidden = true;
			}
		},

		showTrack: function (pTrack) {
			this.track = pTrack;
			let length = this.track && this.track.getTrackPointsCount() || 0;
			this.divDataLoaded.innerText = PiLot.Utils.Language.getText('xPositionsFound').replace('{{x}}', length);
			this.divDataLoaded.hidden = false;
			this.mapTrack.setTracks([this.track], true);
			this.ddlEditBoats.value = pTrack && pTrack.getBoat();
			this.divResult.hidden = false;
			this.showData();
		},

		showData: function () {
			this.divResultText.hidden = (this.exportMode === "Table");
			this.divResultTable.hidden = (this.exportMode !== "Table");
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
			let dataRows = this.tblPositions.querySelectorAll('tr:not(.dgHeader)');
			dataRows.forEach(function (pRow) {
				this.tblPositions.removeChild(pRow);
			}.bind(this));
			if(this.track){
				let row, position;
				let length = this.track.getTrackPointsCount();
				for (var i = 0; i < length; i++) {
					position = this.track.getTrackPointAt(i);
					row = document.createElement('tr');
					row.insertAdjacentHTML('beforeend', '<td>' + position.getUTC().toString() + '</td>');
					row.insertAdjacentHTML('beforeend', '<td>' + RC.Date.DateHelper.millisToLuxon(position.getUTC()).toFormat('dd. MMM yyyy HH:mm:ss') + '</td>');
					row.insertAdjacentHTML('beforeend', '<td>' + RC.Date.DateHelper.millisToLuxon(position.getBoatTime()).toFormat('dd. MMM yyyy HH:mm:ss') + '</td>');
					row.insertAdjacentHTML('beforeend', '<td>' + PiLot.Utils.Nav.toCoordinateString(position.getLatitude(), true, true) + '</td>');
					row.insertAdjacentHTML('beforeend', '<td>' + PiLot.Utils.Nav.toCoordinateString(position.getLongitude(), false, true) + '</td>');
					this.tblPositions.appendChild(row);
				}
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
			if(this.track){
				for (let i = 0; i < this.track.getTrackPointsCount(); i++) {
					position = this.track.getTrackPointAt(i);
					trkpt = doc.createElement('trkpt');
					trkpt.setAttribute('lat', position.getLatitude());
					trkpt.setAttribute('lon', position.getLongitude());
					timeNode = doc.createElement('time');
					timeText = doc.createTextNode(RC.Date.DateHelper.millisToLuxon(position.getUTC()).toISO());
					timeNode.appendChild(timeText);
					trkpt.appendChild(timeNode);
					trkseg.appendChild(trkpt);
				}
			}
			let serializer = new XMLSerializer();
			xml = serializer.serializeToString(doc);
			this.tbResultText.value = xmlHeader + xml;
		},

		showJsonData: function () {
			let json = this.track ? JSON.stringify(this.track.getTrackPoints(), null, 4) : '';
			this.tbResultText.value = json;
		},

		showCSVData: function () {
			let txt = 'Timestamp UTC	Timestamp BoatTime	DateTime UTC	Latitude	Longitude\n';
			let dateString;
			if(this.track){
				for (let i = 0; i < this.track.getTrackPointsCount(); i++) {
					position = this.track.getTrackPointAt(i);
					dateString = RC.Date.DateHelper.millisToLuxon(position.getUTC()).toFormat('dd. MMM yyyy HH:mm:ss');
					txt += [position.getUTC(), position.getBoatTime(), dateString, position.getLatitude(), position.getLongitude()].join('	') + '\n';
				}
			}
			this.tbResultText.value = txt;
		},

		showSpeedChartData: function () {
			if (RC.Utils.isVisible(this.pnlSpeedDiagram)) {
				new PiLot.View.Tools.SpeedDiagram(this.pnlSpeedDiagram, this.track);
			}
		},

		processImportData: function() {
			let processImportDataResult;
			const utcOffset = RC.Utils.getNumericValue(this.tbImportUtcOffset) || null;
			switch(this.importMode){
				case 'CSV':
					processImportDataResult = PiLot.Model.Nav.Track.fromCSV(this.tbImport.value, utcOffset, this.ddlImportBoats.value);
					break;
				case 'TCX':
					processImportDataResult = PiLot.Model.Nav.Track.fromTCX(this.tbImport.value, utcOffset, this.ddlImportBoats.value);
					break;
			}
			if (processImportDataResult.success) {
				this.track = processImportDataResult.track;
				this.mapTrack.setTracks([this.track]);
			} else {
				alert(trackFrprocessImportDataResultomTCXResult.message);
			}
			return processImportDataResult;
		},
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
				const positionsCount = this.track.getTrackPointsCount();
				let position1, position2, latLon1, latLon2;
				let deltaT, deltaTHalf;		// in s
				let speed;					// in m/s
				let utcSeconds;				// s from epoc
				let boatTimeOffset = null;	// boatTime - utc in s
				let lastBoatTimeOffset = null;
				let i = 0;
				while (i < positionsCount - 1) {
					position1 = position1 || this.track.getTrackPointAt(i);
					boatTimeOffset = position1.getBoatTimeOffset();
					if (lastBoatTimeOffset === null || (boatTimeOffset != lastBoatTimeOffset)) {
						this.boatTimeOffsets.push({ validFrom: position1.getUTCSeconds(), offset: boatTimeOffset });
						lastBoatTimeOffset = boatTimeOffset;
					}
					position2 = this.track.getTrackPointAt(i + 1);
					deltaT = (position2.getUTC() - position1.getUTC()) / 1000;
					if (deltaT >= this.sampleSeconds) {
						latLon1 = latLon2 || position1.getLatLon();
						latLon2 = position2.getLatLon();
						speed = latLon1.distanceTo(latLon2) / deltaT;
						switch (this.unit) {
							case 'kts':
								speed = PiLot.Utils.Nav.mpsToKnots(speed);
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
			this.chart = new PiLot.Utils.Chart.DataChart({ chart: this.pnlChart });
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
			this.tilesDownloadHelpers = new Map();
			this.tileSourcesControls = new Map();
			this.tileSources = await PiLot.Model.Nav.readAllTileSourcesAsync();
			this.tileSources.forEach(function (pTileSource) {
				let downloadHelper = new PiLot.Model.Tools.TilesDownloadHelper(pTileSource);
				downloadHelper.on('updateStats', this, this.tileSource_updateStats.bind(this));
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
			this.map = new PiLot.View.Map.Seamap(this.pageContent.querySelector('.divMap'), { persistMapState: true, customLayers: true });
			await this.map.showAsync();
			this.showZoom();
			this.map.getLeafletMap().on('zoomend', this.map_zoomend.bind(this));
			let tileSourcesControl;
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
			this.lblLoading.classList.toggle('hidden', !loading);
		}
	};

	/** A page with different poi management functions */
	var PoisManagementPage = function () {
		this.initialize();
	};

	PoisManagementPage.prototype = {

		initialize: function () {
			this.draw();
		},

		draw: function () {
			const loader = PiLot.Utils.Loader;
			const pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.poisManagementPage);
			loader.getContentArea().appendChild(pageContent);
			new PoisOsmImportControl(pageContent);
			new PoisJsonImportForm(pageContent);
			new PoisJsonExportForm(pageContent);
			new PoiCategoriesForm(pageContent);
			new PoiFeaturesForm(pageContent);
		}
	};

	/**
	 * A control which allows to search for osm pois and import them into the pilot database
	 * @param {HTMLElement} pContainer - where the control will be inserted
	 */
	var PoisOsmImportControl = function (pContainer) {
		this.container = pContainer;
		this.osmMapPois = null;			// PiLot.View.Tools.OsmMapPois

		this.poiDetailControls = null;	// Map with key = osmPoiId, value = OsmPoiDetails control
		this.poiLoader = null;
		this.seamap = null;
		this.editDialog = null;			// PiLot.View.Tools.OsmPoiEditDialog
		this.ddlApi = null;
		this.cbImportMarinas = null;
		this.cbImportLocks = null;
		this.cbImportFuel = null;
		this.cbImportPump = null;
		this.cbImportToilets = null;
		this.cbImportShops = null;
		this.lblLoadingData = null;
		this.plhOsmDetails = null;
		this.initialize();

	};

	PoisOsmImportControl.prototype = {

		initialize: function () {
			this.poiLoader = new PiLot.Service.Nav.OsmPoiLoader();
			this.poiDetailControls = new Map();
			this.drawAsync();
		},

		expandCollapse_expand: function () {
			this.seamap.getLeafletMap().invalidateSize();
		},

		btnLoad_click: async function (e) {
			this.lblLoadingData.hidden = false;
			await this.loadOsmDataAsync();
			this.lblLoadingData.hidden = true;
		},

		osmMapPois_selectPoi: function (pArg) {
			this.highlightPoiDetails(pArg, true);
		},

		poiDetails_select: function (pArg) {
			this.highlightPoiDetails(pArg, false);
			this.osmMapPois.highlightPoi(pArg);
		},

		poiDetails_hidePoi: function (pArg) {
			this.osmMapPois.togglePoi(pArg, false);
		},

		poiDetails_showPoi: function (pArg) {
			this.osmMapPois.togglePoi(pArg, true);
		},

		drawAsync: async function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.poisOsmImportForm);
			this.container.appendChild(control);
			const lblTitle = control.querySelector('.lblTitle');
			const pnlForm = control.querySelector('.pnlForm');
			new PiLot.View.Common.ExpandCollapse(lblTitle, pnlForm).on('expand', this, this.expandCollapse_expand.bind(this));
			this.ddlApi = control.querySelector('.ddlApi');
			this.cbImportMarinas = control.querySelector('.cbImportMarinas');
			this.cbImportLocks = control.querySelector('.cbImportLocks');
            this.cbImportBridges = control.querySelector('.cbImportBridges');
            this.cbImportFuel = control.querySelector('.cbImportFuel');
			this.cbImportPump = control.querySelector('.cbImportPump');
			this.cbImportToilets = control.querySelector('.cbImportToilets');
            this.cbImportShops = control.querySelector('.cbImportShops');
			this.lblLoadingData = control.querySelector('.lblLoadingData');
			this.seamap = new PiLot.View.Map.Seamap(control.querySelector('.pnlMap'), { persistMapState: true });
			await this.seamap.showAsync();
			this.editDialog = new OsmPoiEditDialog(this.seamap.getMapPois());
			const btnLoad = control.querySelector('.btnLoad');
			btnLoad.hidden = false;
			btnLoad.addEventListener('click', this.btnLoad_click.bind(this));
			this.osmMapPois = new OsmMapPois(this.seamap);
			this.osmMapPois.on('selectPoi', this, this.osmMapPois_selectPoi.bind(this));
			this.plhOsmDetails = control.querySelector('.plhOsmDetails');
			this.fillDdlApi();
		},

		fillDdlApi: function () {
			const apis = PiLot.Service.Nav.OsmPoiLoader.apiUrls;
			const ddlValues = apis.map(function (a) {
				return [a, new URL(a).hostname];
			});
			RC.Utils.fillDropdown(this.ddlApi, ddlValues);
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
            if (this.cbImportBridges.checked) {
                types.push('bridge');
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
			if (this.cbImportShops.checked) {
				types.push('shop');
			}
			this.plhOsmDetails.clear();
			const mapBounds = this.seamap.getLeafletMap().getBounds();
			const osmPois = await this.poiLoader.loadDataAsync(this.ddlApi.value, mapBounds.getSouth(), mapBounds.getWest(), mapBounds.getNorth(), mapBounds.getEast(), types);
			this.plhOsmDetails.clear();
			this.osmMapPois.showOsmPois(osmPois);
			this.poiDetailControls = new Map();
			for (const[poiId, poi] of osmPois) {
				const poiDetails = new OsmPoiDetails(poi, this.plhOsmDetails, this.editDialog);
				poiDetails.on('select', this, this.poiDetails_select.bind(this));
				poiDetails.on('hidePoi', this, this.poiDetails_hidePoi.bind(this));
				poiDetails.on('showPoi', this, this.poiDetails_showPoi.bind(this));
				this.poiDetailControls.set(poiId, poiDetails);
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
				if (poiDetailControl.getPoiId() !== pPoiId) {
					poiDetailControl.toggleHighlight(false);
				}
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
	 * @param {PiLot.View.Tools.OsmPoiEditDialog} pEditDialog - edit dialog for the edit/import action
	 * @param {Boolean} pHideActions - optionally set true to hide the "actions" section
	 */
	var OsmPoiDetails = function (pOsmPoi, pContainer, pEditDialog, pHideActions = false) {
		this.osmPoi = pOsmPoi;
		this.container = pContainer;
		this.editDialog = pEditDialog;
		this.hideActions = pHideActions;
		this.control = null;
		this.lblTitle = null;
		this.plhTags = null;
		this.lnkHide = null;
		this.lnkShow = null;
		this.lnkImport = null;
		this.lnkEdit = null;
		this.lnkLink = null;
		this.lnkUnlink = null;
		this.pnlLinkCandidates = null;
		this.plhLinkCandidates = null;
		this.pnlNoLinkCandidates = null;
		this.observable = null;						// Map for observable pattern
		this.initialize();
	};

	OsmPoiDetails.prototype = {

		initialize: function () {
			this.observable = new PiLot.Utils.Common.Observable(['select', 'hidePoi', 'showPoi']);
			this.draw();
			if (this.osmPoi) {
				this.showPoi();
			}
		},

		/**
		 * Registers an observer which will be called when pEvent happens.
		 * @param {String} pEvent - "select", "hidePoi", "showPoi"
		 * @param {Object} pObserver
		 * @param {Function} pCallback
		 * */
		on: function(pEvent, pObserver, pFunction){
			this.observable.addObserver(pEvent, pObserver, pFunction);
		},

		control_click: function (pEvent) {
			this.observable.fire('select', this.osmPoi.getId());
		},

		lnkEdit_click: function () {
			this.showEditDialogAsync();
		},

		lnkImport_click: function () {
			this.showEditDialogAsync();
		},

		lnkLink_click: function () {
			this.showLinkCandidates();
		},

		lnkLinkCanditate_click: function (pPoi, pEvent) {
			pEvent.preventDefault();
			this.linkPoiAsync(pPoi);
		},

		lnkUnlink_click: function (pEvent) {
			pEvent.preventDefault();
			this.unlinkPoiAsync();
		},

		lnkHide_click: function (pEvent) {
			pEvent.preventDefault();
			pEvent.stopPropagation();
			this.observable.fire('hidePoi', this.osmPoi.getId());
			this.lnkHide.hidden = true;
			this.lnkShow.hidden = false;
		},

		lnkShow_click: function (pEvent) {
			pEvent.preventDefault();
			pEvent.stopPropagation();
			this.observable.fire('showPoi', this.osmPoi.getId());
			this.lnkHide.hidden = false;
			this.lnkShow.hidden = true;
		},

		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.osmPoiDetails);
			this.container.appendChild(this.control);
			this.control.addEventListener('click', this.control_click.bind(this));
			this.lblTitle = this.control.querySelector('.lblTitle');
			this.plhTags = this.control.querySelector('.plhTags');
			this.container.querySelector('.pnlActions').hidden = this.hideActions;
			this.lnkHide = this.control.querySelector('.lnkHide');
			this.lnkHide.addEventListener('click', this.lnkHide_click.bind(this));
			this.lnkShow = this.control.querySelector('.lnkShow');
			this.lnkShow.addEventListener('click', this.lnkShow_click.bind(this));
			this.lnkImport = this.control.querySelector('.lnkImport');
			this.lnkImport.addEventListener('click', this.lnkImport_click.bind(this));
			this.lnkEdit = this.control.querySelector('.lnkEdit');
			this.lnkEdit.addEventListener('click', this.lnkEdit_click.bind(this));
			this.lnkLink = this.control.querySelector('.lnkLink');
			this.lnkLink.addEventListener('click', this.lnkLink_click.bind(this));
			this.lnkUnlink = this.control.querySelector('.lnkUnlink');
			this.lnkUnlink.addEventListener('click', this.lnkUnlink_click.bind(this));
			this.pnlLinkCandidates = this.control.querySelector('.pnlLinkCandidates');
			this.plhLinkCandidates = this.control.querySelector('.plhLinkCandidates');
			this.pnlNoLinkCandidates = this.control.querySelector('.pnlNoLinkCandidates');
		},

		showPoi: function (pOsmPoi) {
			this.osmPoi = pOsmPoi || this.osmPoi;
			this.lblTitle.innerText = this.osmPoi.getTitle()
			const tags = this.osmPoi.getTags();
			this.plhTags.clear();
			for (let aTag in tags) {
				const tagControl = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.osmPoiTag);
				tagControl.querySelector('.lblKey').innerText = aTag;
				tagControl.querySelector('.lblValue').innerHTML = PiLot.Utils.Common.createLinks(tags[aTag]);
				this.plhTags.appendChild(tagControl);
			}
		},

		getPoi: function () {
			return this.osmPoi;
		},

		getPoiId: function () {
			return this.osmPoi.getId();
		},

		/** Shows the link depending on whether the osm poi is linked to a pilot poi */
		showActionsAsync: async function () {
			const linkedPoi = await this.osmPoi.getLinkedPoiAsync();
			const isLinked = !!linkedPoi;
			this.lnkImport.hidden = isLinked;
			this.lnkEdit.hidden = !isLinked;
			this.lnkLink.hidden = isLinked;
			this.lnkUnlink.hidden = !isLinked;
		},

		showEditDialogAsync: async function () {
			const poi = await this.osmPoi.getLinkedPoiAsync();
			this.editDialog.showPois(poi, this.osmPoi);
		},

		linkPoiAsync: async function (pPoi) {
			if (pPoi && !pPoi.getSourceId()) {
				await pPoi.ensureDetailsAsync();
				pPoi.setSource('osm');
				pPoi.setSourceId(this.osmPoi.getId().toString());
				await pPoi.saveAsync();
				this.osmPoi.resetLinkedPoi();
				this.showActionsAsync();
				this.hideLinkCandidates();
			} else {
				PiLot.log(`Could not link with poi ${pPoi}`, 0);
			}
		},

		unlinkPoiAsync: async function () {
			const poi = await this.osmPoi.getLinkedPoiAsync();
			if (poi) {
				await poi.ensureDetailsAsync();
				poi.setSource('');
				poi.setSourceId('');
				await poi.saveAsync();
				this.osmPoi.resetLinkedPoi();
				this.showActionsAsync();
				this.hideLinkCandidates();
			} else {
				PiLot.log(`Could not unlink poi ${poi}`, 0);
			}
		},

		showLinkCandidates: function () {
			this.pnlLinkCandidates.hidden = false;
			this.plhLinkCandidates.clear();
			const recentPois = PiLot.Service.Nav.PoiService.getInstance().getRecentPois();
			if (recentPois.length > 0) {
				this.pnlNoLinkCandidates.hidden = true;
				const poisDistance = [];
				const latLng = this.osmPoi.getLatLng();
				for (const poi of recentPois) {
					poisDistance.push({ distance: latLng.distanceTo(poi.getLatLng()), poi: poi });
				}
				poisDistance.sort(function (a, b) { return a.distance - b.distance });
				const language = PiLot.Utils.Language.getLanguage();
				for (let i = 0; i < poisDistance.length && i < 5; i++) {
					this.showLinkCandidate(poisDistance[i].poi, language);
				}
			} else {
				this.pnlNoLinkCandidates.hidden = false;
			}
		},

		showLinkCandidate: function (pPoi, pLanguage) {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.osmLinkCandidate);
			control.querySelector('.lblCategory').innerText = pPoi.getCategory().getLabel(pLanguage);
			control.querySelector('.lblTitle').innerText = pPoi.getTitle();
			control.addEventListener('click', this.lnkLinkCanditate_click.bind(this, pPoi));
			this.plhLinkCandidates.appendChild(control);
		},

		hideLinkCandidates: function () {
			this.pnlLinkCandidates.hidden = true;
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
			if (pIsHighlighted) {
				this.showActionsAsync();
			} else {
				this.hideLinkCandidates();
			}
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
		this.observable = null;						// Map for observable pattern
		this.activePoiId = null;					// the id of the currently highlighted poi
		this.initialize();
	};

	OsmMapPois.prototype = {

		initialize: function () {
			this.pois = new Map();
			this.observable = new PiLot.Utils.Common.Observable(['selectPoi', 'unselectPoi']);
			this.map.getLeafletMap().on('zoomend', this.leafletMap_zoomend.bind(this));
		},

		/**
		 * Registers an observer which will be called when pEvent happens.
		 * @param {String} pEvent - "selectPoi", "unselectPoi"
		 * @param {Object} pObserver
		 * @param {Function} pCallback
		 * */
		on: function(pEvent, pObserver, pFunction){
			this.observable.addObserver(pEvent, pObserver, pFunction);
		},

		leafletMap_zoomend: function () {
			this.resizeMarkers();
		},

		poiMarker_click: async function (pPoi) {
			this.observable.fire('selectPoi', pPoi.getId());
			this.highlightPoi(pPoi.getId());
		},

		showOsmPois: function (pPois) {
			this.clearPois();
			for (const[poiId, poi] of pPois) {
				this.drawMarker(poi);
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
			const latLng = pPoi.getLatLng();
			if (latLng) {
				const iconHtml = PiLot.Templates.Tools.osmMapMarkerIcon;
				const icon = L.divIcon({
					className: 'osmPoiMarker', iconSize: [null, null], html: iconHtml
				});
				const marker = L.marker(latLng, { icon: icon, draggable: false });
				marker.addTo(this.map.getLeafletMap());
				marker.on('click', this.poiMarker_click.bind(this, pPoi));
				result = { poi: pPoi, marker: marker };
				this.pois.set(pPoi.getId(), result);
			} else {
				PiLot.log(`osm poi has no position: ${pPoi.getId()}`, 0);
			}
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
	 * The dialog that shows the local poi (or the empty form) and the osm data side by side
	 * @param {PiLot.View.Map.MapPois} pMapPois - Connecting this to a map will update the marker position if lat/long changed in the form
	 */
	var OsmPoiEditDialog = function (pMapPois) {
		this.mapPois = pMapPois;
		this.control = null;
		this.pnlDialog = null;
		this.poiForm = null;
		this.osmPoiDetails = null;
		this.initialize();
	};

	OsmPoiEditDialog.prototype = {

		initialize: function () {
			this.draw();
		},

		poiForm_save: function (pPoi) {
			this.osmPoiDetails.getPoi().resetLinkedPoi();
			this.hide();
		},

		poiForm_cancel: function () {
			this.hide();
		},

		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.osmPoiEditDialog);
			document.body.insertAdjacentElement('afterbegin', this.control);
			this.poiForm = new PiLot.View.Nav.PoiForm(this.mapPois, this.control.querySelector('.pnlPoiForm'));
			this.poiForm.on('save', this, this.poiForm_save.bind(this));
			this.poiForm.on('cancel', this, this.poiForm_cancel.bind(this));
			this.pnlDialog = this.control.querySelector('.pnlDialog');
			this.osmPoiDetails = new OsmPoiDetails(null, this.control.querySelector('.pnlOsmPoiForm'), null, true);
			PiLot.Utils.Common.bindKeyHandlers(this.control, this.hide.bind(this), this.poiForm.saveDataAsync.bind(this));
		},

		showPois: function (pPoi, pOsmPoi) {
			if (pPoi) {
				this.poiForm.showPoi(pPoi);
			} else {
				this.poiForm.showEmpty(pOsmPoi.getLatLng(), 'osm', pOsmPoi.getId(), pOsmPoi.getTitle(), pOsmPoi.getTagsString());
			}
			this.osmPoiDetails.showPoi(pOsmPoi);
			this.show();
		},

		show: function () {
			document.body.classList.toggle('overflowHidden', true);
			this.control.hidden = false;
			this.pnlDialog.scrollTop = 0;
		},

		hide: function () {
			document.body.classList.toggle('overflowHidden', false);
			this.control.hidden = true;
		}
	};

	/**
	 * A control which allows to paste some json for categories, features and pois,
	 * and imports the pois into the database. The json should have the same form
	 * as it is created by the backup api. The categories and features must match
	 * those in the system, only the pois will be imported, not categories and features.
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
			new PiLot.View.Common.ExpandCollapse(control.querySelector('h2'), control.querySelector('.pnlForm'));
			this.tbImportCategories = control.querySelector('.tbImportCategories');
			this.tbImportFeatures = control.querySelector('.tbImportFeatures');
			this.tbImportPois = control.querySelector('.tbImportPois');
			this.rblReplaceOptions = document.getElementsByName('rblReplaceOptions');
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
			success = success && await this.loadFeaturesAsync();
			success = success && await this.importPoisAsync();
			this.writeOutput(`Import ${success ? 'succeeded' : 'failed'}`);
		},

		/** 
		 * Reads the categories json, and loads the local categories. Makes sure that for each
		 * category in the json, there is a local category with the same name. Missing categories
		 * will be imported (but without creating the parent-child relationships). Fills the maps 
		 * sourcePoiCategories and localPoiCategories with k=name, v=category.
		 * @returns {Boolean} - true, if categories could be parsed an missing categories imported.
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
							this.writeOutput(`Category is missing: ${category.getName()}`);
							category.setId(null);
							await category.saveAsync();
							this.localPoiCategories.set(category.getName(), category);
							this.writeOutput(`Category imported: ${category.getName()}`);
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
		 * Reads the features json, and loads the local features. Makes sure that for each features 
		 * in the json, there is a local feature with the same name. Missing features will be
		 * imported. Fills the maps  sourcePoiFeatures and localPoiFeatures with k=name, v=feature.
		 * @returns {Boolean} - true, if the features could be parsed an missing features imported
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
							this.writeOutput(`Feature is missing: ${feature.getName()}`);
							feature.setId(null);
							await feature.saveAsync();
							this.localPoiFeatures.set(feature.getName(), feature);
							this.writeOutput(`Feature imported: ${feature.getName()}`);
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
						await poi.saveAsync();
						break;
					case 'skip':
						existingPois = await this.getExistingPoisAsync(poi);
						if (existingPois.length === 0) {
							await poi.saveAsync();
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
						await poi.saveAsync();
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

	/**
	 * A control which creates a json export for pois, categories and features.
	 * The output can be used to import pois into another system.
	 * @param {HTMLElement} pContainer - where the control will be inserted
	 */
	var PoisJsonExportForm = function (pContainer) {
		this.container = pContainer;
		this.poiService = null;				// PiLot.Service.Nav.PoiService
		this.tbExportCategories = null;		// HTMLTextAreaElement
		this.tbExportFeatures = null;		// HTMLTextAreaElement
		this.tbExportPois = null;			// HTMLTextAreaElement

		this.initialize();
	};

	PoisJsonExportForm.prototype = {

		initialize: function () {
			this.poiService = PiLot.Service.Nav.PoiService.getInstance();
			this.draw();
		},

		btnExport_click: function () {
			this.exportDataAsync();
		},

		draw: function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.poisJsonExportForm);
			this.container.appendChild(control);
			new PiLot.View.Common.ExpandCollapse(control.querySelector('h2'), control.querySelector('.pnlForm'));
			this.tbExportCategories = control.querySelector('.tbExportCategories');
			this.tbExportFeatures = control.querySelector('.tbExportFeatures');
			this.tbExportPois = control.querySelector('.tbExportPois');
			control.querySelector('.btnExport').addEventListener('click', this.btnExport_click.bind(this));
		},

		exportDataAsync: async function () {
			const allCategories = await this.poiService.getCategoriesAsync(true);
			this.exportMap(allCategories, this.tbExportCategories);
			const allFeatuers = await this.poiService.getFeaturesAsync(true);
			this.exportMap(allFeatuers, this.tbExportFeatures);
			const allPois = await this.poiService.loadRawPoisAsync();
			this.exportArray(allPois, this.tbExportPois);
		},

		exportMap: function (pMap, pTextarea) {
			const objectArray = [];
			for (const element of pMap.values()) {
				objectArray.push(element.toObject());
			}
			this.exportArray(objectArray, pTextarea);
		},

		exportArray: function (pArray, pTextarea) {
			pTextarea.value = JSON.stringify(pArray, null, 2);
		}

	};

	/**
	 * A simple gui to manage the poi categories
	 * @param {HTMLDivElement} pContainer - The container where this will be added
	 */
	var PoiCategoriesForm = function (pContainer) {
		this.container = pContainer;
		this.poiService = null;				// PiLot.Service.Nav.PoiService
		this.plhCategories = null;
		this.categoryForms = null;			// a list of all category forms, just to make sure we can remove the observers when re-populating the list.
		this.initialize();
	};

	PoiCategoriesForm.prototype = {

		initialize: function () {
			this.poiService = PiLot.Service.Nav.PoiService.getInstance();
			this.draw();
		},

		categoryForm_changeParent: function () {
			this.refreshCategoriesListAsync();
		},

		categoryForm_delete: function () {
			this.refreshCategoriesListAsync();
		},

		lnkAddCategory_click: function (pEvent) {
			pEvent.preventDefault();
			this.addCategoryForm(null);
		},

		draw: function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.poiCategoriesForm);
			this.container.appendChild(control);
			new PiLot.View.Common.ExpandCollapse(control.querySelector('h2'), control.querySelector('.pnlForm'));
			this.plhCategories = control.querySelector('.plhCategories');
			control.querySelector('.lnkAddCategory').addEventListener('click', this.lnkAddCategory_click.bind(this));
			this.populateCategoriesAsync();
		},

		populateCategoriesAsync: async function () {
			const categoriesMap = await this.poiService.getCategoriesAsync(true);
			const categoriesList = new PiLot.View.Nav.CategoriesList(categoriesMap, true).getSortedList();
			this.categoryForms = [];
			for (const objCategory of categoriesList) {
				this.addCategoryForm(objCategory.category);
			}
		},

		addCategoryForm: function (pCategory) {
			const categoryForm = new PoiCategoryForm(pCategory, this.plhCategories);
			categoryForm.on('changeParent', this, this.categoryForm_changeParent.bind(this));
			categoryForm.on('delete', this, this.categoryForm_delete.bind(this));
			this.categoryForms.push(categoryForm);
		},

		clearCategoriesList: function () {
			if (this.categoryForms) {
				this.categoryForms.forEach(function (category) {
					category.off('changeParent', this);
					category.off('delete', this);
				});
			}
			this.plhCategories.clear();
		},

		refreshCategoriesListAsync: async function () {
			const scrollTop = window.scrollY;
			this.clearCategoriesList();
			await this.populateCategoriesAsync();
			window.scrollTo(0, scrollTop);
		}
	};

	/**
	 * Simple form which allows to add, edit and delete a poi category
	 * @param {PiLot.Model.Nav.PoiCategory} pCategory - the category to edit, or null to create a new one
	 * @param {HTMLDivElement} pContainer - The container where this will be added
	 */
	var PoiCategoryForm = function (pCategory, pContainer) {
		this.category = pCategory;
		this.container = pContainer;
		this.tbName = null;
		this.labels = null;
		this.ddlParent = null;
		this.tbIcon = null;
		this.observable = null;
		this.initialize();
	};

	PoiCategoryForm.prototype = {

		initialize: function () {
			this.observable = new PiLot.Utils.Common.Observable(['changeParent', 'delete']);
			this.labels = new Map();
			this.drawAsync();
		},

		/**
		 * Registers an observer which will be called when pEvent happens.
		 * @param {String} pEvent - "changeParent", "delete"
		 * @param {Object} pObserver
		 * @param {Function} pCallback
		 * */
		on: function(pEvent, pObserver, pFunction){
			this.observable.addObserver(pEvent, pObserver, pFunction);
		},

		/**
		 * Removes all Observers for pEvent
		 * @param {String} pEvent - 'changeParent', 'delete'
		 * @param {Object} pObserver
		 */
		off: function (pEvent, pObserver) {
			this.observable.removeObserver(pEvent, pObserver);
		},

		tb_change: async function () {
			this.saveDataAsync();
		},

		lnkDelete_click: async function (pEvent) {
			pEvent.preventDefault();
			if (window.confirm(PiLot.Utils.Language.getText('confirmDeletePoiCategory'))) {
				const result = await this.deleteCategoryAsync();
				if (result) {
					this.observable.fire('delete', null);
				} else {
					window.alert(PiLot.Utils.Language.getText('couldNotDeletePoiCategory'));
				}
			}
		},

		ddlParent_change: async function () {
			await this.saveDataAsync();
			this.observable.fire('changeParent', null);
		},

		drawAsync: async function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.poiCategoryForm);
			this.container.appendChild(control);
			this.tbName = control.querySelector('.tbName');
			this.tbName.addEventListener('change', this.tb_change.bind(this));
			const tbLabelTemplate = control.querySelector('.tbLabel');
			const languages = PiLot.Utils.Language.getLanguages();
			for (let i = 0; i < languages.length; i++) {
				let tbLabel;
				if (i == 0) {
					tbLabel = tbLabelTemplate;
				} else {
					tbLabel = tbLabelTemplate.cloneNode(true);
					tbLabelTemplate.insertAdjacentElement('afterend', tbLabel);
				}
				this.labels.set(languages[i], tbLabel);
				tbLabel.addEventListener('change', this.tb_change.bind(this));
			}
			this.ddlParent = control.querySelector('.ddlParent');
			await this.fillCategoriesAsync();
			this.ddlParent.addEventListener('change', this.ddlParent_change.bind(this));
			this.tbIcon = control.querySelector('.tbIcon');
			this.tbIcon.addEventListener('change', this.tb_change.bind(this));
			control.querySelector('.lnkDelete').addEventListener('click', this.lnkDelete_click.bind(this));
			this.showData();
		},

		showData: function () {
			if (this.category) {
				this.tbName.value = this.category.getName();
				for (const [language, label] of this.labels) {
					label.value = this.category.getLabel(language);
				}
				this.ddlParent.value = this.category.getParentId();
				this.tbIcon.value = this.category.getIcon();
			}
		},

		saveDataAsync: async function () {
			if (this.tbName.value) {
				this.category = this.category || new PiLot.Model.Nav.PoiCategory(null, '', {}, '');
				this.category.setName(this.tbName.value);
				const labels = {};
				for (const [language, tbLabel] of this.labels) {
					labels[language] = tbLabel.value;
				}
				this.category.setLabels(labels);
				let parentCategory = null;
				const parentId = this.ddlParent.value;
				if (parentId) {
					const allCategories = await PiLot.Service.Nav.PoiService.getInstance().getCategoriesAsync();
					parentCategory = allCategories.get(Number(parentId));
				} 
				this.category.setParent(parentCategory);
				this.category.setIcon(this.tbIcon.value);
				await this.category.saveAsync();
			}
		},

		deleteCategoryAsync: async function () {
			if (this.category) {
				return await this.category.deleteAsync();
			} else {
				return true;
			}			
		},

		fillCategoriesAsync: async function (pDropDown) {
			await new PiLot.View.Nav.CategoriesDropDown(this.ddlParent, this.category).populateDropdownAsync();
		}

	};

	/**
	 * A simple gui to manage the poi features
	 * @param {HTMLDivElement} pContainer - The container where this will be added
	 */
	var PoiFeaturesForm = function (pContainer) {
		this.container = pContainer;
		this.poiService = null;				// PiLot.Service.Nav.PoiService
		this.plhFeatures = null;
		this.featureForms = null;			// a list of all feature forms, just to make sure we can remove the observers when re-populating the list.
		this.initialize();
	};

	PoiFeaturesForm.prototype = {

		initialize: function () {
			this.poiService = PiLot.Service.Nav.PoiService.getInstance();
			this.draw();
		},

		featureForm_delete: function () {
			this.refreshFeaturesListAsync();
		},

		lnkAddFeature_click: function (pEvent) {
			pEvent.preventDefault();
			this.addFeatureForm(null);
		},

		draw: function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.poiFeaturesForm);
			this.container.appendChild(control);
			new PiLot.View.Common.ExpandCollapse(control.querySelector('h2'), control.querySelector('.pnlForm'));
			this.plhFeatures = control.querySelector('.plhFeatures');
			control.querySelector('.lnkAddFeature').addEventListener('click', this.lnkAddFeature_click.bind(this));
			this.populateFeaturesAsync();
		},

		populateFeaturesAsync: async function () {
			const featuresMap = await this.poiService.getFeaturesAsync(true);
			this.featureForms = [];
			for (const [featureId, feature] of featuresMap) {
				this.addFeatureForm(feature);
			}
		},

		addFeatureForm: function (pFeature) {
			const featureForm = new PoiFeatureForm(pFeature, this.plhFeatures);
			featureForm.on('delete', this, this.featureForm_delete.bind(this));
			this.featureForms.push(featureForm);
		},

		clearFeaturesList: function () {
			if (this.featureForms) {
				this.featureForms.forEach(function (feature) {
					feature.off('delete', this);
				});
			}
			this.plhFeatures.clear();
		},

		refreshFeaturesListAsync: async function () {
			const scrollTop = window.scrollY;
			this.clearFeaturesList();
			await this.populateFeaturesAsync();
			window.scrollTo(0, scrollTop);
		}
	};

	/**
	 * Simple form which allows to add, edit and delete a poi feature
	 * @param {PiLot.Model.Nav.PoiFeature} pFeature - the feature to edit, or null to create a new one
	 * @param {HTMLDivElement} pContainer - The container where this will be added
	 */
	var PoiFeatureForm = function (pFeature, pContainer) {
		this.feature = pFeature;
		this.container = pContainer;
		this.tbName = null;
		this.labels = null;
		this.observable = null;
		this.initialize();
	};

	PoiFeatureForm.prototype = {

		initialize: function () {
			this.observable = new PiLot.Utils.Common.Observable(['delete']);
			this.labels = new Map();
			this.drawAsync();
		},

		/**
		 * Registers an observer which will be called when pEvent happens.
		 * @param {String} pEvent - "delete"
		 * @param {Object} pObserver
		 * @param {Function} pCallback
		 * */
		on: function(pEvent, pObserver, pFunction){
			this.observable.addObserver(pEvent, pObserver, pFunction);
		},

		/**
		 * Removes all Observers for pEvent
		 * @param {String} pEvent - 'delete'
		 * @param {Object} pObserver
		 */
		off: function (pEvent, pObserver) {
			this.observable.removeObserver(pEvent, pObserver);
		},

		tb_change: async function () {
			this.saveDataAsync();
		},

		lnkDelete_click: async function (pEvent) {
			pEvent.preventDefault();
			if (window.confirm(PiLot.Utils.Language.getText('confirmDeletePoiFeature'))) {
				const result = await this.deleteFeatureAsync();
				if (result) {
					this.observable.fire('delete', null);
				} else {
					window.alert(PiLot.Utils.Language.getText('couldNotDeletePoiFeature'));
				}
			}
		},

		drawAsync: async function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.poiFeatureForm);
			this.container.appendChild(control);
			this.tbName = control.querySelector('.tbName');
			this.tbName.addEventListener('change', this.tb_change.bind(this));
			const tbLabelTemplate = control.querySelector('.tbLabel');
			const languages = PiLot.Utils.Language.getLanguages();
			for (let i = 0; i < languages.length; i++) {
				let tbLabel;
				if (i == 0) {
					tbLabel = tbLabelTemplate;
				} else {
					tbLabel = tbLabelTemplate.cloneNode(true);
					tbLabelTemplate.insertAdjacentElement('afterend', tbLabel);
				}
				this.labels.set(languages[i], tbLabel);
				tbLabel.addEventListener('change', this.tb_change.bind(this));
			}
			control.querySelector('.lnkDelete').addEventListener('click', this.lnkDelete_click.bind(this));
			this.showData();
		},

		showData: function () {
			if (this.feature) {
				this.tbName.value = this.feature.getName();
				for (const [language, label] of this.labels) {
					label.value = this.feature.getLabel(language);
				}
			}
		},

		saveDataAsync: async function () {
			if (this.tbName.value) {
				this.feature = this.feature || new PiLot.Model.Nav.PoiFeature(null, '', {}, '');
				this.feature.setName(this.tbName.value);
				const labels = {};
				for (const [language, tbLabel] of this.labels) {
					labels[language] = tbLabel.value;
				}
				this.feature.setLabels(labels);
				await this.feature.saveAsync();
			}
		},

		deleteFeatureAsync: async function () {
			if (this.feature) {
				return await this.feature.deleteAsync();
			} else {
				return true;
			}
		}
	};

	var ChecklistsPage = function (){

		this.plhChecklists = null;
		this.editChecklistForm = null;
		this.checklistDetails = null;

		this.initialize();

	};

	ChecklistsPage.prototype = {
		
		initialize: function(){
			this.draw();
			this.loadAndShowData();
		},

		lnkChecklist_click: function (pEvent){},

		lnkAddChecklist_click: function (pEvent){},

		draw: function(){
			const pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.checklistsPage);
			PiLot.Utils.Loader.getContentArea().appendChild(pageContent);
			this.plhChecklists = pageContent.querySelector('.plhChecklists');
			pageContent.querySelector('.lnkAddChecklist').addEventListener('click', this.lnkAddChecklist_click.bind(this));
		},

		loadAndShowData: function(){
			//const checklists = 
		}
	};

	var ChecklistsPage = function (){

		this.plhContent = null;
		this.checklistsList = null;
		this.checklistDetails = null;
		this.checklistForm = null;

		this.initialize();

	};

	ChecklistsPage.prototype = {
		
		initialize: function(){
			this.draw();
			this.showList();
		},

		checklistList_selectItem: function (pChecklist){
			this.showDetails(pChecklist);
		},

		checklistList_addItem: function (){
			this.showForm(null);
		},

		checklistDetails_close: function(){
			this.showList();	
		},

		checklistDetails_edit: function(pChecklist){
			this.showForm(pChecklist);
		},

		checklistDetails_delete: function(){ 
			this.showList();
		},
		
		checklistForm_save: function(pChecklist){ 
			this.showDetails(pChecklist);
		},

		checklistForm_cancel: function(pChecklist){ 
			this.showList();
		},

		draw: function(){
			const pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.checklistsPage);
			PiLot.Utils.Loader.getContentArea().appendChild(pageContent);
			const plhContent = pageContent.querySelector('.plhContent');
			this.checklistsList = new ChecklistsList(plhContent);
			this.checklistsList.on('selectItem', this, this.checklistList_selectItem.bind(this));
			this.checklistsList.on('addItem', this, this.checklistList_addItem.bind(this));
			this.checklistDetails = new ChecklistDetails(plhContent);
			this.checklistDetails.on('edit', this, this.checklistDetails_edit.bind(this));
			this.checklistDetails.on('delete', this, this.checklistDetails_delete.bind(this));
			this.checklistDetails.on('close', this, this.checklistDetails_close.bind(this));
			this.checklistForm = new ChecklistForm(plhContent);
			this.checklistForm.on('save', this, this.checklistForm_save.bind(this));
			this.checklistForm.on('cancel', this, this.checklistForm_cancel.bind(this));
		},

		showList: function(){
			this.checklistsList.show();
			this.checklistDetails.hide();
			this.checklistForm.hide();
		},

		showDetails: function(pChecklist){
			this.checklistDetails.show(pChecklist);
			this.checklistsList.hide();
			this.checklistForm.hide();
		},
		
		showForm: function(pChecklist){
			this.checklistForm.show(pChecklist);
			this.checklistDetails.hide();
			this.checklistsList.hide();
		}

	};

	var ChecklistsList = function (pContainer){

		this.container = pContainer;
		this.control = null;
		this.lnkAddChecklist = null;
		this.plhItems = null;
		this.observable = null;

		this.initialize();

	};

	ChecklistsList.prototype = {
		
		initialize: function(){
			this.observable = new PiLot.Utils.Common.Observable(['selectItem', 'addItem'])
			PiLot.Model.Common.AuthHelper.instance().on('login', this, this.authHelper_change.bind(this));
			PiLot.Model.Common.AuthHelper.instance().on('logout', this, this.authHelper_change.bind(this));
			this.draw();
		},

		authHelper_change: function(){
			this.applyPermissions();
		},

		lnkChecklist_click: function (pChecklist, pEvent){
			pEvent.preventDefault();
			this.observable.fire('selectItem', pChecklist);
		},

		lnkAddChecklist_click: function (pEvent){
			pEvent.preventDefault();
			this.observable.fire('addItem', null);
		},

		on: function(pEvent, pObserver, pFunction){
			this.observable.addObserver(pEvent, pObserver, pFunction)
		},

		draw: function(){
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.checklistsList);
			this.container.appendChild(this.control);
			this.plhItems = this.control.querySelector('.plhItems');
			this.lnkAddChecklist = this.control.querySelector('.lnkAddChecklist');
			this.lnkAddChecklist.addEventListener('click', this.lnkAddChecklist_click.bind(this));
			this.applyPermissions();
		},

		applyPermissions: function(){
			this.lnkAddChecklist.hidden = !PiLot.Permissions.canWrite();
		},

		show: function(){
			this.control.hidden = false;
			this.loadAndShowDataAsync();
		},

		hide: function(){
			this.control.hidden = true;
		},

		loadAndShowDataAsync: async function(){
			const checklists = await new PiLot.Service.Tools.ChecklistsService().loadChecklistsAsync();
			checklists.sort((a, b) => a.title.localeCompare(b.title));
			this.plhItems.clear();
			const template = this.control.querySelector('.lnkItemTemplate');
			for(let aChecklist of checklists){
				const lnkChecklist = template.cloneNode(true);
				lnkChecklist.hidden = false;
				lnkChecklist.innerText = aChecklist.title;
				lnkChecklist.addEventListener('click', this.lnkChecklist_click.bind(this, aChecklist));
				this.plhItems.appendChild(lnkChecklist);
			}
		}
	};

	var ChecklistDetails = function (pContainer){

		this.container = pContainer;
		this.control = null;
		this.lblTitle = null;
		this.plhItems = null;
		this.checklist = null;
		this.logbookForm = null;
		this.observable = null;

		this.initialize();
	};

	ChecklistDetails.prototype = {
		
		initialize: function(){
			this.observable = new PiLot.Utils.Common.Observable(['close', 'edit', 'delete']);
			PiLot.Model.Common.AuthHelper.instance().on('login', this, this.authHelper_change.bind(this));
			PiLot.Model.Common.AuthHelper.instance().on('logout', this, this.authHelper_change.bind(this));
			this.logbookEntryForm = new PiLot.View.Logbook.LogbookEntryForm();
			this.logbookEntryForm.on('save', this, this.logbookForm_save.bind(this));
			this.draw();
		},

		authHelper_change: function(){
			this.applyPermissions();
		},

		lnkClose_click: function (pEvent){
			pEvent.preventDefault();
			this.observable.fire('close');
		},

		cbItem_change: function(pIndex, pEvent){
			this.saveCheckedAsync(pIndex, pEvent.target.checked);
		},

		lnkEdit_click: function(pEvent){
			pEvent.preventDefault();
			this.observable.fire('edit', this.checklist);
		},

		lnkLogbook_click: function(pEvent){
			pEvent.preventDefault();
			this.createLogbookEntryAsync();
		},

		lnkReset_click: function(pEvent){
			pEvent.preventDefault();
			this.resetChecklistAsync();
		},
		
		lnkDelete_click: function (pEvent){
			pEvent.preventDefault();
			this.deleteChecklistAsync();
		},

		logbookForm_save: function(){
			PiLot.Utils.Loader.PageLoader.getInstance().showPage(PiLot.Utils.Loader.pages.logbook);
		},

		on: function(pEvent, pObserver, pFunction){
			this.observable.addObserver(pEvent, pObserver, pFunction)
		},

		draw: function(){
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.checklistDetails);
			this.container.appendChild(this.control);
			this.container.querySelector('.lnkClose').addEventListener('click', this.lnkClose_click.bind(this));
			this.lblTitle = this.container.querySelector('.lblTitle');
			this.plhItems = this.control.querySelector('.plhItems');
			this.container.querySelector('.lnkEdit').addEventListener('click', this.lnkEdit_click.bind(this));
			this.container.querySelector('.lnkLogbook').addEventListener('click', this.lnkLogbook_click.bind(this));
			this.container.querySelector('.lnkReset').addEventListener('click', this.lnkReset_click.bind(this));
			this.container.querySelector('.lnkDelete').addEventListener('click', this.lnkDelete_click.bind(this));
			this.applyPermissions();
		},

		applyPermissions: function(){
			this.container.querySelector('.pnlButtons').hidden = !PiLot.Permissions.canWrite();
		},

		show: function(pChecklist){
			this.checklist = pChecklist;
			this.showChecklist();
			this.control.hidden = false;
		},

		hide: function(){
			this.control.hidden = true;
		},

		showChecklist: function(){
			this.plhItems.clear();
			this.lblTitle.innerText = this.checklist.title;
			for(let i = 0; i < this.checklist.items.length; i++){
				let control = PiLot.Utils.Common.createNode(PiLot.Templates.Common.checkbox);
				let checkbox = control.querySelector('input');
				checkbox.checked = this.checklist.items[i].checked;
				checkbox.addEventListener('change', this.cbItem_change.bind(this, i));
				control.querySelector('.lblLabel').innerText = this.checklist.items[i].title;
				this.plhItems.appendChild(control);
			}
		},

		saveCheckedAsync: async function(pIndex, pChecked){ 
			this.checklist.items[pIndex].checked = pChecked;
			await new PiLot.Service.Tools.ChecklistsService().saveCheckedAsync(this.checklist.id, pIndex, pChecked);
		},

		deleteChecklistAsync: async function(){
			if(window.confirm(PiLot.Utils.Language.getText('confirmDeleteElement'))){
				await new PiLot.Service.Tools.ChecklistsService().deleteChecklistAsync(this.checklist.id);
				this.observable.fire('delete', this.checklist.id);
			}
		},

		resetChecklistAsync: async function(){
			for(let i = 0; i < this.checklist.items.length; i++){
				this.checklist.items[i].checked = false;
			}
			for(let aCheckbox of this.plhItems.querySelectorAll('input')){
				aCheckbox.checked = false;
			}
			await new PiLot.Service.Tools.ChecklistsService().saveChecklistAsync(this.checklist);
		},

		createLogbookEntryAsync: async function(){
			let notes = [], item;
			for(let i = 0; i < this.checklist.items.length; i++){
				item = this.checklist.items[i];
				if(item.checked){
					notes.push(`☑ ${item.title}`);
				} else{
					notes.push(`☐ ${item.title}`);
				}
			}
			const boatTime = PiLot.Utils.Common.BoatTimeHelper.getCurrentBoatTime();
			const today = RC.Date.DateOnly.fromObject(boatTime.now());
			const logbookDay = await PiLot.Model.Logbook.loadLogbookDayAsync(today) || new PiLot.Model.Logbook.LogbookDay(today);
			this.logbookEntryForm.showDefaultValuesAsync(logbookDay, null, this.checklist.title, notes.join('\n'));
		}
	};

	var ChecklistForm = function (pContainer){

		this.container = pContainer;
		this.control = null;
		this.tbTitle = null;
		this.pnlItemTemplate = null;
		this.plhItems = null;
		this.checklist = null;
		this.observable = null;

		this.initialize();
	};

	ChecklistForm.prototype = {
		
		initialize: function(){
			this.observable = new PiLot.Utils.Common.Observable(['save', 'cancel'])
			this.draw();
		},

		tbTitle_change: function(pEvent){
			this.checklist.title = pEvent.target.value;
		},

		tbItemTitle_change: function (pIndex, pEvent){
			this.checklist.items[pIndex].title = pEvent.target.value;
		},

		lnkMoveDown_click: function(pIndex, pEvent){
			pEvent.preventDefault();
			this.swapItems(pIndex, 1);
		},

		lnkMoveUp_click: function(pIndex, pEvent){
			pEvent.preventDefault();
			this.swapItems(pIndex, -1);
		},
		
		lnkDeleteItem_click: function (pIndex, pEvent){
			pEvent.preventDefault();
			this.removeItem(pIndex);
		},

		lnkAddItem_click: function(pEvent){
			pEvent.preventDefault();
			this.addItem();
		},

		btnSave_click: function(pEvent){
			pEvent.preventDefault();
			this.saveChecklistAsync();
		},

		btnCancel_click: function(pEvent){
			pEvent.preventDefault();
			this.observable.fire('cancel', this.checklist);
		},

		on: function(pEvent, pObserver, pFunction){
			this.observable.addObserver(pEvent, pObserver, pFunction)
		},

		draw: function(){
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Tools.checklistForm);
			this.container.appendChild(this.control);
			this.tbTitle = this.container.querySelector('.tbTitle');
			this.tbTitle.addEventListener('change', this.tbTitle_change.bind(this));
			this.pnlItemTemplate = this.container.querySelector('.pnlItemTemplate');
			this.plhItems = this.control.querySelector('.plhItems');
			this.container.querySelector('.lnkAddItem').addEventListener('click', this.lnkAddItem_click.bind(this));
			this.container.querySelector('.btnSave').addEventListener('click', this.btnSave_click.bind(this));
			this.container.querySelector('.btnCancel').addEventListener('click', this.btnCancel_click.bind(this));
		},

		show: function(pChecklist){
			this.checklist = pChecklist || {
				title: '', id: null, items: []
			};
			this.control.hidden = false;
			this.showChecklist();
		},

		hide: function(){
			this.control.hidden = true;
		},

		showChecklist: function(){
			this.plhItems.clear();
			if(this.checklist){
				this.tbTitle.value = this.checklist.title;
				for(let i = 0; i < this.checklist.items.length; i++){
					let control = this.pnlItemTemplate.cloneNode(true);
					control.hidden = false;
					let textbox = control.querySelector('input');
					textbox.value = this.checklist.items[i].title;
					textbox.addEventListener('change', this.tbItemTitle_change.bind(this, i));
					const lnkMoveDown = control.querySelector('.lnkMoveDown');
					lnkMoveDown.addEventListener('click', this.lnkMoveDown_click.bind(this, i));
					lnkMoveDown.hidden = i === (this.checklist.items.length - 1);
					const lnkMoveUp = control.querySelector('.lnkMoveUp');
					lnkMoveUp.addEventListener('click', this.lnkMoveUp_click.bind(this, i));
					lnkMoveUp.hidden = i === 0;
					control.querySelector('.lnkDeleteItem').addEventListener('click', this.lnkDeleteItem_click.bind(this, i));
					this.plhItems.appendChild(control);
					if(!this.checklist.items[i].title){
						textbox.focus();
					}
				}
				if(!this.checklist.items.length && !this.checklist.title){
					this.tbTitle.focus();
				}
			} else {
				this.tbTitle.value = '';
			}			
		},

		saveChecklistAsync: async function(){ 
			this.checklist.id = await new PiLot.Service.Tools.ChecklistsService().saveChecklistAsync(this.checklist);
			this.observable.fire('save', this.checklist);
		},

		swapItems: function(pIndex, pAmount){
			this.checklist.items.swap(pIndex, pIndex + pAmount);
			this.showChecklist();
		},

		removeItem: function(pIndex){
			this.checklist.items.remove(pIndex);
			this.showChecklist();
		}, 

		addItem: function(){
			this.checklist.items.push({title: '', checked: false});
			this.showChecklist();
		},
	};


	/// return the classes
	return {
		GpsImportExportForm: GpsImportExportForm,
		SpeedDiagram: SpeedDiagram,
		TilesDownloadForm: TilesDownloadForm,
		PoisManagementPage: PoisManagementPage,
		ChecklistsPage: ChecklistsPage,
		ChecklistsList: ChecklistsList,
		ChecklistDetails: ChecklistDetails,
	};

})();
