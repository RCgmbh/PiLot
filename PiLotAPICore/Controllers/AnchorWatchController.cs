using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.API.Workers;
using PiLot.Model.Nav;
using System;

namespace PiLot.API.Controllers {

	/// <summary>
	/// API for the AnchorWatch
	/// </summary>
	[ApiController]
	public class AnchorWatchController : ControllerBase {

		/// <summary>
		/// Gets the current anchorWatch or null
		/// </summary>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public AnchorWatch Get() {
			return AnchorWatchWorker.Instance.GetAnchorWatch();
		}

		/// <summary>
		/// plays the alarm sound to test
		/// </summary>
		[Route(Program.APIROOT + "[controller]/test")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public String GetTestSound(Int32? alarmIndex) {
			return AnchorWatchWorker.Instance.PlayTestAlarm(alarmIndex);
		}

		/// <summary>
		/// Saves the anchorWatch
		/// </summary>
		/// <param name="anchorWatch">The AnchorWatch to save</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public ActionResult Put(AnchorWatch anchorWatch) {
			AnchorWatchWorker.Instance.SaveAnchorWatch(anchorWatch);
			return this.NoContent();
		}

		/// <summary>
		/// Deletes the anchorWatch
		/// </summary>
		[Route(Program.APIROOT + "[controller]")]
		[HttpDelete]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public void Delete() {
			AnchorWatchWorker.Instance.DeleteAnchorWatch();
		}
	}
}
