using System;
using System.Device.Gpio;

namespace PiLot.PowerAPI {

	/// <summary>
	/// Singleton class providing access to the GPIOs we use to read 
	/// power data.
	/// </summary>
	public class GPIOManager {

		public const Int32 PIN_USB = 23;		// the pin is pulled up when USB-powered
		public const Int32 PIN_WIRELESS = 24;   // the pin is pulled up when wireless powered
		public const Int32 PIN_CHG = 5;         // the pin is pulled down when the Li-Po charger is charging
		public const Int32 PIN_STB = 6;			// the pin is pulled down when the Li-Po charger is on standby

		#region static
		private static GPIOManager instance = null;

		/// <summary>
		/// Gets the singleton instance 
		/// </summary>
		public static GPIOManager Instance {
			get {
				if (GPIOManager.instance == null) {
					GPIOManager.instance = new GPIOManager();
				}
				return GPIOManager.instance;
			}
		}
		#endregion

		private GpioController controller = null;

		/// <summary>
		/// Private constructor
		/// </summary>
		private GPIOManager() {
			this.controller = new GpioController(PinNumberingScheme.Logical);
			this.controller.OpenPin(PIN_USB, PinMode.Input);
			this.controller.OpenPin(PIN_WIRELESS, PinMode.Input);
			this.controller.OpenPin(PIN_CHG, PinMode.InputPullUp);
			this.controller.OpenPin(PIN_STB, PinMode.InputPullUp);
		}

		/// <summary>
		/// Gets the GpioController, which can be re-used for other stuffs
		/// </summary>
		public GpioController GpioController {
			get { return this.controller; }
		}

		/// <summary>
		/// Returns whether the device is currently USB powered
		/// </summary>
		public Boolean IsUSBPowered {
			get { return this.controller.Read(PIN_USB) == PinValue.High; }
		}

		/// <summary>
		/// Returns whether the device is currently powered by wireless magic
		/// </summary>
		public Boolean IsWirelessPowered {
			get { return this.controller.Read(PIN_WIRELESS) == PinValue.High; }
		}

		/// <summary>
		/// Returns whether the Battery is being charged and not full
		/// </summary>
		public Boolean IsCharging {
			get { return this.controller.Read(PIN_CHG) == PinValue.Low; }
		}

		/// <summary>
		/// Returns whether the Battery is being charged, but full
		/// </summary>
		public Boolean IsChargingStandby {
			get { return this.controller.Read(PIN_STB) == PinValue.Low; }
		}
	}
}
