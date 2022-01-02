namespace PiLot.Sensors {

	/// <summary>
	/// Interface to be implemented by everything that calls itself a Device.
	/// A Device contains one or many sensors, which provide measurements for
	/// one single factor, such as temperature, humidity etc.
	/// </summary>
	interface IDevice {

		/// <summary>
		/// This tells the Sensor to do whatever it needs to do. The sensor itself
		/// needs to decide wheter it's up for a new reading or not.
		/// </summary>
		void TimerTask();

	}
}
