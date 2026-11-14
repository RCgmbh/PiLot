using System;
using System.Text.Json.Serialization;

namespace PiLot.Utils.Various {

	/// <summary>
	/// Contains information about the current battery state
	/// </summary>
	public class BatteryInfo {

		[JsonPropertyName("status")]
		public Byte Status { get; set; }

		[JsonPropertyName("vbusVoltage_mV")]
		public UInt16 VbusVoltage { get; set; }

		[JsonPropertyName("vbusCurrent_mA")]
		public UInt16 VbusCurrent { get; set; }

		[JsonPropertyName("vbusPower_mW")]
		public UInt16 VbusPower { get; set; }

		[JsonPropertyName("BatteryCurrent_mA")]
		public Int16 BatteryCurrent { get; set; }

		[JsonPropertyName("batteryPercent")]
		public UInt16 BatteryPercent { get; set; }

		[JsonPropertyName("batteryCapacity_mAh")]
		public UInt16 BatteryCapacity { get; set; }

		[JsonPropertyName("dischargeTime_min")]
		public UInt16 DischargeTime { get; set; }

		[JsonPropertyName("chargeTime_min")]
		public UInt16 ChargeTime { get; set; }

		[JsonPropertyName("cellVoltage_mV")]
		public UInt16[] CellVoltage { get; set; }

	}
}
