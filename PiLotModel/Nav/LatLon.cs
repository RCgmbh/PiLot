using System;
using System.Collections.Generic;
using System.Text;

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

		public override string ToString() {
			return $"{this.Latitude:00.000} / {this.Longitude:000.000}";
		}
	}
}
