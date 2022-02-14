using System;
using System.IO;
using Microsoft.AspNetCore.Mvc;

using PiLot.Data.Files;
using PiLot.Model.Photos;
using PiLot.Utils.Logger;

using PiLot.API.ActionFilters;
using PiLot.API.Workers;

namespace PiLot.API.Controllers {

	[Route(Program.APIROOT + "[controller]")]
	[ApiController]
	public class PhotosController : ControllerBase {

		private const String QSDATEFORMAT = "yyyy-MM-dd";

		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		[HttpGet]
		public ImageCollection GetDailyPhotoGallery(Int32 year, Int32 month, Int32 day) {
			try {
				Date date = new Date(year, month, day);
				return new PhotoDataConnector().ReadDailyPhotoGallery(date);
			} catch (Exception ex) {
				Logger.Log(ex, "PhotosController.GetDailyPhotoGallery");
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
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		[HttpPut]
		public ActionResult Put(String day, String fileName) {
			Stream requestStream = this.Request.Body;
			if (requestStream != null) {
				try {
					Date? date = null;
					if (!String.IsNullOrEmpty(day)) {
						date = new Date(DateTime.ParseExact(day, QSDATEFORMAT, null));
					}
					Byte[] bytesInStream = new Byte[requestStream.Length];
					requestStream.Read(bytesInStream, 0, (int)bytesInStream.Length);
					Logger.Log($"PhotoController recieved {bytesInStream.Length} bytes for {fileName}", LogLevels.DEBUG);
					PhotosWorker.Instance.ProcessPhoto(new ImageData() {
						Bytes = bytesInStream,
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
	}
}
