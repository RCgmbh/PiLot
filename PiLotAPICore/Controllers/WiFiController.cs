using System;
using System.Collections.Generic;
using System.Configuration;
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
			return this.GetWiFiHelper().GetInterfaces();
		}

		/// <summary>
		/// Gets a list of all known and of all currently available networks.
		/// </summary>
		[Route(Program.APIROOT + "[controller]/interfaces/{iface}/networks")]
		[HttpGet]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public async Task<List<WiFiInfo>> GetNetworks(String iface) {
			return await this.GetWiFiHelper().GetNetworksAsync(iface);
		}

		/// <summary>
		/// Gets the current wpa_cli status for an interface
		/// </summary>
		[Route(Program.APIROOT + "[controller]/interfaces/{iface}/status")]
		[HttpGet]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public String GetStatus(String iface) {
			return this.GetWiFiHelper().GetStatus(iface);
		}

		/// <summary>
		/// Gets an overall status, also including information
		/// about whether we are online.
		/// </summary>
		[Route(Program.APIROOT + "[controller]/status")]
		[HttpGet]
		public WiFiStatus GetStatus() {
			IWiFiHelper wifiHelper = this.GetWiFiHelper();
			return wifiHelper.GetStatus();
		}

		/// <summary>
		/// Connects to the network with number. The number is taken
		/// from the result of GetNetworks().
		/// </summary>
		[Route(Program.APIROOT + "[controller]/interfaces/{iface}/networks/{identifier}/select")]
		[HttpPut]
		public String SelectNetwork(String iface, String identifier){
			return this.GetWiFiHelper().SelectNetwork(iface, identifier);
		}

		/// <summary>
		/// Adds a new network defined by ssid and passphrase.
		/// </summary>
		[Route(Program.APIROOT + "[controller]/interfaces/{iface}/networks")]
		[HttpPost]
		public String AddNetwork(String iface, AddNetworkData data){
			return this.GetWiFiHelper().AddNetwork(iface, data.SSID, data.Passphrase);
		}

		/// <summary>
		/// Deletes a specific network.
		/// </summary>
		[Route(Program.APIROOT + "[controller]/interfaces/{iface}/networks/{identifier}")]
		[HttpDelete]
		public String DeleteNetwork(String iface, String identifier){
			return this.GetWiFiHelper().RemoveNetwork(iface, identifier);
		}

		/// Get methods, mainly for testing or manual url based usage
		
		[Route(Program.APIROOT + "[controller]/interfaces/{iface}/networks/{identifier}/select")]
		[HttpGet]
		public String GetSelectNetwork(String iface, String identifier){
			return this.GetWiFiHelper().SelectNetwork(iface, identifier);
		}

		[Route(Program.APIROOT + "[controller]/interfaces/{iface}/networks/add")]
		[HttpGet]
		public String GetAddNetwork(String iface, String ssid, String passphrase){
			return this.GetWiFiHelper().AddNetwork(iface, ssid, passphrase);
		}

		[Route(Program.APIROOT + "[controller]/interfaces/{iface}/networks/{identifier}/delete")]
		[HttpGet]
		public String GetDeleteNetwork(String iface, String identifier) {
			return this.GetWiFiHelper().RemoveNetwork(iface, identifier);
		}

		private IWiFiHelper GetWiFiHelper(){
			IWiFiHelper result;
			switch(ConfigurationManager.AppSettings["wifiManager"]){
				case "nmcli": 
					result = new NmcliWiFiHelper();
					break;
				default:
					result = new WpaCliWiFiHelper();
					break;
			}
			return result;
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
