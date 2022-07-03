using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using PiLot.Backup.API.ActionFilters;
using PiLot.Backup.API.Helpers;
using PiLot.Model.Logbook;
using PiLot.Model.Users;
using PiLot.Utils.DateAndTime;

namespace PiLot.Backup.API.Controllers {

	[ApiController]
	public class LogbookController : ControllerBase {

		/// <summary>
		/// Accepts puts, which contains a LogbookDay object, and
		/// saves the data to the backup folder. If the folder does not exist yet,
		/// it will be created and be pre-populated with the latest backup data.
		/// </summary>
		/// <param name="logbookDay">The LogbookDay to save</param>
		/// <param name="backupTime">The unix timestamp for the backup set to create/use</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(BackupAuthorizationFilter))]
		public ActionResult Put(LogbookDay logbookDay, Int32 backupTime) {
			ActionResult result;
			Object userObj = this.HttpContext.Items["user"];
			if(userObj != null) {
				User user = (User)userObj;
				try {
					BackupHelper.BackupLogbookData(logbookDay, user.Username, DateTimeHelper.FromUnixTime(backupTime));
					result = this.Ok();
				} catch (Exception ex) {
					result = this.StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
				}
			} else {
				result = this.NotFound();
			}
			return result;
		}
	}
}
