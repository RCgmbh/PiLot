using System;
using System.Text.Json.Serialization;
using PiLot.Model.Boat;

namespace PiLot.Model.Logbook {

	/// <summary>
	/// Represents a single entry into the logbook
	/// </summary>
	public class LogbookEntry {

		/// <summary>
		/// Unique ID
		/// </summary>
		[JsonPropertyName("entryId")]
		public Int32? EntryID { get; set; }

		/// <summary>
		/// the Time in UTC in seconds from Epoc
		/// </summary>
		[JsonPropertyName("utc")]
		public Int32 Utc { get; set; }

		/// <summary>
		/// The BoatTime of the entry in seconds from Epoc
		/// </summary>
		[JsonPropertyName("boatTime")]
		public Int32 BoatTime { get; set; }

		[JsonPropertyName("title")]
		public String Title { get; set; }

		[JsonPropertyName("latitude")]
		public Double? Latitude { get; set; }

		[JsonPropertyName("longitude")]
		public Double? Longitude { get; set; }

		[JsonPropertyName("cog")]
		public Double? COG { get; set; }

		[JsonPropertyName("sog")]
		public Double? SOG { get; set; }

		[JsonPropertyName("log")]
		public Double? Log { get; set; }

		/// <summary>
		/// An object containing the meteo data, such as weather,
		/// temperature, pressure etc.
		/// </summary>
		[JsonPropertyName("meteo")]
		public LogbookMeteo Meteo { get; set; }

		[JsonPropertyName("boatSetup")]
		public BoatSetup BoatSetup { get; set; }

		[JsonPropertyName("notes")]
		public String Notes { get; set; }
	}
}
