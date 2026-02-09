using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;

using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;
using PiLot.Model.Nav;
using PiLot.Data.Nav;
using PiLot.Utils;
using System.Text.Json.Serialization;
using System.Text.Json;

namespace PiLot.Data.Files {

	/// <summary>
	/// Helper class to read and write track points
	/// </summary>
	public class TrackDataConnector2: ITrackDataConnector {

		#region constants

		protected const String DATASOURCENAME = "tracks";
		private const String TRACKFILEFORMAT = "000000.";
		private const String INDEXFILENAME = "index.json";
		private const Int32 TRACKSPERFOLDER = 100;

		#endregion

		#region instance variables

		protected DataHelper helper;
		
		private Object lockObject;
		
		/// <summary>
		/// Cheap singleton using static instances, to minimize write conflicts.
		/// One instance per data root. Not really reliable, but better than nothing.
		/// </summary>
		private static Dictionary<String, TrackDataConnector2> instances = new Dictionary<String, TrackDataConnector2>();
		
		/// <summary>
		/// The cheap singleton default instance for construction without a path 
		/// </summary>
		private static TrackDataConnector2 instance = null;

		#endregion

		#region constructors

		/// <summary>
		/// Creates a new TrackPointDataConnector for the default data root path
		/// </summary>
		protected TrackDataConnector2() {
			this.lockObject = new object();
			this.helper = new DataHelper();
		}

		/// <summary>
		/// Creates a new TrackPointDataConnector for a specific data root path
		/// </summary>
		/// <param name="pDataRoot">root path</param>
		protected TrackDataConnector2(String pDataRoot) {
			this.lockObject = new object();
			this.helper = new DataHelper(pDataRoot);
		}

		/// <summary>
		/// Returns the instance for the default data root, or creates a new one
		/// </summary>
		public static TrackDataConnector2 GetInstance(){
			if(TrackDataConnector2.instance == null){
				TrackDataConnector2.instance = new TrackDataConnector2();
			} 
			return TrackDataConnector2.instance;
		}

		/// <summary>
		/// Returns the instance for the given data root, or creates a new one
		/// </summary>
		/// <param name="pDataRoot">data root path</param>
		public static TrackDataConnector2 GetInstance(String pDataRoot){
			TrackDataConnector2 result;
			if(TrackDataConnector2.instances.ContainsKey(pDataRoot)){
				result = TrackDataConnector2.instances[pDataRoot];
			} else{
				result = new TrackDataConnector2(pDataRoot);
				TrackDataConnector2.instances.Add(pDataRoot, result);
			}
			return result;
		}

		#endregion

		#region public properties

		public Boolean SupportsStatistics {
			get { return false; }
		}

		public Boolean SupportsTrackIDs {
			get { return true; }
		}

		#endregion

		#region public methods

		/// <summary>
		/// Reads the track with a given ID, including all TrackPoints
		/// </summary>
		/// <returns>The track or null</returns>
		public Track ReadTrack(Int32 pTrackId) {
			TrackMetadata metadata = this.ReadTrackMetadata(pTrackId);
			Track result = this.TrackFromMetadata(metadata);
			if(result != null) {
				result.AddTrackPoints(this.ReadTrackPoints(pTrackId));
			}
			return result;
		}

		/// <summary>
		/// Reads all tracks for a certain period from files.
		/// </summary>
		/// <param name="pStartTime">The start time in milliseconds, either UTC or BoatTime</param>
		/// <param name="pEndTime">The end time in milliseconds, either UTC or BoatTime</param>
		/// <param name="pIsBoatTime">If true, pStartTime and pEndTime are BoatTime, else UTC</param>
		/// <param name="pReadTrackPoints">If true, track points will be read</param>
		/// <returns>A list of tracks, can be empty but not null</returns>
		public List<Track> ReadTracks(Int64 pStartTime, Int64 pEndTime, Boolean pIsBoatTime = false, Boolean pReadTrackPoints = false) {
			List<Track> result = new List<Track>();
			List<TrackMetadata> tracksMetaData = this.ReadTracksMetadata(pStartTime, pEndTime, pIsBoatTime);
			foreach (TrackMetadata aTrackMetadata in tracksMetaData){
				Track track = this.TrackFromMetadata(aTrackMetadata);
				if(pReadTrackPoints){
					track.AddTrackPoints(this.ReadTrackPoints(track.ID.Value, pStartTime, pEndTime, pIsBoatTime));
				}
				result.Add(track);
			}
			return result;
		}

