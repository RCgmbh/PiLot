using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PiLot.Model.Sensors {
	
	/// <summary>
	/// Simple structure containing a sensor name and a value. This is 
	/// used to recieve sensor data over the api
	/// </summary>
	public struct SensorValue {

		public SensorValue(String pSensorName, Double? pValue) {
			this.SensorName = pSensorName;
			this.Value = pValue;
		}

		/// <summary>
		/// The name of the sensor, e.g. "temperature1"
		/// </summary>
		[JsonPropertyName("sensorName")]
		public String SensorName { get; set; }

		/// <summary>
		/// The actually measured Value
		/// </summary>
		[JsonPropertyName("value")]
		public Double? Value { get; set; }

		/// <summary>
		/// Logging-friendly ToString
		/// </summary>
		public override string ToString() {
			return $"SensorName: {this.SensorName}, Value: {this.Value}";
		}
	}
}
