using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Data.Files;
using PiLot.Model.Nav;

namespace PiLot.API.Controllers {

	/// <summary>
	/// API for routes (as in collection of waypoints)
	/// </summary>
	[ApiController]
	public class RoutesController : ControllerBase {

		/// <summary>
		/// Gets the route with id, or the current route when passing "current" as id
		/// </summary>
		/// <param name="id">the route id or "current"</param>
		/// <returns>A Route or null</returns>
		[Route("api/v1/Routes/{id}")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public Route Get(String id) {
			String routeId;
			Route result = null;
			if (id == "current") {
				routeId = new GlobalDataConnector().GetActiveRouteId()?.ToString();
			} else {
				routeId = id;
			}
			if (routeId != null) {
				result = new RouteDataConnector().ReadRoute(routeId);
			}
			return result;
		}

		/// <summary>
		/// Gets a list of all routes
		/// </summary>
		/// <returns>A List of Routes</returns>
		[Route("api/v1/Routes")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<Route> Get() {
			return new RouteDataConnector().ReadAllRoutes();
		}

		/// <summary>
		/// Saves a route and returns the saved route
		/// </summary>
		/// <param name="route">The route to save</param>
		/// <returns></returns>
		[Route("api/v1/Routes")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public Route Put(Route route) {
			new RouteDataConnector().SaveRoute(route);
			return route;
		}

		/// <summary>
		/// Deletes the route with RouteID = id from the server
		/// </summary>
		/// <param name="id">The route ID</param>
		[Route("api/v1/Routes/{id}")]
		[HttpDelete]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public ActionResult Delete(Int32 id) {
			Boolean exists = new RouteDataConnector().DeleteRoute(id);
			if (!exists) {
				return this.NotFound();
			} else {
				return this.Ok();
			}
		}
	}
}
