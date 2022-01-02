using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Boat {

	/// <summary>
	/// Represents the content of a boat config file, containing
	/// only the highest level properties
	/// </summary>
	public class BoatConfig {

		public BoatConfig() { }

		[JsonPropertyName("name")]
		public String Name { get; set; }

		[JsonPropertyName("displayName")]
		public String DisplayName { get; set; }
		
		[JsonPropertyName("features")]
		public BoatFeature[] Features { get; set; }

		[JsonPropertyName("boatSetups")]
		public BoatSetup[] BoatSetups { get; set; }

		[JsonPropertyName("boatImageUrl")]
		public String BoatImageUrl { get; set; }

		[JsonPropertyName("featureGuis")]
		public BoatFeatureGui[] FeatureGuis { get; set; }
	}
}