		/// <summary>
		/// This should not be called as SupportsStatistics is false. Will throw an exception. 
		/// Only there in order to implement ITrackDataConnector
		/// </summary>
		/// <exception cref="NotImplementedException"></exception>
		public List<Track> FindTracks(Int64 pStart, Int64 pEnd, Boolean pIsBoatTime, String[] pBoats) {
			throw new NotImplementedException("Files based DataConnector does not support statistics. Check SupportsStatistics before calling ReadTrackSegmentTypes()");
		}

		/// <summary>
		/// Returns an iterator that will iterate all tracks, containing metadata
		/// and track points
		/// </summary>
		public IEnumerable<Track> ReadAllTracks(){
			foreach(List<TrackMetadata> anIndex in this.EnumerateTrackIndexes()){
				foreach(TrackMetadata aMetadata in anIndex){
					Track track = this.TrackFromMetadata(aMetadata);
					track.AddTrackPoints(this.ReadTrackPoints(track.ID.Value));
					yield return track;
				}
			}
		}

		/// <summary>
		/// Reads for each day of a month whether we have a track.
		/// </summary>
		/// <param name="pYear">The year</param>
		/// <param name="pMonth">The month of the year, in c#-style (1-based index)</param>
		/// <returns>List of Booleans, a value per day</returns>
		public List<Boolean> ReadTracksMonthInfo(Int32 pYear, Int32 pMonth) {
			List<Boolean> result = new List<Boolean>();
			Date loopDate = new Date(pYear, pMonth, 1);
			List<TrackMetadata> tracksMetaData = this.ReadTracksMetadata(DateTimeHelper.ToJSTime(loopDate), DateTimeHelper.ToJSTime(loopDate.AddMonths(1)), true);
			Boolean hasTrack;
			Int64 minMS, maxMS;
			while (loopDate.Month == pMonth) {
				minMS = DateTimeHelper.ToJSTime(loopDate);
				maxMS = DateTimeHelper.ToJSTime(loopDate.AddDays(1));
				hasTrack = tracksMetaData.Exists(t => t.Overlaps(minMS, maxMS, true));
				result.Add(hasTrack);
				loopDate = loopDate.AddDays(1);
			}
			return result;
		}

		/// <summary>
		/// Saves a track to disk, either by creating a new one, or by updating an existing one. As a special
		/// goodie, this allows inserting tracks with a given ID. Tracks with no TrackPoints will be deleted.
		/// </summary>
		/// <param name="pTrack">The track to save</param>
		public void SaveTrack(Track pTrack) {
			lock (this.lockObject) {
				if (
					  (pTrack.StartUTC != null)
				   && (pTrack.EndUTC != null)
				   && this.ReadTracksMetadata(pTrack.StartUTC.Value, pTrack.EndUTC.Value, false).Exists(t => t.TrackID != pTrack.ID)
			   ) {
					String msg = "TrackDataConnector.SaveTrack: Could not save Track as there is an overlapping Track";
					Logger.Log(msg, LogLevels.ERROR);
					throw new Exception(msg);
				}
				this.SaveTrackMetadata(pTrack);
				this.SaveTrackPoints(pTrack.TrackPoints, pTrack.ID.Value, true, true);
			}			
		}

		/// <summary>
		/// Deletes the track (Metadata and TrackPoints)
		/// </summary>
		public void DeleteTrack(Int32 pTrackId) {
			lock(this.lockObject) {
				this.DeleteTrackMetadata(pTrackId);
				this.DeleteTrackPoints(pTrackId);
			}
		}

