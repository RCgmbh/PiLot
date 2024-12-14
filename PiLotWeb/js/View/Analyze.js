/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

PiLot.View.Analyze = (function () {
	
	var AnalyzePage = function () {
		this.tackAnalyzeService = null;
		this.tackAnalyzerOptions = null;
		this.rblMode = null;
		this.pnlHistoricTacks = null;
		this.calData = null;
		this.tracksList = null;
		this.pnlLiveTacks = null;
		this.liveTackInfo = null;
		this.mapTrack = null;			// PiLot.View.Map.MapTrack
		this.mapTacks = null;			// PiLot.View.Analyze.MapTacks
		this.track = null;
		this.tackAnalyzer = null;		// PiLot.Model.Analyze.TackAnalyzer
		this.analyzerOptions = null;
		this.pnlNoData = null;
		this.initializeAsync();
	};

	AnalyzePage.prototype = {

		initializeAsync: async function () {
			this.tackAnalyzeService = new PiLot.Service.Analyze.TackAnalyzeService();
			await this.drawAsync();
			await this.initializeTracksAsync();
		},
		
		rblMode_change: function (pEvent) {
			const mode = Number(pEvent.target.value);
			this.setModeAsync(mode);
		},

		calDate_dateSelected: async function(pSender, pDate){
			
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
			this.showTrackAnalysis(false);
		},

		drawAsync: async function () {
			const pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Analyze.analyzePage);
			PiLot.Utils.Loader.getContentArea().appendChild(pageContent);
			this.rblMode = pageContent.querySelectorAll('.rblMode');
			for (let rbMode of this.rblMode) {
				rbMode.addEventListener('change', this.rblMode_change.bind(this));
			}
			this.pnlHistoricTacks = pageContent.querySelector('.pnlHistoricTacks');
			const tbDate = pageContent.querySelector('.tbDate');
			const divCalDate = pageContent.querySelector('.divCalDate');
			this.calDate = new RC.Controls.Calendar(divCalDate, tbDate, null, this.calDate_dateSelected.bind(this), null, PiLot.Utils.Language.getLanguage());
			pageContent.querySelector('.btnLoadData').addEventListener('click', this.btnLoadData_click.bind(this));
			this.tracksList = new PiLot.View.Nav.TracksList(pageContent.querySelector('.plhTracksList'));
			this.tracksList.on('trackSelected', this.tracksList_trackSelected.bind(this));
			this.pnlLiveTacks = pageContent.querySelector('.pnlLiveTacks');
			this.liveTackInfo = new LiveTackInfo(this.pnlLiveTacks);
			this.tackAnalyzerOptions = new TackAnalyzerOptions(pageContent.querySelector('.plhSettings'));
			this.tackAnalyzerOptions.on('change', this.tackAnalyzerOptions_change.bind(this));
			this.pnlNoData = pageContent.querySelector('.pnlNoData');
			const map = new PiLot.View.Map.Seamap(pageContent.querySelector('.pnlMap'));
			await map.showAsync();
			this.mapTrack = new PiLot.View.Map.MapTrack(map);
			this.mapTacks = new MapTacks(map);
		},

		initializeTracksAsync: async function () {
			let mode;
			let tracks = (
				   await this.loadTrackByUrlTrackIdAsync() 
				|| await this.loadTracksByUrlDateAsync() 
			);
			if (tracks) {
				mode = 1;
			} else {
				mode = this.loadMode();
				if(mode){
					tracks = await this.loadTracksBySavedDateAsync();
				}
			}
			this.tracksList.showTracks(tracks || []);
			this.showMode(mode);
			this.applyMode(mode);
		},

		loadTrackByUrlTrackIdAsync: async function(){
			let result = null;
			const trackId = RC.Utils.getUrlParameter('track');
			if (trackId) {
				const track = await PiLot.Service.Nav.TrackService.getInstance().loadTrackAsync(trackId);
				if (track){
					result = [track];
					if(track.hasTrackPoints()){
						const date = RC.Date.DateHelper.millisToLuxon(track.getTrackPoints()[0].getBoatTime());
						this.showDate(date);
					}
				} 
			}
			return result;
		},

		loadTracksByUrlDateAsync: async function () {
			let result = null;
			const date = PiLot.Utils.Common.parseQsDate();
			if (date) {
				result = await this.loadTracksByDateAsync(date);
			}
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
			this.saveDate(pDate);
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
			} 
			this.pnlNoData.hidden = !!this.track;
			this.tackAnalyzerOptions.toggle(!!this.track);
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
					options.minTurnAngle
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

		/** @param {RC.Date.DateOnly} pDate - a simple date */
		saveDate: function(pDate){
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Analyze.AnalyzePage.date', pDate);
		},

		loadMode: function(){
			return PiLot.Utils.Common.loadUserSetting('PiLot.View.Analyze.AnalyzePage.mode') || 0;
		},

		setModeAsync: async function (pMode) {
			this.applyMode(pMode);
			if (pMode === 0) { // live
				
			}
			else if (pMode === 1) { 
				const tracks = await this.loadTracksBySavedDateAsync();
				this.tracksList.showTracks(tracks || []);
			}
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Analyze.AnalyzePage.mode', pMode);
		},

		showMode: function(pMode){
			for (let rbMode of this.rblMode) {
				rbMode.checked = pMode === Number(rbMode.value);
			}
		},

		applyMode: function(pMode){
			this.pnlLiveTacks.hidden = pMode !== 0;
			this.pnlHistoricTacks.hidden = pMode !== 1;		
		}		
	};

	var LiveTackInfo = function(pContainer){
		this.container = pContainer;
		this.control = null;
		this.gpsObserver = null;
		this.initialize();
	};

	LiveTackInfo.prototype = {
	
		initialize: function(){
			this.draw();
		},

		draw: function(){
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Analyze.liveTackInfo);
			this.container.appendChild(this.control);
		},

		start: function(){
		},

		stop: function(){
		}
	
	};

	var MapTacks = function(pMap){
		this.map = pMap;
		this.layer = null;
		this.initialize();
	};

	MapTacks.prototype = {
	
		initialize: function(){
			this.layer = L.layerGroup().addTo(this.map.getLeafletMap());
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
			//console.log(`Wind direction: ${pTack.windDirection}`);
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
			this.boat = pBoat;
			await this.loadOptionsAsync();
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
				minTurnAngle: 70
			};
		},

	};

	/// return the classes
	return {
		AnalyzePage: AnalyzePage
	};

})();
