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
	public class TrackController : ControllerBase {

		/// <summary>
		/// Accepts puts with the track of a day and saves the data to the backup folder. If the 
		/// folder does not exist yet, it will be created and be pre-populated with the latest backup data.
		/// </summary>
		/// <param name="track">The list of gps records to back up</param>
		/// <param name="backupTime">The unix timestamp for the backup set to create/use</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(BackupAuthorizationFilter))]
		public ActionResult Put(List<GpsRecord> track, Int32 day, Int32 backupTime) {
			ActionResult result;
			Object userObj = this.HttpContext.Items["user"];
			if(userObj != null) {
				User user = (User)userObj;
				try {
					DateTime time = DateTimeHelper.FromUnixTime(backupTime);
					Date trackDay = new Date(DateTimeHelper.FromUnixTime(day));
					BackupHelper.BackupGpsData(track, trackDay, user.Username, time);
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
