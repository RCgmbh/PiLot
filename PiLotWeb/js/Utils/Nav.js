/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.Utils = PiLot.Utils || {};

PiLot.Utils.Nav = {
	
	/// This calculates the xte as object {distance, direction} from pCurrentPosition
	///	to the line segment between pWaypoint1, pWaypoint2. The imaginary line ends at
	/// both endpoints, so when travelling from W1 to W2, after having passed W2, the
	/// result.distance will be the distance to W2 (and not the distance to the infinite
	/// line W1 - W2).If pWaypoint2 is null, the distance to pWaypint1 will be returned.
	/// direction is 'L' or 'R' and indicates whether we need to turn left or right, 
	/// based on the current COG, to get back on track as soon as possible
	getXTE: function (pCurrentPosition, pWaypoint1, pWaypoint2, pCog) {
		var distance = null;
		var direction = null;
		var pointOnLeg = null; // the closest latLon on the leg
		if ((pCurrentPosition !== null) && (pWaypoint1 !== null) && pWaypoint1.hasPosition()) {
			if ((pWaypoint2 == null) || !pWaypoint2.hasPosition()) {
				distance = pCurrentPosition.distanceTo(pWaypoint1.latLon);
				pointOnLeg = pWaypoint1.latLon;
			} else {
				pointOnLeg = pCurrentPosition.nearestPointOnSegment(pWaypoint1.latLon, pWaypoint2.latLon);
				distance = pCurrentPosition.distanceTo(pointOnLeg);
			}
			if (pCog !== null) {
				var angle = ((pCurrentPosition.initialBearingTo(pointOnLeg) - pCog) + 360) % 360;
				direction = (angle <= 180) ? 'R': 'L' ;
			}
		}
		return { distance: distance, direction: direction };
	},

	/// converts a LatLon object from the geodesy scripts into a LatLng object for Leaflet
	latLonToLatLng: function (pLatLon) {
		return new L.LatLng(pLatLon.lat, pLatLon.lon);
	},

	/// takes a geodesy latLon or a leaflet LatLng and converts it to a string
	latLonToString: function (pLatLon) {
		var lat = pLatLon.lat;
		var lon = pLatLon.lon || pLatLon.lng;
		var result = null;
		if (lat && lon) {
			result = "".concat(
				lat > 0 ? 'N ' : 'S ',
				PiLot.Utils.Nav.toCoordinateString(lat, true),
				' / ',
				lon > 0 ? 'E ' : 'W ',
				PiLot.Utils.Nav.toCoordinateString(lon, false)
			);
		}
		return result;
	},

	/// this converts a value representing either a latitude or a longitude into an array
	/// consisting of three elements:
	/// 0: the prefix (N, S, W, E)
	/// 1: the degree part as  2 digit (lat) or 3 digit (long) string 
	/// 2: the minutes part as 3 digit string
	toCoordinateArray: function (pValue, pIsLatitude) {
		var result = null;
		if ((pValue !== null) && $.isNumeric(pValue)) {
			var prefix = pIsLatitude ? (pValue > 0 ? 'N' : 'S') : (pValue > 0 ? 'E' : 'W');
			var abs = Math.abs(pValue);
			result = [
				prefix,
				RC.Utils.toFixedLength(Math.floor(abs), pIsLatitude ? 2 : 3, 0),
				RC.Utils.toFixedLength((abs % 1) * 60, 2, 3)
			]
		} else {
			result = [null, null, null];
		}
		return result;
	},

	/// this converts a latitude or longitude from number (e.g. 9.12345)
	/// to a string of the form 009°07.407'. Longitudes have a 3-digit degree
	/// part, latitudes a 2-digits degree part. A leading "-" will be removed
	/// and replaced by an "E", "W", "N", "S" if pAddPrefix is true
	toCoordinateString: function (pValue, pIsLatitude, pAddPrefix) {
		var result = null;
		if ((typeof pValue !== 'undefined') && (pValue !== null)) {
			var segments = PiLot.Utils.Nav.toCoordinateArray(pValue, pIsLatitude);
			var result =
				(segments[1] != null ? segments[1] : '--') + '° '
				+ (segments[2] != null ? segments[2] : '---') + "'"
				;
			if (pAddPrefix) {
				result = segments[0] + ' ' + result;
			}
		}
		return result;
	}
};