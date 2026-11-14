using System;
using System.Collections;
using System.Text;
using System.Device.I2c;

using PiLot.Utils.OS;

namespace PiLot.Utils.Various {

	/// <summary>
	/// Reads the current status data from the Waveshare UPS Hat
	/// </summary>
	public class BatteryHelper : IDisposable {

		private const int BUSID = 1;
		private const int DEVICEADDRESS = 0x2D;
		private readonly I2cDevice device;

		public BatteryHelper() {
			if(new SystemHelper().IsLinux){
				this.device = I2cDevice.Create(new I2cConnectionSettings(BUSID, DEVICEADDRESS));
			}
		}

		public BatteryInfo GetStatus(){
			BatteryInfo result = null;
			if(this.device != null){
				result = this.GetWaveshareEStatus();
			} 
			return result;
		}

		public BatteryInfo GetWaveshareEStatus() {
			var statusData = ReadBlock(0x02, 1);
			byte status = statusData[0];
			var vbusData = ReadBlock(0x10, 6);
			UInt16 vbusVoltage = ToUInt16(vbusData[0], vbusData[1]);
			UInt16 vbusCurrent = ToUInt16(vbusData[2], vbusData[3]);
			UInt16 vbusPower = ToUInt16(vbusData[4], vbusData[5]);
			var batteryData = ReadBlock(0x20, 12);
			UInt16 batteryVoltage = ToUInt16(batteryData[0], batteryData[1]);
			Int16 batteryCurrent = ToInt16(batteryData[2], batteryData[3]);
			UInt16 batteryPercent = ToUInt16(batteryData[4], batteryData[5]);
			UInt16 batteryCapacity = ToUInt16(batteryData[6], batteryData[7]);
			UInt16 dischargeTime = ToUInt16(batteryData[8], batteryData[9]);
			UInt16 chargeTime = ToUInt16(batteryData[10], batteryData[11]);
			var cellData = ReadBlock(0x30, 8);
			UInt16 cell1Voltage = ToUInt16(cellData[0], cellData[1]);
			UInt16 cell2Voltage = ToUInt16(cellData[2], cellData[3]);
			UInt16 cell3Voltage = ToUInt16(cellData[4], cellData[5]);
			UInt16 cell4Voltage = ToUInt16(cellData[6], cellData[7]);
			return new BatteryInfo() {
				Status = status,
				VbusVoltage = vbusVoltage,
				VbusCurrent = vbusCurrent,
				VbusPower = vbusPower,
				BatteryCurrent = batteryCurrent,
				BatteryPercent = batteryPercent,
				BatteryCapacity = batteryCapacity,
				DischargeTime = dischargeTime,
				ChargeTime = chargeTime,
				CellVoltage = new UInt16[]{
					cell1Voltage,
					cell2Voltage,
					cell3Voltage,
					cell4Voltage
				}
			};
		}

		private byte[] ReadBlock(byte register, int length) {
			Span<byte> registerBuffer = stackalloc byte[] { register };
			byte[] readBuffer = new byte[length];
			device.WriteRead(registerBuffer, readBuffer);
			return readBuffer;
		}

		private static UInt16 ToUInt16(byte low, byte high) {
			return (UInt16)(low | (high << 8));
		}

		private static Int16 ToInt16(byte low, byte high) {
			return (Int16)(low | (high << 8));
		}

		public void Dispose() {
			this.device?.Dispose();
		}
	}
}