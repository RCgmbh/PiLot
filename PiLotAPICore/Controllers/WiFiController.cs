using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Utils.OS;
using PiLot.Model.Common;
using System.Threading.Tasks;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Controller for interacting with wireless networks
	/// </summary>
	[ApiController]
	public class WiFiController : ControllerBase {

		/// <summary>
		/// Gets the active Route ID or null, if no route is active
		/// </summary>
		/// <returns></returns>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		//[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public async Task<List<WiFiInfo>> GetActiveRouteId() {
			return await new WiFiHelper().GetNetworksAsync();
		}
	}
}
