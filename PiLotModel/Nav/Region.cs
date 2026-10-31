using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

using PiLot.Utils;

namespace PiLot.Model.Nav {

	/// <summary>
	/// Represents a geographic region, represented by a polygon
	/// </summary>
	public class Region {

		/// <summary>
		/// Default constructor
		/// </summary>
		public Region() { }

		[JsonPropertyName("id")]
		public Int32? ID { get; set; }

		[JsonPropertyName("name")]
		public String Name { get; set; }

		[JsonPropertyName("coordinates")]
		public List<LatLon> Coordinates { get; set; }

	}
}
