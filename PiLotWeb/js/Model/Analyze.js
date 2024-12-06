var PiLot = PiLot || {};
PiLot.Model = PiLot.Model || {};

PiLot.Model.Analyze = (function () {

	/**
	 * Finds tacks in a track and calculates tack angles 
	 * @param {PiLot.Model.Nav.Track} pTrack
	 * @param {Number} pMinSampleLength - minimal sample length in meters
	 * */
	var TackAnalyzer = function(pTrack, pMinSampleLength){
		this.track = pTrack;
		this.minSampleLength = pMinSampleLength;
		this.samples;								// array of arrays with point1, point2, distance, total distance, bearing
		this.initialize();
	};

	TackAnalyzer.prototype = {

		initialize: function(){
			this.preprocessTrack();
		},

		preprocessTrack: function(){
			this.samples = [];
			if(this.track && this.track.getTrackPointsCount() > 1){
				const trackPoints = this.track.getTrackPoints();
				let point1 = trackPoints[0];
				let latLon1 = point1.getLatLon();
				let totalDistance = 0;
				let latLon2, distance;
				for(let i = 1; i < trackPoints.length; i++){
					point2 = trackPoints[i];
					latLon2 = point2.getLatLon();
					distance = latLon1.distanceTo(latLon2);
					if (distance >= this.minSampleLength) {
						totalDistance += distance;
						this.samples.push(
							[point1, point2, distance, totalDistance, latLon1.initialBearingTo(latLon2)]
						);
						point1 = point2;
						latLon1 = latLon2;
						
					}					
				}
			}
		},

		findTacks: function (pMaxSampleAngle, pMinLeg1Length, pMinLeg2Length, pMaxTurnDistance, pMinTurnAngle) {
			let result = [];
			if (this.samples.length > 0) {
				let leg1 = { distance: 0, samples: [] };
				let leg2 = null;
				let leg;
				let currentSample = this.samples[0];
				let nextSample;
				let leg1Bearing, leg2Bearing, angle;
				for (let i = 1; i < this.samples.length; i++) {
					nextSample = this.samples[i];
					if (Math.abs(this.getAngle(this.getSampleBearing(currentSample), this.getSampleBearing(nextSample))) > pMaxSampleAngle) {	// it's not straight, don't continue the leg
						if (!leg2) {
							if (leg1.samples.length && (leg1.distance >= pMinLeg1Length)) {
								leg2 = this.createLeg(nextSample);								// start leg2 with the sample, if leg1 is long enough
							} else {
								leg1 = this.createLeg(nextSample);								// reset leg1, restart it with the sample
							}
						} else {
							leg2 = this.createLeg(nextSample);									// restart leg2 with the next sample
						}
					} else {																	// it's going straight, continue the current leg
						if (leg2) {
							this.addSampleToLeg(leg2, nextSample);								
							this.cropLeg(leg2, pMinLeg2Length);
						} else {
							this.addSampleToLeg(leg1, nextSample);								
							this.cropLeg(leg1, pMinLeg1Length);
						}						
					}
					if (leg2 && leg2.samples.length && (leg1.samples.last()[1].getLatLon().distanceTo(leg2.samples[0][0].getLatLon()) > pMaxTurnDistance)) { // leg 2 is too far from leg1, set leg2 as leg1
						leg1 = leg2;
						leg2 = null;
						this.cropLeg(leg1, pMinLeg1Length);
					}
					if (leg2 && leg2.samples.length) {
						if (leg2.distance >= pMinLeg2Length) {
							leg1Bearing = this.getLegBearing(leg1);
							leg2Bearing = this.getLegBearing(leg2);
							angle = this.getAngle(leg1Bearing, leg2Bearing);
							if (Math.abs(angle) > pMinTurnAngle) {
								result.push({ leg1: this.legToLatLngArray(leg1), leg2: this.legToLatLngArray(leg2), angle: angle });
								leg1 = leg2;
								leg2 = null;
							}
						}
					}
					currentSample = nextSample;
				}
			}
			return result;
		},

		createLeg: function (pSample) {
			return { distance: pSample[2], samples: [pSample] }
		},

		legToLatLngArray: function(pLeg){
			return [pLeg.samples[0][0].getLatLng(), pLeg.samples.last()[1].getLatLng()]
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

		getSampleBearing: function(pSample){
			return pSample[0].getLatLon().initialBearingTo(pSample[1].getLatLon());
		},

		getLegBearing: function(pLeg){
			return pLeg.samples[0][0].getLatLon().initialBearingTo(pLeg.samples.last()[1].getLatLon());	
		},

		getAngle: function (pBearing1, pBearing2) {
			const angle = ((pBearing2 - pBearing1  + 540) % 360) - 180;
			//console.log(`angle ${pBearing1} to ${pBearing2} = ${angle}`);
			return angle;
		}
	};

	return {
		TackAnalyzer: TackAnalyzer
	};

})();