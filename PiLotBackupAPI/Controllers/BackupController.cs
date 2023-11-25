using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PiLot.Backup.API.ActionFilters;
using PiLot.Backup.API.Helpers;
using PiLot.Model.Users;
using PiLot.Utils.DateAndTime;

namespace PiLot.Backup.API.Controllers {

	/// <summary>
	/// The controller for general backup operations
	/// </summary>
	[ApiController]
	public class BackupController : ControllerBase {

		/// <summary>
		/// This calls the commit, which will persist the temporary data
		/// of the newly created backup set, and clean up older backups
		/// </summary>
		/// <param name="backupTime">The timestamp of the backup set</param>
		[Route(Program.APIROOT + "[controller]/commit")]
		[HttpPut]
		[ServiceFilter(typeof(BackupAuthorizationFilter))]
		public ActionResult PutCommit([FromQuery] Int32 backupTime) {
			ActionResult result;
			Object userObj = this.HttpContext.Items["user"];
			if (userObj != null) {
				User user = (User)userObj;
				try {
					BackupHelper.CommitBackup(user.Username, DateTimeHelper.FromUnixTime(backupTime));
					result = this.Ok();
				} catch (Exception ex) {
					result = this.StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
				}
			} else {
				result = this.Unauthorized();
			}
			return result;
		}
	}
}
