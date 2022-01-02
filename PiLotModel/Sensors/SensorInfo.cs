using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PiLot.Model.Sensors {

	/// <summary>
	/// Struct containing all information about a single sensor
	/// </summary>
	public struct SensorInfo {

		/// <summary>
		/// The type of sensor, which only makes sense in the context of the
		/// device this belongs to. e.g. for a BMP180, this can be "temperature"
		/// or "pressure", but it's the Device class who needs to make sense
		/// of this
		/// </summary>
		[JsonPropertyName("sensorType")]
		public String SensorType { get; set; }

		/// <summary>
		/// An ID which uniquely (per device) identifies the Sensor. This is
		/// mainly used for Devices of type pilot, where different data sources
		/// need to be accessed.
		/// </summary>
		[JsonPropertyName("id")]
		public String ID { get; set; }


		/// <summary>
		/// The name, usually used to determine the storage, but this is
		/// depending of the Device type
		/// </summary>
		[JsonPropertyName("name")]
		public String Name { get; set; }

		/// <summary>
		/// The friendly name used when displaying this sensor's data, such
		/// as "Water temperature" 
		/// </summary>
		[JsonPropertyName("displayName")]
		public String DisplayName { get; set; }

		/// <summary>
		/// A list of tags to further specify the data. This allows clients
		/// to request data onyl for a certain purpose, e.g. "System", 
		/// "Meteo" or "LogbookTemperature". This implements no logic,
		/// the client is expected to know what he wants.
		/// </summary>
		[JsonPropertyName("tags")]
		public List<String> Tags { get; set; }

		/// <summary>
		/// A number which can be used to sort the sensor info when displaying
		/// information.
		/// </summary>
		[JsonPropertyName("sortOrder")]
		public Int32? SortOrder { get; set; }

	}
}
