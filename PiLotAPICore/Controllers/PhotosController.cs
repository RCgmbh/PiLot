using System;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Data.Files;
using PiLot.Model.Photos;
using PiLot.Utils.Logger;

namespace PiLot.API.Controllers {

	[Route(Program.APIROOT + "[controller]")]
	[ApiController]
	public class PhotosController : ControllerBase {

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
	}
}
