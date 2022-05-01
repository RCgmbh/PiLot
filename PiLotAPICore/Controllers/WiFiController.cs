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
		/// 
		/// </summary>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		//[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public async Task<List<WiFiInfo>> GetNetworks() {
			return await new WiFiHelper().GetNetworksAsync();
		}

		[Route(Program.APIROOT + "[controller]/{number}/enable")]
		[HttpPut]
		public String SelectNetwork(Int32 number){
			return new WiFiHelper().SelectNetwork(number);
		}

		[Route(Program.APIROOT + "[controller]/add")]
		[HttpGet]
		public String AddNetwork(String ssid, String passphrase){
			return new WiFiHelper().AddNetwork(ssid, passphrase);
		}
	}
}
