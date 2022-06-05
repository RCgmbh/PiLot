using System;
using System.Collections.Generic;
using System.Threading.Tasks;

using PiLot.APIProxy;
using PiLot.Model.Sensors;
using PiLot.Utils.Logger;

namespace PiLot.Sensors {

	#pragma warning disable CS4014 // Because this call is not awaited, execution of the current method continues before the call is completed
	/// <summary>
	/// This treats another pilot as a device, queries its data and
	/// stores them locally in order to have a proper history and
	/// quick querying
	/// </summary>
	public class PiLotDevice : BaseDevice, IDevice {

		// TODO: Set this to 0 as soon as the api handles 0 by loading the current data
		private const Int32 MAXSECONDSOLD = 120;
		private const String APIURL = "http://{0}/pilotapi/v1";

		private List<SensorInfo> sensorInfos = null;
		private DataProxy remoteApiProxy = null;

		/// <summary>
		/// Default constructor
		/// </summary>
		/// <param name="pID">The ID is the hostname of the pilot device, e.g. pilot1</param>
		/// <param name="pInterval">The interval to query the pilot</param>
		/// <param name="pSensors">use any data source name, e.g. temeprature1 for data queried via the /Data API</param>
		/// <param name="pLocalAPI">The api url where the data will be sent to</param>
		/// <param name="pLoginHelper">The one and only login helper for the application</param>
		public PiLotDevice(String pID, Int32 pInterval, List<SensorInfo> pSensors, String pLocalAPI, LoginHelper pLoginHelper)
			: base(pID, pInterval, pSensors, pLocalAPI, pLoginHelper) {
			
		}

		/// <summary>
		/// We prepare the url we will need to query the pilot device, not performing
		/// any validation. The api will either return values, or for invalid data sources, 
		/// will just return null. Late we can just use the list of SensorInfos to know
		/// where to store the data
		/// </summary>
		protected override void SetupDevice(String pDeviceID, List<SensorInfo> pSensors) {
			this.sensorInfos = pSensors;
			this.remoteApiProxy = new DataProxy(String.Format(APIURL, this.id), null);
		}

		/// <summary>
		/// Performs the reading by calling the async method, which will read and save
		/// the data in fire and forget manner.
		/// </summary>
		protected override void PerformReading() {
			this.PerformReadingAsync();
		}

		/// <summary>
		/// Reads the data from the device, and the saves it locally for each SensorInfo. Only
		/// non-null values are stored.
		/// </summary>
		private async Task PerformReadingAsync() {
			Logger.Log($"Requesting data from external pilot {this.remoteApiProxy.ApiControllerUrl}", LogLevels.DEBUG);
			foreach (SensorInfo aSensorInfo in this.sensorInfos) {
				SensorDataRecord data = await this.remoteApiProxy.GetLatestValue(aSensorInfo.ID, MAXSECONDSOLD);
				if (data != null) {
					this.SaveDataAsync(aSensorInfo.Name, data.Value); 
				} else {
					Logger.Log($"Did not get any data for PiLotDevice {this.id}, data source {aSensorInfo.ID}", LogLevels.INFO);
				}
			} 
		}
	}
}
