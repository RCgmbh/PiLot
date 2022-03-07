using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;

using PiLot.Utils.Logger;
using PiLot.Model.Nav;


namespace PiLot.APIProxy {

	/// <summary>
	/// Proxy class for easy access to the /Position REST API
	/// </summary>
	public class PositionProxy {

		private const String CONTROLLERURL = "/Position";

		private PiLotHttpClient httpClient;
		private String putMultipleUrl, putLocalUrl, getUrl;
		
		/// <summary>
		/// Creates a new PositionProxy instance, which can be used to 
		/// read data from and send data to the Position API
		/// </summary>
		/// <param name="pApiUrl">The API Root url, such as http://localhost/pilotapi/api/v1, without ending /</param>
		/// <param name="pLoginHelper">Pass the one and only LoginHelper within the application, or null</param>
		public PositionProxy(String pApiUrl, LoginHelper pLoginHelper) {
			String apiControllerUrl = pApiUrl + CONTROLLERURL;
			this.putMultipleUrl = apiControllerUrl + "/multiple";
			this.putLocalUrl = apiControllerUrl + "/local";
			this.getUrl = apiControllerUrl;
			this.httpClient = new PiLotHttpClient(pLoginHelper);
		}

		/// <summary>
		/// This takes an array of positions and saves them to the api.
		/// </summary>
		/// <param name="pPositions">Array of GpsRecords</param>
		/// <returns>true, if the operation succeeded</returns>
		public async Task<Boolean> PutPositionsAsync(GpsRecord[] pPositions) {
			String jsonString = JsonSerializer.Serialize(pPositions);
			return await this.httpClient.PutAsync(jsonString, this.putMultipleUrl);
		}

		/// <summary>
		/// This takes one positions and saves it to the api, using the local
		/// option, which will only work when called from the local host, but
		/// does not require any authentication
		/// </summary>
		/// <param name="pPosition">GpsRecord</param>
		/// <returns>true, if the operation succeeded</returns>
		public async Task<Boolean> PutPositionAsync(GpsRecord pPosition) {
			String jsonString = JsonSerializer.Serialize(pPosition);
			return await this.httpClient.PutAsync(jsonString, this.putLocalUrl);
		}

		/// <summary>
		/// Reads PositionData from the Position api, returning the latest positions. This can only
		/// be used for recent data, as the api will only serve data from its cache.
		/// </summary>
		/// <param name="pStartTime">Start time in MS UTC. Only records later than this will be loaded</param>
		/// <returns>Array of GpsRecords, possibly empty but not null</returns>
		public async Task<List<GpsRecord>> GetLatestPositions(Int64 pStartTime) {
			List<GpsRecord> result = new List<GpsRecord>();
			String url = this.getUrl;
			url = UrlHelper.AddParameter(url, "startTime", pStartTime.ToString());
			ProxyResult<List<GpsRecord>> clientResult = await this.httpClient.GetAsync<List<GpsRecord>>(url);
			if (clientResult.Success) {
				result = clientResult.Data;
			}
			return result;
		}
	}
}
