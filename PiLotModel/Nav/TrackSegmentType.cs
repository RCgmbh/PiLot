﻿using System;
using System.Text.Json.Serialization;

using PiLot.Utils;

namespace PiLot.Model.Nav {

	/// <summary>
	/// This represents a certain type of track segment we are interested in, 
	/// e.g. the fastest mile or the longest distance for one hour.
	/// </summary>
	public struct TrackSegmentType {

		public enum Criterions { Fastest, Uninterrupted }

		/// <summary>
		/// Default constructor. Please note that either the duration or the distance must
		/// be defined, not both.
		/// </summary>
		/// <param name="pId">The technical id</param>
		/// <param name="pDuration">The duration in seconds</param>
		/// <param name="pDistance">The distance in meters</param>
		/// <param name="pLabels">The Labels for the GUI in all languages</param>
		public TrackSegmentType(Int32 pId, Criterions pCriterion, Int32? pDuration, Int32? pDistance, Object pLabels) {
			Assert.IsTrue(
				   pCriterion == Criterions.Fastest && (pDuration != null) ^ (pDistance != null)
				|| pCriterion == Criterions.Uninterrupted && (pDuration != null) && (pDistance != null)
				, "TrackSegmentType: pDuration xor pDistance must be non-null for criterion Fastest. Both must be non-null for criterion Uninterrupted"
			);
			this.ID = pId;
			this.Criterion = pCriterion;
			this.Duration = pDuration;
			this.Distance = pDistance;
			this.Labels = pLabels;
		}

		/// <summary>
		/// The unique ID
		/// </summary>
		[JsonPropertyName("id")]
		public Int32 ID { get; private set; }

		/// <summary>
		/// Allows to differ between fastest segments (e.g. fastest mile, fastes hour) and
		/// uninterrupted segments, which can be used to calculate average speed by ignoring
		/// longer breaks, or to find the longest uniterrupted segment.
		/// </summary>
		[JsonPropertyName("criterion")]
		public Criterions Criterion { get; private set; }

		/// <summary>
		/// For criterion fastest: The minimal duration in seconds, e.g. 3600 for the longest distance for an hour
		/// For criterion uninterrupted: the minimal length of a break
		/// </summary>
		[JsonPropertyName("duration")]
		public Int32? Duration { get; private set; }

		/// <summary>
		/// For criterion fastest: The minimal distance in meters, e.g 1852 for the fastest mile
		/// For criterion uninterrupted: the maximal distance per Duration to be considered as interruption. It's complicated.
		/// </summary>
		[JsonPropertyName("distance")]
		public Int32? Distance { get; private set; }

		/// <summary>
		/// The labels to show in the gui, an object with a property for each language/2-letter ISO
		/// </summary>
		[JsonPropertyName("labels")]
		public Object Labels { get; set; }

	}
}