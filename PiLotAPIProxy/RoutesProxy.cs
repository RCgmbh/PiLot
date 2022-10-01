using System;
using System.Text.Json;
using System.Threading.Tasks;

using PiLot.Model.Nav;

namespace PiLot.APIProxy {

	/// <summary>
	/// Proxy class to access the /Routes endpoint
	/// </summary>
	public class RoutesProxy {

		private const String CONTROLLERURL = "/Routes";

		private PiLotHttpClient httpClient;
		private String apiControllerUrl;

		/// <summary>
		/// Creates a new RoutesProxy instance, which can be used to 
		/// read data from and send data to the Routes API
		/// </summary>
		/// <param name="pApiUrl">The API Root url, such as http://localhost/pilotapi/api/v1, without ending /</param>
		/// <param name="pLoginHelper">Pass the one and only LoginHelper within the application, or null</param>
		public RoutesProxy(String pApiUrl, LoginHelper pLoginHelper) {
			this.apiControllerUrl = pApiUrl + CONTROLLERURL;
			this.httpClient = new PiLotHttpClient(pLoginHelper);
		}

		/// <summary>
		/// This takes a Route and saves it to the api.
		/// </summary>
		/// <param name="pRoute">Route to save</param>
		/// <returns>true, if the operation succeeded</returns>
		public async Task<Boolean> PutRouteAsync(Route pRoute) {
			String jsonString = JsonSerializer.Serialize(pRoute);
			return await this.httpClient.PutAsync(jsonString, this.apiControllerUrl);
		}
	}
}
