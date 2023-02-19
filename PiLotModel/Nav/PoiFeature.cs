using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Nav {

	/// <summary>
	/// Represents a poi feature
	/// </summary>
	public class PoiFeature {

		[JsonPropertyName("id")]
		public Int32? ID { get; set; }
		
		[JsonPropertyName("name")]
		public String Name { get; set; }

		[JsonPropertyName("labels")]
		public Object Labels { get; set; }
	}
}