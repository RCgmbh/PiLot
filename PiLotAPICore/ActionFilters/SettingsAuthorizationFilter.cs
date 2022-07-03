using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

using PiLot.API.Helpers;
using PiLot.Model.Users;

namespace PiLot.API.ActionFilters {

	/// <summary>
	/// This is used to ensure configuration authorization in REST requests
	/// </summary>
	public class SettingsAuthorizationFilter : IActionFilter {

		public void OnActionExecuted(ActionExecutedContext context) { }

		public void OnActionExecuting(ActionExecutingContext actionContext) {
			User currentUser = AuthenticationHelper.Instance.Authenticate(actionContext.HttpContext);
			if (!AuthenticationHelper.Instance.AuthorizationHelper.UserCanChangeSettings(currentUser)) {
				actionContext.Result = new StatusCodeResult(403);
			}
		}
	}
}