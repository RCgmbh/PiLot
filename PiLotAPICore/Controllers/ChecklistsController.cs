using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Config;
using PiLot.Data.Files;
using PiLot.Model.Tools;

namespace PiLot.API.Controllers {

	[ApiController]
	public class ChecklistsController : ControllerBase {

		/// <summary>
		/// Returns all available checklists
		/// </summary>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<Checklist> Get() {
			return new ChecklistDataConnector().ReadChecklists();
		}
	}
}
