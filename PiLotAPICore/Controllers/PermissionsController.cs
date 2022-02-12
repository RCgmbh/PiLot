using System;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.Helpers;
using PiLot.Model.Users;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Controller used to get the current user's permissions, in order
	/// to trim the UI accordingly.
	/// </summary>
	[ApiController]
	public class PermissionsController : ControllerBase {

		/// <summary>
		/// Gets a UserInfo object containing the username and the permissions
		/// of the current user. if the current user is null, still an object
		/// will be returned, with username null and the permissions of an
		/// unauthenticated user
		/// </summary>
		/// <returns>A UserInfo object</returns>
		[Route(Program.APIROOT + "[controller]")]
		public UserInfo Get() {
			User currentUser = AuthenticationHelper.Instance.Authenticate(this.HttpContext);
			return new UserInfo(currentUser);
		}

		[Route(Program.APIROOT + "[controller]/ReloadConfig")]
		public String GetReloadConfig() {
			AuthorizationHelper.Instance.ReloadConfig();
			AuthenticationHelper.Instance.ReloadConfig();
			return "OK";
		}
	}

	/// <summary>
	/// Data class used to serialize
	/// </summary>
	public class UserInfo {

		private User user;
		private AuthorizationHelper authorizationHelper;

		public UserInfo(User pUser) {
			this.user = pUser;
			this.authorizationHelper = AuthorizationHelper.Instance;
		}

		[JsonPropertyName("username")]
		public String Username {
			get {
				return this.user?.Username;
			}
		}

		[JsonPropertyName("canRead")]
		public Boolean CanRead {
			get {
				return this.authorizationHelper.UserCanRead(this.user);
			}
		}

		[JsonPropertyName("canWrite")]
		public Boolean CanWrite {
			get {
				return this.authorizationHelper.UserCanWrite(this.user);
			}
		}

		[JsonPropertyName("canChangeSettings")]
		public Boolean CanChangeSettings {
			get {
				return this.authorizationHelper.UserCanChangeSettings(this.user);
			}
		}

		[JsonPropertyName("hasSystemAccess")]
		public Boolean HasSystemAccess {
			get {
				return this.authorizationHelper.UserHasSystemAccess(this.user);
			}
		}
	}
}
