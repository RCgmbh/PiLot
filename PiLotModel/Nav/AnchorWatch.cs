using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Nav {

	/// <summary>
	/// Represents an anchor watch setting
	/// </summary>
	public class AnchorWatch {

		[JsonPropertyName("latitude")]
		public Double Latitude { get; set; }

		[JsonPropertyName("longitude")]
		public Double Longitude { get; set; }

		[JsonPropertyName("radius")]
		public Int32 Radius{ get; set; }

	}
}