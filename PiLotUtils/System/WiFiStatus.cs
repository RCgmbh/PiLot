using System;
using System.Text.Json.Serialization;

namespace PiLot.Utils.OS {

	/// <summary>
	/// Represents the status of the WiFi
	/// </summary>
	public class WiFiStatus {

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

	}
}
