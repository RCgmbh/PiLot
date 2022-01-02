using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Data.Files;
using PiLot.Model.Boat;
using PiLot.Model.Logbook;

namespace PiLot.API.Controllers {
    
    [ApiController]
    public class LogbookController : ControllerBase {

		/// <summary>
		/// Gets the LogbookDay for one day, or null
		/// </summary>
		[Route("api/v1/Logbook/{year}/{month}/{day}")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public LogbookDay Get(Int32 year, Int32 month, Int32 day) {
			return new LogbookDataConnector().ReadLogbookDay(new Model.Common.Date(year, month, day));
		}

		/// <summary>
		/// Gets the LogbookDay for the current date based on
		/// boatTime, or null if there is no logbookDay
		/// </summary>
		[Route("api/v1/Logbook/today")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public LogbookDay Get() {
			return new LogbookDataConnector().ReadCurrentLogbookDay();
		}

		/// <summary>
		/// Gets summarized data for each day a month. The result is an array of objects
		/// {day, hasTrack, hasDiary, hasLogbook, hasPhotos}
		/// </summary>
		[Route("api/v1/Logbook/{year}/{month}")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public Object[] Get(Int32 year, Int32 month) {
			return new LogbookDataConnector().ReadLogbookMonthInfo(year, month).ToArray();
		}

		/// <summary>
		/// Gets the latest boatSetup for a specific boatConfig before or at a certain date.
		/// LogbookEntries are used to find the boatSetup
		/// </summary>
		[Route("api/v1/Logbook/latestBoatSetup")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public BoatSetup GetLatestBoatSetup(Int32 year, Int32 month, Int32 day, String boatConfigName) {
			Date date = new Date(year, month, day);
			return new LogbookDataConnector().ReadLatestBoatSetup(date, boatConfigName);
		}

		/// <summary>
		/// Saves a logbookDay. Any existing lobookDay for this date will be replaced.
		/// </summary>
		/// <param name="logbookDay">The logbookday to save</param>
		[Route("api/v1/Logbook")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public void Put(LogbookDay logbookDay) {
			new LogbookDataConnector().SaveLogbookDay(logbookDay);
		}

		/// <summary>
		/// Saves a logbook Entry and returns it.
		/// </summary>
		/// <param name="logbookEntry">The logbookEntry to save</param>
		/// <returns>The updated entry</returns>
		[Route("api/v1/Logbook/entry")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public ActionResult Put(LogbookEntry logbookEntry) {
			Boolean added = new LogbookDataConnector().SaveLogbookEntry(logbookEntry);
			if (added) {
				return this.StatusCode(StatusCodes.Status201Created, logbookEntry);
			} else {
				return this.Ok(logbookEntry);
			}
		}

		/// <summary>
		/// Saves the diary text for a day
		/// </summary>
		/// <returns>The LogbookDay where the text was set</returns>
		[Route("api/v1/Logbook/diary/{year}/{month}/{day}")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public ActionResult Put(DiaryText text, Int32 year, Int32 month, Int32 day) {
			Boolean added = new LogbookDataConnector().SaveDiaryText(text, new Model.Common.Date(year, month, day), out LogbookDay logbookDay);
			if (added) {
				return this.StatusCode(StatusCodes.Status201Created, logbookDay);
			} else {
				return this.Ok(logbookDay);
			}
		}

		/// <summary>
		/// Deletes a logbookEntry. Returns ok, if the item was deleted
		/// or not found (404) if the item was not found
		/// </summary>
		/// <param name="entryId"></param>
		[Route("api/v1/Logbook/entry/{id}")]
		[HttpDelete]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public ActionResult Delete(Int32 id) {
			Boolean result = new LogbookDataConnector().DeleteLogbookEntry(id);
			if (result) {
				return this.Ok();
			} else {
				return this.NotFound();
			}
		}

	}
}
