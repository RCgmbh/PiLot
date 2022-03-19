using System;
using System.Text.Json.Serialization;

namespace PiLot.Utils.OS {

    /// <summary>
    /// Represents the information about one WiFi network
    /// </summary>
    public class WiFiInfo {

        /// <summary>
        /// Creates an instance of a known network. IsAvailable is set to
        /// true only if this is connected, so it should be set afterwards
        /// </summary>
        public WiFiInfo(String pSSID, Int32 pNumber, Boolean pIsConnected){
            this.SSID = pSSID;
            this.IsKnown = true;
            this.IsAvailable = pIsConnected;
            this.Number = pNumber;
            this.IsConnected = pIsConnected;
        }

        /// <summary>
        /// Creates an instance of an unknown network
        /// </summary>
        public WiFiInfo(String pSSID){
            this.SSID = pSSID;
            this.IsKnown = false;
            this.IsAvailable = true;
        }

        /// <summary>
        /// The network name
        /// </summary>
        [JsonPropertyName("ssid")]
        public String SSID {
            get; set;
        }

        /// <summary>
        /// True, if the network has already been added
        /// </summary>
        [JsonPropertyName("isKnown")]
        public Boolean IsKnown{
            get; set;
        }

        /// <summary>
        /// True, if the network was found with the last scan
        /// </summary>
        [JsonPropertyName("isAvailable")]
        public Boolean IsAvailable{
            get; set;
        }

        /// <summary>
        /// The network number, for known networks, else null
        /// </summary>
        [JsonPropertyName("number")]
        public Int32? Number{
            get; set;
        }

        /// <summary>
        /// True, if the network is the currently connected network
        /// </summary>
        [JsonPropertyName("isConnected")]
        public Boolean IsConnected{
            get; set;
        }

        /// <summary>
        /// For available networks, represents the signal level (0
        /// is 100%, less is less), null for unavailable.
        /// </summary>
        [JsonPropertyName("signalStrength")]
        public Int32? SignalStrength{
            get; set;
        }
    }
}