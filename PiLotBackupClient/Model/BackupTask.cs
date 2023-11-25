using System;
using System.Text.Json.Serialization;

namespace PiLot.Backup.Client.Model {

	[JsonConverter(typeof(JsonStringEnumConverter))]
	public enum DataTypes {GPS = 0, SensorData = 1, Logbook = 2, Routes = 3, POIs = 4, Photos = 5}

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
