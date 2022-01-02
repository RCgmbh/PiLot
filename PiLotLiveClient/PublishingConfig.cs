using System;
using System.Text.Json.Serialization;

namespace PiLot.LiveClient {
	
	public class PublishingConfig {

		/// <summary>
		/// The base url of the local API, used to read data. e.g. http://pilot1/pilotapi/api/v1
		/// </summary>
		[JsonPropertyName("localAPI")]
		public String LocalAPI { get; set; }

		/// <summary>
		/// The fully qualified url of the remote API, used to send data
		/// </summary>
		[JsonPropertyName("remoteAPI")]
		public String RemoteAPI { get; set; }

		/// <summary>
		/// The interval in seconds, how often to send data
		/// </summary>
		[JsonPropertyName("interval")]
		public Int32 Interval { get; set; }

		/// <summary>
		/// The Basic Auth Username used for the remote API
		/// </summary>
		[JsonPropertyName("username")]
		public String Username { get; set; }

		/// <summary>
		/// The Basic Auth Password used for the remote API
		/// </summary>
		[JsonPropertyName("password")]
		public String Password { get; set; }


	}
}
