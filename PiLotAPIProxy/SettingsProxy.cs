using System;
using System.Threading.Tasks;

namespace PiLot.APIProxy {

	/// <summary>
	/// Proxy class to access the /Settings endpoint
	/// </summary>
	public class SettingsProxy {

		private const String CONTROLLERURL = "/Settings";

		private PiLotHttpClient httpClient;
		private String apiControllerUrl;

		/// <summary>
		/// Creates a new SettingsProxy instance, which can be used to 
		/// read data from and send data to the Settings API
		/// </summary>
		/// <param name="pApiUrl">The API Root url, such as http://localhost/pilotapi/api/v1, without ending /</param>
		/// <param name="pLoginHelper">Pass the one and only LoginHelper within the application, or null</param>
		public SettingsProxy(String pApiUrl, LoginHelper pLoginHelper) {
			this.apiControllerUrl = pApiUrl + CONTROLLERURL;
			this.httpClient = new PiLotHttpClient(pLoginHelper);
		}

		/// <summary>
		/// Selects the current route
		/// </summary>
		/// <param name="pRouteId">The id of the current route</param>
		/// <returns>true, if the operation succeeded</returns>
		public async Task<Boolean> SelectRoute(Int32? pRouteId) {
			String url = $"{this.apiControllerUrl}/activeRouteId?routeId={pRouteId}";
			return await this.httpClient.PutAsync(String.Empty, url);
		}

		/// <summary>
		/// Selects the current boat config
		/// </summary>
		/// <param name="pName">The name of the current boat config</param>
		/// <returns>true, if the operation succeeded</returns>
		public async Task<Boolean> SelectBoatConfig(String pName) {
			String url = $"{this.apiControllerUrl}/currentBoatConfigName?name={pName}";
			return await this.httpClient.PutAsync(String.Empty, url);
		}
	}
}
