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
		this.samples;
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
				let latLon2, distance;
				for(let i = 1; i < trackPoints.length; i++){
					point2 = trackPoints[i];
					latLon2 = point2.getLatLon();
					distance = latLon1.distanceTo(latLon2);
					if(distance >= this.minSampleLength){
						this.samples.push(
							[point1, point2, latLon1.distanceTo(latLon2), latLon1.initialBearingTo(latLon2)]
						);
						point1 = point2;
						latLon1 = latLon2;
					}					
				}
			}
			console.log(this.samples);
		}
	};

	return {
		TackAnalyzer: TackAnalyzer
	};

})();