/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

PiLot.View.Analyze = (function () {
	
	var AnalyzePage = function () {
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
		this.leafletMap = null;
		this.mapTrack = null;			// PiLot.View.Map.MapTrack
		this.tacksLayerGroup = null;	
		this.track = null;
		this.analyzerOptions = null;
		this.pnlNoData = null;
		this.initializeAsync();
	};

	AnalyzePage.prototype = {

		initializeAsync: async function(){
			await this.drawAsync();
			await this.loadTrackAsync();
			
		},
		
		rngMinSampleLength_change: function(pSender){
			this.analyzerOptions.minSampleLength = pSender.target.value;
			this.lblMinSampleLength.innerText = pSender.target.value;
			this.analyzeAndShowTrack(false);
		},

		rngMaxSampleAngle_change: function(pSender){
			this.analyzerOptions.maxSampleAngle = pSender.target.value;
			this.lblMaxSampleAngle.innerText = pSender.target.value;
			this.analyzeAndShowTrack(false);
		},

		rngMinTurnAngle_change: function(pSender){
			this.analyzerOptions.minTurnAngle = pSender.target.value;
			this.lblMinTurnAngle.innerText = pSender.target.value;
			this.analyzeAndShowTrack(false);
		},

		rngMaxTurnDistance_change: function(pSender){
			this.analyzerOptions.maxTurnDistance = pSender.target.value;
			this.lblMaxTurnDistance.innerText = pSender.target.value;
			this.analyzeAndShowTrack(false);
		},

		rngMinLeg1Length_change: function(pSender){
			this.analyzerOptions.minLeg1Length = pSender.target.value;
			this.lblMinLeg1Length.innerText = pSender.target.value;
			this.analyzeAndShowTrack(false);
		},

		rngMinLeg2Length_change: function(pSender){
			this.analyzerOptions.minLeg2Length = pSender.target.value;
			this.lblMinLeg2Length.innerText = pSender.target.value;
			this.analyzeAndShowTrack(false);
		},

		drawAsync: async function () {
			let pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Analyze.analyzePage);
			PiLot.Utils.Loader.getContentArea().appendChild(pageContent);
			this.rngMinSampleLength = pageContent.querySelector('.rngMinSampleLength');
			this.rngMinSampleLength.addEventListener('click', this.rngMinSampleLength_change.bind(this));
			this.lblMinSampleLength = pageContent.querySelector('.lblMinSampleLength');
			this.rngMaxSampleAngle = pageContent.querySelector('.rngMaxSampleAngle');
			this.rngMaxSampleAngle.addEventListener('click', this.rngMaxSampleAngle_change.bind(this));
			this.lblMaxSampleAngle = pageContent.querySelector('.lblMaxSampleAngle');
			this.rngMinTurnAngle = pageContent.querySelector('.rngMinTurnAngle');
			this.rngMinTurnAngle.addEventListener('click', this.rngMinTurnAngle_change.bind(this));
			this.lblMinTurnAngle = pageContent.querySelector('.lblMinTurnAngle');
			this.rngMaxTurnDistance = pageContent.querySelector('.rngMaxTurnDistance');
			this.rngMaxTurnDistance.addEventListener('click', this.rngMaxTurnDistance_change.bind(this));
			this.lblMaxTurnDistance = pageContent.querySelector('.lblMaxTurnDistance');
			this.rngMinLeg1Length = pageContent.querySelector('.rngMinLeg1Length');
			this.rngMinLeg1Length.addEventListener('click', this.rngMinLeg1Length_change.bind(this));
			this.lblMinLeg1Length = pageContent.querySelector('.lblMinLeg1Length');
			this.rngMinLeg2Length = pageContent.querySelector('.rngMinLeg2Length');
			this.rngMinLeg2Length.addEventListener('click', this.rngMinLeg2Length_change.bind(this));
			this.lblMinLeg2Length = pageContent.querySelector('.lblMinLeg2Length');
			this.pnlNoData = pageContent.querySelector('.pnlNoData');
			const map = new PiLot.View.Map.Seamap(pageContent.querySelector('.pnlMap'));
			await map.showAsync();
			this.leafletMap = map.getLeafletMap();
			this.mapTrack = new PiLot.View.Map.MapTrack(map);
			this.tacksLayerGroup = L.layerGroup().addTo(this.leafletMap);
		},

		loadTrackAsync: async function () {
			this.track = null;
			this.mapTrack.setTracks([]);
			const trackId = RC.Utils.getUrlParameter('track');
			if (trackId) {
				this.track = await PiLot.Service.Nav.TrackService.getInstance().loadTrackAsync(trackId);
				await this.loadAnalyzerOptionsAsync();
			}
			this.analyzeAndShowTrack();
		},

		analyzeAndShowTrack: function (pZoomToTrack = true) {
			if (this.track) {
				this.pnlNoData.hidden = true;
				this.mapTrack.setTracks([this.track], pZoomToTrack);
				const analyzer = new PiLot.Model.Analyze.TackAnalyzer(this.track, this.analyzerOptions.minSampleLength);
				const tacks = analyzer.findTacks(
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
				this.pnlNoData.hidden = false;
			}
		},

		loadAnalyzerOptionsAsync: async function () {
			// load the options for the boat of the current track, if they exist
			this.initializeDefaultOptions();
			this.showOptions();
		},

		showOptions: function(){
			this.rngMinSampleLength.value = this.analyzerOptions.minSampleLength;
			this.lblMinSampleLength.innerText = this.analyzerOptions.minSampleLength;
			this.rngMaxSampleAngle.value = this.analyzerOptions.maxSampleAngle;
			this.lblMaxSampleAngle.innerText = this.analyzerOptions.maxSampleAngle;
			this.rngMinTurnAngle.value = this.analyzerOptions.minTurnAngle;
			this.lblMinTurnAngle.innerText = this.analyzerOptions.minTurnAngle;
			this.rngMaxTurnDistance.value = this.analyzerOptions.maxTurnDistance;
			this.lblMaxTurnDistance.innerText = this.analyzerOptions.maxTurnDistance;
			this.rngMinLeg1Length.value = this.analyzerOptions.minLeg1Length;
			this.lblMinLeg1Length.innerText = this.analyzerOptions.minLeg1Length;
			this.rngMinLeg2Length.value = this.analyzerOptions.minLeg2Length;
			this.lblMinLeg2Length.innerText = this.analyzerOptions.minLeg2Length;
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
		},

		showLeg: function (pLeg) {
			const polyline = L.polyline(
				pLeg, PiLot.Templates.Analyze.tackLineOptions
			).addTo(this.tacksLayerGroup);
		}

	};

	/// return the classes
	return {
		AnalyzePage: AnalyzePage
	};

})();
