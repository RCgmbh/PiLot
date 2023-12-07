using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using PiLot.Backup.API.ActionFilters;
using PiLot.Backup.API.Helpers;
using PiLot.Model.Common;
using PiLot.Model.Users;
using PiLot.Utils.DateAndTime;

namespace PiLot.Backup.API.Controllers {

	/// <summary>
	/// The controller for general backup operations
	/// </summary>
	[ApiController]
	public class BackupController : ControllerBase {

		/// <summary>
		/// This prepares a backup set. It must be called before
		/// adding data.
		/// </summary>
		/// <param name="backupTime">The timestamp of the backup set</param>
		/// <param name="fullBackup">True for full backup, no data will be copied from the previous backup</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(BackupAuthorizationFilter))]
		public ActionResult PutCreate([FromQuery] Int32 backupTime, Boolean fullBackup) {
			ActionResult result;
			Object userObj = this.HttpContext.Items["user"];
			if (userObj != null) {
				User user = (User)userObj;
				try {
					BackupHelper.PrepareBackup(user.Username, DateTimeHelper.FromUnixTime(backupTime), fullBackup);
					result = this.Ok();
				} catch (Exception ex) {
					result = this.StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
				}
			} else {
				result = this.Unauthorized();
			}
			return result;
		}

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

		[Route(Program.APIROOT + "[controller]/summary")]
		[HttpPost]
		[ServiceFilter(typeof(BackupAuthorizationFilter))]
		public ActionResult GetDataSummary(List<DataSource> dataSources, Int32 backupTime) {
			List<Int32> result = null;
			Object userObj = this.HttpContext.Items["user"];
			if (userObj != null) {
				User user = (User)userObj;
				result = BackupHelper.GetDataSummary(dataSources, user.Username, DateTimeHelper.FromUnixTime(backupTime));
				return this.Ok(result);
			} else {
				return this.Unauthorized();
			}			
		}
	}
}
