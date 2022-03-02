using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace PiLot.API.ActionFilters {

	/// <summary>
	/// This permits REST requests only for local clients, having the same IP
	/// as the server. This can be used for operations that should only be
	/// allowed to clients that run on the local machine.
	/// </summary>
	public class LocalAuthorizationFilter : IActionFilter {

		public void OnActionExecuted(ActionExecutedContext context) { }

		public void OnActionExecuting(ActionExecutingContext actionContext) {
			var connection = actionContext.HttpContext.Connection;
			if (!connection.LocalIpAddress.Equals(connection.RemoteIpAddress)) {
				actionContext.Result = new StatusCodeResult(403);
			}
		}
	}
}