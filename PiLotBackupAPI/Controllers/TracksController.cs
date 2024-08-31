using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using PiLot.Backup.API.ActionFilters;
using PiLot.Backup.API.Helpers;
using PiLot.Model.Nav;
using PiLot.Model.Users;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;

namespace PiLot.Backup.API.Controllers {

	[ApiController]
	public class TracksController : ControllerBase {

		/// <summary>
		/// Accepts puts with a track and saves the data to the backup folder. If the folder does 
		/// not exist yet, it will be created and be pre-populated with the latest backup data.
		/// </summary>
		/// <param name="track">A Track</param>
		/// <param name="backupTime">The unix timestamp for the backup set to create/use</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(BackupAuthorizationFilter))]
		public ActionResult Put(Track track, Int32 backupTime) {
			ActionResult result;
			Object userObj = this.HttpContext.Items["user"];
			if(userObj != null) {
				User user = (User)userObj;
				try {
					DateTime time = DateTimeHelper.FromUnixTime(backupTime);
					BackupHelper.BackupTrack(track, user.Username, time);
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
