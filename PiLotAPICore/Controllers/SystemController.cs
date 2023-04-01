using System;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Utils.OS;

namespace PiLot.API.Controllers {

	[ApiController]
	public class SystemController : ControllerBase {

		/// <summary>
		/// Shuts the system down
		/// </summary>
		[Route(Program.APIROOT + "[controller]/shutdown")]
		[HttpPut]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public String Shutdown() {
			return new SystemHelper().Shutdown();
		}

		/// <summary>
		/// Sets the system time
		/// </summary>
		[Route(Program.APIROOT + "[controller]/date")]
		[HttpPut]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public String PutDate(Int64 millisUtc) {
			return new SystemHelper().SetDate(millisUtc);
		}
	}
}
