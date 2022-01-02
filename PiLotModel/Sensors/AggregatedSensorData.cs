using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

using PiLot.Model.Common;
using PiLot.Utils;

namespace PiLot.Model.Sensors {

	/// <summary>
	/// This represents the result from a query for aggregated sensor data,
	/// which is data where multiple measurements are combined into larger
	/// chunks, using Median. It also contains information about boatTime,
	/// as the aggregated data does not natively have boatTime information.
	/// </summary>
	public class AggregatedSensorData {

		private List<SensorDataRecord> rawData = null;

		/// <summary>
		/// The duration one cluster of aggregated data covers, in seconds
		/// </summary>
		private Int32 aggregateSeconds;

		/// <summary>
		/// the utcTimestamp of the beginning of the series. From here to endTime,
		/// we will have 
		/// </summary>
		private Int32 startTime;

		private Int32 endTime;


		/// <summary>
		/// Creates a new Object and immediately processes the data. Couldn't be easier.
		/// </summary>
		/// <param name="pRawData">A list of SensorDataRecords to process, not null</param>
		/// <param name="pStartTime">The reference time for the groups, each group starts at pStartTime + n*pAggregateSeconds, in seconds utc</param>
		/// <param name="pEndTime">The end time, being the time of the last group, as seconds from epoc utc</param>
		/// <param name="pAggregateSeconds">The duration for which data should be aggregated into one value</param>
		public AggregatedSensorData(List<SensorDataRecord> pRawData, Int32 pStartTime, Int32 pEndTime, Int32 pAggregateSeconds) {
			Assert.IsNotNull(pRawData);
			Assert.IsTrue(pAggregateSeconds > 0, $"pAggregateSeconds must be more than 0, actual value was {pAggregateSeconds}");
			this.rawData = pRawData;
			this.startTime = pStartTime;
			this.endTime = pEndTime;
			this.aggregateSeconds = pAggregateSeconds;
			this.ProcessData();
		}

		/// <summary>
		/// Gets the list of timestamp/value tuples, where timestamp is Seconds from
		/// epoc, and the value is the median of all aggregated values, or it might be
		/// null. We use an array, because this is quite lightweight to serialize
		/// </summary>
		[JsonPropertyName("values")]
		public List<Double?[]> Values { get; private set; } = null;

		/// <summary>
		/// Gets the list of boatTime offsets, indicating the boatTime offset which was
		/// valid during a certain period of time.
		/// </summary>
		[JsonPropertyName("boatTimeOffsets")]
		public List<BoatTimeOffset> BoatTimeOffsets { get; private set; } = null;

		/// <summary>
		/// Processes the data by aggregating the values and saving the BoatTimeOffsets. It goes
		/// through each value, and decides into which cluster it belongs (index). In a second
		/// processing step, it calculates the median and stores the value together with the timestamp.
		/// The timestamp is the middle of the group, calculated using half the aggreateSeconds 
		/// </summary>
		private void ProcessData() {
			this.BoatTimeOffsets = new List<BoatTimeOffset>();
			this.Values = new List<Double?[]>();
			Double resultLength = (this.endTime - this.startTime) / this.aggregateSeconds;
			List<Double?>[] groupedValues = new List<Double?>[(Int32)Math.Ceiling(resultLength)];
			Int32 index = 0;						// the index of the group of data where the current value fits in
			Int32 boatTimeOffsetSeconds;			// the boatTimeOffset of the currently processed record, in seconds
			Int32? lastBoatTimeOffsetSeconds = null;				// the last boatTimeOffset, needed to keep track of changes
			List<Double?> aggregateValues = new List<Double?>();	// the list of values to be consolidated into one value
			foreach (SensorDataRecord aRecord in this.rawData) {
				if (aRecord.Value != null) {
					index = (Int32)Math.Floor((aRecord.UTC - this.startTime) / (Double)aggregateSeconds);
					if (groupedValues[index] == null) {
						groupedValues[index] = new List<Double?>();
					}
					groupedValues[index].Add(aRecord.Value.Value);
				}
				boatTimeOffsetSeconds = aRecord.BoatTime - aRecord.UTC;
				Int32? utc = null;					
				if((lastBoatTimeOffsetSeconds == null) || (lastBoatTimeOffsetSeconds.Value != boatTimeOffsetSeconds)) {
					if(lastBoatTimeOffsetSeconds != null) {		// we want the first BoatTimeOffset to have utc = null so it serves as default.
						utc = aRecord.UTC;
					}
					this.BoatTimeOffsets.Add(new BoatTimeOffset(utc, (Int32)(boatTimeOffsetSeconds / 60)));
					lastBoatTimeOffsetSeconds = boatTimeOffsetSeconds;
				}
			}
			for(var i = 0; i < groupedValues.Length; i++) {
				this.ProcessValues(groupedValues[i], i);
			}
		}

		/// <summary>
		/// adds a new item to this values, by calculating the median of a list of values,
		/// and the timestamp based on 
		/// </summary>
		/// <param name="pValues"></param>
		/// <param name="pIndex"></param>
		private void ProcessValues(List<Double?> pValues, Int32 pIndex) {
			Double? median = this.Median(pValues);
			if (median != null) {
				median = Math.Round(median.Value, 2);
			}
			this.Values.Add(new Double?[2] { this.startTime + (this.aggregateSeconds * pIndex) + aggregateSeconds / 2, median });
		}

		/// <summary>
		/// Returns the median number of a list of doubles or null, if the list contains
		/// no non-null values
		/// </summary>
		private Double? Median(List<Double?> pData) {
			Double? result = null;
			if (pData != null) {
				List<Double?> nonNullData = pData.FindAll(d => d != null);
				if (nonNullData.Count > 0) {
					nonNullData.Sort();
					if ((nonNullData.Count % 2) == 0) {
						result = (
							  nonNullData[(nonNullData.Count) / 2]
							+ nonNullData[(nonNullData.Count / 2) - 1]
						) / 2;
					} else {
						result = nonNullData[(nonNullData.Count - 1) / 2];
					}
				}
			}
			return result;
		}
	}
}
