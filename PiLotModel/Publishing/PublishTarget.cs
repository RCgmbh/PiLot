using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Publishing {

	/// <summary>
	/// Represents a target (another PiLot), where we want to publish our data.
	/// </summary>
	public class  PublishTarget {

		public PublishTarget() { }

		/// <summary>
		/// The unique, technical name. This will be used in the
		/// URL of api calls. So keep it simple.
		/// </summary>
		[JsonPropertyName("name")]
		public String Name { get; set; }

		/// <summary>
		/// The friendly name of the target to be presented to the user
		/// </summary>
		[JsonPropertyName("displayName")]
		public String DisplayName { get; set; }

		/// <summary>
		/// The full url of the pilot api on the target. E.g. 
		/// http://pilot0/pilotapi/api/v1
		/// </summary>
		[JsonPropertyName("apiUrl")]
		public String APIUrl { get; set; }
		
		/// <summary>
		/// The full url of the target's web frontend, used for the photos
		/// </summary>
		[JsonPropertyName("webUrl")]
		public String WebUrl { get; set; }

		/// <summary>
		/// The username used to authenticate against the target
		/// </summary>
		[JsonPropertyName("username")]
		public String Username { get; set; }

		/// <summary>
		/// The password used to authenticate against the target,
		/// in clear text.
		/// </summary>
		[JsonPropertyName("password")]
		public String Password { get; set; }

	}
}
