using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PiLot.Backup.Client.Model {

	/// <summary>
	/// This encapsulates the settings for the application, which
	/// are persisted into a json file
	/// </summary>
	public class Config {

		public Config() {
			this.BackupTargets = new List<BackupTarget>();
		}

		[JsonPropertyName("backupTargets")]
		public List<BackupTarget> BackupTargets { get; set; }

	}
}
