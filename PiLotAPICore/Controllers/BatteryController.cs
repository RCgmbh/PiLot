using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.API.Helpers;
using PiLot.Utils.Various;

namespace PiLot.API.Controllers {

	[ApiController]
	public class BatteryController : ControllerBase {

		/// <summary>
		/// Reads the current Battery status
		/// </summary>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public BatteryInfo GetBatteryStatus() {
			BatteryHelper batteryHelper = BatteryHelperSingleton.BatteryHelper;
			return batteryHelper.GetStatus();
		}

		/// <summary>
		/// Shuts down the device so that it will boot as soon as the 
		/// batteries are being charged
		/// </summary>
		[Route(Program.APIROOT + "[controller]/shutdown")]
		[HttpGet]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public void Shutdown() {
			BatteryHelper batteryHelper = BatteryHelperSingleton.BatteryHelper;
			batteryHelper.Shutdown();
		}
	}
}
