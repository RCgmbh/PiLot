using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Config;
using PiLot.Data.Files;
using PiLot.Model.Boat;

namespace PiLot.API.Controllers {

	[ApiController]
	public class BoatConfigsController : ControllerBase {

		/// <summary>
		/// Returns some basic information about all available boat configs
		/// </summary>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<Object> Get() {
			return new BoatConfigReader().ReadBoatConfigInfos();
		}

		/// <summary>
		/// Returns the BoatConfig with a specific id (=name). Pass "current"
		/// to get the current BoatConfig. Yeah, no good idea to name one
		/// BoatConfig "current.json" :-)
		/// </summary>
		/// <param name="id">The name of the config or "current"</param>
		[Route(Program.APIROOT + "[controller]/{id}")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public ActionResult Get(String id) {
			String name;
			if (id == "current") {
				name = new GlobalDataConnector().GetCurrentBoatConfigName();
			} else {
				name = id;
			}
			BoatConfig boatConfig = new BoatConfigReader().ReadBoatConfig(name);
			if (boatConfig != null) {
				return this.Ok(boatConfig);
			} else {
				return this.NotFound();
			}
		}
	}
}
