using System;

namespace PiLot.Backup.API.Helpers {

	public class AuthenticationHelper: Auth.AuthenticationHelper {

		private const String APPKEY = "authenticationHelper";

		/// <summary>
		/// Singleton accessor, gets the current Instance from the
		/// application, or creates a new instance and saves it
		/// to the application
		/// </summary>
		public static AuthenticationHelper Instance {
			get {
				AuthenticationHelper result = null;
				Object applicationItem = Program.GetApplicationObject(APPKEY);
				if (applicationItem != null) {
					result = applicationItem as AuthenticationHelper;
				} else {
					result = new AuthenticationHelper();
					Program.SetApplicationObject(APPKEY, result);
				} 
				return result;
			}
		}
	}
}
