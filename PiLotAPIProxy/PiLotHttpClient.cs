using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

using PiLot.Utils.Logger;

namespace PiLot.APIProxy {

	/// <summary>
	/// This is a wrapper for the HttpClient, injecting the auth
	/// cookie for each request, and handling unauthenticated 
	/// responses by re-authenticating
	/// </summary>
	public class PiLotHttpClient {

		private HttpClient httpClient;
		private LoginHelper loginHelper;

		/// <summary>
		/// Default constructor. We want to make sure we have one single
		/// login helper throughout the application, not mixing up different tokens.
		/// It can be null, which will result in not injecting any authentication
		/// info
		/// </summary>
		/// <param name="pLoginHelper">A login helper, or null</param>
		public PiLotHttpClient(LoginHelper pLoginHelper) {
			this.loginHelper = pLoginHelper;
			HttpClientHandler handler = new HttpClientHandler();
			handler.UseCookies = false;     // we have to set this to false, in order to later set cookies on a per-request basis
			this.httpClient = new HttpClient(handler);
			this.httpClient.Timeout = new TimeSpan(0, 5, 0); // 5 minutes
		}

		/// <summary>
		/// This reads data from an api endpoint, and handles the Deserialization into a certain type. It
		/// will return a ProxyResult object with the resulting data, a Success flag and in the case of
		/// failure (be it a problem with the request or with the deserialization), information about the
		/// problem in the Message attribute
		/// </summary>
		/// <typeparam name="T">The expected result type</typeparam>
		/// <param name="pUrl">The API endpoint URL</param>
		/// <returns>A ProxyResult object of the given type</returns>
		public async Task<ProxyResult<T>> GetAsync<T>(String pUrl) {
			ProxyResult<T> result = new ProxyResult<T>();
			ProxyResult<String> stringResult = await this.GetAsync(pUrl, false);
			Logger.Log($"PiLotHttpClient.GetAsync<T>: Recieved Data: {stringResult.Data}, url: {pUrl}", LogLevels.DEBUG);
			if (stringResult.Success) {
				result.Success = true;
				if (stringResult.MediaType == "application/json" && !String.IsNullOrEmpty(stringResult.Data) && stringResult.Data != "null") {
					try {
						result.Data = JsonSerializer.Deserialize<T>(stringResult.Data);
					} catch (Exception ex) {
						result.Success = false;
						result.Message = ex.Message;
						Logger.Log($"PiLotHttpClient.GetAsync<T>: Error deserializing Data: {stringResult.Data}, error: {ex.Message}", LogLevels.ERROR);
					}
				} else {
					result.Message = stringResult.Data;
				}
			} else {
				result.Success = false;
				result.Message = stringResult.Message;
			}
			return result;
		}

		/// <summary>
		/// Puts jsonized data to a certain url. If Authentication fails, it will call itself
		/// again, this time forcing authentication. If that fails again, we give up
		/// </summary>
		/// <param name="pJson">The json serialized data</param>
		/// <param name="pUrl">The fully qualified url of the rest endpoint</param>
		/// <returns>true, if the operation succeeded</returns>
		public async Task<Boolean> PutAsync(String pJson, String pUrl) {
			Logger.Log($"Putting Data to {pUrl}: {pJson}", LogLevels.DEBUG);
			HttpContent content = new StringContent(pJson, Encoding.UTF8, "application/json");
			return await this.PutAsync(content, pUrl, false);
		}

		/// <summary>
		/// Puts binary data to a certain url. If Authentication fails, it will call itself
		/// again, this time forcing authentication. If that fails again, we give up
		/// </summary>
		/// <param name="pBytes">The bytes to send</param>
		/// <param name="pUrl">The fully qualified url of the rest endpoint</param>
		/// <returns>true, if the operation succeeded</returns>
		public async Task<Boolean> PutAsync(Byte[] pBytes, String pUrl) {
			Logger.Log($"Putting Data to {pUrl}: Byte[{pBytes.Length}]", LogLevels.DEBUG);
			HttpContent content = new ByteArrayContent(pBytes);
			return await this.PutAsync(content, pUrl, false);
		}

