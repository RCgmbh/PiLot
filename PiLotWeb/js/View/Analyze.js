﻿/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

PiLot.View.Analyze = (function () {
	
	var AnalyzePage = function () {
		this.tackAnalyzeService = null;
		this.tackAnalyzerOptions = null;
		this.rblMode = null;
		this.historicTacksInfo = null;
		this.liveTackInfo = null;
		this.mapTacks = null;			// PiLot.View.Analyze.MapTacks
		this.analyzerOptions = null;
		this.initializeAsync();
	};

	AnalyzePage.prototype = {

		initializeAsync: async function () {
			await this.drawAsync();
			await this.initializeMode();
		},
		
		rblMode_change: function (pEvent) {
			const mode = Number(pEvent.target.value);
			this.setMode(mode);
		},

		drawAsync: async function () {
			const pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Analyze.analyzePage);
			PiLot.Utils.Loader.getContentArea().appendChild(pageContent);
			this.rblMode = pageContent.querySelectorAll('.rblMode');
			for (let rbMode of this.rblMode) {
				rbMode.addEventListener('change', this.rblMode_change.bind(this));
			}
			const tackAnalyzerOptions = new TackAnalyzerOptions(pageContent.querySelector('.plhSettings'));
			const map = new PiLot.View.Map.Seamap(pageContent.querySelector('.pnlMap'), {positionMarker: true});
			await map.showAsync();
			const mapTrack = new PiLot.View.Map.MapTrack(map, false);
			const mapTacks = new MapTacks(map);
			const plhHistoricTacks = pageContent.querySelector('.plhHistoricTacks');
			this.historicTacksInfo = new HistoricTacksInfo(plhHistoricTacks, tackAnalyzerOptions, mapTacks, mapTrack);
			this.historicTacksInfo.hide();
			const plhLiveTacks = pageContent.querySelector('.plhLiveTacks');
			this.liveTackInfo = new LiveTackInfo(plhLiveTacks, tackAnalyzerOptions, mapTacks, mapTrack);
			this.liveTackInfo.hide();
		},

		initializeMode: function () {
			let mode;
			if (this.historicTacksInfo.isDirectUrl()) {
				mode = 1;
			} else {
				mode = this.loadMode();
			}
			this.showMode(mode);
			this.applyMode(mode);
		},

		loadMode: function(){
			return PiLot.Utils.Common.loadUserSetting('PiLot.View.Analyze.AnalyzePage.mode') || 0;
		},

		setMode: function (pMode) {
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Analyze.AnalyzePage.mode', pMode);
			this.applyMode(pMode);
		},

		showMode: function(pMode){
			for (let rbMode of this.rblMode) {
				rbMode.checked = pMode === Number(rbMode.value);
			}
		},

		applyMode: function(pMode){
			this.liveTackInfo.toggle(pMode === 0);
			this.historicTacksInfo.toggle(pMode === 1);
		}		
	};

	var HistoricTacksInfo = function(pContainer, pTackAnalyzerOptions, pMapTacks, pMapTrack){
		this.container = pContainer;
		this.tackAnalyzerOptions = pTackAnalyzerOptions;
		this.mapTacks = pMapTacks;							// PiLot.View.Analyze.MapTacks
		this.mapTrack = pMapTrack;							// PiLot.View.Map.MapTrack
		this.tackAnalyzer = null;							// PiLot.Model.Analyze.TackAnalyzer
		this.track = null;
		this.urlTrackId = null;
		this.urlDate = null;
		this.control = null;
		this.calDate = null;
		this.tracksList = null;
		this.pnlNoData = null;
		this.initialize();
	};

	HistoricTacksInfo.prototype = {
		
		initialize: function(){
			this.tackAnalyzerOptions.on('change', this.tackAnalyzerOptions_change.bind(this));
			this.draw();
		},

		btnLoadData_click: async function () {
			const date = RC.Date.DateOnly.fromObject(this.calDate.date());
			const tracks = await this.loadTracksByDateAsync(date);
			this.tracksList.showTracks(tracks || []);
		},

		tracksList_trackSelected: function (pSender, pTrack) {
			this.track = pTrack;
			this.showTrackAsync();
		},

		tackAnalyzerOptions_change: function (pSender, pOptions) {
			if(!this.control.hidden){
				this.showTrackAnalysis(false);
			}
		},

		draw: function(){
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Analyze.historicTacksInfo);
			this.container.appendChild(this.control);
			const tbDate = this.control.querySelector('.tbDate');
			const divCalDate = this.control.querySelector('.divCalDate');
			this.calDate = new RC.Controls.Calendar(divCalDate, tbDate, null, null, null, PiLot.Utils.Language.getLanguage());
			this.control.querySelector('.btnLoadData').addEventListener('click', this.btnLoadData_click.bind(this));
			this.tracksList = new PiLot.View.Nav.TracksList(this.control.querySelector('.plhTracksList'));
			this.tracksList.on('trackSelected', this.tracksList_trackSelected.bind(this));
			this.pnlNoData = this.control.querySelector('.pnlNoData');
		},

		isDirectUrl: function(){
			this.urlTrackId = RC.Utils.getUrlParameter('track');
			if(!this.urlTrackId){
				this.urlDate = PiLot.Utils.Common.parseQsDate();
			}
			return this.urlTrackId || this.urlDate;
		},

		toggle: function(pDoShow){
			pDoShow ? this.showAsync() : this.hide();
		},

		showAsync: async function(){
			this.mapTacks.setShowValues(true);
			this.control.hidden = false;
			if(this.track === null){
				const tracks = (
					(this.urlTrackId && await this.loadTrackByIdAsync(this.urlTrackId)) 
					|| (this.urlDate && await this.loadTracksByUrlDateAsync())
					|| await this.loadTracksBySavedDateAsync()
				);
				this.tracksList.showTracks(tracks || []);
				this.pnlNoData.hidden = !!(tracks && tracks.length);
			} else {
				await this.showTrackAsync();
			}
		},

		hide: function(){
			this.control.hidden = true;
		},

		loadTrackByIdAsync: async function(pTrackId){
			const result = await PiLot.Service.Nav.TrackService.getInstance().loadTrackAsync(pTrackId);
			if (result && result.hasTrackPoints()){
				const date = RC.Date.DateHelper.millisToLuxon(result.getTrackPoints()[0].getBoatTime());
				this.showDate(date);
			}
			this.urlTrackId = null;
			return result ? [result] : [];
		},

		loadTracksByUrlDateAsync: async function () {
			const result = await this.loadTracksByDateAsync(this.urlDate);
			this.urlDate = null;
			return result;
		},

		loadTracksBySavedDateAsync: async function (){
			let result = null;
			let date = this.loadDate();
			if(!date){
				const currentBoatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
				date = currentBoatTime.today();
			}
			result = await this.loadTracksByDateAsync(date);
			return result;
		},

		/** @param {RC.Date.DateOnly} pDate - a simple date */
		loadTracksByDateAsync: async function (pDate){
			const result = await PiLot.Service.Nav.TrackService.getInstance().loadTracksByDateAsync(pDate);
			this.showDate(pDate.toLuxon());
			await this.saveDateAsync(pDate);
			return result;
		},

		/** @param {DateTime} pDate - a luxon date */
		showDate: function (pDate){
			this.calDate.date(pDate);
			this.calDate.showDate();
		},

		showTrackAsync: async function () {
			if (this.track) {
				await this.tackAnalyzerOptions.setBoatAsync(this.track.getBoat());
				this.tackAnalyzer = new PiLot.Model.Analyze.TackAnalyzer(this.track);
				this.showTrackAnalysis(true);
			} else {
				const boatConfig = await PiLot.Model.Boat.loadCurrentConfigAsync();
				await this.tackAnalyzerOptions.setBoatAsync(boatConfig.getName());
			}
			this.pnlNoData.hidden = !!this.track;
		},

		showTrackAnalysis: function (pZoomToTrack = true) {
			if (this.track) {
				this.mapTrack.setTracks([this.track], pZoomToTrack);
				const options = this.tackAnalyzerOptions.getOptions();
				const tacks = this.tackAnalyzer.findTacks(
					options.minSampleLength,
					options.maxSampleAngle,
					options.minLeg1Length,
					options.minLeg2Length,
					options.maxTurnDistance,
					options.minTurnAngle,
					options.maxTurnAngle,
				);
				this.mapTacks.showTacks(tacks);
			}
		},

		/** @returns {RC.Date.DateOnly} a simple date */
		loadDate: function(){
			return RC.Date.DateOnly.fromObject(
				PiLot.Utils.Common.loadUserSetting('PiLot.View.Analyze.AnalyzePage.date')
			);
		},

		/**
		 * Saves the selected date to user settings. If today's date is selected,
		 * null will be saved so that next time we will fall back to the current
		 * date again. 
		 * @param {RC.Date.DateOnly} pDate - a simple date
		 * */
		saveDateAsync: async function(pDate){
			const currentBoatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			let saveDate = currentBoatTime.today().equals(pDate) ? null : pDate;
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Analyze.AnalyzePage.date', saveDate);
		},

	};

	var LiveTackInfo = function(pContainer, pTackAnalyzerOptions, pMapTacks, pMapTrack){
		this.container = pContainer;
		this.tackAnalyzerOptions = pTackAnalyzerOptions;
		this.mapTacks = pMapTacks;
		this.mapTrack = pMapTrack;
		this.track = null;									// PiLot.Model.Nav.Track
		this.tackAnalyzer = null;							// PiLot.Model.Analyze.TackAnalyzer
		this.control = null;
		this.gpsObserver = null;
		this.trackObserver = null;
		this.maxLengthSeconds = 3600;
		this.pnlNoData = null;
		this.lblTackAngle = null;
		this.lblVMG = null;
		this.initialize();
	};

	LiveTackInfo.prototype = {
	
		initialize: function(){
			this.gpsObserver = new PiLot.Model.Nav.GPSObserver({intervalMs: 1000, calculationRange: 2, autoStart: false});
			this.gpsObserver.on('recieveGpsData', this.gpsObserver_recieveGpsData.bind(this));
			this.gpsObserver.on('outdatedGpsData', this.gpsObserver_outdatedGpsData.bind(this));
			this.tackAnalyzerOptions.on('change', this.tackAnalyzerOptions_change.bind(this));
			this.trackObserver = new PiLot.Model.Nav.TrackObserver(null, this.gpsObserver);
			this.trackObserver.setTrackSeconds(this.maxLengthSeconds);
			this.draw();
		},

		track_change: function(){
			this.showTackInfoAsync();
		},

		gpsObserver_recieveGpsData: function(){
			if(this.track === null){
				this.loadCurrentTrackAsync();
				this.showTackInfoAsync();
			}
		},

		gpsObserver_outdatedGpsData: function(){
			this.setTrackAsync(null);
		},
		
		tackAnalyzerOptions_change: function (pSender, pOptions) {
			this.showTackInfoAsync();
		},

		draw: function(){
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Analyze.liveTackInfo);
			this.container.appendChild(this.control);
			this.pnlNoData = this.control.querySelector('.pnlNoData');
			this.lblTackAngle = this.control.querySelector('.lblTackAngle');
			this.lblVMG = this.control.querySelector('.lblVMG');
		},

		toggle: function(pDoShow){
			pDoShow ? this.show() : this.hide();
		},

		show: async function(){
			this.mapTacks.setShowValues(false);
			this.control.hidden = false;
			this.gpsObserver.start();
			await this.loadCurrentTrackAsync();
			await this.showTackInfoAsync();
		},

		hide: function(){
			this.control.hidden = true;
			this.gpsObserver.stop();
		},

		loadCurrentTrackAsync: async function(){
			const currentBoatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			const endMs = currentBoatTime.now().toMillis();
			const startMs = endMs - (this.maxLengthSeconds * 1000);
			const tracks = await PiLot.Service.Nav.TrackService.getInstance().loadTracksAsync(startMs, endMs, false);
			if (tracks.length > 0) {
				tracks.sort((t1, t2) => t2.compareTo(t1));
				await this.setTrackAsync(tracks[0]);
			} else {
				await this.setTrackAsync(null);
			}
		},
		
		setTrackAsync: async function(pTrack){
			if(this.track){
				this.track.off('addTrackPoint');
				this.track.off('changeLastTrackPoint');
			}
			this.track = pTrack;
			if(this.track){
				await this.tackAnalyzerOptions.setBoatAsync(this.track.getBoat());
				this.track.on('addTrackPoint', this.track_change.bind(this));
				this.track.on('changeLastTrackPoint', this.track_change.bind(this));
				this.trackObserver.setTrack(this.track);
				this.mapTrack.setTracks([this.track], true);
			} else {
				const boatConfig = await PiLot.Model.Boat.loadCurrentConfigAsync();
				await this.tackAnalyzerOptions.setBoatAsync(boatConfig.getName());
			}
			this.pnlNoData.hidden = !!this.track;
		},

		/**
		 * Shows the tack angle, which is the angle between last tack's first leg, and the
		 * current cog. Also shows the VMG, which is based on the wind direction taken
		 * from the last two (if available) or one tack.
		 */
		showTackInfoAsync: async function(){
			let lastTacks = this.findLastTacks();
			if (lastTacks.length > 0){
				let windDirection;
				if(lastTacks.length === 2){
					windDirection = PiLot.Utils.Nav.getAverageBearing(lastTacks[0].windDirection, lastTacks[1].windDirection);
				} else {
					windDirection = lastTacks[0].windDirection;
				}
				this.mapTacks.showTacks(lastTacks);
				const cog = this.gpsObserver.getCOG();
				const angle = PiLot.Utils.Nav.getAngle(lastTacks[0].leg1.bearing, cog);
				this.lblTackAngle.innerText = Math.round(angle);
				const sog = this.gpsObserver.getSOG();
				const vmg = PiLot.Utils.Nav.getVmg(windDirection, cog, sog);
				this.lblVMG.innerText = vmg.toFixed(1);
			} else{
				this.mapTacks.clear();
				this.lblTackAngle.innerText = '-';
				this.lblVMG.innerText = '-';
			}
		},

		/** @returns {Object[]} - the last 0-2 tacks */
		findLastTacks: function(){
			let result;
			if(this.track){
				this.tackAnalyzer = new PiLot.Model.Analyze.TackAnalyzer(this.track);
				const options = this.tackAnalyzerOptions.getOptions();
				result = this.tackAnalyzer.findTacks(
					options.minSampleLength,
					options.maxSampleAngle,
					options.minLeg1Length,
					options.minLeg2Length,
					options.maxTurnDistance,
					options.minTurnAngle,
					options.maxTurnAngle,
					2
				);
			} else {
				result = [];
			}
			return result;
		}
	};

	var MapTacks = function(pMap){
		this.map = pMap;
		this.showValues = true;
		this.layer = null;
		this.initialize();
	};

	MapTacks.prototype = {
	
		initialize: function(){
			this.layer = L.layerGroup().addTo(this.map.getLeafletMap());
		},

		setShowValues: function(pShow){
			this.showValues = pShow;
		},

		showTacks: function(pTacks){
			this.clear();
			for (let aTack of pTacks) {
				this.showTack(aTack);
			}
		},

		clear: function(){
			this.layer.clearLayers();
		},

		showTack: function (pTack) {
			this.showLeg(pTack.leg1);
			this.showLeg(pTack.leg2);
			if(this.showValues){
				const html = `<div>${Math.round(pTack.angle)}°</div>`
				const icon = L.divIcon({
					className: `tackMarker`, iconSize: [null, null], html: html
				});
				const options = { icon: icon, draggable: false, autoPan: true, zIndexOffset: 2000 };
				const latLng1 = pTack.leg1.end.getLatLng();
				const latLng2 = pTack.leg2.start.getLatLng();
				const position = [(latLng1[0] + latLng2[0]) / 2, (latLng1[1] + latLng2[1]) / 2];
				const marker = L.marker(position, options);
				marker.addTo(this.layer);
			}
		},

		showLeg: function (pLeg) {
			const polyline = L.polyline(
				[pLeg.start.getLatLng(), pLeg.end.getLatLng()], PiLot.Templates.Analyze.tackLineOptions
			).addTo(this.layer);
		}
	};

	var TackAnalyzerOptions = function (pContainer) {
		this.container = pContainer;
		this.control = null;
		this.ddlSliderScale = null;
		this.sliderScale = null;
		this.rngMinSampleLength = null;
		this.lblMinSampleLength = null;
		this.rngMaxSampleAngle = null;
		this.lblMaxSampleAngle = null;
		this.rngMinTurnAngle = null;
		this.lblMinTurnAngle = null;
		this.rngMaxTurnAngle = null;
		this.lblMaxTurnAngle = null;
		this.rngMaxTurnDistance = null;
		this.lblMaxTurnDistance = null;
		this.rngMinLeg1Length = null;
		this.lblMinLeg1Length = null;
		this.rngMinLeg2Length = null;
		this.lblMinLeg2Length = null;
		this.lnkSaveSettings = null;
		this.pnlSaveSuccess = null;
		this.tackAnalyzeService = null;
		this.options = null;
		this.boat = null;
		this.observers = null;
		this.initialize();
	};

	TackAnalyzerOptions.prototype = {

		initialize: function () {
			this.tackAnalyzeService = new PiLot.Service.Analyze.TackAnalyzeService();
			this.observers = RC.Utils.initializeObservers(['change']);
			const authHelper = PiLot.Model.Common.AuthHelper.instance();
			authHelper.on('login', this.authHelper_change.bind(this));
			authHelper.on('logout', this.authHelper_change.bind(this));
			this.draw();
			this.loadSliderScale();
		},

		/**
		 * @param {String} pEvent - "change"
		 * @param {Function} pCallback
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		authHelper_change: function () {
			this.applyPermissions();
		},

		ddlSliderScale_change: function (pEvent) {
			this.adjustSliderScale(pEvent.target.value);
		},

		rngMinSampleLength_change: function (pEvent) {
			this.changeOption('minSampleLength', pEvent.target.value, this.lblMinSampleLength, true);
		},

		rngMaxSampleAngle_change: function (pEvent) {
			this.changeOption('maxSampleAngle', pEvent.target.value, this.lblMaxSampleAngle, false);
		},

		rngMinTurnAngle_change: function (pEvent) {
			this.changeOption('minTurnAngle', pEvent.target.value, this.lblMinTurnAngle, false);
		},

		rngMaxTurnAngle_change: function (pEvent) {
			this.changeOption('maxTurnAngle', pEvent.target.value, this.lblMaxTurnAngle, false);
		},

		rngMaxTurnDistance_change: function (pEvent) {
			this.changeOption('maxTurnDistance', pEvent.target.value, this.lblMaxTurnDistance, true);
		},

		rngMinLeg1Length_change: function (pEvent) {
			this.changeOption('minLeg1Length', pEvent.target.value, this.lblMinLeg1Length, true);
		},

		rngMinLeg2Length_change: function (pEvent) {
			this.changeOption('minLeg2Length', pEvent.target.value, this.lblMinLeg2Length, true);
		},

		lnkSaveSettings_click: function (pEvent) {
			this.saveOptionsAsync();
		},

		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Analyze.tackAnalyzerOptions);
			this.container.appendChild(this.control);
			new PiLot.View.Common.ExpandCollapse(this.control.querySelector('.lblSettings'), this.control.querySelector('.pnlSettings'));
			this.ddlSliderScale = this.control.querySelector('.ddlSliderScale');
			this.ddlSliderScale.addEventListener('change', this.ddlSliderScale_change.bind(this));
			this.rngMinSampleLength = this.control.querySelector('.rngMinSampleLength');
			this.rngMinSampleLength.addEventListener('input', this.rngMinSampleLength_change.bind(this));
			this.lblMinSampleLength = this.control.querySelector('.lblMinSampleLength');
			this.rngMaxSampleAngle = this.control.querySelector('.rngMaxSampleAngle');
			this.rngMaxSampleAngle.addEventListener('input', this.rngMaxSampleAngle_change.bind(this));
			this.lblMaxSampleAngle = this.control.querySelector('.lblMaxSampleAngle');
			this.rngMinTurnAngle = this.control.querySelector('.rngMinTurnAngle');
			this.rngMinTurnAngle.addEventListener('input', this.rngMinTurnAngle_change.bind(this));
			this.lblMinTurnAngle = this.control.querySelector('.lblMinTurnAngle');
			this.rngMaxTurnAngle = this.control.querySelector('.rngMaxTurnAngle');
			this.rngMaxTurnAngle.addEventListener('input', this.rngMaxTurnAngle_change.bind(this));
			this.lblMaxTurnAngle = this.control.querySelector('.lblMaxTurnAngle');
			this.rngMaxTurnDistance = this.control.querySelector('.rngMaxTurnDistance');
			this.rngMaxTurnDistance.addEventListener('input', this.rngMaxTurnDistance_change.bind(this));
			this.lblMaxTurnDistance = this.control.querySelector('.lblMaxTurnDistance');
			this.rngMinLeg1Length = this.control.querySelector('.rngMinLeg1Length');
			this.rngMinLeg1Length.addEventListener('input', this.rngMinLeg1Length_change.bind(this));
			this.lblMinLeg1Length = this.control.querySelector('.lblMinLeg1Length');
			this.rngMinLeg2Length = this.control.querySelector('.rngMinLeg2Length');
			this.rngMinLeg2Length.addEventListener('input', this.rngMinLeg2Length_change.bind(this));
			this.lblMinLeg2Length = this.control.querySelector('.lblMinLeg2Length');
			this.lnkSaveSettings = this.control.querySelector('.lnkSaveSettings');
			this.lnkSaveSettings.addEventListener('click', this.lnkSaveSettings_click.bind(this));
			this.pnlSaveSuccess = this.control.querySelector('.pnlSaveSuccess');
		},

		applyPermissions: function () {
			this.lnkSaveSettings.hidden = !PiLot.Permissions.canWrite();
		},

		toggle: function (pVisible) {
			this.control.hidden = !pVisible;
		},

		getOptions: function () {
			return this.options;
		},

		setBoatAsync: async function (pBoat) {
			if(pBoat !== this.boat){
				this.boat = pBoat;
				await this.loadOptionsAsync();
			}
		},

		loadSliderScale: function () {
			this.sliderScale = PiLot.Utils.Common.loadUserSetting('PiLot.View.Analyze.TackAnalyzerOptions.sliderScale') || 10;
		},

		adjustSliderScale: function (pScale) {
			this.sliderScale = Number(pScale);
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Analyze.TackAnalyzerOptions.sliderScale', this.sliderScale);
			this.setScaledRangeValue(this.rngMinSampleLength, this.options.minSampleLength);
			this.setScaledRangeValue(this.rngMaxTurnDistance, this.options.maxTurnDistance);
			this.setScaledRangeValue(this.rngMinLeg1Length, this.options.minLeg1Length);
			this.setScaledRangeValue(this.rngMinLeg2Length, this.options.minLeg2Length);
		},

		loadOptionsAsync: async function () {
			if (this.boat) {
				this.options = await this.tackAnalyzeService.loadTackAnalyzerOptionsAsync(this.boat);
			}
			if (!this.options) {
				this.initializeDefaultOptions();
			}
			this.showOptions();
			this.pnlSaveSuccess.hidden = true;
		},

		saveOptionsAsync: async function () {
			if (this.boat) {
				await this.tackAnalyzeService.saveTackAnalyzerOptionsAsync(this.boat, this.options);
				this.pnlSaveSuccess.hidden = false;
			}
		},

		showOptions: function () {
			this.ddlSliderScale.value = this.sliderScale;
			this.setScaledRangeValue(this.rngMinSampleLength, this.options.minSampleLength);
			this.lblMinSampleLength.innerText = this.options.minSampleLength;
			this.rngMaxSampleAngle.value = this.options.maxSampleAngle;
			this.lblMaxSampleAngle.innerText = this.options.maxSampleAngle;
			this.rngMinTurnAngle.value = this.options.minTurnAngle;
			this.lblMinTurnAngle.innerText = this.options.minTurnAngle;
			this.rngMaxTurnAngle.value = this.options.maxTurnAngle;
			this.lblMaxTurnAngle.innerText = this.options.maxTurnAngle;
			this.setScaledRangeValue(this.rngMaxTurnDistance, this.options.maxTurnDistance);
			this.lblMaxTurnDistance.innerText = this.options.maxTurnDistance;
			this.setScaledRangeValue(this.rngMinLeg1Length, this.options.minLeg1Length);
			this.lblMinLeg1Length.innerText = this.options.minLeg1Length;
			this.setScaledRangeValue(this.rngMinLeg2Length, this.options.minLeg2Length);
			this.lblMinLeg2Length.innerText = this.options.minLeg2Length;
		},

		changeOption: function (pOptionsKey, pValue, pLabel, pIsScaled) {
			const value = pIsScaled ? this.getScaledRangeValue(pValue) : pValue;
			this.options[pOptionsKey] = value;
			pLabel.innerText = value;
			this.pnlSaveSuccess.hidden = true;
			this.lnkSaveSettings.hidden = !PiLot.Permissions.canWrite();
			RC.Utils.notifyObservers(this, this.observers, 'change', this.options);
		},

		setScaledRangeValue: function (pRange, pValue) {
			pRange.value = Math.ceil(pValue / this.sliderScale);
		},

		getScaledRangeValue: function (pValue) {
			return pValue * this.sliderScale;
		},

		initializeDefaultOptions: function () {
			this.options = {
				minSampleLength: 9,
				maxSampleAngle: 20,
				minLeg1Length: 100,
				minLeg2Length: 100,
				maxTurnDistance: 30,
				minTurnAngle: 70,
				maxTurnAngle: 140
			};
		},

	};

	/// return the classes
	return {
		AnalyzePage: AnalyzePage
	};

})();
