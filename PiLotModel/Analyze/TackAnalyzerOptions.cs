using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Analyze {

	public class TackAnalyzerOptions {

		[JsonPropertyName("minSampleLength")]
		public Int32 MinSampleLength { get; set; }

		[JsonPropertyName("maxSampleAngle")]
		public Int32 MaxSampleAngle { get; set; }

		[JsonPropertyName("minLeg1Length")]
		public Int32 MinLeg1Length { get; set; }

		[JsonPropertyName("minLeg2Length")]
		public Int32 MinLeg2Length { get; set; }

		[JsonPropertyName("maxTurnDistance")]
		public Int32 MaxTurnDistance { get; set; }

		[JsonPropertyName("minTurnAngle")]
		public Int32 MinTurnAngle { get; set; }

		[JsonPropertyName("maxTurnAngle")]
		public Int32 MaxTurnAngle { get; set; }
	}
}