		/// <summary>
		/// Sets the boat for a certain track
		/// </summary>
		public void SetBoat(Int32 pTrackId, String pBoat){
			TrackMetadata metadata = this.ReadTrackMetadata(pTrackId);
			metadata.Boat = pBoat;
			metadata.DateChanged = DateTimeHelper.JSNow;
			this.SaveTrackMetadata(metadata);
		}

		/// <summary>
		/// This should not be called as SupportsStatistics is false. Will throw an exception. 
		/// Only there in order to implement ITrackDataConnector
		/// </summary>
		/// <exception cref="NotImplementedException"></exception>
		public List<TrackSegmentType> ReadTrackSegmentTypes() {
			throw new NotImplementedException("Files based DataConnector does not support statistics. Check SupportsStatistics before calling ReadTrackSegmentTypes()");
		}

		/// <summary>
		/// This should not be called as SupportsStatistics is false. Will throw an exception. 
		/// Only there in order to implement ITrackDataConnector
		/// </summary>
		/// <exception cref="NotImplementedException"></exception>
		public List<TrackSegment> ReadTrackSegments(Int32 pTrackId) {
			throw new NotImplementedException("Files based DataConnector does not support statistics. Check SupportsStatistics before calling ReadTrackSegments()");
		}

		/// <summary>
		/// This should not be called as SupportsStatistics is false. Will throw an exception. 
		/// Only there in order to implement ITrackDataConnector
		/// </summary>
		/// <exception cref="NotImplementedException"></exception>
		public List<TrackSegment> FindTrackSegments(Int32 pTypeId, Int64? pStart, Int64? pEnd, Boolean pIsBoatTime, String[] pBoats, Int32 pPageSize) {
			throw new NotImplementedException("Files based DataConnector does not support statistics. Check SupportsStatistics before calling FindTrackSegments()");
		}


		/// <summary>
		/// This should not be called as SupportsStatistics is false. Will throw an exception. 
		/// Only there in order to implement ITrackDataConnector
		/// </summary>
		/// <exception cref="NotImplementedException"></exception>
		public void SaveTrackSegment(TrackSegment pSegment) {
			throw new NotImplementedException("Files based DataConnector does not support statistics. Check SupportsStatistics before calling SaveTrackSegment(TrackSegment)");
		}

		/// <summary>
		/// This should not be called as SupportsStatistics is false. Will throw an exception. 
		/// Only there in order to implement ITrackDataConnector
		/// </summary>
		/// <exception cref="NotImplementedException"></exception>
		public void DeleteTrackSegments(Int32? pTrackId, Int32? pTypeId) {
			throw new NotImplementedException("Files based DataConnector does not support statistics. Check SupportsStatistics before calling DeleteTrackSegments(Int32?, Int32?)");
		}

		/// <summary>
		/// Saves a single TrackPoint by adding it to the corresponding track. If there
		/// is no track, it will be created.
		/// </summary>
		/// <param name="pTrackPoint">The track point to save</param>
		/// <param name="pBoat">The name of the current boat</param>
		/// <returns>The id of the track the TrackPoint was added to</returns>
		public Int32? SaveTrackPoint(TrackPoint pTrackPoint, String pBoat = null) {
			return this.SaveTrackPoints(new List<TrackPoint>{pTrackPoint}, pBoat, null);
		}

		/// <summary>
		/// Saves a list of TrackPoint to disk, using the current track for the given boat, or
		/// creating a new track if there is none. All TrackPoints will be associated with the
		/// same track, defined by the first TrackPoint.
		/// </summary>
		/// <param name="pTrackPoints">The list of track points to save</param>
		/// <param name="pBoat">The name of the current boat</param>
		/// <param name="pTrackId">Optionally pass the track ID, otherwise the track will be found/created</param>
		/// <returns>The id of the track to which the points are added or null, if there are no points</returns>
		public Int32? SaveTrackPoints(List<TrackPoint> pTrackPoints, String pBoat, Int32? pTrackId = null) {
			Int32? trackId = null;
			if (pTrackPoints.Count > 0) {
				lock(this.lockObject){
					if (pTrackId == null) {
						Track track = this.EnsureTrack(pBoat, pTrackPoints[0].UTC, pTrackPoints[0].BoatTime ?? pTrackPoints[0].UTC);
						trackId = track.ID;
					} else {
						trackId = pTrackId;
					}
					this.SaveTrackPoints(pTrackPoints, trackId.Value, false, true);
				}
			}
			return trackId;
		}

