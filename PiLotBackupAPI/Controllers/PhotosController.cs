using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using PiLot.Backup.API.ActionFilters;
using PiLot.Backup.API.Helpers;
using PiLot.Model.Photos;
using PiLot.Model.Users;
using PiLot.Utils.Logger;

namespace PiLot.Backup.API.Controllers {

	[ApiController]
	public class PhotosController : ControllerBase {

		private const String QSDATEFORMAT = "yyyy-MM-dd";

		/// <summary>
		/// Accepts puts with a single photo, which will be backed up. The content 
		/// must be nothing but the pure bytes. No multipart data.
		/// </summary>
		/// <param name="day">The image date as yyyy-MM-dd</param>
		/// <param name="fileName">The original filename that will be reused</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(BackupAuthorizationFilter))]
		public async Task<ActionResult> Put(String day, String fileName) {
			ActionResult result;
			Object userObj = this.HttpContext.Items["user"];
			if(userObj != null) {
				User user = (User)userObj;
				Date? date = null;
				if (!String.IsNullOrEmpty(day)) {
					date = new Date(DateTime.ParseExact(day, QSDATEFORMAT, null));
				}
				if (date != null) {
					Stream requestStream = this.Request.Body;
					try {
						Byte[] bytes = await new PiLot.Utils.Various.BytesHelper().ReadBytes(this.Request.Body, this.Request.ContentLength.Value);
						Logger.Log($"PhotoController recieved {bytes.Length} bytes for {fileName}", LogLevels.DEBUG);
						BackupHelper.BackupPhoto(date.Value, fileName, bytes, user.Username);
						result = this.Ok();
					} catch (Exception ex) {
						result = this.StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
					}
				} else {
					result = this.BadRequest("Day is missing or invalid.");
				}
			} else {
				result = this.Unauthorized();
			}
			return result;
		}
	}
}
