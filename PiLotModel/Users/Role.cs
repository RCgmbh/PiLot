using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Users {
	/// <summary>
	/// A Role gives a set of permissions to a user
	/// </summary>
	public class Role {

		public Role() { }

		[JsonPropertyName("name")]
		public String Name {
			get; set;
		}

		/// <summary>
		/// Gets or sets whether the role grants read permissions
		/// </summary>
		[JsonPropertyName("canRead")]
		public Boolean CanRead {
			get; set;
		} = false;

		/// <summary>
		/// Gets or sets whether the role grants write permissions
		/// </summary>
		[JsonPropertyName("canWrite")]
		public Boolean CanWrite {
			get; set;
		} = false;

		/// <summary>
		/// Gets or sets whether the role grants access to config settings
		/// </summary>
		[JsonPropertyName("canChangeSettings")]
		public Boolean CanChangeSettings {
			get; set;
		} = false;

		/// <summary>
		/// Gets or sets whether the role grants access to call system-tasks
		/// </summary>
		[JsonPropertyName("hasSystemAccess")]
		public Boolean HasSystemAccess {
			get; set;
		} = false;

		/// <summary>
		/// Gets or sets whether the role grants access to backup data
		/// </summary>
		[JsonPropertyName("canBackup")]
		public Boolean CanBackup {
			get; set;
		} = false;
	}
}
