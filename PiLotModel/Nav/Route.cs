using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Nav {

	/// <summary>
	/// Represents a route, consisting of waypoints
	/// </summary>
	public class Route {

		public Route() { }

		[JsonPropertyName("name")]
		public String Name {
			get; set;
		}

		[JsonPropertyName("routeId")]
		public Int32? RouteID {
			get;set;
		}

		[JsonPropertyName("waypoints")]
		public Waypoint[] Waypoints {
			get; set;
		}
	}
}