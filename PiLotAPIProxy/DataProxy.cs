using System;
using System.Text.Json;
using System.Threading.Tasks;

using PiLot.Model.Sensors;

namespace PiLot.APIProxy {

	/// <summary>
	/// Proxy class for easy access to the /Data REST API
	/// </summary>
	public class DataProxy {

		private const String CONTROLLERURL = "/Data";

		private String apiControllerUrl;
		private PiLotHttpClient httpClient;

		/// <summary>
		/// Creates a new DataProxy instance, which can be used to 
		/// send data to the Data API
		/// </summary>
		/// <param name="pApiUrl">The API Root url, such as http://localhost/pilotapi/api/v1, without ending /</param>
		/// <param name="pLoginHelper">Pass the one and only LoginHelper within the application, or null</param>
		public DataProxy(String pApiUrl, LoginHelper pLoginHelper) {
			this.apiControllerUrl = pApiUrl + CONTROLLERURL;
			this.httpClient = new PiLotHttpClient(pLoginHelper);
		}

		/// <summary>
		/// This takes an array of current sensor values and saves them to the api.
		/// </summary>
		/// <param name="data">Array of {sensorName, value} objects</param>
		public async Task<Boolean> PutSensorDataAsync(SensorValue[] pData) {
			String jsonString = JsonSerializer.Serialize(pData);
			return await this.httpClient.PutAsync(jsonString, this.apiControllerUrl);
		}

		/// <summary>
		/// Reads SensorData from the Data api, returning the lates sensor data for
		/// a sensor. The Data must be no older than a certain number of seconds.
		/// </summary>
		/// <param name="pName">The data source name</param>
		/// <param name="pMaxSecondsOld">The maximal age of data to be returned</param>
		/// <returns>a SensorDataRecord or null</returns>
		public async Task<SensorDataRecord> GetLatestValue(String pName, Int32 pMaxSecondsOld) {
			String url = this.apiControllerUrl + $"/{pName}";
			url = UrlHelper.AddParameter(url, "maxSecondsOld", pMaxSecondsOld.ToString());
			ProxyResult<SensorDataRecord> proxyResult = await this.httpClient.GetAsync<SensorDataRecord>(url);
			return proxyResult.Data;
		}

		/// <summary>
		/// Gets the full url of the api controller, e.g. http://pilot/pilotapi/api/v1/Data
		/// </summary>
		public String ApiControllerUrl {
			get { return this.apiControllerUrl; }
		}
	}
}
