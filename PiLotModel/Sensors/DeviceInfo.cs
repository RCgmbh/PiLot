using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PiLot.Model.Sensors {

	/// <summary>
	/// Struct for DeviceInfo, used to deserialize data from sensors.json
	/// </summary>
	public struct DeviceInfo {

		/// <summary>
		/// A DeviceType, as defined in DeviceTypes
		/// </summary>
		[JsonPropertyName("deviceType")]
		public String DeviceType { get; set; }

		/// <summary>
		/// An ID which uniquely (per pilot) identifies the Device
		/// </summary>
		[JsonPropertyName("id")]
		public String ID { get; set; }

		/// <summary>
		/// The reading interval in Seconds
		/// </summary>
		[JsonPropertyName("interval")]
		public Int32 Interval { get; set; }

		/// <summary>
		/// A list of SensorInfo objects defining the sonsors on this
		/// device
		/// </summary>
		[JsonPropertyName("sensors")]
		public List<SensorInfo> Sensors { get; set; }

	}
}
