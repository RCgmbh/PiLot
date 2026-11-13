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

		[JsonPropertyName("dischargeTime_s")]
		public Int32 DischargeTime { get; set; }

		[JsonPropertyName("chargeTime_s")]
		public Int32 ChargeTime { get; set; }

		[JsonPropertyName("cell1Voltage_mV")]
		public UInt16 Cell1Voltage { get; set; }

		[JsonPropertyName("cell2Voltage_mV")]
		public UInt16 Cell2Voltage { get; set; }

		[JsonPropertyName("cell3Voltage_mV")]
		public UInt16 Cell3Voltage { get; set; }

		[JsonPropertyName("cell4Voltage_mV")]
		public UInt16 Cell4Voltage{ get; set; }

	}
}
