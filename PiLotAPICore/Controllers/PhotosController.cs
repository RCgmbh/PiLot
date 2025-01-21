using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

using PiLot.Data.Files;
using PiLot.Model.Photos;
using PiLot.Utils.Logger;
using PiLot.API.ActionFilters;
using PiLot.API.Workers;
using System.Collections.Generic;

namespace PiLot.API.Controllers {

	[ApiController]
	public class PhotosController : ControllerBase {

		private const String QSDATEFORMAT = "yyyy-MM-dd";

		[Route(Program.APIROOT + "[controller]/{year}/{month}/{day}")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public ImageCollection GetDailyPhotoGallery(Int32 year, Int32 month, Int32 day) {
			try {
				Date date = new Date(year, month, day);
				return new PhotoDataConnector().ReadDailyPhotoGallery(date);
			} catch (Exception ex) {
				Logger.Log(ex, "PhotosController.GetDailyPhotoGallery");
				throw;
			}
		}

		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<ImageCollection> GetAllPhotoGalleries() {
			try {
				return new PhotoDataConnector().ReadAllPhotoGalleries();
			} catch (Exception ex) {
				Logger.Log(ex, "PhotosController.GetAllPhotoGalleries");
				throw;
			}
		}

		/// <summary>
		/// Puts a photo to the server. The content must be nothing but the
		/// pure bytes. No multipart data.
		/// </summary>
		/// <param name="day">The day as string in format yyyy-mm-dd</param>
		/// <param name="fileName">the original Name of the image</param>
		/// <returns></returns>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public async Task<ActionResult> Put(String day, String fileName) {
			Stream requestStream = this.Request.Body;
			if (requestStream != null) {
				try {
					Date? date = null;
					if (!String.IsNullOrEmpty(day)) {
						date = new Date(DateTime.ParseExact(day, QSDATEFORMAT, null));
					}
					Byte[] bytes = await new PiLot.Utils.Various.BytesHelper().ReadBytes(this.Request.Body, this.Request.ContentLength.Value);
					Logger.Log($"PhotoController recieved {bytes.Length} bytes for {fileName}", LogLevels.DEBUG);
					PhotosWorker.Instance.ProcessPhoto(new ImageData() {
						Bytes = bytes,
						Day = date,
						Name = fileName
					});
				} catch (Exception ex) {
					Logger.Log(ex, "PhotosController.Put");
					throw;
				}
			}
			return this.Ok();
		}

		/// <summary>
		/// Deletes a photo from the server. 
		/// </summary>
		/// <param name="day">The day as string in format yyyy-mm-dd</param>
		/// <param name="fileName">the original Name of the image</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpDelete]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public ActionResult Delete(String day, String fileName) {
			ActionResult result;
			try {
				Date? date = null;
				if (!String.IsNullOrEmpty(day)) {
					date = new Date(DateTime.ParseExact(day, QSDATEFORMAT, null));
					new PhotoDataConnector().DeleteImageWithThumbnails(date.Value, fileName);
					result = this.Ok();
				} else {
					result = this.BadRequest("day missing");
				}
			} catch (Exception ex) {
				Logger.Log(ex, "PhotosController.Delete");
				throw;
			}
			return result;
		}
	}
}
