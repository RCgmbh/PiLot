using System;
using System.Text.Json.Serialization;

using PiLot.Model.Common;

namespace PiLot.Backup.Client.Model {

	/// <summary>
	/// represents a task which should be performed against a backup target
	/// </summary>
	public class BackupTask {

		public BackupTask() { }

		/// <summary>
		/// The type of data to be backed up
		/// </summary>
		[JsonPropertyName("dataType")]
		public DataTypes DataType { get; set; }

		/// <summary>
		/// The data source name, especially for DateNumber Data types,
		/// e.g. temperature0, temperature1, pressure0 etc.
		/// </summary>
		[JsonPropertyName("dataSource")]
		public String DataSource { get; set; }

		/// <summary>
		/// The date when the last successful backup was done
		/// </summary>
		[JsonPropertyName("lastSuccess")]
		public DateTime? LastSuccess { get; set; }

	}
}
