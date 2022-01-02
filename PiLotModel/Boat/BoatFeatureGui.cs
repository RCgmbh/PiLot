using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Boat {
	
	/// <summary>
	/// Another helper to serialize BoatConfigs from json Files.
	/// The FeatureGui defines how a certain Feature looks in 
	/// a certain state.
	/// </summary>
	public class BoatFeatureGui {

		[JsonPropertyName("featureId")]
		public Int32 FeatureId { get; set; }

		[JsonPropertyName("guis")]
		public FeatureGuiElement[] Guis { get; set; }

	}
}
