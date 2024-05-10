using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using PiLot.Backup.API.ActionFilters;
using PiLot.Backup.API.Helpers;
using PiLot.Model.Sensors;
using PiLot.Model.Users;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;

namespace PiLot.Backup.API.Controllers {

	[ApiController]
	public class DataController : ControllerBase {

		/// <summary>
		/// Accepts puts with sensor data and saves the data to the backup folder. If the 
		/// folder does not exist yet, it will be created and be pre-populated with the
		/// latest backup data.
		/// </summary>
		/// <param name="values">The sensor values</param>
		/// <param name="sensorName">The name of the sensor, defining the directory name</param>
		/// <param name="backupTime">The unix timestamp for the backup set to create/use</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(BackupAuthorizationFilter))]
		public ActionResult Put(SensorDataRecord[] values, String sensorName, Int32 backupTime) {
			ActionResult result;
			Object userObj = this.HttpContext.Items["user"];
			if(userObj != null) {
				User user = (User)userObj;
				try {					
					BackupHelper.BackupSensorData(values, sensorName, user.Username, DateTimeHelper.FromUnixTime(backupTime));
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
