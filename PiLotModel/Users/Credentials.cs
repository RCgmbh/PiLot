using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Users {

	/// <summary>
	/// Represents credentials as they are transmitted from the client
	/// to authenticate a user
	/// </summary>
	public struct Credentials {

		public Credentials(String pUsername, String pPassword) {
			this.Username = pUsername;
			this.Password = pPassword;
		}

		[JsonPropertyName("username")]
		public String Username { get; set; }

		[JsonPropertyName("password")]
		public String Password { get; set; }

	}
}
