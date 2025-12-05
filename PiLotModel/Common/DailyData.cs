using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

using PiLot.Model.Logbook;
using PiLot.Model.Nav;
using PiLot.Model.Photos;

namespace PiLot.Model.Common {

	/// <summary>
	/// This contains consolidated data for a certain day.
	/// It is mainly used to help the user decide whether he wants to overwrite
	/// existing data when he publishes data from one PiLot to the other.
	/// </summary>
	public class DailyData {
				
		public DailyData() { }

		/// <summary>
		/// The tracks for the chosen date
		/// </summary>
		[JsonPropertyName("tracks")]
		public List<Track> Tracks {
			get; set;
		}

		/// <summary>
		/// The LogbookDay for the chosen date, containing diary and logbook
		/// </summary>
		[JsonPropertyName("logbookDay")]
		public LogbookDay LogbookDay {
			get; set;
		}

		/// <summary>
		/// The collection of all Photos available on the target for that day
		/// </summary>
		[JsonPropertyName("photoInfos")]
		public ImageCollection PhotoInfos {
			get; set;
		}
	}
}