using System;
using System.Device.Gpio;
using System.Threading;

using PiLot.GPIO.Devices;
using PiLot.Utils.Logger;
using PiLot.Utils.OS;

namespace PiLot.PowerAPI {

	/// <summary>
	/// The PowerManager is responsible for observing the button, and for 
	/// controlling the Power LED, which indicates the current status, but
	/// also interacts with the button
	/// </summary>
	public class PowerManager: IDisposable {

		private const Int32 PIN_LED = 16;
		private const ConnectionTypes MODE_LED = ConnectionTypes.Ground;
		private const Int32 PIN_BUTTON = 25;
		private const ConnectionTypes MODE_BUTTON = ConnectionTypes.Ground;


		private GpioController controller;
		private LED led;
		Timer timer = null;
		private byte buttonState = 0; // 0: initializing, 1: listening,
									  // 2: pushed, await reboot, 3: pushed, await shutdown,

		/// <summary>
		/// Default constructor.
		/// </summary>
		/// <param name="pController">If you have a GpioController at hand, please pass it. If not, don't worry</param>
		public PowerManager (GpioController pController) {
			if (pController != null) {
				this.controller = pController;
			} else {
				this.controller = new GpioController(PinNumberingScheme.Logical);
			}
			this.led = new LED(this.controller, PIN_LED, MODE_LED);
			new Button(this.controller, PIN_BUTTON, MODE_BUTTON, OnButton);
			this.timer = new Timer(this.OnTimer, null, 4000, Timeout.Infinite);
			this.SayHello();
		}

		public void Dispose() {
			this.timer.Dispose();
			this.led.TurnOff();
			this.led.Dispose();
		}

		/// <summary>
		/// Handles the button event. Depending on the buttonState, magic things happen.
		/// </summary>
		private void OnButton() {
			switch (this.buttonState) {
				case 0: // initializing
					// do nothing
					break;
				case 1: // idle mode
					this.buttonState = 2;
					this.led.TurnOn();		// on: push again, and i will reboot
					this.ResetTimer();
					break;
				case 2: // button pushed, await reboot
					this.Reboot();
					break;
				case 3: // button pushed, await shutdown
					this.ShutDown();
					break;
			}
		}

		private void OnTimer(Object pTimerState) {
			switch (this.buttonState) {
				case 0:
					this.SetIdleState();
					break;
				case 1:
					this.buttonState = 2;
					break;
				case 2:
					this.buttonState = 3;
					this.ResetTimer();
					this.led.Blink(50, 50, 30); // flashing: push again, and i will shut down
					break;
				case 3:
					this.SetIdleState();
					break;
			}
		}

		/// <summary>
		/// goes to the idle state, where the led is flashing but nothing
		/// else is going to happen, therefore we also dont need the timer
		/// either
		/// </summary>
		private void SetIdleState() {
			this.led.Blink(50, 1950);
			this.buttonState = 1;
			this.StopTimer();
		}

		/// <summary>
		/// Resets the timer, which will just make it fire after a while.
		/// </summary>
		private void ResetTimer() {
			this.StopTimer();
			this.timer = new Timer(this.OnTimer, null, 3000, Timeout.Infinite);
		}

		private void StopTimer() {
			if (this.timer != null) {
				this.timer.Dispose();
			}
		}

		/// <summary>
		/// Does some fancy blinking, and then falls back to the default flashing
		/// </summary>
		private void SayHello() {
			this.led.Blink(100, 100, 20);
		}

		private void Reboot() {
			this.StopTimer();
			this.led.TurnOff();
			Logger.Log("Reboot initiated by PowerManager: Button", LogLevels.INFO);
			new SystemHelper().Reboot();
		}

		private void ShutDown() {
			this.StopTimer();
			this.led.TurnOff();
			Logger.Log("Shutdown initiated by PowerManager: Button", LogLevels.INFO);
			new SystemHelper().Shutdown();
		}
	}
}
