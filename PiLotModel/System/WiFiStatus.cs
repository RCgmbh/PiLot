using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.System {

	/// <summary>
	/// Represents the status of the WiFi
	/// </summary>
	public class WiFiStaus {

		/// <summary>
		/// Whether any wifi is connected
		/// </summary>
		[JsonPropertyName("connected")]
		public Boolean Connected { get; set; }

		/// <summary>
		/// Wheter the internet can be reached
		/// </summary>
		[JsonPropertyName("internetAccess")]
		public Boolean InternetAccess { get; set; }

		/// <summary>
		/// Details about the connection
		/// </summary>
		[JsonPropertyName("details")]
		public String Details { get; set; }
	}
}
