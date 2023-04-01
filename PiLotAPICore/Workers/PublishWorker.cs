using System;
using System.Threading;
using System.Threading.Tasks;

using PiLot.APIProxy;
using PiLot.Data.Files;
using PiLot.Model.Publishing;
using PiLot.Model.Nav;
using PiLot.Model.Photos;
using PiLot.Model.Logbook;
using PiLot.Utils;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;

namespace PiLot.API.Workers {

	/// <summary>
	/// This is the guy who does the actual job of publishing data from the local
	/// PiLot to a remote target. It takes a publishJob, which contains information
	/// about the target and the requested data, and will always be updated with the
	/// current status and messages.
	/// </summary>
	public class PublishWorker {

		/// <summary>
		/// Default constructor
		/// </summary>
		/// <param name="pJob">The actual publishing job</param>
		public PublishWorker(PublishJob pJob) {
			Assert.IsNotNull(pJob, "pJob must not be null");
			this.Job = pJob;
		}

		/// <summary>
		/// Gets the PublishJob
		/// </summary>
		public PublishJob Job {
			get;
			private set;
		}

		public async Task StartPublishAsync(CancellationToken pCancellationToken) {
			this.Job.OverallStatus = PublishJob.Statuses.Busy;
			this.Job.Messages.Add($"Starting publishing to {this.Job.Target.DisplayName}");
			try {
				LoginHelper loginHelper = new LoginHelper(this.Job.Target.APIUrl, this.Job.Target.Username, this.Job.Target.Password);
				if (!pCancellationToken.IsCancellationRequested) {
					await this.PublishTrackAsync(loginHelper);
				} else {
					this.Job.Messages.Add("Cancellation has been requested. Skipping Track publishing.");
				}
				if (!pCancellationToken.IsCancellationRequested) {
					await this.PublishLogbookAsync(loginHelper);
				} else {
					this.Job.Messages.Add("Cancellation has been requested. Skipping Logbook publishing.");
				}
				if (!pCancellationToken.IsCancellationRequested) {
					await this.PublishPhotosAsync(loginHelper, pCancellationToken);
				} else {
					this.Job.Messages.Add("Cancellation has been requested. Skipping Photos publishing.");
				}
			} catch(Exception ex) {
				this.Job.Messages.Add(ex.Message);
				this.Job.OverallStatus = PublishJob.Statuses.Error;
				Logger.Log(ex, "PublishJob");
			}
			this.Job.Messages.Add($"Finished publishing to {this.Job.Target.DisplayName}");
			if (this.Job.OverallStatus != PublishJob.Statuses.Error) {
				this.Job.OverallStatus = PublishJob.Statuses.Finished;
			}
		}

		/// <summary>
		/// Publishes the track according to the publish settings
		/// </summary>
		private async Task PublishTrackAsync(LoginHelper pLoginHelper) {
			if(this.Job.Selection.PublishTrackMode != 0) {
				TrackProxy proxy = new TrackProxy(this.Job.Target.APIUrl, pLoginHelper);
				Track track = new GPSDataConnector().ReadTrack(DateTimeHelper.ToJSTime(this.Job.Date), DateTimeHelper.ToJSTime(this.Job.Date.AddDays(1)), true);
				Boolean success = await proxy.PutTrackAsync(track, true);
				if (success) {
					this.Job.Messages.Add($"Track published successfully: {track.GpsRecords.Count} positions");
				} else {
					this.Job.Messages.Add("😥 Publishing track failed. See logfiles for (hopefully) more details.");
				}				
			} else {
				this.Job.Messages.Add("Skipping Track");
			}
		}

		/// <summary>
		/// Publishes the logbook entries and the diary text, depending on the
		/// publish settings.
		/// </summary>
		private async Task PublishLogbookAsync(LoginHelper pLoginHelper) {
			if((this.Job.Selection.PublishDiaryMode > 0) || (this.Job.Selection.PublishLogbookMode > 0)){
				LogbookProxy proxy = new LogbookProxy(this.Job.Target.APIUrl, pLoginHelper);
				LogbookDay logbookDay = new LogbookDataConnector().ReadLogbookDay(this.Job.Date) ?? new LogbookDay(new Model.Common.Date(this.Job.Date));
				if(this.Job.Selection.PublishDiaryMode != 0) {
					Boolean diarySuccess = await proxy.PutDiaryTextAsync(logbookDay.DiaryText, logbookDay.Date, this.Job.Selection.PublishDiaryMode == 2);
					if (diarySuccess) {
						this.Job.Messages.Add("Diary published successfully");
					} else {
						this.Job.Messages.Add("😥 Publishing diary failed. See logfiles for (hopefully) more details.");
					}					
				}
				if(this.Job.Selection.PublishLogbookMode != 0) {
					foreach(LogbookEntry anEntry in logbookDay.LogbookEntries) {
						anEntry.EntryID = null;
					}
					Boolean entriesSuccess = await proxy.PutLogbookEntriesAsync(logbookDay.LogbookEntries, logbookDay.Date, this.Job.Selection.PublishLogbookMode == 1);
					if (entriesSuccess) {
						this.Job.Messages.Add($"Logbook entries published successfully: {logbookDay.LogbookEntries.Count} entries");
					} else {
						this.Job.Messages.Add("😥 Publishing logbook entries failed. See logfiles for (hopefully) more details.");
					}					
				}
			}
		}

		/// <summary>
		/// Puts the photos, based on the selected image names
		/// </summary>
		private async Task PublishPhotosAsync(LoginHelper pLoginHelper, CancellationToken pCancellationToken) {
			PhotosProxy proxy = new PhotosProxy(this.Job.Target.APIUrl, pLoginHelper);
			PhotoDataConnector dataConnector = new PhotoDataConnector();
			Boolean success;
			ImageData imageData;
			Int32 counter = 0;
			Int32 total = this.Job.Selection.PublishPhotos.Length;
			foreach(String anImageName in this.Job.Selection.PublishPhotos) {
				if (!pCancellationToken.IsCancellationRequested) {
					imageData = dataConnector.ReadImage(this.Job.Date, anImageName);
					success = await proxy.PutPhotoAsync(imageData);
					counter++;
					if (success) {
						this.Job.Messages.Add($"Image {anImageName} ({counter} of {total}) published successfully.");
					} else {
						this.Job.Messages.Add($"😥 Publishing photo {anImageName} failed. See logfiles for (hopefully) more details.");
					}
				} else {
					this.Job.Messages.Add("Cancellation has been requested. Cancelling Photos publishing.");
				}				
			}
		}
	}
}