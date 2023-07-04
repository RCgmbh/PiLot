using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.API.Workers;
using PiLot.Data.Files;
using PiLot.Model.Nav;

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
