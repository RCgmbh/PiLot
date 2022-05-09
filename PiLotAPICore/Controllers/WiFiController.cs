using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Utils.OS;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Controller for interacting with wireless networks
	/// </summary>
	[ApiController]
	public class WiFiController : ControllerBase {

		/// <summary>
		/// Gets a list of all known and of all currently available networks.
		/// </summary>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public async Task<List<WiFiInfo>> GetNetworks() {
			return await new WiFiHelper().GetNetworksAsync();
		}

		/// <summary>
		/// Gets the current wpa_cli status
		/// </summary>
		[Route(Program.APIROOT + "[controller]/status")]
		[HttpGet]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public String GetStatus() {
			return new WiFiHelper().GetStatus();
		}

		/// <summary>
		/// Connects to the network with number. The number is taken
		/// from the result of GetNetworks().
		/// </summary>
		[Route(Program.APIROOT + "[controller]/{number}/select")]
		[HttpPut]
		public String SelectNetwork(Int32 number){
			return new WiFiHelper().SelectNetwork(number);
		}

		/// <summary>
		/// Adds a new network defined by ssid and passphrase.
		/// </summary>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPost]
		public String AddNetwork(AddNetworkData pData){
			return new WiFiHelper().AddNetwork(pData.SSID, pData.Passphrase);
		}

		/// <summary>
		/// Deletes a specific network.
		/// </summary>
		[Route(Program.APIROOT + "[controller]/{number}")]
		[HttpDelete]
		public String DeleteNetwork(Int32 number){
			return new WiFiHelper().RemoveNetwork(number);
		}

		/// Get methods, mainly for testing or manual url based usage
		
		[Route(Program.APIROOT + "[controller]/{number}/select")]
		[HttpGet]
		public String GetSelectNetwork(Int32 number){
			return new WiFiHelper().SelectNetwork(number);
		}

		[Route(Program.APIROOT + "[controller]/add")]
		[HttpGet]
		public String GetAddNetwork(String ssid, String passphrase){
			return new WiFiHelper().AddNetwork(ssid, passphrase);
		}

		[Route(Program.APIROOT + "[controller]/{number}/delete")]
		[HttpGet]
		public String GetDeleteNetwork(Int32 number){
			return new WiFiHelper().RemoveNetwork(number);
		}

		/// <summary>
		/// Helper class that encapsulates the payload for the AddNetwork method
		/// </summary>
		public class AddNetworkData {

			[JsonPropertyName("ssid")]
			public String SSID { get; set; }

			[JsonPropertyName("passphrase")]
			public string Passphrase { get; set; }

		}

	}
}
