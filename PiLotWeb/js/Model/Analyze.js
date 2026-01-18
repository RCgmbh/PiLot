var PiLot = PiLot || {};
PiLot.Model = PiLot.Model || {};

PiLot.Model.Analyze = (function () {

	/**
	 * Finds tacks in a track and calculates tack angles 
	 * @param {PiLot.Model.Nav.Track} pTrack
	 * */
	var TackAnalyzer = function(pTrack){
		this.track = pTrack;
		this.minSampleLength = null;
		this.samples = null;								// array of arrays with point1, point2, distance, bearing
		this.initialize();
	};

	TackAnalyzer.prototype = {

		initialize: function(){ },

		setTrack: function(pTrack){
			this.track = pTrack;
			this.samples = null;
		},

		/**
		 * Finds the tack on the track. As the sampling is done backwards, pMinLeg1Length and pMinLeg2Length
		 * need to be used reversed (pMinLeg1Length is used for leg2 and vice versa).
		 * @param {Object} pOptions: object with the following options:
		 * 		- minSampleLength - minimal length of a sample in meters
		 * 		- maxSampleAngle - maximal angle in deg between samples to still be considered straight
		 * 		- minLeg1Length - minimal length of the incoming leg in meters
		 * 		- minLeg2Length - minimal length of the outgoing leg in meters
		 * 		- maxTurnDistance - maximal distance of the two legs in meters
		 * 		- minTurnAngle - minimal angle between lets in deg to be considered a turn
		 * 		- maxTurnAngle - maximal angle between lets in deg to be considered a turn
		 * @param {Boolen} pMaxTacks - if not null, only the last x tacks will be returned
		 * @returns {Object[]} - Array of objects with {leg1, leg2, angle, windDirection}, starting with the most recent tack
		 */
		findTacks: function (pOptions, pMaxTacks = null) {
			const options = pOptions || TackAnalyzer.defaultOptions;
			if ((this.samples === null) || (this.minSampleLength !== options.minSampleLength)) {
				this.minSampleLength = options.minSampleLength;
				this.sampleTrack();
			}
			let result = [];
			if (this.samples.length > 0) {
				let leg1 = { distance: 0, samples: [] };
				let leg2 = null;
				let currentSample = this.samples[0];
				let nextSample;
				let leg1Bearing, leg2Bearing, angle;
				for (let i = 1; i < this.samples.length; i++) {
					nextSample = this.samples[i];
					if (this.isSampleAngleWithinRange(currentSample, nextSample, options.maxSampleAngle)) {				// it's going straight, continue the current leg
						if (leg2) {
							this.addSampleToLeg(leg2, nextSample);								
							this.cropLeg(leg2, options.minLeg1Length);
						} else {
							this.addSampleToLeg(leg1, nextSample);								
							this.cropLeg(leg1, options.minLeg2Length);
						}						
					} else {																	// it's not straight, don't continue the leg	
						if (leg2) {
							leg2 = this.createLeg(nextSample);									// restart leg2 with the next sample
						} else {
							if (leg1.samples.length && (leg1.distance >= options.minLeg2Length)) {	
								leg2 = this.createLeg(nextSample);								// start leg2 with the sample, if leg1 is long enough
							} else {
								leg1 = this.createLeg(nextSample);								// reset leg1, restart it with the sample
							}
						}				
					}
					if (!this.isTurnDistanceWithinRange(leg1, leg2, options.maxTurnDistance)) {		// leg 2 is too far from leg1, set leg2 as leg1
						leg1 = leg2;
						leg2 = null;
						this.cropLeg(leg1, options.minLeg2Length);
					}
					if (leg2 && leg2.samples.length && leg2.distance >= options.minLeg1Length) {
						leg1Bearing = this.getLegBearing(leg1);
						leg2Bearing = this.getLegBearing(leg2);
						angle = PiLot.Utils.Nav.getAngle(leg1Bearing, leg2Bearing);
						if (Math.abs(angle) >= options.minTurnAngle) {
							if(Math.abs(angle) <= options.maxTurnAngle){
								result.push(this.createTackInfo(leg1, leg2, leg1Bearing, leg2Bearing, angle));
								if(pMaxTacks !== null && pMaxTacks === result.length){
									break;
								}
							}
							leg1 = leg2;
							leg2 = null;
						}
					}
					currentSample = nextSample;
				}
			}
			return result;
		},

		/**
		 * Creates samples that are at least this.minSampleLength meters long. Sampling
		 * id done backwards, which is not only good for mental flexibility, but also
		 * makes it easy to find only tha last tack, which is used 
		 */
		sampleTrack: function(){
			this.samples = [];
			if(this.track && this.track.getTrackPointsCount() > 1){
				const trackPoints = this.track.getTrackPoints();
				let point1 = trackPoints.last();
				let latLon1 = point1.getLatLon();
				let latLon2, distance;
				for(let i = trackPoints.length - 2; i >= 0; i--){
					point2 = trackPoints[i];
					latLon2 = point2.getLatLon();
					distance = latLon1.distanceTo(latLon2);
					if (distance >= this.minSampleLength) {
						this.samples.push(
							[point1.clone(), point2.clone(), distance, latLon1.initialBearingTo(latLon2)]
						);
						point1 = point2;
						latLon1 = latLon2;
						
					}					
				}
			}
		},

		/** Checks whether the angle between two samples is small enough to consider them straight */
		isSampleAngleWithinRange: function (pSample1, pSample2, pMaxSampleAngle) {
			return Math.abs(PiLot.Utils.Nav.getAngle(pSample1[3], pSample2[3])) <= pMaxSampleAngle;
		},

		/** Checks whether the end of leg 1 and the start of leg 2 are not furhter than pMaxTurnDistance apart */
		isTurnDistanceWithinRange: function(pLeg1, pLeg2, pMaxTurnDistance){
			return (
				!pLeg1 || !pLeg2 
				|| !pLeg1.samples.length || !pLeg2.samples.length 
				|| (pLeg1.samples.last()[1].getLatLon().distanceTo(pLeg2.samples[0][0].getLatLon()) <= pMaxTurnDistance)
			);
		},

		/**
		 * Creates a leg, starting with one sample. A leg consists of n samples and a distance. 
		 * @param {Array} pSample - Array with [start:TrackPoint, end:TrackPoint, distance:Number, bearing: number]
		 * */
		createLeg: function (pSample) {
			return { distance: pSample[2], samples: [pSample] }
		},

		legToLatLngArray: function(pLeg){
			return [pLeg.samples[0][0].getLatLng(), pLeg.samples.last()[1].getLatLng()]
		},

		/**
		 * Creates a tack info, taking into consideration that the track has been
		 * sampled backwards, so this turns everything around.
		 * @param {Object} pLeg1 - the first leg, having samples as array of TrackPoints
		 * @param {Object} pLeg2 - the second leg, having samples as array of TrackPoints
		 * @param {Number} pBearing1 - Bearing of leg 1 in deg 
		 * @param {Number} pBearing2 - Bearing of leg2 in deg
		 * @param {Number} pAngle - the tack angle 
		 * @returns {Object} with leg1: start, end, bearing and leg2: start, end, bearing
		 */
		createTackInfo: function(pLeg1, pLeg2, pBearing1, pBearing2, pAngle){
			const bearing1 = PiLot.Utils.Nav.getReverseBearing(pBearing2);
			const bearing2 = PiLot.Utils.Nav.getReverseBearing(pBearing1);
			const angle = pAngle * -1;
			const windDirection = this.getWindDirection(bearing1, angle);
			return { 
				leg1: {start: pLeg2.samples.last()[1], end: pLeg2.samples[0][0], bearing: bearing1},
				leg2: {start: pLeg1.samples.last()[1], end: pLeg1.samples[0][0], bearing: bearing2},
				angle: angle, 
				windDirection: windDirection
			};
		},

		addSampleToLeg: function(pLeg, pSample){
			pLeg.distance += pSample[2];
			pLeg.samples.push(pSample);
		},

		cropLeg: function (pLeg, pMinLegLength) {
			while(pLeg.samples.length && (pLeg.distance - pLeg.samples[0][2] > pMinLegLength)){
				const sample = pLeg.samples.shift();
				pLeg.distance -= sample[2]
			}
		},

		getLegBearing: function(pLeg){
			return pLeg.samples[0][0].getLatLon().initialBearingTo(pLeg.samples.last()[1].getLatLon());	
		},

		getWindDirection: function(pBearing1, pAngle){
			return (pBearing1 + pAngle/2 + 360) % 360;
		}
	};

	TackAnalyzer.defaultOptions = {
		minSampleLength: 9,
		maxSampleAngle: 20,
		minLeg1Length: 100,
		minLeg2Length: 100,
		maxTurnDistance: 30,
		minTurnAngle: 70,
		maxTurnAngle: 140
	};

	/** Observes the current track and continously analyzes it for tacks */
	var TackObserver = function(){

		this.gpsObserver = null;
		this.trackAnalyzer = null;
		this.analyzerOptions = null;
		this.observable = null;
		this.initialize();

	};

	TackObserver.prototype = {

		initialize: function(){
			this.observable = new PiLot.Utils.Common.Observable(['analyzeTrack', 'noGpsData', 'loadTrack']);
			this.tackAnalyzer = new TackAnalyzer();
			this.gpsObserver = PiLot.Model.Nav.GPSObserver.getInstance();	
			this.gpsObserver.on('outdatedGpsData', this.gpsObserver_outdatedGpsData.bind(this));
			const trackObserver = PiLot.Model.Nav.TrackObserver.getInstance();
			trackObserver.on('addTrackPoint', this.trackObserver_changeTrackPoints.bind(this));
			trackObserver.on('changeLastTrackPoint', this.trackObserver_changeTrackPoints.bind(this));
			trackObserver.on('loadTrack', this.trackObserver_loadTrack.bind(this));
		},

		gpsObserver_outdatedGpsData: function(){
			this.observable.fire('noGpsData', null);
		},

		trackObserver_changeTrackPoints: function(pTrackObserver){
			if(pTrackObserver.hasTrack()){
				this.tackAnalyzer.setTrack(pTrackObserver.getTrack());
				this.findTacks();
			}
		},

		trackObserver_loadTrack: async function(pTrackObserver){
			if(pTrackObserver.hasTrack()){
				const track = pTrackObserver.getTrack();
				this.analyzerOptions = await (new PiLot.Service.Analyze.TackAnalyzeService().loadTackAnalyzerOptionsAsync(track.getBoat()));
				this.analyzerOptions = this.analyzerOptions || TackAnalyzer.defaultOptions;
				this.observable.fire('loadTrack', track);
				this.tackAnalyzer.setTrack(track);
				this.findTacks();
			}
			
		},

		/**
		 * @param {String} pEvent - 'analyzeTrack', 'noGpsData', 'loadTrack'
		 * */
		on: function(pEvent, pObserver, pFunction){ 
			this.observable.addObserver(pEvent, pObserver, pFunction)
		},

		findTacks: function(){
			const tacks = this.tackAnalyzer.findTacks(this.analyzerOptions, 2);
			const windDirection = this.calculateWindDirection(tacks);
			const currentAngle = this.caculateCurrentAngle(tacks);
			const vmg = this.calculateVMG(windDirection);
			this.observable.fire('analyzeTrack', {tacks: tacks, windDirection: windDirection, currentAngle: currentAngle, vmg: vmg});
		},

		calculateWindDirection: function(pTacks){
			let result = null;
			if(pTacks.length > 0){
				if(pTacks.length === 2){
					result = PiLot.Utils.Nav.getAverageBearing(pTacks[0].windDirection, pTacks[1].windDirection);
				} else {
					result = pTacks[0].windDirection;
				}
			}
			return result;
		},

		caculateCurrentAngle: function(pTacks){
			let result = null;
			if(pTacks.length > 0){
				const cog = this.gpsObserver.getCOG();
				if(cog !== null){
					result = PiLot.Utils.Nav.getAngle(pTacks[0].leg1.bearing, cog);
				}
			}
			return result;
		},

		calculateVMG: function(pWindDirection){
			let result = null;
			if(pWindDirection !== null){
				const cog = this.gpsObserver.getCOG();
				const sog = this.gpsObserver.getSOG();
				if(cog !== null && sog !== null)
				result = PiLot.Utils.Nav.getVmg(pWindDirection, cog, sog);
			}
			return result;
		},

		getAnalyzerOptions: function(){
			return this.analyzerOptions;
		},

		setAnalyzerOptions: function(pOptions){
			this.analyzerOptions = pOptions;
		},

		start: function(){
			this.gpsObserver && this.gpsObserver.start();
		},

		stop: function(){
			this.gpsObserver && this.gpsObserver.stop();
		}
	};

	var currentTackObserver = null;

	/** @returns {TackObserver} - single instance of the tack observer */
	TackObserver.getInstance = function(){
		currentTackObserver = currentTackObserver || new TackObserver();
		return currentTackObserver;
	}
	
	return {
		TackAnalyzer: TackAnalyzer,
		TackObserver: TackObserver
	};

})();