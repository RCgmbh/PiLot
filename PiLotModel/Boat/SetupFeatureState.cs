using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Boat {
	
	/// <summary>
	/// This is just used to enable a proper deserialization of the 
	/// Boat Config files. A setupFeatureState says that a certain
	/// feature is in a certain state
	/// </summary>
	public class SetupFeatureState {

		public SetupFeatureState() { }

		public SetupFeatureState(Int32 pFeatureId, Int32 pStateId) {
			this.FeatureId = pFeatureId;
			this.StateId = pStateId;
		}

		[JsonPropertyName("featureId")]
		public Int32 FeatureId { get; set; }

		[JsonPropertyName("stateId")]
		public Int32 StateId { get; set; }

	}

}
