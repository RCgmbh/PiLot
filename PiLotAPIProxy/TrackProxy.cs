﻿using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;

using PiLot.Model.Nav;

namespace PiLot.APIProxy {

	/// <summary>
	/// Proxy class for easy access to the /Track REST API
	/// </summary>
	public class TrackProxy {

		private const String CONTROLLERURL = "/Tracks";

		private PiLotHttpClient httpClient;
		private String apiControllerUrl;

		/// <summary>
		/// Creates a new TrackProxy instance, which can be used to 
		/// read data from and send data to the Track API Endpoint
		/// </summary>
		/// <param name="pApiUrl">The API Root url, such as http://localhost/pilotapi/api/v1, without ending /</param>
		/// <param name="pLoginHelper">Pass the one and only LoginHelper within the application, or null</param>
		public TrackProxy(String pApiUrl, LoginHelper pLoginHelper) {
			this.apiControllerUrl = pApiUrl + CONTROLLERURL;
			this.httpClient = new PiLotHttpClient(pLoginHelper);
		}

		/// <summary>
		/// Reads the Track for a certain time range. 
		/// </summary>
		/// <param name="pStartTime">The start time in milliseconds (UTC or BoatTime)</param>
		/// <param name="pEndTime">The end time of the track in milliseconds (UTC or BoatTime)</param>
		/// <returns>The Track, might be without any positions, but not null</returns>
		public async Task<ProxyResult<Track>> GetTrackAsync(Int64 pStartTime, Int64 pEndTime, Boolean pIsBoatTime) {
			//Track track = new Track();
			String url = $"{this.apiControllerUrl}?startTime={pStartTime}&endTime={pEndTime}&isBoatTime={pIsBoatTime}";
			/*ProxyResult<List<Double?[]>> clientResult = await this.httpClient.GetAsync<List<Double?[]>>(url);
			if (clientResult.Success) {
				clientResult.Data.ForEach(p => track.AddTrackPoint(p));
			}*/
			ProxyResult<Track> result = await this.httpClient.GetAsync<Track>(url);
			//result.Success = clientResult.Success;
			//result.Message = clientResult.Message;
			//result.Data = track;
			return result;
		}

		/// <summary>
		/// This sends a track to the the api
		/// </summary>
		/// <param name="pTrack">The track to send</param>
		/// <returns>true, if the operation succeeded</returns>
		public async Task<Boolean> PutTrackAsync(Track pTrack) {
			String jsonString = JsonSerializer.Serialize(pTrack);
			return await this.httpClient.PutAsync(jsonString, this.apiControllerUrl);
		}
	}
}
