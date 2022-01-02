using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Logbook {
	
	/// <summary>
	/// Represents the Meteo part of a logbook entry.
	/// </summary>
	public class LogbookMeteo {

		[JsonPropertyName("weather")]
		public String Weather { get; set; }

		[JsonPropertyName("temperature")]
		public Double? Temperature { get; set; }

		[JsonPropertyName("pressure")]
		public Double? Pressure { get; set; }

		[JsonPropertyName("windForce")]
		public String WindForce { get; set; }

		[JsonPropertyName("windDirection")]
		public String WindDirection { get; set; }

		[JsonPropertyName("waveHeight")]
		public Double? WaveHeight { get; set; }

	}
}
