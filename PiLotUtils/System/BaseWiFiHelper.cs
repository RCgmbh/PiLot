using System;
using System.Linq;

namespace PiLot.Utils.OS {

	/// <summary>
	/// Base class offering common functionality for WiFi Helpers
	/// </summary>
	public abstract class BaseWiFiHelper {

        protected SystemHelper systemHelper;

        public BaseWiFiHelper(){
            this.systemHelper = new SystemHelper();
        }

		/// <summary>
		/// Converts a String into an array of strings, separated by newline. Removes empty lines.
		/// </summary>
		protected String[] GetLines(String pString) {
			String[] result = pString.Split("\n".ToCharArray());
			result = result.Where(s => !String.IsNullOrEmpty(s)).ToArray();
			return result;
		}
	}
}