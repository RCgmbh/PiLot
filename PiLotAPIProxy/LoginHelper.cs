using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

using PiLot.Model.Users;
using PiLot.Utils;
using PiLot.Utils.Logger;

namespace PiLot.APIProxy {
	
	/// <summary>
	/// Helper which handles the login process and token
	/// </summary>
	public class LoginHelper {

		private const String CONTROLLERURL = "/Authentication";

		private String token = null;
		private String username, password;
		private HttpClient httpClient;
		private String apiControllerUrl;
		private Boolean isAuthenticating = false;

		public LoginHelper(String pApiUrl, String pUsername, String pPassword) {
			Assert.IsNotNull(pUsername);
			Assert.IsNotNull(pPassword);
			this.apiControllerUrl = pApiUrl + CONTROLLERURL;
			this.username = pUsername;
			this.password = pPassword;
			this.httpClient = new HttpClient();
			this.httpClient.Timeout = new TimeSpan(0, 1, 0); // 1 minute
		}

		/// <summary>
		/// Gets the current token, if we have one and pForceAuthentication
		/// is false. Else, it will try to get one using the /Login api. If
		/// this fails, it wil just return null, and write a warning to the log.
		/// </summary>
		/// <param name="pForceAuthentication">If true, any current token will be dismissed</param>
		/// <returns>A possibly valid token or null</returns>
		public async Task<String> GetToken(Boolean pForceAuthentication) {
			if (pForceAuthentication || String.IsNullOrEmpty(this.token)) {
				await this.AuthenticateAsync();
			}
			return this.token;
		}

		/// <summary>
		/// This sets the token to null, enforcing an authentication next time the toke
		/// is requested
		/// </summary>
		public void InvalidateToken() {
			this.token = null;
		}

		/// <summary>
		/// This calls the login service and saves the token to this.token. It makes sure
		/// that only one login attempt is done at any given time.
		/// </summary>
		private async Task AuthenticateAsync() {
			String jsonString = JsonSerializer.Serialize(new Credentials(this.username, this.password));
			HttpContent content = new StringContent(jsonString, Encoding.UTF8, "application/json");
			String url = this.apiControllerUrl + "/login";
			Logger.Log($"trying to log in at {url} with username {this.username}", LogLevels.DEBUG);
			while (this.isAuthenticating) {
				Thread.Sleep(100);
			}
			this.isAuthenticating = true;
			try {
				HttpResponseMessage response = await this.httpClient.PostAsync(url, content);
				String responseString = String.Empty;
				if (response.IsSuccessStatusCode) {
					try {
						responseString = await response.Content.ReadAsStringAsync();
						Logger.Log($"Response from login: {responseString}", LogLevels.DEBUG);
						this.token = responseString;
					} catch (Exception ex) {
						Logger.Log($"Error processing data. Url: {url}, data: {responseString}, error: {ex.Message}", LogLevels.ERROR);
						throw;
					}
				} else if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized) {
					Logger.Log($"Login failed for url {url}, username: {username}", LogLevels.WARNING);
				} else {
					responseString = response.Content.ReadAsStringAsync().Result;
					Logger.Log($"Error when trying to authenticate against {url}: Status Code: {response.StatusCode}, Response Message: {responseString}", LogLevels.ERROR);
				}
			} finally {
				this.isAuthenticating = false;
			}
		}

		/// <summary>
		/// Adds a cookie to the headers, if we successfully get a token
		/// </summary>
		/// <param name="pHeaders">The headers of the current request message</param>
		public async Task AddCookieAsync(HttpHeaders pHeaders) {
			String token = await this.GetToken(false);
			if (!String.IsNullOrEmpty(token)) {
				pHeaders.Add("Cookie", $"token={this.token}");
			}
		}
	}
}
