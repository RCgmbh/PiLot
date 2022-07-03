using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PiLot.Backup.API.Helpers;
using PiLot.Model.Users;

namespace PiLot.Backup.API.Controllers {

	/// <summary>
	/// Controller offering simple login/logout functionality
	/// </summary>
	[ApiController]
	public class AuthenticationController : ControllerBase {
		/// <summary>
		/// Tries to log in, sending username and password. Upon successful login,
		/// an auth cookie is created and added to the header, and the token ist
		/// sent as result (mainly for debugging purposes)
		/// </summary>
		/// <returns>the token or http 401</returns>
		[Route(Program.APIROOT + "[controller]/login")]
		[HttpGet]
		public ActionResult GetLogin(String username, String password) {
			String token = AuthenticationHelper.Instance.Login(username, password, this.HttpContext);
			if (token != null) {
				return this.Ok(token);
			} else {
				return this.StatusCode(StatusCodes.Status401Unauthorized);
			}
		}

		/// <summary>
		/// Tries to log in, posting username and password. Upon successful login,
		/// an auth cookie is created and added to the header, and the token ist
		/// sent as result (mainly for debugging purposes)
		/// </summary>
		/// <param name="credentials">A credentials object containing username and password</param>
		/// <returns>the token or http 401</returns>
		[Route(Program.APIROOT + "[controller]/login")]
		[HttpPost]
		public ActionResult PostLogin(Credentials credentials) {
			String token = AuthenticationHelper.Instance.Login(credentials.Username, credentials.Password, this.HttpContext);
			if (token != null) {
				return this.Ok(token);
			} else {
				return this.StatusCode(StatusCodes.Status401Unauthorized);
			}
		}

		[Route(Program.APIROOT + "[controller]/logout")]
		[HttpPost]
		public ActionResult PostLogout() {
			AuthenticationHelper.Instance.Logout(this.HttpContext);
			return this.Ok("bye");
		}

	}
}
