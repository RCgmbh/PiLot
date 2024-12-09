/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

PiLot.View.Analyze = (function () {
	
	var AnalyzePage = function () {
		this.tackAnalyzeService = null;
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
		this.leafletMap = null;
		this.mapTrack = null;			// PiLot.View.Map.MapTrack
		this.tacksLayerGroup = null;	
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
			this.loadSliderScale();
			const authHelper = PiLot.Model.Common.AuthHelper.instance();
			authHelper.on('login', this.authHelper_change.bind(this));
			authHelper.on('logout', this.authHelper_change.bind(this));
			await this.loadTrackAsync();
		},

		authHelper_change: function () {
			this.applyPermissions();
		},

		ddlSliderScale_change: function (pEvent){
			this.adjustSliderScale(pEvent.target.value);
		}, 
		
		rngMinSampleLength_change: function(pEvent){
			this.changeOption('minSampleLength', pEvent.target.value, this.lblMinSampleLength, true);
		},

		rngMaxSampleAngle_change: function(pEvent){
			this.changeOption('maxSampleAngle', pEvent.target.value, this.lblMaxSampleAngle, false);
		},

		rngMinTurnAngle_change: function(pEvent){
			this.changeOption('minTurnAngle', pEvent.target.value, this.lblMinTurnAngle, false);
		},

		rngMaxTurnDistance_change: function(pEvent){
			this.changeOption('maxTurnDistance', pEvent.target.value, this.lblMaxTurnDistance, true);
		},

		rngMinLeg1Length_change: function(pEvent){
			this.changeOption('minLeg1Length', pEvent.target.value, this.lblMinLeg1Length, true);
		},

		rngMinLeg2Length_change: function(pEvent){
			this.changeOption('minLeg2Length', pEvent.target.value, this.lblMinLeg2Length, true);
		},

		lnkSaveSettings_click: function (pEvent) {
			this.saveAnalyzerOptionsAsync();
		},

		drawAsync: async function () {
			let pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Analyze.analyzePage);
			PiLot.Utils.Loader.getContentArea().appendChild(pageContent);
			this.ddlSliderScale = pageContent.querySelector('.ddlSliderScale');
			this.ddlSliderScale.addEventListener('change', this.ddlSliderScale_change.bind(this));
			this.rngMinSampleLength = pageContent.querySelector('.rngMinSampleLength');
			this.rngMinSampleLength.addEventListener('input', this.rngMinSampleLength_change.bind(this));
			this.lblMinSampleLength = pageContent.querySelector('.lblMinSampleLength');
			this.rngMaxSampleAngle = pageContent.querySelector('.rngMaxSampleAngle');
			this.rngMaxSampleAngle.addEventListener('input', this.rngMaxSampleAngle_change.bind(this));
			this.lblMaxSampleAngle = pageContent.querySelector('.lblMaxSampleAngle');
			this.rngMinTurnAngle = pageContent.querySelector('.rngMinTurnAngle');
			this.rngMinTurnAngle.addEventListener('input', this.rngMinTurnAngle_change.bind(this));
			this.lblMinTurnAngle = pageContent.querySelector('.lblMinTurnAngle');
			this.rngMaxTurnDistance = pageContent.querySelector('.rngMaxTurnDistance');
			this.rngMaxTurnDistance.addEventListener('input', this.rngMaxTurnDistance_change.bind(this));
			this.lblMaxTurnDistance = pageContent.querySelector('.lblMaxTurnDistance');
			this.rngMinLeg1Length = pageContent.querySelector('.rngMinLeg1Length');
			this.rngMinLeg1Length.addEventListener('input', this.rngMinLeg1Length_change.bind(this));
			this.lblMinLeg1Length = pageContent.querySelector('.lblMinLeg1Length');
			this.rngMinLeg2Length = pageContent.querySelector('.rngMinLeg2Length');
			this.rngMinLeg2Length.addEventListener('input', this.rngMinLeg2Length_change.bind(this));
			this.lblMinLeg2Length = pageContent.querySelector('.lblMinLeg2Length');
			this.lnkSaveSettings = pageContent.querySelector('.lnkSaveSettings');
			this.lnkSaveSettings.addEventListener('click', this.lnkSaveSettings_click.bind(this));
			this.pnlSaveSuccess = pageContent.querySelector('.pnlSaveSuccess');
			this.pnlNoData = pageContent.querySelector('.pnlNoData');
			const map = new PiLot.View.Map.Seamap(pageContent.querySelector('.pnlMap'));
			await map.showAsync();
			this.leafletMap = map.getLeafletMap();
			this.mapTrack = new PiLot.View.Map.MapTrack(map);
			this.tacksLayerGroup = L.layerGroup().addTo(this.leafletMap);
		},

		applyPermissions: function () {
			this.lnkSaveSettings.hidden = !PiLot.Permissions.canWrite();
		},

		loadTrackAsync: async function () {
			this.track = null;
			this.mapTrack.setTracks([]);
			const trackId = RC.Utils.getUrlParameter('track');
			if (trackId) {
				this.track = await PiLot.Service.Nav.TrackService.getInstance().loadTrackAsync(trackId);
				await this.loadAnalyzerOptionsAsync();
				this.tackAnalyzer = new PiLot.Model.Analyze.TackAnalyzer(this.track);
			}
			this.analyzeAndShowTrack();
		},

		analyzeAndShowTrack: function (pZoomToTrack = true) {
			if (this.track) {
				this.mapTrack.setTracks([this.track], pZoomToTrack);
				const tacks = this.tackAnalyzer.findTacks(
					this.analyzerOptions.minSampleLength,
					this.analyzerOptions.maxSampleAngle,
					this.analyzerOptions.minLeg1Length,
					this.analyzerOptions.minLeg2Length,
					this.analyzerOptions.maxTurnDistance,
					this.analyzerOptions.minTurnAngle
				);
				this.tacksLayerGroup.clearLayers();
				for (let aTack of tacks) {
					this.showTack(aTack);
				}
			} else {
				this.lnkSaveSettings.hidden = true;
			}
			this.pnlNoData.hidden = this.tack !== null;
		},

		loadAnalyzerOptionsAsync: async function () {
			if (this.track) {
				this.analyzerOptions = await this.tackAnalyzeService.loadTackAnalyzerOptionsAsync(this.track.getBoat());
			}
			if (!this.analyzerOptions) {
				this.initializeDefaultOptions();
			}
			this.showOptions();
			this.pnlSaveSuccess.hidden = true;
		},

		saveAnalyzerOptionsAsync: async function () {
			if (this.track) {
				await this.tackAnalyzeService.saveTackAnalyzerOptionsAsync(this.track.getBoat(), this.analyzerOptions);
				this.pnlSaveSuccess.hidden = false;
			}
		},

		showOptions: function(){
			this.ddlSliderScale.value = this.sliderScale;
			this.setScaledRangeValue(this.rngMinSampleLength, this.analyzerOptions.minSampleLength);
			this.lblMinSampleLength.innerText = this.analyzerOptions.minSampleLength;
			this.rngMaxSampleAngle.value = this.analyzerOptions.maxSampleAngle;
			this.lblMaxSampleAngle.innerText = this.analyzerOptions.maxSampleAngle;
			this.rngMinTurnAngle.value = this.analyzerOptions.minTurnAngle;
			this.lblMinTurnAngle.innerText = this.analyzerOptions.minTurnAngle;
			this.setScaledRangeValue(this.rngMaxTurnDistance, this.analyzerOptions.maxTurnDistance);
			this.lblMaxTurnDistance.innerText = this.analyzerOptions.maxTurnDistance;
			this.setScaledRangeValue(this.rngMinLeg1Length, this.analyzerOptions.minLeg1Length);
			this.lblMinLeg1Length.innerText = this.analyzerOptions.minLeg1Length;
			this.setScaledRangeValue(this.rngMinLeg2Length,  this.analyzerOptions.minLeg2Length);
			this.lblMinLeg2Length.innerText = this.analyzerOptions.minLeg2Length;
		},

		changeOption: function (pOptionsKey, pValue, pLabel, pIsScaled) {
			const value = pIsScaled ? this.getScaledRangeValue(pValue) : pValue;
			this.analyzerOptions[pOptionsKey] = value;
			pLabel.innerText = value;
			this.pnlSaveSuccess.hidden = true;
			this.lnkSaveSettings.hidden = !PiLot.Permissions.canWrite();
			this.analyzeAndShowTrack(false);
		},

		setScaledRangeValue: function(pRange, pValue){
			pRange.value = Math.ceil(pValue / this.sliderScale);
		},

		getScaledRangeValue: function(pValue){
			return pValue * this.sliderScale;
		},

		initializeDefaultOptions: function () {
			this.analyzerOptions = {
				minSampleLength: 9,
				maxSampleAngle: 20,
				minLeg1Length: 100,
				minLeg2Length: 100,
				maxTurnDistance: 30,
				minTurnAngle: 70
			};
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
			marker.addTo(this.tacksLayerGroup);
			console.log(`Wind direction: ${pTack.windDirection}`);
		},

		showLeg: function (pLeg) {
			const polyline = L.polyline(
				[pLeg.start.getLatLng(), pLeg.end.getLatLng()], PiLot.Templates.Analyze.tackLineOptions
			).addTo(this.tacksLayerGroup);
		},

		loadSliderScale: function(){
			this.sliderScale = PiLot.Utils.Common.loadUserSetting('PiLot.View.Analyze.sliderScale') || 10;
		},

		adjustSliderScale: function(pScale){
			this.sliderScale = Number(pScale);
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Analyze.sliderScale', this.sliderScale);
			this.setScaledRangeValue(this.rngMinSampleLength, this.analyzerOptions.minSampleLength);
			this.setScaledRangeValue(this.rngMaxTurnDistance, this.analyzerOptions.maxTurnDistance);
			this.setScaledRangeValue(this.rngMinLeg1Length, this.analyzerOptions.minLeg1Length);
			this.setScaledRangeValue(this.rngMinLeg2Length,  this.analyzerOptions.minLeg2Length);
		}
	};

	/// return the classes
	return {
		AnalyzePage: AnalyzePage
	};

})();
