using System;
using System.Text;
using System.Device.I2c;

public class BatteryHelper {

	private const int I2CBUSID = 1;
	private const int DEVICEADDRESS = 0x2D;

	private I2cDevice device;

	public BatteryHelper() {
		var settings = new I2cConnectionSettings(I2CBUSID, DEVICEADDRESS);
		this.device = I2cDevice.Create(settings);
	}

	public String ReadStatus() {
	
		// VBUS
		ushort vbusVoltageMv = this.ReadUInt16(0x10);
		ushort vbusCurrentMa = this.ReadUInt16(0x12);
		ushort vbusPowerMw = this.ReadUInt16(0x14);

		// Batterie
		ushort batteryVoltageMv = this.ReadUInt16(0x20);
		short batteryCurrentMa = this.ReadInt16(0x22);
		ushort batteryPercent = this.ReadUInt16(0x24);
		ushort batteryCapacityMah = this.ReadUInt16(0x26);
		ushort dischargeTimeMin = this.ReadUInt16(0x28);
		ushort chargeTimeMin = this.ReadUInt16(0x2A);

		// Einzelzellen
		ushort cell1Mv = this.ReadUInt16(0x30);
		ushort cell2Mv = this.ReadUInt16(0x32);
		ushort cell3Mv = this.ReadUInt16(0x34);
		ushort cell4Mv = this.ReadUInt16(0x36);

		StringBuilder resultBuilder = new StringBuilder();
		resultBuilder.Append($"VBUS Spannunh: {vbusVoltageMv} mV ({vbusVoltageMv / 1000.0:F2} V)\n");
		resultBuilder.Append($"VBUS Strom: {vbusCurrentMa} mA ({vbusCurrentMa / 1000.0:F2} A)\n");
		resultBuilder.Append($"VBUS Leistung: {vbusPowerMw} mW ({vbusPowerMw / 1000.0:F2} W)\n");
		resultBuilder.Append($"Batteriespannung: {batteryVoltageMv} mV ({batteryVoltageMv / 1000.0:F2} V)\n");
		resultBuilder.Append($"Batteriestrom: {batteryCurrentMa} mA\n");
		resultBuilder.Append($"Ladestand: {batteryPercent} %\n");
		resultBuilder.Append($"Restkapazität: {batteryCapacityMah} mAh\n");
		resultBuilder.Append($"Restlaufzeit: {dischargeTimeMin} min\n");
		resultBuilder.Append($"Restladezeit: {chargeTimeMin} min\n");
		resultBuilder.Append($"Zelle 1: {cell1Mv} mV\n");
		resultBuilder.Append($"Zelle 2: {cell2Mv} mV\n");
		resultBuilder.Append($"Zelle 3: {cell3Mv} mV\n");
		resultBuilder.Append($"Zelle 4: {cell4Mv} mV\n");
		return resultBuilder.ToString();
	}

	private ushort ReadUInt16(byte lowRegister) {
		byte low = ReadRegister(lowRegister);
		byte high = ReadRegister((byte)(lowRegister + 1));
		return (ushort)((high << 8) | low);
	}

	private short ReadInt16(byte lowRegister) {
		byte low = ReadRegister(lowRegister);
		byte high = ReadRegister((byte)(lowRegister + 1));
		return (short)((high << 8) | low);
	}

	private byte ReadRegister(byte register) {
		this.device.WriteByte(register);
		byte[] buffer = new byte[1];
		this.device.Read(buffer);
		return buffer[0];
	}
}
		