		/// <summary>
		/// Deletes all track points between pStartTime and pEndTime from a track.
		/// </summary>
		/// <param name="pTrackId">The track id</param>
		/// <param name="pStart">The js timestamp of the start time</param>
		/// <param name="pEnd">The js timestamp of the end time</param>
		/// <param name="pIsBoatTime">Whether start and end are BoatTime (true) or UTC (fale)</param>
		public void DeleteTrackPoints(Int32 pTrackId, Int64 pStart, Int64 pEnd, Boolean pIsBoatTime) {
			lock(this.lockObject){
				Track track = this.ReadTrack(pTrackId);
				if(track != null){
					track.Cut(pStart, pEnd, pIsBoatTime);
					this.SaveTrackPoints(track.TrackPoints, pTrackId, true, true);
				}
			}
		}

		/// <summary>
		/// Returns the number of days that have a track.
		/// </summary>
		public Int32 ReadDaysWithData() {
			return this.EnumerateTrackMetadata().Where(t => t.StartUTC != null).Count();
		}

		#endregion

		#region private methods
		
		/// <summary>
		/// Gets the root path where track data is stored. The root
		/// will contain directories, each holding an index file and
		/// the raw trackPoints files.
		/// </summary>
		/// <param name="pCreateIfMissing"></param>
		/// <returns></returns>
		private String GetTracksRootPath(Boolean pCreateIfMissing){
			return this.helper.GetDataPath(DATASOURCENAME, pCreateIfMissing);
		}

		/// <summary>
		/// Gets the path of the directory that holds the index file and the trackpoints
		/// for a track with a certain id. Optionally allows to create the directory
		/// </summary>
		/// <param name="pTrackId">The track id</param>
		/// <param name="pCreateIfMissing">Set true, to create the directory</param>
		/// <returns>The absolute path, which might or might not exist</returns>
		private String GetTrackDirectoryPath(Int32 pTrackId, Boolean pCreateIfMissing) {
			String tracksRootPath = this.GetTracksRootPath(pCreateIfMissing);
			String trackDirectoryName = (pTrackId / TRACKSPERFOLDER).ToString("N0");
			String trackDirectoryPath = Path.Combine(tracksRootPath, trackDirectoryName);
			if(pCreateIfMissing && !Directory.Exists(trackDirectoryPath)) {
				Directory.CreateDirectory(trackDirectoryPath);
			}
			return trackDirectoryPath;
		}

		/// <summary>
		/// Gets the absolute path of the index file in a certain directory containing
		/// track data.
		/// </summary>
		/// <param name="pDirectoryPath">The path to the directory holding index and tracks</param>
		/// <returns></returns>
		private String GetTrackIndexPath (String pDirectoryPath){
			return Path.Combine(pDirectoryPath, INDEXFILENAME);
		}

		/// <summary>
		/// Gets the file, where the TrackPoints for one certain track
		/// are or will be stored.
		/// </summary>
		/// <param name="pTrackId">The ID of the track</param>
		/// <param name="pCreateIfMissing">True, to create missing directories</param>
		/// <returns>The absolute path to the file (which might not exist though)</returns>
		private String GetTrackFilePath(Int32 pTrackId, Boolean pCreateIfMissing) {
			String trackDirectoryPath = this.GetTrackDirectoryPath(pTrackId, pCreateIfMissing);
			String fileName = pTrackId.ToString(TRACKFILEFORMAT);
			return Path.Combine(trackDirectoryPath, fileName);
		}

