using System;
using System.Collections.Generic;
using System.Device.Gpio;
using System.Threading;

namespace PiLot.GPIO.Devices {

	/// <summary>
	/// Represents a LED, which can be turned on, off and blink
	/// </summary>
	public class LED: IDisposable {

		public const Int32 INTERVALMS = 50;

		GpioController controller;
		Int32 pinNumber;
		PinValue valueOn;
		PinValue valueOff;
				
		Boolean isOn = false;
		Timer timer = null;
		private Int32? cycles = null;
		private List<Boolean> pattern = null;
		private Int32 index = -1;

		/// <summary>
		/// Default constructor
		/// </summary>
		/// <param name="pController">Pleaese pass a GpioController, if you have one at hand. Otherwise a new one with logical numbering will be created</param>
		/// <param name="pPinNumber">The Pin number the LED is connected to. Use numbering scheme from pController</param>
		/// <param name="pConnectionType">Plus: the LED is connected to a GPIO Pin and 3.3v, Ground: GPIO and GND</param>
		public LED(GpioController pController, Int32 pPinNumber, ConnectionTypes pConnectionType) {
			if (pConnectionType == ConnectionTypes.Plus) {
				this.valueOn = PinValue.Low;
				this.valueOff = PinValue.High;
			} else {
				this.valueOn = PinValue.High;
				this.valueOff = PinValue.Low;
			}
			this.controller = pController ?? new GpioController(PinNumberingScheme.Logical);
			this.pinNumber = pPinNumber;
			this.controller.OpenPin(this.pinNumber, PinMode.Output);
		}

		/// <summary>
		/// Starts blinking the led, for a certain duration
		/// </summary>
		/// <param name="pOnMS">The on period in MS</param>
		/// <param name="pOffMS">The off period in MS</param>
		/// <param name="pCycles">The number of cycles to blink, null is forever</param>
		public void Blink(Int32 pOnMS, Int32 pOffMS, Int32? pCycles = null) {
			this.StopTimer();
			this.index = -1;
			this.cycles = pCycles;
			this.pattern = new List<Boolean>();
			for(Int32 i = 0; i < pOnMS / INTERVALMS; i++) {
				this.pattern.Add(true);
			}
			for (Int32 i = 0; i < pOffMS / INTERVALMS; i++) {
				this.pattern.Add(false);
			}
			this.StartTimer();
		}

		/// <summary>
		/// Starts blinking the led, for a certain duration
		/// </summary>
		/// <param name="pOnMS">The on period in MS</param>
		/// <param name="pOffMS">The off period in MS</param>
		/// <param name="pCycles">The number of cycles to blink, null is forever</param>
		public void Blink(Double pOnMS, Double pOffMS, Int32? pCycles = null) {
			this.Blink((Int32)pOnMS, (Int32)pOffMS, pCycles);
		}

		/// <summary>
		/// Turns on the LED. Also stops any blinking sequence
		/// </summary>
		public void TurnOn() {
			this.Toggle(true);
			this.StopTimer();
		}

		/// <summary>
		/// Turns of the LED. Also stops any blinking sequence
		/// </summary>
		public void TurnOff() {
			this.Toggle(false);
			this.StopTimer();
		}

		/// <summary>
		/// Turns the LED on, if it's off, and turns it off, if it's on
		/// </summary>
		public void Toggle() {
			this.Toggle(!this.isOn);
		}

		/// <summary>
		/// Turns the LED on or off, based on pTurnOff
		/// </summary>
		/// <param name="pTurnOn">true: turn on, false: turn off</param>
		public void Toggle(Boolean pTurnOn) {
			if (pTurnOn != this.isOn) {
				PinValue pinValue = pTurnOn ? this.valueOn : this.valueOff;
				this.controller.Write(this.pinNumber, pinValue);
				this.isOn = pTurnOn;
			}
		}

		public void Dispose() {
			this.StopTimer();
		}

		/// <summary>
		/// Starts the timer
		/// </summary>
		private void StartTimer() {
			this.timer = new Timer(this.OnTimer, null, 0, INTERVALMS);
		}

		/// <summary>
		/// Stops the timer
		/// </summary>
		private void StopTimer() {
			if (this.timer != null) {
				this.timer.Dispose();
			}
		}

		/// <summary>
		/// Handles the timer event, turns the led on or off, based on 
		/// </summary>
		/// <param name="timerState"></param>
		private void OnTimer(Object timerState) {
			if(this.pattern != null) {
				this.index++;
				if(this.index >= this.pattern.Count) {
					this.index = 0;
					if(this.cycles != null) {
						this.cycles--;
					}
				}
				if ((this.cycles == null) || (this.cycles > 0)) {
					this.Toggle(this.pattern[this.index]);
				} else {
					this.StopTimer();
				}
			} 			
		}
	}
}
