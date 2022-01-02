using System;
using System.Collections.Generic;
using System.Web;

namespace PiLot.APIProxy {

	/// <summary>
	/// Helper class offering common functionality for api usage
	/// </summary>
	public class UrlHelper {

		/// <summary>
		/// Adds querystring parameters to an url, not expecting the url to have any querystring yet.
		/// </summary>
		/// <param name="pUrl">The base url without any get parameters</param>
		/// <param name="pParameters">The get parameters to add</param>
		/// <returns>The full url with query string</returns>
		public static String AddParameters(String pUrl, Dictionary<String, String> pParameters) {
			var query = HttpUtility.ParseQueryString(string.Empty);
			var uriBuilder = new UriBuilder(pUrl);
			foreach(KeyValuePair<String, String> aParameter in pParameters) {
				query[aParameter.Key] = aParameter.Value;
			}
			uriBuilder.Port = -1;
			uriBuilder.Query = query.ToString();
			return uriBuilder.ToString();
		}

		/// <summary>
		/// Adds a single get parameter to an url
		/// </summary>
		/// <param name="pUrl">the base url, without query string</param>
		/// <param name="pKey">the key to add</param>
		/// <param name="pValue">the value to add</param>
		/// <returns>The full url including query string</returns>
		public static String AddParameter(String pUrl, String pKey, String pValue) {
			Dictionary<String, String> parameters = new Dictionary<String, String>() {
				{pKey, pValue }
			};
			return UrlHelper.AddParameters(pUrl, parameters);
		}
	}
}
