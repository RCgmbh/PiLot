using System;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Data.Files;
using PiLot.Model.Common;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Controller for common, application-wide settings
	/// </summary>
	[ApiController]
	public class SettingsController : ControllerBase {

		/// <summary>
		/// Gets the active Route ID or null, if no route is active
		/// </summary>
		/// <returns></returns>
		[Route(Program.APIROOT + "[controller]/activeRouteId")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public Int32? GetActiveRouteId() {
			return new GlobalDataConnector().GetActiveRouteId();
		}

		/// <summary>
		/// Sets the active Route ID (which can be null), and returns it
		/// </summary>
		[Route(Program.APIROOT + "[controller]/activeRouteId")]
		[HttpPut]
		[ServiceFilter(typeof(SettingsAuthorizationFilter))]
		public Int32? PutActiveRouteId(Int32? routeId) {
			new GlobalDataConnector().SetActiveRouteId(routeId);
			return routeId;
		}

		/// <summary>
		/// Gets the current boat config name
		/// </summary>
		[Route(Program.APIROOT + "[controller]/currentBoatConfigName")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public String GetCurrentBoatConfigName() {
			return new GlobalDataConnector().GetCurrentBoatConfigName();
		}

		/// <summary>
		/// Sets the current BoatConfig name
		/// </summary>
		/// <param name="name">The unique BoatConfig name</param>
		[Route(Program.APIROOT + "[controller]/currentBoatConfigName")]
		[HttpPut]
		[ServiceFilter(typeof(SettingsAuthorizationFilter))]
		public ActionResult PutCurrentBoatConfigName(String name) {
			new GlobalDataConnector().SetCurrentBoatConfigName(name);
			return this.Ok(name);
		}

		/// <summary>
		/// Gets the current BoatTime
		/// </summary>
		/// <returns></returns>
		[Route(Program.APIROOT + "[controller]/boatTime")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public BoatTime GetBoatTime() {
			return new GlobalDataConnector().GetBoatTime();
		}

		/// <summary>
		/// Saves the current BoatTime UTC offset to the server
		/// </summary>
		/// <param name="utcOffset">the UTC offset in minutes</param>
		[Route(Program.APIROOT + "[controller]/boatTime")]
		[HttpPut]
		[ServiceFilter(typeof(SettingsAuthorizationFilter))]
		public void PutCurrentBoatTime(Int32 utcOffset) {
			new GlobalDataConnector().SetBoatTime(utcOffset);
		}

	}
}
