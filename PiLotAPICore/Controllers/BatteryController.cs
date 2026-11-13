using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
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
			using BatteryHelper batteryHelper = new BatteryHelper();
			return batteryHelper.GetStatus();
		}
	}
}