		/// <summary>
		/// Iterates through all index files, assuming that they all reside
		/// in 1st-level subdirectories of the tracks root directory.
		/// </summary>
		/// <returns>An iterator for the content of all index files</returns>
		private IEnumerable<List<TrackMetadata>> EnumerateTrackIndexes(){
			DirectoryInfo tracksRootDirectory = new DirectoryInfo(this.GetTracksRootPath(false));
			if(tracksRootDirectory.Exists){
				foreach(DirectoryInfo aDirectory in tracksRootDirectory.GetDirectories()){
					yield return this.ReadTrackIndex(this.GetTrackIndexPath(aDirectory.FullName));
				}
			}
		}

		/// <summary>
		/// Reads the track index for one directory
		/// </summary>
		/// <param name="pFilePath">The path to the index file</param>
		/// <returns>a List of TrackMetadata, can be empty but never null</returns>
		private List<TrackMetadata> ReadTrackIndex(String pFilePath){
			List<TrackMetadata> result = null;
			if (File.Exists(pFilePath)) {
				String fileContent = File.ReadAllText(pFilePath);
				if (!String.IsNullOrEmpty(fileContent)) {
					try {
						result = JsonSerializer.Deserialize<List<TrackMetadata>>(fileContent);
					}
					catch (Exception ex) {
						Logger.Log($"TrackDataConnector: Error when trying to deserialize tracks index. Exception: {ex.Message}", LogLevels.ERROR);
						throw;
					}
				}
			} 
			if (result == null) {
				result = new List<TrackMetadata>(0);
			}
			return result;
		}

		/// <summary>
		/// Saves the track index (the list of all metadata for one directory) to file.
		/// This requires the path to the file, as it will usually have been read just
		/// before.
		/// </summary>
		/// <param name="pIndex">The complete index for one directory</param>
		/// <param name="pFilePath">The path to the index file</param>
		private void PersistTrackIndex(List<TrackMetadata> pIndex, String pFilePath){
			String json = null;
			try {
				json = JsonSerializer.Serialize(pIndex);
			} catch (Exception ex) {
				Logger.Log($"TrackDataConnector: Error when trying to serialize tracks index. Exception: {ex.Message}", LogLevels.ERROR);
				throw;
			}
			if (json != null) {
				File.WriteAllText(pFilePath, json);
			}
		}

		/// <summary>
		/// Returns an iterator that will iterate all track metadata
		/// </summary>
		private IEnumerable<TrackMetadata> EnumerateTrackMetadata(){
			foreach(List<TrackMetadata> anIndex in this.EnumerateTrackIndexes()){
				foreach(TrackMetadata aMetadata in anIndex){
					yield return aMetadata;
				}
			}
		}

		/// <summary>
		/// Reads the metadata for one specific track. Returns null, if the
		/// track does not exist.
		/// </summary>
		/// <param name="pTrackId">The id of the track</param>
		/// <returns>The metadata or null</returns>
		private TrackMetadata ReadTrackMetadata(Int32 pTrackId){
			String trackIndexPath = this.GetTrackIndexPath(this.GetTrackDirectoryPath(pTrackId, false));
			List<TrackMetadata> trackIndex = this.ReadTrackIndex(trackIndexPath);
			return trackIndex.FirstOrDefault(t => t.TrackID == pTrackId);
		}

		/// <summary>
		/// Reads all track metadata for a certain period from files.
		/// </summary>
		/// <param name="pStartTime">The start time in milliseconds, either UTC or BoatTime</param>
		/// <param name="pEndTime">The end time in milliseconds, either UTC or BoatTime</param>
		/// <param name="pIsBoatTime">If true, pStartTime and pEndTime are BoatTime, else UTC</param>
		/// <param name="pReadTrackPoints">If true, track points will be read</param>
		/// <returns>A list of track metadata, can be empty but not null</returns>
		private List<TrackMetadata> ReadTracksMetadata(Int64 pStartTime, Int64 pEndTime, Boolean pIsBoatTime = false) {
			List<TrackMetadata> result = new List<TrackMetadata>();
			foreach (TrackMetadata aMetadata in this.EnumerateTrackMetadata()) {
				if(aMetadata.Overlaps(pStartTime, pEndTime, pIsBoatTime)){
					result.Add(aMetadata);
				}
			}
			return result;
		}

