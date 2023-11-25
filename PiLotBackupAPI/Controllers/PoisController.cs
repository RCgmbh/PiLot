using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using PiLot.Backup.API.ActionFilters;
using PiLot.Backup.API.Helpers;
using PiLot.Model.Nav;
using PiLot.Model.Users;
using PiLot.Utils.DateAndTime;

namespace PiLot.Backup.API.Controllers {

	[ApiController]
	public class PoisController : ControllerBase {

		/// <summary>
		/// Accepts puts with the list of all pois, which will be all saved into one single file
		/// </summary>
		/// <param name="pois">The list of pois</param>
		/// <param name="backupTime">The unix timestamp for the backup set to create/use</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(BackupAuthorizationFilter))]
		public ActionResult Put(List<Poi> pois, Int32 backupTime) {
			ActionResult result;
			Object userObj = this.HttpContext.Items["user"];
			if(userObj != null) {
				User user = (User)userObj;
				try {
					BackupHelper.BackupPois(pois, user.Username, DateTimeHelper.FromUnixTime(backupTime));
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
