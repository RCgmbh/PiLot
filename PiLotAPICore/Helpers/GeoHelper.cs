using System;

namespace PiLot.API.Helpers {
	public class GeoHelper {

		/// <summary>
		/// Returns the distance between two coordinates in meters
		/// see http://www.movable-type.co.uk/scripts/latlong.html
		/// </summary>
		/// <param name="pLat1">Latitude of point 1</param>
		/// <param name="pLat2">Latitude of pont 2</param>
		/// <param name="pLon1">Longitude of point 1</param>
		/// <param name="pLon2">Longitude of point 2</param>
		/// <returns>The distance between the two points in Meters</returns>
		public static Double Haversine(Double pLat1, Double pLat2, Double pLon1, Double pLon2) {
			double r = 6371000; // metres
			Double φ1 = pLat1 * Math.PI / 180; // φ, λ in radians
			Double φ2 = pLat2 * Math.PI / 180;
			Double Δφ = (pLat2 - pLat1) * Math.PI / 180;
			Double Δλ = (pLon2 - pLon1) * Math.PI / 180;
			Double a = Math.Sin(Δφ / 2) * Math.Sin(Δφ / 2) +
					  Math.Cos(φ1) * Math.Cos(φ2) *
					  Math.Sin(Δλ / 2) * Math.Sin(Δλ / 2);
			Double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
			return r * c; // in metres
		}
	}
}