		/// <summary>
		/// Creates a Track from TrackMetadata. The track will not have any TrackPoints yet.
		/// </summary>
		/// <returns>A Track or null, if the metadata is null</returns>
		private Track TrackFromMetadata(TrackMetadata pMetaData) {
			Track result = null;
			if (pMetaData != null) {
				result = new Track(){
					ID = pMetaData.TrackID,
					StartUTC = pMetaData.StartUTC,
					EndUTC = pMetaData.EndUTC,
					StartBoatTime = pMetaData.StartBoatTime,
					EndBoatTime = pMetaData.EndBoatTime,
					Distance = null,
					Boat = pMetaData.Boat,
					DateCreated = pMetaData.DateCreated,
					DateChanged = pMetaData.DateChanged
				};
			}
			return result;
		}

		/// <summary>
		/// Saves the metadata for pTrack, and assigns the ID if it was null before.
		/// </summary>
		/// <param name="pTrack">The track for which the metadata needs to be saved</param>
		private void SaveTrackMetadata(Track pTrack){
			if(pTrack.ID == null){
				Int32 maxId = 0;
				foreach(TrackMetadata aTrack in this.EnumerateTrackMetadata()){
					maxId = Math.Max(aTrack.TrackID, maxId);
				}
				pTrack.ID = maxId + 1;
			}
			TrackMetadata metadata = new TrackMetadata(pTrack);
			this.SaveTrackMetadata(metadata);
		}

		/// <summary>
		/// Saves the metadata to file, by adding or replacing it in the index.
		/// </summary>
		/// <param name="pTrack">The track for which the metadata needs to be saved</param>
		private void SaveTrackMetadata(TrackMetadata pMetadata){
			String trackIndexPath = this.GetTrackIndexPath(this.GetTrackDirectoryPath(pMetadata.TrackID, true));
			List<TrackMetadata> index = this.ReadTrackIndex(trackIndexPath);
			TrackMetadata metadata = index.FirstOrDefault(m => m.TrackID == pMetadata.TrackID);
			if (metadata == null) {
				index.Add(pMetadata);
			} else {
				metadata.AssignValues(pMetadata);
			}
			this.PersistTrackIndex(index, trackIndexPath);
		}

		/// <summary>
		/// Deletes the metadata for a track from the index, if the track exists in the index.
		/// </summary>
		/// <param name="pTrackId">The track id</param>
		private void DeleteTrackMetadata(Int32 pTrackId){
			String trackIndexPath = this.GetTrackIndexPath(this.GetTrackDirectoryPath(pTrackId, false));
			if (File.Exists(trackIndexPath)) {
				List<TrackMetadata> index = this.ReadTrackIndex(trackIndexPath);
				index.RemoveAll(m => m.TrackID == pTrackId);
				this.PersistTrackIndex(index, trackIndexPath);
			}
		}

