using System;
using Microsoft.AspNetCore.Mvc;

using PiLot.Data.Files;
using PiLot.Model.Nav;
using PiLot.Model.Publishing;

using PiLot.API.ActionFilters;
using PiLot.API.Helpers;

namespace PiLot.API.Controllers {

	[ApiController]
	public class PublishJobsController : ControllerBase {

		/// <summary>
		/// Gets the current publishJob for a target and a date, or null if there is no current Job
		/// </summary>
		[Route(Program.APIROOT + "[controller]/{targetName}/{year}/{month}/{day}")]
		[HttpGet]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public PublishJob Get(String targetName, Int32 year, Int32 month, Int32 day) {
			return PublishHelper.Instance.GetJob(targetName, new Date(year, month, day));
		}

		/// <summary>
		/// Sends a publish job to the server. If there is no open job for the same target and date,
		/// the data defined by pSelection will be published to the target. If there is an open Job,
		/// this will return http 409, Conflict. You best check the status of the job by firing a
		/// get to the same url before calling this.
		/// </summary>
		[Route(Program.APIROOT + "[controller]/{targetName}/{year}/{month}/{day}")]
		[HttpPut]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public ActionResult Put(String targetName, Int32 year, Int32 month, Int32 day, PublishSelection selection) {
			PublishHelper helper = PublishHelper.Instance;
			Date date = new Date(year, month, day);
			PublishJob currentJob = helper.GetJob(targetName, date);
			if((currentJob == null) || (currentJob.IsFinished)) {
				PublishTarget target = new PublishingDataConnector().GetPublishTarget(targetName);
				if(target == null) {
					return this.NotFound();
				} else {
					PublishJob newJob = new PublishJob(target, selection, date);
					helper.AddJob(newJob);
					return this.Ok();
				}				
			} else {
				return this.Conflict();
			}
		}
    }
}
