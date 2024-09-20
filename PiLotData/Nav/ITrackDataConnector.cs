using System;
using System.Collections.Generic;

using PiLot.Model.Nav;

namespace PiLot.Data.Nav {

	public interface ITrackDataConnector {

		/// <summary>
		/// Returns true, if an implementation of the interface supports track ids.
		/// It mus be checked before calling any operation that depends on track ids
		/// which might otherwise throw a not implemented exception.
		/// </summary>
		Boolean SupportsTrackIDs { get; }

		/// <summary>
		/// Returns true, if an implementation of the interface supports statistics
		/// (analyzed track segments per track). It mus be checked before calling
		/// any statistics-specific operation, which might otherwise throw a not
		/// implemented exception.
		/// </summary>
		Boolean SupportsStatistics { get; }

		/// <summary>
		/// Reads a track based on the ID. Will only be implemented if SupportTrackIDs=true
		/// </summary>
		/// <returns>The track including its track points or null</returns>
		Track ReadTrack(Int32 pTrackId);

		/// <summary>
		/// Returns all tracks that overlap with a certain time period
		/// </summary>
		/// <param name="pStart">Start of the period in ms since epoc</param>
		/// <param name="pEnd">End of the period in ms since epoc</param>
		/// <param name="pIsBoatTime">True, to treat start/end as Boattime, false for UTC</param>
		/// <param name="pReadTrackPoints">True to also read all trackpoints. False by default</param>
		/// <returns>A list of tracks, can be empty, but not null</returns>
		List<Track> ReadTracks(Int64 pStart, Int64 pEnd, Boolean pIsBoatTime, Boolean pReadTrackPoints);

		/// <summary>
		/// Reads for each day of a month whether there is a track.
		/// </summary>
		/// <param name="pYear">The year</param>
		/// <param name="pMonth">The month of the year, in c#-style (1-based index)</param>
		/// <returns>List of Booleans, one value for each day</returns>
		List<Boolean> ReadTracksMonthInfo(Int32 pYear, Int32 pMonth);

		/// <summary>
		/// Saves a new track, replaces overlapping data. If TrackID is supported,
		/// the id must be null and will be set.
		/// </summary>
		/// <param name="pTrack">The track to save</param>
		void SaveTrack(Track pTrack);

		/// <summary>
		/// Deletes a track, if it exists. Will only be implemented if SupportTrackIDs=true
		/// </summary>
		/// <param name="pTrackId">The track id</param>
		void DeleteTrack(Int32 pTrackId);

		/// <summary>
		/// Saves the name of the boat for a track
		/// </summary>
		/// <param name="pTrackId">The track id, not null</param>
		/// <param name="pBoat">The boat name</param>
		void SetBoat(Int32 pTrackId, String pBoat);

		/// <summary>
		/// Reads all track segment types. Will only be implemented if SupportStatistics=true
		/// </summary>
		/// <returns>List of TrackSegmentType, can be empty but not null</returns>
		List<TrackSegmentType> ReadTrackSegmentTypes();

		/// <summary>
		/// Reads all TrackSegments that belong to a certain track. Will only be
		/// implemented if SupportStatistics=true
		/// </summary>
		/// <param name="pTrackId">The id of the track</param>
		/// <returns>A list of TrackSegment, can be empty but not null</returns>
		List<TrackSegment> ReadTrackSegments(Int32 pTrackId);

		/// <summary>
		/// Returns a list of TrackSegments for a certain time, optionally filtered by time
		/// and boats. If start and end are passed, all segments that overlap with the
		/// period start-end are returned. If any of the values is null, there will be no
		/// limitation in that direction.
		/// </summary>
		/// <param name="pTypeId">The track type ID</param>
		/// <param name="pStart">Start of the search period in ms</param>
		/// <param name="pEnd">End of the search period in ms</param>
		/// <param name="pIsBoatTime">Whether to search based on UTC (false) or BoatTime</param>
		/// <param name="pBoats">A list of boats to filter by, can be null</param>
		/// <param name="pPageSize">The maximum number of results to return</param>
		/// <returns>a list of TrackSegment, can be empty but not null</returns>
		List<TrackSegment> FindTrackSegments(Int32 pTypeId, Int64? pStart, Int64? pEnd, Boolean pIsBoatTime, String[] pBoats, Int32 pPageSize);

		/// <summary>
		/// Saves a track segment. Any existing segment for the same track and type
		/// will be replaced. Will only be implemented if SupportStatistics=true
		/// </summary>
		/// <param name="pSegment">The TrackSegment to save</param>
		void SaveTrackSegment(TrackSegment pSegment);

		/// <summary>
		/// Deletes TrackSegments, for one or all tracks, for one or all types.
		/// Will only be implemented if SupportStatistics=true
		/// </summary>
		/// <param name="pTrackId">The track id, if segments for one track should be deleted</param>
		/// <param name="pTypeId">The type id, if segments of one type should be deleted</param>
		void DeleteTrackSegments(Int32? pTrackId, Int32? pTypeId);

		/// <summary>
		/// Saves a TrackPoint
		/// </summary>
		/// <param name="pTrackPoint">The TrackPoint to save</param>
		/// <param name="pBoat">The name of the boat being used</param>
		/// <returns>if SupportTrackIDs = true: the id of the track the point is added to, -1 else, null if nothing was saved</returns>
		Int32? SaveTrackPoint(TrackPoint pTrackPoint, String pBoat);

		/// <summary>
		/// Saves a list of TrackPoint. All TrackPoints will be associated with the
		/// same track, defined by the first TrackPoint.
		/// </summary>
		/// <param name="pTrackPoints">The list of track points to save</param>
		/// <param name="pBoat">The name of the current boat</param>
		/// <param name="pTrackId">Optionally pass a TrackId</param>
		/// <returns>if SupportTrackIDs = true: the id of the track the point is added to, -1 else, null if nothing was saved</returns>
		Int32? SaveTrackPoints(List<TrackPoint> pTrackPoints, String pBoat, Int32? pTrackId = null);

		/// <summary>
		/// Deletes a range of trackpoints from a track
		/// </summary>
		/// <param name="pTrackId">The track id, must be -1 if SupportTrackIDs = false</param>
		/// <param name="pStart">The js timestamp of the start time</param>
		/// <param name="pEnd">The js timestamp of the end time</param>
		/// <param name="pIsBoatTime">Whether start and end are BoatTime (true) or UTC (fale)</param>
		void DeleteTrackPoints(Int32 pTrackId, Int64 pStart, Int64 pEnd, Boolean pIsBoatTime);
	}
}
