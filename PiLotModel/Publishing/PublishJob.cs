using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using PiLot.Utils;

namespace PiLot.Model.Publishing {

	/// <summary>
	/// This represents a current or completed Publish Job, which publishes
	/// selected data from one PiLot (source) to another (target). It contains
	/// an overall status, and some messages that give a detailed view about
	/// what happened. The publishing work itself is not done by the Job, but
	/// by a worker living directly within the API, as it needs access to
	/// Proxies and data and stuffs we dont have here.
	/// </summary>
	public class PublishJob {

		public enum Statuses { Idle = 0, Busy = 1, Finished = 2, Skipped = 3, Error = 9 }

		/// <summary>
		/// Default constructor
		/// </summary>
		/// <param name="pTarget">The target, not null</param>
		/// <param name="pSelection">The selection, not null</param>
		/// <param name="pDate">The Date, not null</param>
		public PublishJob(PublishTarget pTarget, PublishSelection pSelection, Date pDate) {
			Assert.IsNotNull(pTarget, "pTarget must not be null");
			Assert.IsNotNull(pSelection, "pSelection must not be null");
			this.Target = pTarget;
			this.Messages = new List<String>();
			this.OverallStatus = Statuses.Idle;
			this.Selection = pSelection;
			this.Date = pDate;
		}

		/// <summary>
		/// Gets or sets the target, where the job wants to publish to.
		/// </summary>
		[JsonIgnore]
		public PublishTarget Target {
			get;
			set;
		}

		/// <summary>
		/// Gets the selection which was used to create the job
		/// </summary>
		[JsonIgnore]
		public PublishSelection Selection {
			get;
			private set;
		}

		/// <summary>
		/// Gets the overall Status of the Job
		/// </summary>
		[JsonPropertyName("overallStatus")]
		public Statuses OverallStatus {
			get;
			set;
		}

		/// <summary>
		/// Gets a List of messages which could give information about errors or 
		/// other important stuffs.
		/// </summary>
		[JsonPropertyName("messages")]
		public List<String> Messages {
			get;
			set;
		}

		/// <summary>
		/// The Date this Job refers to
		/// </summary>
		[JsonIgnore]
		public Date Date {
			get;
			set;
		}

		/// <summary>
		/// Returns whether this is finished, which means another job for this
		/// target and date could be started
		/// </summary>
		[JsonPropertyName("isFinished")]
		public Boolean IsFinished {
			get {
				return this.OverallStatus == Statuses.Finished || this.OverallStatus == Statuses.Error;
			}
		}
	}
}