		/// <summary>
		/// Returns the track a new TrackPoint should belong to. This is the track that is closer than a
		/// certain time (defined by a constant of the Track class) to the timestamp, and belongs to a 
		/// given boat. If there is no such track, a new one will be created and returned.
		/// </summary>
		/// <param name="pBoat">The boat for which a track is needed</param>
		/// <param name="pUtc">The initial track start/end in utc</param>
		/// <param name="pBoatTime">The initial track start/end in boat time </param>
		/// <returns>The track to which the trackpoins will be added</returns>
		private Track EnsureTrack(String pBoat, Int64 pUtc, Int64 pBoatTime) {
			Track result = null;
			Int64 range = Track.MINGAPSECONDS * 1000;
			Int64 start = pUtc - range;
			Int64 end = pUtc + range;
			result = this.ReadTracks(start, end, false, false)
				.Where(t => (t.Boat == pBoat) && (t.StartUTC != null) && (t.EndUTC != null))
				.OrderBy(t => Math.Min(Math.Abs(pUtc - t.StartUTC.Value), Math.Abs(pUtc - t.EndUTC.Value)))
				.FirstOrDefault();
			if (result == null) {
				result = new Track() {
					StartBoatTime = pBoatTime,
					EndBoatTime = pBoatTime,
					Boat = pBoat,
					DateCreated = DateTimeHelper.JSNow,
					DateChanged = DateTimeHelper.JSNow
				};
				this.SaveTrackMetadata(result);
			}
			return result;
		} 

		/// <summary>
		/// Reads the trackpoints from file. Use this, if you have the file path
		/// at hand, otherwise use the version taking the track id.
		/// </summary>
		/// <param name="pFilePath">The path to the file holding the records</param>
		/// <param name="pStartTime">Optional, milliseconds UTC or BoatTime</param>
		/// <param name="pEndTime">Optional, milliseconds UTC or BoatTime</param>
		/// <param name="pIsBoatTime">Defines whether pStart and pEnd are boat time or UTC</param>
		/// <returns>A list of track points, can be empty but not null</returns>
		private List<TrackPoint> ReadTrackPoints(String pFilePath, Int64? pStartTime, Int64? pEndTime, Boolean? pIsBoatTime) {
			List<TrackPoint> result = new List<TrackPoint>();
			if (File.Exists(pFilePath)) {
				try {
					foreach (String aLine in File.ReadLines(pFilePath)) {
						TrackPoint trackPoint = TrackPoint.FromString(aLine);
						if (trackPoint != null && trackPoint.IsInPeriod(pStartTime, pEndTime, pIsBoatTime)) {
							result.Add(trackPoint);
						}
					};
				} catch (Exception ex) {
					Logger.Log(ex, $"Reading trackpoint data from file {pFilePath}");
				}
			}
			return result;
		}

		/// <summary>
		/// Reads the track points from a file
		/// </summary>
		/// <param name="pTrackId">the id of the track</param>
		/// <returns>A list of TrackPoint, can be empty, but not null</returns>
		protected List<TrackPoint> ReadTrackPoints(Int32 pTrackId, Int64? pStartTime = null, Int64? pEndTime = null, Boolean? pIsBoatTime = null) {
			String filePath = this.GetTrackFilePath(pTrackId, false);
			return this.ReadTrackPoints(filePath, pStartTime, pEndTime, pIsBoatTime);
		}

		/// <summary>
		/// Saves trackpoints to file, either by adding them or by replacing the entire track. If there are no
		/// track points, the file for the track points will be deleted.
		/// </summary>
		/// <param name="pTrack">The track for which we save the data</param>
		/// <param name="pReplaceExisting">Set true, if the existing trackPoints should be replaced</param>
		/// <param name="pDoUpdateMetadata">If true, track start and end will be updated in the index file</param>
		private void SaveTrackPoints(List<TrackPoint> pTrackPoints, Int32 pTrackId, Boolean pReplaceExisting, Boolean pDoUpdateMetadata) {
			String trackFilePath = this.GetTrackFilePath(pTrackId, true);
			List<TrackPoint> trackPoints;
			if (!pReplaceExisting){
				trackPoints = this.ReadTrackPoints(trackFilePath, null, null, null);
				trackPoints.AddRange(pTrackPoints);
			} else {
				trackPoints = pTrackPoints;
			}
			if (trackPoints.Count > 0) {
				trackPoints.Sort();
				String[] lines = trackPoints.Select(r => r.ToString()).ToArray();
				File.WriteAllLines(trackFilePath, lines);
			} else {
				this.DeleteTrackPoints(pTrackId);
			}			
			if(pDoUpdateMetadata){
				TrackMetadata metaData = this.ReadTrackMetadata(pTrackId);
				TrackPoint trackPoint = trackPoints.FirstOrDefault();
				metaData.StartUTC = trackPoint?.UTC;
				metaData.StartBoatTime = trackPoint?.BoatTime ?? trackPoint?.UTC;
				trackPoint = trackPoints.LastOrDefault();
				metaData.EndUTC = trackPoint?.UTC;
				metaData.EndBoatTime = trackPoint?.BoatTime ?? trackPoint?.UTC;
				this.SaveTrackMetadata(metaData);
			}
		}

