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

		/**
		 * Finds the tack on the track. As the sampling is done backwards, pMinLeg1Length and pMinLeg2Length
		 * need to be used reversed (pMinLeg1Length is used for leg2 and vice versa).
		 * @param {Number} pMinSampleLength - minimal length of a sample in meters
		 * @param {Number} pMaxSampleAngle - maximal angle in deg between samples to still be considered straight
		 * @param {Number} pMinLeg1Length - minimal length of the incoming leg in meters
		 * @param {Number} pMinLeg2Length - minimal length of the outgoing leg in meters
		 * @param {Number} pMaxTurnDistance - maximal distance of the two legs in meters
		 * @param {Number} pMinTurnAngle - minimal angle between lets in deg to be considered a turn
		 * @param {Number} pMaxTurnAngle - maximal angle between lets in deg to be considered a turn
		 * @param {Boolen} pMaxTacks - if not null, only the last x tacks will be returned
		 * @returns {Object[]} - Array of objects with {leg1, leg2, angle, windDirection}
		 */
		findTacks: function (pMinSampleLength, pMaxSampleAngle, pMinLeg1Length, pMinLeg2Length, pMaxTurnDistance, pMinTurnAngle, pMaxTurnAngle, pMaxTacks = null) {
			if (this.minSampleLength !== pMinSampleLength) {
				this.minSampleLength = pMinSampleLength;
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
					if (this.isSampleAngleWithinRange(currentSample, nextSample, pMaxSampleAngle)) {				// it's going straight, continue the current leg
						if (leg2) {
							this.addSampleToLeg(leg2, nextSample);								
							this.cropLeg(leg2, pMinLeg1Length);
						} else {
							this.addSampleToLeg(leg1, nextSample);								
							this.cropLeg(leg1, pMinLeg2Length);
						}						
					} else {																	// it's not straight, don't continue the leg	
						if (leg2) {
							leg2 = this.createLeg(nextSample);									// restart leg2 with the next sample
						} else {
							if (leg1.samples.length && (leg1.distance >= pMinLeg2Length)) {	
								leg2 = this.createLeg(nextSample);								// start leg2 with the sample, if leg1 is long enough
							} else {
								leg1 = this.createLeg(nextSample);								// reset leg1, restart it with the sample
							}
						}				
					}
					if (!this.isTurnDistanceWithinRange(leg1, leg2, pMaxTurnDistance)) {		// leg 2 is too far from leg1, set leg2 as leg1
						leg1 = leg2;
						leg2 = null;
						this.cropLeg(leg1, pMinLeg2Length);
					}
					if (leg2 && leg2.samples.length && leg2.distance >= pMinLeg1Length) {
						leg1Bearing = this.getLegBearing(leg1);
						leg2Bearing = this.getLegBearing(leg2);
						angle = PiLot.Utils.Nav.getAngle(leg1Bearing, leg2Bearing);
						if (Math.abs(angle) >= pMinTurnAngle) {
							if(Math.abs(angle) <= pMaxTurnAngle){
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

	return {
		TackAnalyzer: TackAnalyzer
	};

})();