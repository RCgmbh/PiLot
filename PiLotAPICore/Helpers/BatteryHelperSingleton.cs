using System;

using PiLot.Utils.Various;

namespace PiLot.API.Helpers {

	/// <summary>
	/// Singleton accessor for a BatteryHelper object. 
	/// </summary>
	public static class BatteryHelperSingleton {

		private const String APPKEY = "batteryHelper";
		private static Object lockObject = new Object();

		/// <summary>
		/// Gets the current BatteryHelper from the Application, or creates one.
		/// </summary>
		public static BatteryHelper BatteryHelper {
			get {
				BatteryHelper result = null;
				lock (lockObject) {
					result = GetApplicationItem();
					if (result == null){
						result = new BatteryHelper();
						Program.SetApplicationObject(APPKEY, result);
					}
				}
				return result;
			}
		}

		public static void DisposeBatteryHelper(){
			BatteryHelper batteryHelper = GetApplicationItem();
			batteryHelper?.Dispose();
		}

		private static BatteryHelper GetApplicationItem(){
			BatteryHelper result = null;
			Object applicationItem = Program.GetApplicationObject(APPKEY);
			if (applicationItem != null) {
				result = applicationItem as BatteryHelper;
			} 
			return result;
		}
	}
}