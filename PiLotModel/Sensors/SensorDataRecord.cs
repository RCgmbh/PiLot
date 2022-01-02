using System;
using System.Text.Json.Serialization;

using PiLot.Utils.DateAndTime;

namespace PiLot.Model.Sensors {
	
	/// <summary>
	/// This represents one record from sensor Data. It contains
	/// the utc timestamp, the boatTime timestamp and the value itself. It
	/// is used to present timelined data on the client.
	/// </summary>
	public class SensorDataRecord {

		private Int32 utc;
		private Int32 boatTime;
		private Double? value;

		/// <summary>
		/// Parameterless constructor for JSON deserialization (we did not use 
		/// a struct as JsonSerializer seems to have an issue with nullable
		/// structs)
		/// </summary>
		public SensorDataRecord() { }

		/// <summary>
		/// Creates a new SensorDataRecord
		/// </summary>
		/// <param name="pUtc">the utc timestamp in seconds from 1.1.1970</param>
		/// <param name="pBoatTime">the boatTime timestamp in seconds from 1.1.1970</param>
		/// <param name="pValue">the value actually measured</param>
		public SensorDataRecord(Int32 pUtc, Int32 pBoatTime, Double? pValue) {
			this.utc = pUtc;
			this.boatTime = pBoatTime;
			this.value = pValue;
		} 

		/// <summary>
		/// Creates a new SensorDataRecord
		/// </summary>
		/// <param name="pUtc">the time in utc</param>
		/// <param name="pBoatTime">the time in boatTime</param>
		/// <param name="pValue">the value actually measures</param>
		public SensorDataRecord(DateTime pUtc, DateTime pBoatTime, Double? pValue) {
			this.utc = DateTimeHelper.ToUnixTime(pUtc);
			this.boatTime = DateTimeHelper.ToUnixTime(pBoatTime);
			this.value = pValue;
		}

		/// <summary>
		/// Gets or sets the utc timestamp of the record in Seconds from 1.1.1976
		/// </summary>
		[JsonPropertyName("utc")]
		public Int32 UTC { 
			get { return this.utc; }
			set { this.utc = value; }
		}

		/// <summary>
		/// Gets the BoatTime timestamp of the record in Seconds from 1.1.1970
		/// </summary>
		[JsonPropertyName("boatTime")]
		public Int32 BoatTime {
			get { return this.boatTime; }
			set { this.boatTime = value; }
		}

		/// <summary>
		/// Returns the recorded value
		/// </summary>
		[JsonPropertyName("value")]
		public Double? Value { 
			get { return this.value; }
			set { this.value = value; }
		}
	}
}
