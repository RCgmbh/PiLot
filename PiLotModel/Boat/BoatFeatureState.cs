using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Boat {
	
	/// <summary>
	/// Helper class to properly deserialize BoatConfigs from json files
	/// A BoatFeatureState is a certain state a BoatFeature can have, e.g.
	/// the  BoatFeature "main sail" can have the state "reef 1"
	/// </summary>
	public class BoatFeatureState {

		[JsonPropertyName("name")]
		public String Name { get; set; }

		[JsonPropertyName("stateId")]
		public Int32 StateId { get; set; }

	}
}
