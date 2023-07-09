using System;
using System.Device.Gpio;
using System.Threading;

namespace PiLot.GPIO.Devices {

	/// <summary>
	/// This represents an ADC0832 and allows to read the values. Code is taken from 
	/// https://www.heinrichhartmann.com/blog/2014/12/14/sensor-monitoring-with-raspberrypi-and-circonus,
	/// added some delays (which will make it a bit slow, but performance does not count so much here).
	/// Does not use SPI from System.Device.Spi, as this somehow did not work. So we send and read
	/// the bytes manually.
	/// </summary>
	public class ADC0832 {

		private const int PIN_CS = 8;
		private const int PIN_CLK = 11;
		private const int PIN_DO = 9;
		private const int PIN_DI = 10;

		private GpioController controller = null;

		public ADC0832(GpioController pController) {
			this.controller = pController;
			this.controller.OpenPin(PIN_CS, PinMode.Output);
			this.controller.OpenPin(PIN_CLK, PinMode.Output);
			this.controller.OpenPin(PIN_DO, PinMode.Input);
			this.controller.OpenPin(PIN_DI, PinMode.Output);
		}

		/// <summary>
		/// Sends a bit by setting DI high or low, and calling the clock
		/// </summary>
		private void SendBit(Boolean pBit) {
			this.controller.Write(PIN_DI, pBit ? PinValue.High : PinValue.Low);
			this.SendClock();
		}

		/// <summary>
		/// Sends a clock impluse by setting high and low
		/// </summary>
		private void SendClock() {
			this.controller.Write(PIN_CLK, PinValue.High);
			this.controller.Write(PIN_CLK, PinValue.Low);
			Thread.Sleep(1);
		}
		
		/// <summary>
		/// Reads the Data from DO
		/// </summary>
		/// <returns></returns>
		public Byte Read() {

			this.controller.Write(PIN_CS, PinValue.High);
			this.controller.Write(PIN_CS, PinValue.Low);

			this.controller.Write(PIN_CLK, PinValue.Low);
			this.SendBit(true);
			this.SendBit(true);
			this.SendBit(false);


			Byte result = 0;
			for (int i = 0; i < 8; i++) {
				this.SendClock();
				result <<= 1; // shift bit
				if (this.controller.Read(PIN_DO) == PinValue.High) {
					result |= 0x1; // set first bit
					Thread.Sleep(1);
				}
			}

			this.controller.Write(PIN_CS, PinValue.High);

			return result;
		}		
	}
}
