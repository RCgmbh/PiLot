using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

using PiLot.API.Helpers;
using PiLot.Model.Users;

namespace PiLot.API.ActionFilters {

	/// <summary>
	/// This is used to ensure read authorization in REST requests. If the user has no
	/// read permission, a HTTP Status 403 is returned
	/// </summary>
	public class ReadAuthorizationFilter : IActionFilter {

		public void OnActionExecuted(ActionExecutedContext context) { }

		public void OnActionExecuting(ActionExecutingContext actionContext) {
			User currentUser = AuthenticationHelper.Instance.Authenticate(actionContext.HttpContext);
			if (!AuthorizationHelper.Instance.UserCanRead(currentUser)) {
				actionContext.Result = new StatusCodeResult(403);
			}			
		}
	}
}