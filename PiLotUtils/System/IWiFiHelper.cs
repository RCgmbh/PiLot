using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PiLot.Utils.OS {

	/// <summary>
	/// Interface defining a helper to interacting with the wireless network,
	/// allowing to list and connect to wireless networks.
	/// </summary>
	public interface IWiFiHelper {

		/// <summary>
		/// Returns the list of available interfaces.
		/// </summary>
		/// <returns>List of Strings, can be empty</returns>
		List<String> GetInterfaces();

		/// <summary>
		/// Return the list of all networks, those available and those
		/// known but currently not available
		/// </summary>
		Task<List<WiFiInfo>> GetNetworksAsync(String pInterface);

        /// <summary>
        /// Adds a new network with SSID and passphrase and selects it. Returns the results of the
        /// involved commands.
        /// </summary>
        String AddNetwork(String pInterface, String pSSID, String pPassphrase);

        /// <summary>
        /// Selects the network identified by pId
        /// </summary>
        String SelectNetwork(String pInterface, Object pIdentifier);

        /// <summary>
        /// Removes the network identified by pId
        /// </summary>
        String RemoveNetwork(String pInterface, Object pIdentifier);

        /// <summary>
        /// Gets the current WiFi status for pInterface. 
        /// </summary>
        String GetStatus(String pInterface);

		/// <summary>
		/// Returns whether the device is connected to a wifi and this
		/// wifi is connected to the internet
		/// </summary>
		WiFiStatus GetStatus();
	}
}