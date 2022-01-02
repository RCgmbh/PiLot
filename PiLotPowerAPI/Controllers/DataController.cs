using System;
using Microsoft.AspNetCore.Mvc;

namespace PiLot.PowerAPI.Controllers {

	/// <summary>
	/// API Controller to provide information about the current power status
	/// </summary>
	[ApiController]
	public class DataController : ControllerBase {

		/// <summary>
		/// Gets whether the device is currently being powered over USB
		/// </summary>
		[HttpGet]
		[Route("powerapi/v1/data/{id}")]
		public Double? Get(String id) {
			Double? result = null;
			switch (id) {
				case "usb":
					result = GPIOManager.Instance.IsUSBPowered ? 1 : 0;
					break;
				case "wireless":
					result = GPIOManager.Instance.IsWirelessPowered ? 1 : 0;
					break;
				case "battery":
					result = Program.ChargeManager.CurrentVoltage; ;
					break;
				case "adc":
					result = Program.ChargeManager.CurrentADCValue;
					break;
			}
			if(result != null) {
				result = Math.Round(result.Value, 3);
			}
			return result;
		}
	}
}
