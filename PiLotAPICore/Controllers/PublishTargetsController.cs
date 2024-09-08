using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;


using PiLot.API.ActionFilters;
using PiLot.APIProxy;
using PiLot.Config;
using PiLot.Data.Files;
using PiLot.Model.Common;
using PiLot.Model.Logbook;
using PiLot.Model.Nav;
using PiLot.Model.Publishing;
using PiLot.Model.Photos;
using PiLot.Utils.Logger;
using PiLot.Utils.DateAndTime;
using PiLot.API.Helpers;

namespace PiLot.API.Controllers {

	[ApiController]
	public class PublishTargetsController : ControllerBase {

		/// <summary>
		/// Gets the names of all PublishTargets. For each PublishTarget the Name
		/// and the DisplayName are delivered
		/// </summary>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public List<Object> Get() {
			List<PublishTarget> targets = new PublishingConfigReader().ReadPublishTargets();
			return targets.Select(t => (Object)new {name = t.Name, displayName = t.DisplayName }).ToList();
		}

		/// <summary>
		/// Gets the daily data for a certain PublishTarget and a certain day. 
		/// </summary>
		[Route(Program.APIROOT + "[controller]/{targetName}/{year}/{month}/{day}")]
		[HttpGet]
		[ServiceFilter(typeof(SystemAuthorizationFilter))]
		public async Task<TargetData<DailyData>> Get(String targetName, Int32 year, Int32 month, Int32 day) {
			TargetData<DailyData> result = new TargetData<DailyData>();
			PublishTarget target = new PublishingConfigReader().GetPublishTarget(targetName);
			if(target != null) {
				System.Date date = new System.Date(year, month, day);
				LoginHelper loginHelper = new LoginHelper(target.APIUrl, target.Username, target.Password);
				TargetData<LogbookDay> logbookDayData = await this.LoadLogbookDayAsync(target, loginHelper, date);
				TargetData<List<Track>> trackData = await this.LoadTracksAsync(target, loginHelper, date);
				TargetData<ImageCollection> photoData = await this.LoadPhotoInfosAsync(target, loginHelper, date);
				if(logbookDayData.Success && trackData.Success && photoData.Success) {
					result.Success = true;
					result.Data = new DailyData() {
						LogbookDay = logbookDayData.Data,
						Tracks = trackData.Data,
						PhotoInfos = photoData.Data
					};
				} else {
					result.Success = false;
					result.Messages = String.Join("\n", new String[3]{logbookDayData.Messages, trackData.Messages, photoData.Messages} );
				}				
			} else {
				Logger.Log($"Did not find PublishTarget with Name = {targetName}", LogLevels.WARNING);
				result.Messages = $"Did not find PublishTarget with Name = {targetName}";
				result.Success = false;
			}
			return result;
		}

		/// <summary>
		/// Loads the LogbookDay for pDate from the publish target.
		/// </summary>
		private async Task<TargetData<LogbookDay>> LoadLogbookDayAsync(PublishTarget pTarget, LoginHelper pLoginHelper, System.Date pDate) {
			LogbookProxy logbookProxy = new LogbookProxy(pTarget.APIUrl, pLoginHelper);
			ProxyResult<LogbookDay> proxyResult = await logbookProxy.GetLogbookDayAsync(pDate);
			TargetData<LogbookDay> result = new TargetData<LogbookDay>() {
				Success = proxyResult.Success,
				Messages = proxyResult.Message,
				Data = proxyResult.Data
			};
			return result;
		}

		/// <summary>
		/// This loads the remote tracks for that day, based on boatTime. They might
		/// or might not overlap with the local tracks. So the user will have to decide,
		/// if he tries to publish or manually deletes overlapping remote tracks first.
		/// </summary>
		/// <param name="pDate">The date for which we want the track.</param>
		/// <returns>A ProxyResult containing the remote tracks for the day</returns>
		private async Task<TargetData<List<Track>>> LoadTracksAsync(PublishTarget pTarget, LoginHelper pLoginHelper, System.Date pDate) {
			Int64 trackStart = DateTimeHelper.ToJSTime(pDate);
			Int64 trackEnd = DateTimeHelper.ToJSTime(pDate.AddDays(1));
			TrackProxy trackProxy = new TrackProxy(pTarget.APIUrl, pLoginHelper);
			ProxyResult<List<Track>> proxyResult = await trackProxy.GetTracksAsync(trackStart, trackEnd, true);
			TargetData<List<Track>> result = new TargetData<List<Track>>() {
				Success = proxyResult.Success,
				Messages = proxyResult.Message,
				Data = proxyResult.Data
			};
			return result;
		}

		/// <summary>
		/// Loads the daily Photos Colection from the server, and makes the rootUrl
		/// absolute, based on the configured webUrl of the publish target.
		/// </summary>
		/// <returns>A TargetData with an ImageCollection that will never be null</returns>
		private async Task<TargetData<ImageCollection>> LoadPhotoInfosAsync(PublishTarget pTarget, LoginHelper pLoginHelper, System.Date pDate) {
			PhotosProxy photosProxy = new PhotosProxy(pTarget.APIUrl, pLoginHelper);
			ProxyResult<ImageCollection> proxyResult = await photosProxy.GetDailyPhotos(pDate);
			TargetData<ImageCollection> result = new TargetData<ImageCollection>() {
				Success = proxyResult.Success,
				Messages = proxyResult.Message,
				Data = proxyResult.Data
			};
			if (!String.IsNullOrEmpty(result.Data?.RootURL)) {
				result.Data.RootURL = $"{pTarget.WebUrl}/{result.Data.RootURL}/";
			}
			return result;
		}
    }
}
