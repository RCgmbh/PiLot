using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PiLot.Backup.Client.Model {

	/// <summary>
	/// Represents one target where a backup should be created
	/// </summary>
	public class BackupTarget {

		public BackupTarget() { }

		/// <summary>
		/// The absolute url of the API endpoint of the target
		/// </summary>
		[JsonPropertyName("targetUrl")]
		public String TargetUrl { get; set; }

		/// <summary>
		/// The username used to authenticate against the endpoint
		/// </summary>
		[JsonPropertyName("username")]
		public String Username { get; set; }

		/// <summary>
		/// The password used to authenticate against the endpoint
		/// </summary>
		[JsonPropertyName("password")]
		public String Password { get; set; }

		/// <summary>
		/// The list of all tasks that should be performed against this target
		/// </summary>
		[JsonPropertyName("backupTasks")]
		public List<BackupTask> BackupTasks { get; set; }

	}
}
