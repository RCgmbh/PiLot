using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

using PiLot.Model.Users;

using PiLot.Backup.API.Helpers;

namespace PiLot.Backup.API.ActionFilters {

	/// <summary>
	/// This is used to ensure backup authorization in REST requests
	/// </summary>
	public class BackupAuthorizationFilter : IActionFilter {

		public void OnActionExecuted(ActionExecutedContext context) { }

		public void OnActionExecuting(ActionExecutingContext actionContext) {
			User currentUser = AuthenticationHelper.Instance.Authenticate(actionContext.HttpContext);
			actionContext.HttpContext.Items.Add("user", currentUser);
			if (!AuthenticationHelper.Instance.AuthorizationHelper.CanBackup(currentUser)) {
				actionContext.Result = new StatusCodeResult(403);
			}
		}
	}
}