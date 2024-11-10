using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Model.System;
using PiLot.Utils.OS;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Controller for interacting with wireless networks
	/// </summary>
	[ApiController]
	public class WiFiController : ControllerBase {

		/// <summary>
		/// Gets a list of the available interfaces.
		/// </summary>
		[Route(Program.APIROOT + "[controller]/interfaces")]
		[HttpGet]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public List<String> GetInterfaces() {
			return new WiFiHelper().GetInterfaces();
		}

		/// <summary>
		/// Gets a list of all known and of all currently available networks.
		/// </summary>
		[Route(Program.APIROOT + "[controller]/interfaces/{iface}/networks")]
		[HttpGet]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public async Task<List<WiFiInfo>> GetNetworks(String iface) {
			return await new WiFiHelper().GetNetworksAsync(iface);
		}

		/// <summary>
		/// Gets the current wpa_cli status for an interface
		/// </summary>
		[Route(Program.APIROOT + "[controller]/interfaces/{iface}/status")]
		[HttpGet]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public String GetStatus(String iface) {
			return new WiFiHelper().GetStatus(iface);
		}

		/// <summary>
		/// Gets an overall status, also including information
		/// about whether we are online.
		/// </summary>
		[Route(Program.APIROOT + "[controller]/status")]
		[HttpGet]
		public WiFiStaus GetStatus() {
			WiFiHelper wifiHelper = new WiFiHelper();
			WiFiStaus result = new WiFiStaus() {
				Connected = false,
				InternetAccess = false
			};
			List<String> interfaces = wifiHelper.GetInterfaces();
			List<String> details = new List<String>(interfaces.Count);
			foreach(String anInterface in interfaces) {
				result.Connected = result.Connected || wifiHelper.IsConnected(anInterface);
				details.Add($"{anInterface}: {wifiHelper.GetStatus(anInterface)}");
			}
			result.Details = String.Join("\n", details);
			result.InternetAccess = new SystemHelper().Ping("8.8.8.8");
			return result;
		}

		/// <summary>
		/// Connects to the network with number. The number is taken
		/// from the result of GetNetworks().
		/// </summary>
		[Route(Program.APIROOT + "[controller]/interfaces/{iface}/networks/{number}/select")]
		[HttpPut]
		public String SelectNetwork(String iface, Int32 number){
			return new WiFiHelper().SelectNetwork(iface, number);
		}

		/// <summary>
		/// Adds a new network defined by ssid and passphrase.
		/// </summary>
		[Route(Program.APIROOT + "[controller]/interfaces/{iface}/networks")]
		[HttpPost]
		public String AddNetwork(String iface, AddNetworkData data){
			return new WiFiHelper().AddNetwork(iface, data.SSID, data.Passphrase);
		}

		/// <summary>
		/// Deletes a specific network.
		/// </summary>
		[Route(Program.APIROOT + "[controller]/interfaces/{iface}/networks/{number}")]
		[HttpDelete]
		public String DeleteNetwork(String iface, Int32 number){
			return new WiFiHelper().RemoveNetwork(iface, number);
		}

		/// Get methods, mainly for testing or manual url based usage
		
		[Route(Program.APIROOT + "[controller]/interfaces/{iface}/networks/{number}/select")]
		[HttpGet]
		public String GetSelectNetwork(String iface, Int32 number){
			return new WiFiHelper().SelectNetwork(iface, number);
		}

		[Route(Program.APIROOT + "[controller]/interfaces/{iface}/networks/add")]
		[HttpGet]
		public String GetAddNetwork(String iface, String ssid, String passphrase){
			return new WiFiHelper().AddNetwork(iface, ssid, passphrase);
		}

		[Route(Program.APIROOT + "[controller]/interfaces/{iface}/networks/{number}/delete")]
		[HttpGet]
		public String GetDeleteNetwork(String iface, Int32 number) {
			return new WiFiHelper().RemoveNetwork(iface, number);
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
