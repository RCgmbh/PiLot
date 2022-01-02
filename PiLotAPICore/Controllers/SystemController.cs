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
		[Route("api/v1/System/shutdown")]
		[HttpPut]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public String Shutdown() {
			return new SystemHelper().Shutdown();
		}

		/// <summary>
		/// Sets the system time
		/// </summary>
		[Route("api/v1/System/date")]
		[HttpPut]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public String PutDate(Int64 millisUtc) {
			return new SystemHelper().SetDate(millisUtc);
		}

	}
}
