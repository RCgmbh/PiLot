using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using PiLot.Backup.API.ActionFilters;
using PiLot.Backup.API.Helpers;
using PiLot.Model.Tools;
using PiLot.Model.Users;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;

namespace PiLot.Backup.API.Controllers {

	[ApiController]
	public class ChecklistsController : ControllerBase {

		/// <summary>
		/// Accepts puts with the list of all checklists, which will be all saved into one single file
		/// </summary>
		/// <param name="pois">The list of checklists</param>
		/// <param name="backupTime">The unix timestamp for the backup set to create/use</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(BackupAuthorizationFilter))]
		public ActionResult Put(List<Checklist> checklists, Int32 backupTime) {
			ActionResult result;
			Object userObj = this.HttpContext.Items["user"];
			if(userObj != null) {
				User user = (User)userObj;
				try {
					BackupHelper.BackupChecklists(checklists, user.Username, DateTimeHelper.FromUnixTime(backupTime));
					result = this.Ok();
				} catch (Exception ex) {
					result = this.StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
					Logger.Log(ex, this.HttpContext.Request.Path.ToString());
				}
			} else {
				result = this.Unauthorized();
			}
			return result;
		}
	}
}
