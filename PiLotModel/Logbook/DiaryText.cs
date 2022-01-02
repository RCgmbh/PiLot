using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Logbook {

	/// <summary>
	/// This is just a helper to send the diary Text
	/// as a json object within the put body, as 
	/// otherwise this would require a bit of a hack
	/// </summary>
	public struct DiaryText {

		public DiaryText(String pText) {
			this.Text = pText;
		}

		[JsonPropertyName("text")]
		public String Text { get; set; }

	}
}