		/// <summary>
		/// This does the actual Job for the public GetAsync. It will call itself
		/// once with pForceAuthenticatio = true, if at first it fails
		/// </summary>
		/// <param name="pUrl">The API url</param>
		/// <returns>The result as string (json serialized)</returns>
		private async Task<ProxyResult<String>> GetAsync(String pUrl, Boolean pForceAuthentication) {
			ProxyResult<String> result = new ProxyResult<String>();
			Logger.Log($"Reading Data from {pUrl}", LogLevels.DEBUG);
			try {
				HttpRequestMessage message = new HttpRequestMessage(HttpMethod.Get, pUrl);
				if (this.loginHelper != null) {
					if (pForceAuthentication) {
						this.loginHelper.InvalidateToken();
					}
					await this.loginHelper?.AddCookieAsync(message.Headers);
				}
				HttpResponseMessage response = await this.httpClient.SendAsync(message);
				Logger.Log($"Response recieved from {pUrl}. StatusCode: {response.StatusCode}, Content: {response.Content}", LogLevels.DEBUG);
				if (response.IsSuccessStatusCode) {
					result.Data = await response.Content.ReadAsStringAsync();
					result.Success = true;
					result.MediaType = response.Content.Headers?.ContentType?.MediaType;
					Logger.Log($"Done reading data. Response: {result.Data}", LogLevels.DEBUG);
				} else if (
					   ((response.StatusCode == HttpStatusCode.Unauthorized) || (response.StatusCode == HttpStatusCode.Forbidden))
					&& !pForceAuthentication
					&& (this.loginHelper != null)
				) {
					result = await this.GetAsync(pUrl, true);
				} else {
					result.Message = await response.Content.ReadAsStringAsync();
					result.Success = false;
					Logger.Log($"Error reading data from {pUrl}: Status Code: {response.StatusCode}, Response Message: {result.Message}", LogLevels.ERROR);
				}
			} catch (Exception ex) {
				result.Message = ex.Message;
				result.Success = false;
				Logger.Log(ex, pUrl);
			}
			return result;
		}

		/// <summary>
		/// This does the actual job for the public PutAsync. It will call itself
		/// once with pForceAuthentication = true, if at first it fails.
		/// </summary>
		/// <param name="pContent">The HttpContent, e.g. StringContent, MultipartFormDataContent</param>
		/// <param name="pUrl">The fully qualified url of the rest endpoint</param>
		/// <param name="pForceAuthentication">If true, a re-authentication will be forced. Only use this, if the request fails with access denied</param>
		/// <returns>true, if the operation succeeded</returns>
		private async Task<Boolean> PutAsync(HttpContent pContent, String pUrl, Boolean pForceAuthentication) {
			Boolean result = false;
			try {
				if (this.loginHelper != null) {
					if (pForceAuthentication) {
						this.loginHelper.InvalidateToken();
					}
					await this.loginHelper?.AddCookieAsync(pContent.Headers);
				}
				HttpResponseMessage response = await this.httpClient.PutAsync(pUrl, pContent);
				if (response.IsSuccessStatusCode) {
					result = true;
					Logger.Log($"Successfully put data to {pUrl}", LogLevels.DEBUG);
				} else if (
					   ((response.StatusCode == HttpStatusCode.Unauthorized) || (response.StatusCode == HttpStatusCode.Forbidden))
					&& !pForceAuthentication
					&& (this.loginHelper != null)
				) {
					result = await this.PutAsync(pContent, pUrl, true);
				} else {
					String responseMessage = response.Content.ReadAsStringAsync().Result;
					Logger.Log($"Error putting data to {pUrl}: Status Code: {response.StatusCode}, Response Message: {responseMessage}", LogLevels.ERROR);
				}
			} catch (Exception ex) {
				Logger.Log(ex, pUrl);
			}
			return result;
		}
	}
}
