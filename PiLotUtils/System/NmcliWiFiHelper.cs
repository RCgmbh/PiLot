using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PiLot.Utils.OS {

	/// <summary>
	/// Helper for interacting with nmcli, allowing to list and connect to 
	/// wireless networks. 
	/// </summary>
	public class NmcliWiFiHelper: BaseWiFiHelper, IWiFiHelper {

		private const String FIELDSEPARATOR = ":";
		private const String DEVICETYPEWIFI = "wifi";
		private const String CONNECTIONTYPEWIFI = "802-11-wireless";
		private const String HOTSPOTCONNECTION = "hotspot";

		
        
        public NmcliWiFiHelper():base(){ }

		/// <summary>
		/// Returns the list of available interfaces. The interface used for the
		/// connection "hotspot" will be ignored, as it is used for the hotspot.
		/// This method will only return results on linux systems.
		/// </summary>
		/// <returns>List of Strings, can be empty</returns>
		public List<String> GetInterfaces() {
			List<String> result = new List<String>();
			if (this.systemHelper.IsLinux) {
				String hotspotInterface = this.GetHotspotInterface();
				String cmdResult = this.systemHelper.CallCommand("sudo", "nmcli -t -f DEVICE,TYPE device");
				String[] fields;
				foreach (String aLine in this.GetLines(cmdResult)) {
					fields = this.GetFields(aLine);
					if((fields[0] != hotspotInterface) && (fields[1] == DEVICETYPEWIFI)){
						result.Add(fields[0]);
					}
				}
			}
			return result;
		}

		/// <summary>
		/// Return the list of all networks, those available and those
		/// known but currently not available
		/// </summary>
		public async Task<List<WiFiInfo>> GetNetworksAsync(String pInterface){
			List<WiFiInfo> result = this.ReadKnownNetworks(pInterface);
            result = this.SearchNetworks(pInterface, result);
            return result;
        }

        /// <summary>
        /// Adds a new network with SSID and passphrase and selects it. Returns the results of the
        /// involved commands.
        /// </summary>
        public String AddNetwork(String pInterface, String pSSID, String pPassphrase){
            List<String> cmdResults = new List<String>();
			/*String[] addResult = this.GetLines(this.systemHelper.CallCommand("sudo", $"wpa_cli add_network -i {pInterface}"));
			Int32 networkNumber = -1;
			foreach(String aResult in addResult) {
				if(Int32.TryParse(aResult, out networkNumber)){
					break;
				}
			}
			if (networkNumber > -1){
                cmdResults.Add(this.systemHelper.CallCommand("sudo", $"wpa_cli set_network {networkNumber} ssid \"{this.StringToHex(pSSID)}\" -i {pInterface}"));
                String hexPassphrase = this.GetHexPassphrase(pSSID, pPassphrase);
                cmdResults.Add(this.systemHelper.CallCommand("sudo", $"wpa_cli set_network {networkNumber} psk \"{hexPassphrase}\" -i {pInterface}"));
				cmdResults.Add(this.systemHelper.CallCommand("sudo", $"wpa_cli enable_network {networkNumber} -i {pInterface}"));
				cmdResults.Add($"Select network: {this.SelectNetwork(pInterface, networkNumber)};");
				cmdResults.Add($"Save config: {this.SaveConfig(pInterface)};");
            } else{
                cmdResults.Add($"Unexpected result for Add network: {String.Join(" ", addResult)}");
            }
            return String.Join("\n", cmdResults);*/
       		return "not implemented";
        }

        /// <summary>
        /// Selects the network identified by pNumber
        /// </summary>
        public String SelectNetwork(String pInterface, Object pNumber){
            /*String cmdResult = this.systemHelper.CallCommand("sudo", $"wpa_cli select_network {pNumber} -i {pInterface}");
            return cmdResult;*/
			return "not implemented";
        }

        /// <summary>
        /// Removes the network identified by pNumber
        /// </summary>
        public String RemoveNetwork(String pInterface, Object pNumber){
            /*String cmdResult = this.systemHelper.CallCommand("sudo", $"wpa_cli remove_network {pNumber} -i {pInterface}");
            return cmdResult;*/
			return "not implemented";
        }

        /// <summary>
        /// Gets the current WiFi status for pInterface. 
        /// </summary>
        public String GetStatus(String pInterface){
            /*String cmdResult = this.systemHelper.CallCommand("sudo", $"wpa_cli status -i {pInterface}");
            return cmdResult;*/
			return "not implemented";
        }

		/// <summary>
		/// Returns whether pInterface is currently connected to a WiFi
		/// </summary>
		/// <param name="pInterface">The name of the interface</param>
		/// <returns>True, if pInterface is connected</returns>
		public Boolean IsConnected(String pInterface) {
			/*List<WiFiInfo> knownNetworks = this.ReadKnownNetworks(pInterface);
			return knownNetworks.Any(n => n.IsConnected);
			*/
			return false;
		}

		/// <summary>
		/// Returns all known wifi connections, each as a string array with these fields:
		/// [NAME, TYPE, TIMESTAMP, DEVICE, ACTIVE("yes"|"no")]
		/// Connections with TIMESTAMP = 0 will be ignored.
		/// </summary>
		private List<String[]> ReadConnections(){
			List<String[]> result = new List<String[]>(); 
			String cmdResult = this.systemHelper.CallCommand("sudo", $" sudo nmcli -t -f NAME,TYPE,TIMESTAMP,DEVICE connection");
			String[] connectionInfo;
			foreach(String aLine in this.GetLines(cmdResult)){
				connectionInfo = this.GetFields(aLine);
				if(connectionInfo[1] == CONNECTIONTYPEWIFI && connectionInfo[2] != "0"){
					result.Add(connectionInfo);
				}
			}
			return result;
		}

		/// <summary>
		/// Return the name of the interface/device assigned to the hotspot connection,
		/// as this interface will not be used for connecting to wifis.
		/// </summary>
		private String GetHotspotInterface(){
			List<String[]> knownConnections = this.ReadConnections();
			String[] hotspotConnection = knownConnections.FirstOrDefault(c => c[0] == HOTSPOTCONNECTION);
			String result = hotspotConnection != null ? hotspotConnection[3] : null;
			return result;
		}

        /// <summary>
        /// populates a list of known networks
        /// </summary>
        private List<WiFiInfo> ReadKnownNetworks(String pInterface){
            List<WiFiInfo> result = new List<WiFiInfo>();
            List<String[]> connections = this.ReadConnections();
            foreach(String[] aConnection in connections){
                if((aConnection[3] == pInterface) || String.IsNullOrEmpty(aConnection[3])) {
                    result.Add(new WiFiInfo(aConnection[0], -1, false));
                }
            }
            return result;
        }

        /// <summary>
        /// This adds the list of currently available networks to the known networks. For known
        /// networks that are currently available, the availability information will be added to
        /// the known network, resulting in a list of distinct networks.
        /// <param name="pWaitSeconds">The time to wait between scan and list results</param>
        /// <param name="pKnownNetworks">The list of known networks, not null</param>
        /// </summary>
        private List<WiFiInfo> SearchNetworks(String pInterface, List<WiFiInfo> pKnownNetworks){
            List<WiFiInfo> result = pKnownNetworks;
            this.systemHelper.CallCommand("sudo", "nmcli dev wifi rescan");
            String cmdResult = this.systemHelper.CallCommand("sudo", $"nmcli -t -f SSID,IN-USE,SIGNAL device wifi list ifname {pInterface}");
            String[] lines = this.GetLines(cmdResult);
            String[] fields;
            Int32 signalStrength;
            String ssid;
            foreach(String aLine in lines){
                fields = this.GetFields(aLine);
                if((!String.IsNullOrEmpty(fields[0])) && Int32.TryParse(fields[2], out signalStrength)) {
                    ssid = fields[0];
                    WiFiInfo wifiInfo = pKnownNetworks.FirstOrDefault(e => e.SSID == ssid);
                    if(wifiInfo == null){
						wifiInfo = new WiFiInfo(ssid);
						wifiInfo.SignalStrength = 0;
                        result.Add(wifiInfo);
                    }
					signalStrength = signalStrength * -1; // we use negative strength, as it is with wpa_cli. The smaller the stronger.
					wifiInfo.SignalStrength = Math.Min(wifiInfo.SignalStrength ?? 0, signalStrength); // we take the smallest value as one wifi can be listed many times
					wifiInfo.IsConnected = (fields[1] == "*");
					wifiInfo.IsAvailable = true;
                }
            }
            return result;
        }

		/// <summary>
		/// Splits a line by ":", which is used by nmcli as field separator
		/// </summary>
		private String[] GetFields(String pString){
			return (pString.Split(FIELDSEPARATOR.ToCharArray()));
		}
	}
}