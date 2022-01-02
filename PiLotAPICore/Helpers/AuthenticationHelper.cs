using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Http;

using PiLot.Utils.Logger;
using PiLot.Model.Users;

namespace PiLot.API.Helpers {
	public class AuthenticationHelper {

		private const String USERSFILE = "App_Data/users.json";
		private const String APPKEY = "authenticationHelper";

		public const Double TOKENVALIDHOURS = 2;
		public const String COOKIEKEY = "token";

		private Dictionary<String, User> users = null;
		private Dictionary<String, TokenInfo> tokens = null;

		/// <summary>
		/// Private constructor for singleton
		/// </summary>
		private AuthenticationHelper() {
			this.LoadConfig();
			this.tokens = new Dictionary<String, TokenInfo>();
		}

		/// <summary>
		/// Singleton accessor, gets the current Instance from the
		/// application, or creates a new instance and saves it
		/// to the application
		/// </summary>
		public static AuthenticationHelper Instance {
			get {
				AuthenticationHelper result = null;
				Object applicationItem = Program.GetApplicationObject(APPKEY);
				if (applicationItem != null) {
					result = applicationItem as AuthenticationHelper;
				} else {
					result = new AuthenticationHelper();
					Program.SetApplicationObject(APPKEY, result);
				} 
				return result;
			}
		}

		/// <summary>
		/// This authenticates the user based on the cookie in the current request.
		/// If the cookie is invalid, it returns null.
		/// </summary>
		/// <returns>The current user or null</returns>
		public User Authenticate(HttpRequestMessage pRequest) {
			User result = null;
			String cookieToken = this.GetTokenFromCookie(pRequest);
			String host = pRequest.Headers.Host; //pContext.Request.Headers.Host;// .Host.Host;
			if ((cookieToken != null) && this.tokens.ContainsKey(cookieToken)) {
				TokenInfo token = this.tokens[cookieToken];
				if (token.Validate(host)) {
					result = token.User;
					token.Refresh();
				} else {
					this.tokens.Remove(cookieToken);
				}
			}
			return result;
		}

		/// <summary>
		/// This authenticates the user based on the cookie in the current request.
		/// If the cookie is invalid, it returns null.
		/// </summary>
		/// <returns>The current user or null</returns>
		public User Authenticate(HttpContext pContext) {
			User result = null;
			String cookieToken = this.GetTokenFromCookie(pContext);
			String host = pContext.Request.Host.Host;
			if ((cookieToken != null) && this.tokens.ContainsKey(cookieToken)) {
				TokenInfo token = this.tokens[cookieToken];
				if (token.Validate(host)) {
					result = token.User;
					token.Refresh();
				} else {
					this.tokens.Remove(cookieToken);
				}
			}
			return result;
		}

		/// <summary>
		/// This checks a username and password agains the user base. If the credentials
		/// are valid, it generates a new token and saves it to the tokens dictionary,
		/// sets the auth cookie and returns the token. If the credentials are invalid,
		/// it returns null.
		/// </summary>
		/// <param name="pUsername">The username entered by the user</param>
		/// <param name="pPassword">The password entered by the user</param>
		public String Login(String pUsername, String pPassword, HttpContext pContext) {
			String token = null;
			Boolean isValid = this.users.TryGetValue(pUsername, out User user);
			isValid = isValid && user.Pwd == pPassword;
			if (isValid) {
				token = Guid.NewGuid().ToString();
				this.tokens.Add(token, new TokenInfo(user, pContext.Request.Host.Host));
				CookieOptions cookieOptions = new CookieOptions();
				cookieOptions.Expires = DateTime.UtcNow.AddYears(1);
				pContext.Response.Cookies.Append(AuthenticationHelper.COOKIEKEY, token, cookieOptions);
			}
			return token;
		}

		/// <summary>
		/// removes the token from the dictionary and clears the cookie, resulting
		/// in a logut of the current user
		/// </summary>
		public void Logout(HttpContext pContext) {
			String cookieToken = this.GetTokenFromCookie(pContext);
			if (cookieToken != null) {
				this.tokens.Remove(cookieToken);
			}
			CookieOptions cookieOptions = new CookieOptions();
			cookieOptions.Expires = new DateTime(1970, 1, 1);
			pContext.Response.Cookies.Append(AuthenticationHelper.COOKIEKEY, String.Empty, cookieOptions);
		}

		/// <summary>
		/// Reloads the config from file
		/// </summary>
		public void ReloadConfig() {
			this.users = null;
			this.tokens = new Dictionary<String, TokenInfo>();
			this.LoadConfig();
		}

		/// <summary>
		/// Gets the token from cookie provided the request message
		/// </summary>
		/// <returns>The token or null</returns>
		private String GetTokenFromCookie(HttpRequestMessage pRequest) {
			String result = null;
			/*CookieHeaderValue cookie = pRequest.Headers.GetCookies(AuthenticationHelper.COOKIEKEY).FirstOrDefault();
			if (cookie != null) {
				result = cookie[AuthenticationHelper.COOKIEKEY].Value;
			}*/
			return result;
		}

		/// <summary>
		/// Gets the token from cookie of a context
		/// </summary>
		/// <returns>The token or null</returns>
		private String GetTokenFromCookie(HttpContext pContext) {
			String result = null;
			KeyValuePair<String, String>? cookie = pContext.Request.Cookies.FirstOrDefault(i => i.Key == AuthenticationHelper.COOKIEKEY);
			if (cookie != null) {
				result = cookie.Value.Value;
			}
			return result;
		}

		/// <summary>
		/// This loads the config from file and deserializes the user objects, 
		/// resulting in a dictionary of users
		/// </summary>
		private void LoadConfig() {
			List<User> userInfos = null;
			this.users = new Dictionary<String, User>();
			//String usersConfigFile = ConfigurationManager.AppSettings["usersConfigFile"];
			String usersConfigFile = Path.Combine(AppContext.BaseDirectory, USERSFILE);
			if (File.Exists(usersConfigFile)) {
				try {
					String fileContent = null;
					fileContent = File.ReadAllText(usersConfigFile);
					userInfos = JsonSerializer.Deserialize<List<User>>(fileContent);
				} catch (Exception ex) {
					Logger.Log("Error reading users: {0}", ex.Message, LogLevels.ERROR);
					throw;
				}
			}
			if (userInfos != null) {
				AuthorizationHelper authorizationHelper = AuthorizationHelper.Instance;
				foreach (User aUser in userInfos) {
					if (!this.users.ContainsKey(aUser.Username)) {
						aUser.Role = authorizationHelper.GetRole(aUser.RoleName);
						this.users.Add(aUser.Username, aUser);
					} else {
						Logger.Log($"Duplicate Username found: {aUser.Username}. User will not be available", LogLevels.WARNING);
					}
				}
			}
		}

		public class TokenInfo {

			public TokenInfo(User pUser, String pHost) {
				this.User = pUser;
				this.Host = pHost;
				this.Refresh();
			}

			public User User { get; set; }

			public String Host { get; set; }

			public DateTime ValidUntil { get; set; }

			/// <summary>
			/// Returns true, if the token is still valid, and the host stored
			/// with the token equels pHost
			/// </summary>
			/// <param name="pHost">The hostname of the current request</param>
			public Boolean Validate(String pHost) {
				return ((pHost == this.Host) && (this.ValidUntil >= DateTime.UtcNow));
			}

			/// <summary>
			/// Sets the validUntil to now + token valid seconds
			/// </summary>
			public void Refresh() {
				this.ValidUntil = DateTime.UtcNow.AddHours(AuthenticationHelper.TOKENVALIDHOURS);
			}
		}

	}
}
