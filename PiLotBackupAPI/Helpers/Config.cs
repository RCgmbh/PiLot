using System;
using System.Text.Json.Serialization;

namespace PiLot.Backup.API.Helpers {

	/// <summary>
	/// Encapsulates configuration data for the service
	/// </summary>
	public class Config {

		public Config() { }

		/// <summary>
		/// The ages in minutes of backup sets to keep. E.g. one set at most
		/// 5 minutes old, one set at most 10 minutes old etc.
		/// </summary>
		[JsonPropertyName("backupSetsInterval")]
		public Int32[] BackupSetsInterval { get; set; }

	}
}