using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PiLot.Utils.OS {

	/// <summary>
	/// Helper for interacting with wpa_cli, allowing to list and connect to 
    /// wireless networks.
	/// </summary>
	public class WiFiHelper {

		private const String GETINTERFACESCMD = "wpa_cli interface";
		private const String SETINTERFACECMD = "wpa_cli interface {0}";
		private const String LISTKNOWNNETWORKSCMD = "wpa_cli list_networks";
        private const String SCANCMD = "wpa_cli scan";
		private const String LISTSCANRESULTSCMD = "wpa_cli scan_result";
        private const String ADDNETWORKCMD = "wpa_cli add_network";
        private const String SETSSIDCMD = "wpa_cli set_network {0} ssid '\"{1}\"'"; // ssid to HEX, if not with '" "'!
        private const String SETPWDCMD = "wpa_cli set_network {0} psk '\"{1}\"'";
		private const String SELECTNETWORKCMD = "wpa_cli set_network {0}";
        
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
        /// populates a list of known networks
        /// </summary>
        private List<WiFiInfo> ReadKnownNetworks(){
            List<WiFiInfo> result = new List<WiFiInfo>();
            String cmdResult = this.systemHelper.CallCommand("sudo", LISTKNOWNNETWORKSCMD);
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
            this.systemHelper.CallCommand("sudo", SCANCMD);
            await Task.Delay(pWaitSeconds * 1000);
            String cmdResult = this.systemHelper.CallCommand("sudo", LISTSCANRESULTSCMD);
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
	}
}