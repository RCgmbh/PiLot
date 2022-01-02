using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Boat {
	
	/// <summary>
	/// One more helper class to deserialize BoatConfigs from json files.
	/// The FeatureGuiElement defines the gui elements (svg objects) to
	/// show for certain states of a feature
	/// </summary>
	public class FeatureGuiElement {

		[JsonPropertyName("stateId")]
		public Int32 StateId { get; set; }


		[JsonPropertyName("svgObjectId")]
		public String SvgObjectId { get; set; }

	}
}
