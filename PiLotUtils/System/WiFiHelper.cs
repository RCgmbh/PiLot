using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PiLot.Utils.OS {

	/// <summary>
	/// Helper for interacting with wpa_cli, allowing to list and connect to 
	/// wireless networks.
	/// </summary>
	public class WiFiHelper {

        private SystemHelper systemHelper;

        public WiFiHelper(){
            this.systemHelper = new SystemHelper();
        }

        /// <summary>
        /// Return the list of all networks, those available and those
        /// known but currently not available
        /// </summary>
		public async Task<List<WiFiInfo>> GetNetworksAsync(){
			List<WiFiInfo> result = this.ReadKnownNetworks();
            result = await this.SearchNetworksAsync(5, result);
            return result;
        }

        /// <summary>
        /// Adds a new network with SSID and passphrase and selects it. Returns the results of the
        /// involved commands.
        /// </summary>
        public String AddNetwork(String pSSID, String pPassphrase){
            List<String> cmdResults = new List<String>();
            Int32 networkNumber;
            String[] addResult = this.systemHelper.CallCommand("sudo", "wpa_cli add_network").Split("\n".ToCharArray());
            if( (addResult.Length > 1) && Int32.TryParse(addResult[1] , out networkNumber)){
                cmdResults.Add(this.systemHelper.CallCommand("sudo", $"wpa_cli set_network {networkNumber} ssid \"{this.StringToHex(pSSID)}\""));
                String hexPassphrase = this.GetHexPassphrase(pSSID, pPassphrase);
                cmdResults.Add(this.systemHelper.CallCommand("sudo", $"wpa_cli set_network {networkNumber} psk \"{hexPassphrase}\""));
				cmdResults.Add(this.SelectNetwork(networkNumber));
				// todo: save config
            } else{
                cmdResults.Add($"Unexpected result for Add netowrk: {addResult}");
            }
            return String.Join("\n", cmdResults);
        }

        /// <summary>
        /// Selects the network identified by pNumber
        /// </summary>
        public String SelectNetwork(Int32 pNumber){
            String cmdResult = this.systemHelper.CallCommand("sudo", $"wpa_cli select_network {pNumber}");
            return cmdResult;
        }

        /// <summary>
        /// Removes the network identified by pNumber
        /// </summary>
        public String RemoveNetwork(Int32 pNumber){
            String cmdResult = this.systemHelper.CallCommand("sudo", $"wpa_cli remove_network {pNumber}");
            return cmdResult;
        }

        /// <summary>
        /// Gets the current WiFi status
        /// </summary>
        public String GetStatus(){
            String cmdResult = this.systemHelper.CallCommand("sudo", $"wpa_cli status");
            return cmdResult;
        }

        /// <summary>
        /// populates a list of known networks
        /// </summary>
        private List<WiFiInfo> ReadKnownNetworks(){
            List<WiFiInfo> result = new List<WiFiInfo>();
            String cmdResult = this.systemHelper.CallCommand("sudo", "wpa_cli list_networks");
            String[] lines = cmdResult.Split("\n".ToCharArray());
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
        private async Task<List<WiFiInfo>> SearchNetworksAsync(Int32 pWaitSeconds, List<WiFiInfo> pKnownNetworks){
            List<WiFiInfo> result = pKnownNetworks;
            this.systemHelper.CallCommand("sudo", "wpa_cli scan");
            await Task.Delay(pWaitSeconds * 1000);
            String cmdResult = this.systemHelper.CallCommand("sudo", "wpa_cli scan_result");
            String[] lines = cmdResult.Split("\n".ToCharArray());
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
            String[] lines = cmdResult.Split("\n".ToCharArray());
            if((lines.Length > 4) && (lines[3].IndexOf("=") > 0)){
                result = lines[3].Substring(lines[3].IndexOf("=") + 1).Trim();
            }
            return result;
        }
	}
}