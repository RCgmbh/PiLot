﻿using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Config;
using PiLot.Model.Sensors;

namespace PiLot.API.Controllers {

	/// <summary>
	/// A controller to get information about the different available DataSources.
	/// </summary>
	[ApiController]
	public class SensorInfosController : ControllerBase {

		/// <summary>
		/// Gets a list of all SensorInfos having a certain tag
		/// </summary>
		[Route(Program.APIROOT + "[controller]/{tag}")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<SensorInfo> Get(String tag) {
			return new SensorConfigReader().ReadSensorInfos(tag);
		}

		/// <summary>
		/// Gets a list of all SensorInfos
		/// </summary>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<SensorInfo> Get() {
			return new SensorConfigReader().ReadSensorInfos();
		}

	}
}
