using System;
using System.Collections.Generic;
using System.Linq;

using PiLot.Model.Publishing;
using System.Threading;
using System.Threading.Tasks;
using PiLot.API.Workers;
using PiLot.Utils;

namespace PiLot.API.Helpers {

	/// <summary>
	/// This class is responsible for keeping Track of all the PublishWorkers. We want
	/// to make sure we only have one PublishJob and thus one PublishWorker per day and 
	/// target to avoid conflicts.
	/// </summary>
	public class PublishHelper {

		#region constants
		private const String APPKEY = "publishHelper";

		#endregion

		#region instance variables

		private List<PublishWorker> workers = null;

		#endregion

		#region constructors

		// hidden constructor, use the Instance getter instead
		private PublishHelper() {
			this.workers = new List<PublishWorker>();
		}

		/// <summary>
		/// Gets the current instance from the Application, or creates one.
		/// </summary>
		public static PublishHelper Instance {
			get {
				PublishHelper result = null;
				Object applicationItem = Program.GetApplicationObject(APPKEY);
				if(applicationItem != null) {
					result = applicationItem as PublishHelper;
				} else {
					result = new PublishHelper();
					Program.SetApplicationObject(APPKEY, result);
				}
				return result;
			}
		}

		#endregion

		#region public methods

		/// <summary>
		/// Gets the Job for a certain Target and Date, or null, if there is no such job.
		/// </summary>
		/// <param name="pTargetName">The target name</param>
		/// <param name="pDate">the date</param>
		/// <returns>A PublishJob or null</returns>
		public PublishJob GetJob(String pTargetName, Date pDate) {
			return this.GetWorker(pTargetName, pDate)?.Job;
		}

		/// <summary>
		/// Adds and starts a publish Job, if there is no active job for the same target and date yet. If there is a
		/// finieshed job, it will be replaced by the new one. If there is an acitve job, nothing happens, and we return false.
		/// </summary>
		/// <param name="pJob">The job to add, not null</param>
		/// <returns>True: Job was added, false: Job was not added due to conflict</returns>
		public Boolean AddJob(PublishJob pJob) {
			Assert.IsNotNull(pJob, "Can not add null as PublishJob");
			Boolean result = false;
			PublishWorker currentWorker = this.GetWorker(pJob.Target.Name, pJob.Date);
			if (currentWorker != null && currentWorker.Job.IsFinished) {
				this.workers.Remove(currentWorker);
				currentWorker = null;
			} 
			if(currentWorker == null) {
				PublishWorker newWorker = new PublishWorker(pJob);
				this.workers.Add(newWorker);
				this.StartBackgroundJob(newWorker);
				result = true;
			}
			return result;
		}

		/// <summary>
		/// This starts a job in the background, so that the calling API Method
		/// can return without having to wait for the job to finish. It will just
		/// call StartPublishAsync on pWorker.
		/// </summary>
		private void StartBackgroundJob(PublishWorker pWorker) {
			var tokenSource = new CancellationTokenSource();
			var cancellationToken = tokenSource.Token;
			Task.Factory.StartNew(async (token) => {
				CancellationToken ct = (CancellationToken)token;
				await pWorker.StartPublishAsync(ct);
			}, cancellationToken, cancellationToken);
			// the following line did not work on mono, that's why we have the above workaround
			// HostingEnvironment.QueueBackgroundWorkItem(cancellationToken => pWorker.StartPublishAsync(cancellationToken));
		}

		#endregion

		/// <summary>
		/// Gets the worker for the Job for a certain target and date. We always
		/// have a 1:1 relationship between Jobs and Workers.
		/// </summary>
		/// <param name="pTargetName">The target name</param>
		/// <param name="pDate">the date</param>
		/// <returns>A PublishJob or null</returns>
		private PublishWorker GetWorker(String pTargetName, Date pDate) {
			PublishWorker result = this.workers.FirstOrDefault(j => ((j.Job.Target.Name == pTargetName) && (j.Job.Date == pDate)));
			return result;
		}
	}
}