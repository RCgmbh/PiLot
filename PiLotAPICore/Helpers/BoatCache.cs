using System;

using PiLot.Data.Files;
using PiLot.Utils.Logger;

namespace PiLot.API.Helpers {

	/// <summary>
	/// This caches the current boat, as it is used every time we save gps data
	/// (in order to get the proper track)
	/// </summary>
	public class BoatCache {

		#region constants

		private const String APPKEY = "boatCache";

		private static Object lockObject = new Object();

		#endregion

		#region events

		/// <summary>
		/// This is fired as soon as the current boat is changed.
		/// </summary>
		public event BoatChangedEventHandler BoatChanged;
		
		#endregion

		#region instance variables

		String currentBoat = null;
		private GlobalDataConnector globalDataConnector = null;

		#endregion

		#region constructors

		// hidden constructor, use the Instance getter instead
		private BoatCache() {
			this.globalDataConnector = new GlobalDataConnector();
			Logger.Log("BoatCache: New instance created", LogLevels.DEBUG);
		}

		/// <summary>
		/// Gets the current instance from the Application, or creates one.
		/// </summary>
		public static BoatCache Instance {
			get {
				BoatCache result = null;
				lock (lockObject) {
					Object applicationItem = Program.GetApplicationObject(APPKEY);
					if (applicationItem != null) {
						result = applicationItem as BoatCache;
					} else {
						result = new BoatCache();
						Program.SetApplicationObject(APPKEY, result);
					}
				}
				return result;
			}
		}

		#endregion

		#region public properties

		/// <summary>
		/// Gets or sets the current boat
		/// </summary>
		public String CurrentBoat {
			get {
				if (this.currentBoat == null) {
					this.currentBoat = this.globalDataConnector.GetCurrentBoatConfigName();
				}
				return this.currentBoat;
			}
			set {
				if (this.currentBoat == null || !value.Equals(this.currentBoat)) {
					this.currentBoat = value;
					this.globalDataConnector.SetCurrentBoatConfigName(this.currentBoat);
					this.BoatChanged?.Invoke(this.currentBoat);
				}
			}
		}

		#endregion
	}

	/// <summary>
	/// Delegate for an event informing about changed position data.
	/// </summary>
	public delegate void BoatChangedEventHandler(String pBoat);
}