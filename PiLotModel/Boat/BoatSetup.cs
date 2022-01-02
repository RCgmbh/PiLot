using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PiLot.Model.Boat {

	/// <summary>
	/// Represents a certain BoatSetup, which is defined
	/// by the boatConfig, it refers to, plus a set of
	/// featureIDs and stateIDs defining the state of
	/// each feature
	/// </summary>
	public class BoatSetup {

		/// <summary>
		/// For predefined setups the name, or null
		/// </summary>
		[JsonPropertyName("name")]
		public String Name { get; set; }

		/// <summary>
		/// The name of the BoatConfig this refers to
		/// </summary>
		[JsonPropertyName("boatConfigName")]
		public String BoatConfigName { get; set; }

		/// <summary>
		/// A list of Lists {featureId, stateId}. We use 
		/// List instead of Tuple, as it serializes a bit
		/// more compactly
		/// </summary>
		[JsonPropertyName("featureStates")]
		public List<SetupFeatureState> FeatureStates { get; set; }
	}
}
