using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Nav {

	/// <summary>
	/// Represents a waypoint as a part of a Route
	/// </summary>
	public class Waypoint {

		[JsonPropertyName("waypointId")]
		public Int32? WaypointID { get; set; }
		
		[JsonPropertyName("name")]
		public String Name { get; set; }
		
		[JsonPropertyName("latitude")]
		public Double? Latitude { get; set; }

		[JsonPropertyName("longitude")]
		public Double? Longitude { get; set; }
	}
}