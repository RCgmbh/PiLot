using System;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Data.Files.Analyze;
using PiLot.Model.Analyze;

namespace PiLot.API.Controllers {

	/// <summary>
	/// API for the TackAnalyzerOptions
	/// </summary>
	[ApiController]
	public class TackAnalyzerOptionsController : Controller {

		[Route(Program.APIROOT + "[controller]/{boat}")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public TackAnalyzerOptions Get(String boat) {
			return new TackAnalyzerDataConnector().ReadTackAnalyzerOptions(boat);
		}

		[Route(Program.APIROOT + "[controller]/{boat}")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public ActionResult Put(String boat, TackAnalyzerOptions options) {
			new TackAnalyzerDataConnector().SaveTackAnalyzerOptions(options, boat);
			return this.Ok();
		}
	}
}
