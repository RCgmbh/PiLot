using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Users {
	/// <summary>
	/// Represents a user who can access the application
	/// </summary>
	public class User {

		public User() { }

		/// <summary>
		/// The username, which uniquely identifies the user
		/// </summary>
		[JsonPropertyName("username")]
		public String Username { get; set; }

		/// <summary>
		/// The user's password
		/// </summary>
		[JsonPropertyName("pwd")]
		public String Pwd { get; set; }

		/// <summary>
		/// The role name used for serialization
		/// </summary>
		[JsonPropertyName("rolename")]
		public String RoleName { get; set; }

		/// <summary>
		/// The user's role. For simplicity, each user can have just one role
		/// </summary>
		[JsonIgnore]
		public Role Role {
			get; set;
		}

		/// <summary>
		/// Gets whether the user can read data
		/// </summary>
		public Boolean CanRead() {
			return ((this.Role != null) && this.Role.CanRead);
		}

		/// <summary>
		/// Gets whether the user can write data
		/// </summary>
		public Boolean CanWrite() {
			return ((this.Role != null) && this.Role.CanWrite);
		}

		/// <summary>
		/// Gets whether the user can change the configuration,
		/// e.g. BoatTime, BoatConfig
		/// </summary>
		/// <returns></returns>
		public Boolean CanChangeSettings() {
			return ((this.Role != null) && this.Role.CanChangeSettings);
		}

		/// <summary>
		/// Gets whether the user can call system tasks
		/// </summary>
		public Boolean HasSystemAccess() {
			return ((this.Role != null) && this.Role.HasSystemAccess);
		}
	}
}
