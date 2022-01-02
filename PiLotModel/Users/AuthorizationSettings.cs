using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Users {
	/// <summary>
	/// This is just used to serialize and deserialize the whole auth settings into
	/// one single json file. The file has a roles array and the
	/// name of the role used for unauthenticated access
	/// </summary>
	public class AuthorizationSettings {

		public AuthorizationSettings() { }

		[JsonPropertyName("roles")]
		public Role[] Roles { get; set; }

		[JsonPropertyName("anonymousRole")]
		public String AnonymousRole { get; set; }

	}
}
