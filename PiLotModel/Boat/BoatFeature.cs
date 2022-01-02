using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Boat {

	/// <summary>
	/// Helper class to properly serialize / deserialize BoatConfigs.
	/// A feature is something a boat has, e.g. a sail, together with
	/// the possible States it can have
	/// </summary>
	public class BoatFeature {

		[JsonPropertyName("featureId")]
		public Int32 FeatureId { get; set; }

		[JsonPropertyName("name")]
		public String Name { get; set; }

		[JsonPropertyName("states")]
		public BoatFeatureState[] States { get; set; }
	}
}
