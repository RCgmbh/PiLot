using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PiLot.Utils.OS {

	/// <summary>
	/// Helper for interacting with wpa_cli, allowing to list and connect to 
	/// wireless networks. This is very much coupled with the actual output
	/// of wpa_cli, so it will probably need some fine tuning every now and then.
	/// </summary>
	public class WiFiHelper {

        private SystemHelper systemHelper;

        public WiFiHelper(){
            this.systemHelper = new SystemHelper();
        }

		/// <summary>
		/// Returns the list of available interfaces
		/// </summary>
		/// <returns>List of Strings, can be empty</returns>
		public List<String> GetInterfaces() {
			List<String> result = new List<String>();
			String cmdResult = this.systemHelper.CallCommand("sudo", "wpa_cli interface");
			String[] lines = this.GetLines(cmdResult);
			for(Int32 i = 2; i < lines.Length; i++) {
				result.Add(lines[i]);
			}
			return result;
		}

		/// <summary>
		/// Return the list of all networks, those available and those
		/// known but currently not available
		/// </summary>
		public async Task<List<WiFiInfo>> GetNetworksAsync(String pInterface){
			List<WiFiInfo> result = this.ReadKnownNetworks(pInterface);
            result = await this.SearchNetworksAsync(pInterface, 5, result);
            return result;
        }

        /// <summary>
        /// Adds a new network with SSID and passphrase and selects it. Returns the results of the
        /// involved commands.
        /// </summary>
        public String AddNetwork(String pInterface, String pSSID, String pPassphrase){
            List<String> cmdResults = new List<String>();
            Int32 networkNumber;
            String[] addResult = this.GetLines(this.systemHelper.CallCommand("sudo", $"wpa_cli add_network -i {pInterface}"));
            if( (addResult.Length > 1) && Int32.TryParse(addResult[1] , out networkNumber)){
                cmdResults.Add(this.systemHelper.CallCommand("sudo", $"wpa_cli set_network {networkNumber} ssid \"{this.StringToHex(pSSID)}\" -i {pInterface}"));
                String hexPassphrase = this.GetHexPassphrase(pSSID, pPassphrase);
                cmdResults.Add(this.systemHelper.CallCommand("sudo", $"wpa_cli set_network {networkNumber} psk \"{hexPassphrase}\" -i {pInterface}"));
				cmdResults.Add(this.systemHelper.CallCommand("sudo", $"wpa_cli enable_network {networkNumber} -i {pInterface}"));
				cmdResults.Add($"Select network: {this.SelectNetwork(pInterface, networkNumber)};");
				cmdResults.Add($"Save config: {this.SaveConfig(pInterface)};");
            } else{
                cmdResults.Add($"Unexpected result for Add network: {String.Join(" ", addResult)}");
            }
            return String.Join("\n", cmdResults);
        }

        /// <summary>
        /// Selects the network identified by pNumber
        /// </summary>
        public String SelectNetwork(String pInterface, Int32 pNumber){
            String cmdResult = this.systemHelper.CallCommand("sudo", $"wpa_cli select_network {pNumber} -i {pInterface}");
            return cmdResult;
        }

        /// <summary>
        /// Removes the network identified by pNumber
        /// </summary>
        public String RemoveNetwork(String pInterface, Int32 pNumber){
            String cmdResult = this.systemHelper.CallCommand("sudo", $"wpa_cli remove_network {pNumber} -i {pInterface}");
            return cmdResult;
        }

        /// <summary>
        /// Gets the current WiFi status
        /// </summary>
        public String GetStatus(String pInterface){
            String cmdResult = this.systemHelper.CallCommand("sudo", $"wpa_cli status -i {pInterface}");
            return cmdResult;
        }

        /// <summary>
        /// Saves the wpa configuration
        /// </summary>
        private String SaveConfig(String pInterface){
            return this.systemHelper.CallCommand("sudo", $"wpa_cli save_config -i {pInterface}");
        }

        /// <summary>
        /// populates a list of known networks
        /// </summary>
        private List<WiFiInfo> ReadKnownNetworks(String pInterface){
            List<WiFiInfo> result = new List<WiFiInfo>();
            String cmdResult = this.systemHelper.CallCommand("sudo", $"wpa_cli list_networks -i {pInterface}");
            String[] lines = this.GetLines(cmdResult);
            String[] segments;
            Int32 networkNumber;
            foreach(String aLine in lines){
                segments = aLine.Split("\t".ToCharArray());
                if((segments.Length == 4) && (Int32.TryParse(segments[0], out networkNumber))) {
                    result.Add(new WiFiInfo(segments[1], networkNumber, segments[3] == "[CURRENT]"));
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
        private async Task<List<WiFiInfo>> SearchNetworksAsync(String pInterface, Int32 pWaitSeconds, List<WiFiInfo> pKnownNetworks){
            List<WiFiInfo> result = pKnownNetworks;
            this.systemHelper.CallCommand("sudo", $"wpa_cli scan -i {pInterface}");
            await Task.Delay(pWaitSeconds * 1000);
            String cmdResult = this.systemHelper.CallCommand("sudo", $"wpa_cli scan_result -i {pInterface}");
            String[] lines = this.GetLines(cmdResult);
            String[] segments;
            Int32 signalStrength;
            String ssid;
            foreach(String aLine in lines){
                segments = aLine.Split("\t".ToCharArray());
                if((segments.Length == 5) && (!String.IsNullOrEmpty(segments[4])) && (Int32.TryParse(segments[2], out signalStrength))) {
                    ssid = segments[4];
                    WiFiInfo wifiInfo = pKnownNetworks.FirstOrDefault(e => e.SSID == ssid);
                    if(wifiInfo == null){
                        wifiInfo = new WiFiInfo(ssid);
                        result.Add(wifiInfo);
                    }
                    wifiInfo.SignalStrength = signalStrength;
                    wifiInfo.IsAvailable = true;
                }
            }
            return result;
        }

        /// <summary>
        /// Converts the ssid to the hex code, which is used to pass it to set_network.
        /// Alternatively, the form '"ssid"' could be used, which however did not work.
        /// </summary>
        private String StringToHex(String pInput){
            byte[] bytes = Encoding.Default.GetBytes(pInput);
            String hexString = BitConverter.ToString(bytes);
            return hexString.Replace("-", "");
        } 

        /// <summary>
        /// This creates the hex encoded passphrase, which will be passed to set_network.
        /// Passing it unencoded with '"password"' did not work. This is quick and dirty
        /// and expects an exact structure, whith psk=xy on line 4. 
        /// </summary>
        private String GetHexPassphrase(String pSSID, String pPassphrase){
            String result = null;
            String cmdResult = this.systemHelper.CallCommand("sudo", $"wpa_passphrase {pSSID} {pPassphrase}");
            String[] lines = this.GetLines(cmdResult);
            if((lines.Length > 4) && (lines[3].IndexOf("=") > 0)){
                result = lines[3].Substring(lines[3].IndexOf("=") + 1).Trim();
            }
            return result;
        }

		/// <summary>
		/// Converts a String into an array of strings, separated by newline. Removes empty lines.
		/// </summary>
		private String[] GetLines(String pString) {
			String[] result = pString.Split("\n".ToCharArray());
			result = result.Where(s => !String.IsNullOrEmpty(s)).ToArray();
			return result;
		}
	}
}