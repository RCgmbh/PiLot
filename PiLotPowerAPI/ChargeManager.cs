using System;
using System.Collections.Generic;
using System.Device.Gpio;
using System.Linq;
using System.Threading;
using PiLot.PowerAPI.Devices;
using PiLot.Utils.DateAndTime;

namespace PiLot.PowerAPI {

	/// <summary>
	/// This class makes the charge LED light or flash, depending on the current
	/// charging state. It also provides information about the current charging state.
	/// 
	/// Charging: LED flashes, the shorter the off-interval, the fuller the battery
	/// Charging, Battery full: LED is steady on
	///	Device is Battery powerded: like charging, but twice as fast
	/// Charger not powered: LED is off
	/// </summary>
	public class ChargeManager: IDisposable {

		private const Int32 PIN_LED = 26;
		private const ConnectionTypes MODE_LED = ConnectionTypes.Ground;
		private const Int32 TIMERMS = 2000;
		private const Int32 MEDIANINTERVAL = 10;
		private const Double MAXVOLTAGE = 4.3;
		private const Double MINVOLTAGE = 3.6;

		private LED led = null;
		private GPIOManager gpioManager = null;
		private ADC0832 adc = null;
		private Double? currentBlinkProportion = null;  // this stores the current blinking mode of the led
		private Timer timer = null;
		private List<(Int32, Byte)> adcMeasurements = null; // list of measurements with timestamp (seconds), measurement
		private Byte currentChargeState = 0;

		/// <summary>
		/// Default constructor, expecting a GpioController
		/// </summary>
		/// <param name="pController">A GpioController, not null</param>
		public ChargeManager(GpioController pController) {
			this.led = new LED(pController, PIN_LED, MODE_LED);
			this.gpioManager = GPIOManager.Instance;
			this.adc = new ADC0832(pController);
			this.adcMeasurements = new List<(Int32, Byte)>();
			this.SayHello();
			this.timer = new Timer(new TimerCallback(this.OnTimer), null, 4000, TIMERMS);
		}

		/// <summary>
		/// Gets the current voltage, which is based on the median of the
		/// most recently read values from the ADC. If there is no data,
		/// it will return null
		/// </summary>
		public Double? CurrentVoltage {
			get {
				Double? result = null;
				if(this.currentChargeState != 0) {
					if(this.gpioManager.IsCharging) {
						result = (Double)this.currentChargeState / 50 - 0.25;
					} else {
						result = (Double)this.currentChargeState / 60 + 0.6;
					}
				}
				return result;
			}
		}

		/// <summary>
		/// Gets the current the median of the most recent readings from the ADC.
		/// If there is no data, it will return 0
		/// </summary>
		public Double? CurrentADCValue {
			get {
				return this.currentChargeState;
			}
		}

		public void Dispose() {
			this.timer.Dispose();
			this.led.TurnOff();
			this.led.Dispose();
		}

		private void OnTimer(Object pTimerState) {
			this.MeasureChargeState();
			this.ShowState();
		}

		/// <summary>
		/// Does some fancy blinking
		/// </summary>
		private void SayHello() {
			this.led.Blink(100, 100, 20);
		}

		/// <summary>
		/// Shows the charging state using the LED. The state of the led is only changed, 
		/// if something has changed, thereby trying to avoid too much flickering.
		/// </summary>
		private void ShowState() {
			Boolean charging = this.gpioManager.IsCharging;
			Boolean standby = this.gpioManager.IsChargingStandby;
			Boolean batteryPowered = !(this.gpioManager.IsUSBPowered || this.gpioManager.IsWirelessPowered);
			if (charging) {
				Double blinkProportion = this.GetBlinkProportion();
				if (this.currentBlinkProportion != blinkProportion) {
					this.currentBlinkProportion = blinkProportion;
					this.led.Blink(TIMERMS * blinkProportion, TIMERMS * (1 - blinkProportion));
				}
			} else if (standby) {
				if (this.currentBlinkProportion != TIMERMS) {
					this.led.TurnOn();
					this.currentBlinkProportion = TIMERMS;
				}
			} else if (batteryPowered) {
				Double blinkProportion = this.GetBlinkProportion();
				//Console.WriteLine($"blinkProportion: {blinkProportion}");
				if (this.currentBlinkProportion != blinkProportion) {
					this.currentBlinkProportion = blinkProportion;
					this.led.Blink(TIMERMS / 2 * blinkProportion, TIMERMS / 2 * (1 - blinkProportion));
				}
			} else { 
				if (this.currentBlinkProportion != 0) {
					this.led.TurnOff();
					this.currentBlinkProportion = 0;
				}
			}
		}

		/// <summary>
		/// Reads the data from the ADC, then calculates the current charge state as
		/// median of the charge states from the last x seconds. This is called by
		/// the timer, so it does not need to be called anywhere else
		/// </summary>
		private void MeasureChargeState() {
			Int32 utcNow = DateTimeHelper.UnixNow;
			this.adcMeasurements.Add((utcNow, this.adc.Read()));
			Int32 minTime = utcNow - MEDIANINTERVAL;
			this.adcMeasurements.RemoveAll(i => i.Item1 < minTime);
			this.currentChargeState = this.Median(this.adcMeasurements.Select(i => i.Item2).ToList());
		}

		/// <summary>
		/// Returns the median value of a cuple of bytes
		/// </summary>
		/// <param name="pBytes"></param>
		/// <returns></returns>
		private Byte Median(List<Byte> pBytes) {
			Byte result = 0;
			if (pBytes.Count > 0) {
				pBytes.Sort();
				if ((pBytes.Count % 2) == 0) {
					result = (Byte)((
						  pBytes[(pBytes.Count) / 2]
						+ pBytes[(pBytes.Count / 2) - 1]
					) / 2);
				} else {
					result = pBytes[(pBytes.Count - 1) / 2];
				}
			}
			return result;
		}

		/// <summary>
		/// This returns a value which can be used to determine the blink pattern. The
		/// higher the battery volate, the longer the on-period is in relation to the
		/// off-period. This returns the on-period as a fraction of 1, rounded to 0.05
		/// </summary>
		private Double GetBlinkProportion() {
			//Console.WriteLine($"adc: {adcValue}");
			Double result = (this.CurrentVoltage - MINVOLTAGE) / (MAXVOLTAGE - MINVOLTAGE) ?? 0;
			result = Math.Round(result * 20) / 20;
			return Math.Min(Math.Max(result, 0), 1);
		}
	}
}
