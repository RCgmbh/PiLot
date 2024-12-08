var PiLot = PiLot || {};
PiLot.Model = PiLot.Model || {};

PiLot.Model.Analyze = (function () {

	/**
	 * Finds tacks in a track and calculates tack angles 
	 * @param {PiLot.Model.Nav.Track} pTrack
	 * */
	var TackAnalyzer = function(pTrack, ){
		this.track = pTrack;
		this.minSampleLength = null;
		this.samples;								// array of arrays with point1, point2, distance, total distance, bearing
		this.initialize();
	};

	TackAnalyzer.prototype = {

		initialize: function(){ },

		sampleTrack: function(){
			this.samples = [];
			if(this.track && this.track.getTrackPointsCount() > 1){
				const trackPoints = this.track.getTrackPoints();
				let point1 = trackPoints[0];
				let latLon1 = point1.getLatLon();
				let latLon2, distance;
				for(let i = 1; i < trackPoints.length; i++){
					point2 = trackPoints[i];
					latLon2 = point2.getLatLon();
					distance = latLon1.distanceTo(latLon2);
					if (distance >= this.minSampleLength) {
						this.samples.push(
							[point1, point2, distance, latLon1.initialBearingTo(latLon2)]
						);
						point1 = point2;
						latLon1 = latLon2;
						
					}					
				}
			}
		},

		findTacks: function (pMinSampleLength, pMaxSampleAngle, pMinLeg1Length, pMinLeg2Length, pMaxTurnDistance, pMinTurnAngle) {
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
							this.cropLeg(leg2, pMinLeg2Length);
						} else {
							this.addSampleToLeg(leg1, nextSample);								
							this.cropLeg(leg1, pMinLeg1Length);
						}						
					} else {																	// it's not straight, don't continue the leg	
						if (leg2) {
							leg2 = this.createLeg(nextSample);									// restart leg2 with the next sample
						} else {
							if (leg1.samples.length && (leg1.distance >= pMinLeg1Length)) {	
								leg2 = this.createLeg(nextSample);								// start leg2 with the sample, if leg1 is long enough
							} else {
								leg1 = this.createLeg(nextSample);								// reset leg1, restart it with the sample
							}
						}				
					}
					if (!this.isTurnDistanceWithinRange(leg1, leg2, pMaxTurnDistance)) {		// leg 2 is too far from leg1, set leg2 as leg1
						leg1 = leg2;
						leg2 = null;
						this.cropLeg(leg1, pMinLeg1Length);
					}
					if (leg2 && leg2.samples.length && leg2.distance >= pMinLeg2Length) {
						leg1Bearing = this.getLegBearing(leg1);
						leg2Bearing = this.getLegBearing(leg2);
						angle = this.getAngle(leg1Bearing, leg2Bearing);
						if (Math.abs(angle) > pMinTurnAngle) {
							result.push(this.createTackInfo(leg1, leg2, leg1Bearing, leg2Bearing, angle));
							leg1 = leg2;
							leg2 = null;
						}
					}
					currentSample = nextSample;
				}
			}
			return result;
		},

		isSampleAngleWithinRange: function (pSample1, pSample2, pMaxSampleAngle) {
			return Math.abs(this.getAngle(pSample1[3], pSample2[3])) <= pMaxSampleAngle;
		},

		isTurnDistanceWithinRange: function(pLeg1, pLeg2, pMaxTurnDistance){
			return (
				!pLeg1 || !pLeg2 
				|| !pLeg1.samples.length || !pLeg2.samples.length 
				|| (pLeg1.samples.last()[1].getLatLon().distanceTo(pLeg2.samples[0][0].getLatLon()) <= pMaxTurnDistance)
			);
		},

		createLeg: function (pSample) {
			return { distance: pSample[2], samples: [pSample] }
		},

		legToLatLngArray: function(pLeg){
			return [pLeg.samples[0][0].getLatLng(), pLeg.samples.last()[1].getLatLng()]
		},

		createTackInfo: function(pLeg1, pLeg2, pBearing1, pBearing2, pAngle){
			return { 
				leg1: this.legToLatLngArray(pLeg1), 
				leg2: this.legToLatLngArray(pLeg2), 
				angle: pAngle, 
				windDirection: this.getWindDirection(pBearing2, pAngle)
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

		getAngle: function (pBearing1, pBearing2) {
			const angle = ((pBearing2 - pBearing1  + 540) % 360) - 180;
			return angle;
		},

		getWindDirection: function(pBearing2, pAngle){
			return (pBearing2 - pAngle/2 + 360) % 360;
		}
	};

	return {
		TackAnalyzer: TackAnalyzer
	};

})();