		/// <summary>
		/// Deletes the file containing the trackpoints for a track
		/// </summary>
		/// <param name="pTrackId">The track id</param>
		private void DeleteTrackPoints(Int32 pTrackId){
			String filePath = this.GetTrackFilePath(pTrackId, false);
			if(File.Exists(filePath)) {
				File.Delete(filePath);
			}
		}

		#endregion

		#region classes

		/// <summary>
		/// Represents the metadata for a track that is stored in the index file.
		/// </summary>
		internal class TrackMetadata{

			public TrackMetadata(){}

			internal TrackMetadata(Track pTrack){
				Assert.IsNotNull(pTrack.ID, "Can not create TrackIndexData from track having ID null");
				this.TrackID = pTrack.ID.Value;
				this.StartUTC = pTrack.StartUTC;
				this.EndUTC = pTrack.EndUTC;
				this.StartBoatTime = pTrack.StartBoatTime;
				this.EndBoatTime = pTrack.EndBoatTime;
				this.Boat = pTrack.Boat;
			}

			[JsonPropertyName("trackId")]
			public Int32 TrackID {
				get; set;
			}

			[JsonPropertyName("startUtc")]
			public Int64? StartUTC {
				get; set;
			}

			[JsonPropertyName("endUtc")]
			public Int64? EndUTC {
				get; set; 
			}

			[JsonPropertyName("startBoatTime")]
			public Int64? StartBoatTime {
				get; set;
			}

			[JsonPropertyName("endBoatTime")]
			public Int64? EndBoatTime {
				get; set;
			}

			[JsonPropertyName("boat")]
			public String Boat {
				get; set;
			}

			[JsonPropertyName("dateCreated")]
			public Int64? DateCreated {
				get; set;
			}

			[JsonPropertyName("dateChanged")]
			public Int64? DateChanged {
				get; set;
			}

			/// <summary>
			/// Assigns the data from the another TrackMetadata object, allowing
			/// to update metadata within the index, not needing to replace it.
			/// </summary>
			/// <param name="pOther">The metadata from which the values will be copied</param>
			internal void AssignValues(TrackMetadata pOther){
				this.StartUTC = pOther.StartUTC;
				this.EndUTC = pOther.EndUTC;
				this.StartBoatTime = pOther.StartBoatTime;
				this.EndBoatTime = pOther.EndBoatTime;
				this.Boat = pOther.Boat;
			}

			/// <summary>
			/// Returns true, if this overlaps the period defined by pStartTime and pEndTime. If this
			/// has no start or no end, it does not overlap with anything.
			/// </summary>
			/// <param name="pStartTime">Start time in ms</param>
			/// <param name="pEndTime">End time in ms</param>
			/// <param name="pIsBoatTime">True to treat start and end as boattime, else it's UTC</param>
			/// <returns></returns>
			internal Boolean Overlaps (Int64 pStartTime, Int64 pEndTime, Boolean pIsBoatTime){
				Boolean result;
				if((this.StartUTC != null) && (this.EndUTC != null)) {
					Int64 trackStart = pIsBoatTime ? this.StartBoatTime.Value : this.StartUTC.Value;
					Int64 trackEnd = pIsBoatTime ? this.EndBoatTime.Value : this.EndUTC.Value;
					result = DateTimeHelper.Overlaps(trackStart, trackEnd, pStartTime, pEndTime);
				} else {
					result = false;
				}
				return result;				
			}
		}

		#endregion
	}
}
