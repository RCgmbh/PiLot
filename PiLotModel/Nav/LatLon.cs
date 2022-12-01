using System;

namespace PiLot.Model.Nav {

	/// <summary>
	/// Represents a position on the globe. Offers some simple spherical calculations.
	/// </summary>
	public class LatLon {

		public const Double RADIUS = 6371000; // earh radius in meters

		private double longitude;

		/// <summary>
		/// Default constructor
		/// </summary>
		/// <param name="pLat">The latitude in degrees. Allowed values are -90 to 90</param>
		/// <param name="pLon">The longitude in degrees. Any values are accepted, but will translate to -180 to 180</param>
		public LatLon(Double pLat, Double pLon) {
			this.Latitude = pLat;
			this.Longitude = pLon;
		}

		/// <summary>
		/// Gets or sets the latitude in degrees. Allowed values are -90 to 90
		/// </summary>
		public Double Latitude { get; set; }

		/// <summary>
		/// The longitude in degrees. Any values are accepted, but will translate to -180 .. 180
		/// </summary>
		public Double Longitude {
			get { return this.longitude; }
			set {
				this.longitude = (value + 180) % 360 - 180;
			}
		}

		/// <summary>
		/// Returns the distance between two coordinates in meters using the haversine
		/// formula. See http://www.movable-type.co.uk/scripts/latlong.html
		/// </summary>
		/// <param name="pOther">The other point, not null</param>
		/// <returns>Distance in meters</returns>
		public Double DistanceTo(LatLon pOther) {
			Double φ1 = this.Latitude * Math.PI / 180;
			Double φ2 = pOther.Latitude * Math.PI / 180;
			Double Δφ = (pOther.Latitude - this.Latitude) * Math.PI / 180;
			Double Δλ = (pOther.longitude - this.longitude) * Math.PI / 180;
			Double a = Math.Sin(Δφ / 2) * Math.Sin(Δφ / 2) +
					  Math.Cos(φ1) * Math.Cos(φ2) *
					  Math.Sin(Δλ / 2) * Math.Sin(Δλ / 2);
			Double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
			return RADIUS * c; // in metres
		}

		/// <summary>
		/// Moves this into a certain distance with a certain bearing
		/// Formula:
		/// sinφ2 = sinφ1⋅cosδ + cosφ1⋅sinδ⋅cosθ
		/// tanΔλ = sinθ⋅sinδ⋅cosφ1 / cosδ−sinφ1⋅sinφ2
		/// see mathforum.org/library/drmath/view/52049.html for derivation
		/// </summary>
		/// <param name="pDistance">the distance in meters</param>
		/// <param name="pCourse">The initial bearing, in degrees from north</param>
		public void MoveBy (Double pDistance, Double pCourse) {
			Double δ = pDistance / RADIUS; // angular distance in radians
			Double θ = pCourse * Math.PI / 180;
			Double φ1 = this.Latitude * Math.PI / 180;
			Double λ1 = this.Longitude * Math.PI / 180;
			Double sinφ1 = Math.Sin(φ1);
			Double cosφ1 = Math.Cos(φ1);
			Double sinδ = Math.Sin(δ);
			Double cosδ = Math.Cos(δ);
			Double sinθ = Math.Sin(θ);
			Double cosθ = Math.Cos(θ);
			Double sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * cosθ;
			Double φ2 = Math.Asin(sinφ2);
			Double y = sinθ * sinδ * cosφ1;
			Double x = cosδ - sinφ1 * sinφ2;
			Double λ2 = λ1 + Math.Atan2(y, x);
			this.Latitude = φ2 * 180 / Math.PI;
			this.Longitude = λ2 * 180 / Math.PI;
		}

		/// <summary>
		/// Returns the point at given fraction between ‘this’ point and specified point.
		/// See http://www.movable-type.co.uk/scripts/latlong.html
		/// </summary>
		/// <param name="pOther">Destination point</param>
		/// <param name="pFraction">Fraction between the two points (0 = this point, 1 = specified point)</param>
		/// <returns>Intermediate point between this point and destination point</returns>
		public LatLon IntermediatePointTo(LatLon pOther, float pFraction) {
			var φ1 = this.Latitude * Math.PI / 180;
			var λ1 = this.Longitude * Math.PI / 180;
			var φ2 = pOther.Latitude * Math.PI / 180;
			var λ2 = pOther.Longitude * Math.PI / 180;
			var sinφ1 = Math.Sin(φ1);
			var cosφ1 = Math.Cos(φ1);
			var sinλ1 = Math.Sin(λ1);
			var cosλ1 = Math.Cos(λ1);
			var sinφ2 = Math.Sin(φ2);
			var cosφ2 = Math.Cos(φ2);
			var sinλ2 = Math.Sin(λ2);
			var cosλ2 = Math.Cos(λ2);

			// distance between points
			var Δφ = φ2 - φ1;
			var Δλ = λ2 - λ1;
			var a = Math.Sin(Δφ / 2) * Math.Sin(Δφ / 2) + Math.Cos(φ1) * Math.Cos(φ2) * Math.Sin(Δλ / 2) * Math.Sin(Δλ / 2);
			var δ = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
			var A = Math.Sin((1 - pFraction) * δ) / Math.Sin(δ);
			var B = Math.Sin(pFraction * δ) / Math.Sin(δ);
			var x = A * cosφ1 * cosλ1 + B * cosφ2 * cosλ2;
			var y = A * cosφ1 * sinλ1 + B * cosφ2 * sinλ2;
			var z = A * sinφ1 + B * sinφ2;
			var φ3 = Math.Atan2(z, Math.Sqrt(x * x + y * y));
			var λ3 = Math.Atan2(y, x);
			LatLon result = new LatLon(φ3 * 180 / Math.PI, (λ3 * 180 / Math.PI + 540) % 360 - 180); // normalise lon to −180..+180°
			return result;
		}

		public override string ToString() {
			return $"{this.Latitude:00.000} / {this.Longitude:000.000}";
		}
	}
}
