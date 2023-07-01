var PiLot = PiLot || {};
PiLot.Utils = PiLot.Utils || {};

/**
 * This namespace contains some classes helping with audio playback
 * */
PiLot.Utils.Audio = (function () {

	/**
	 * An alarm, that can start and stop.
	 * */
	var Alarm = function () {
		this.audioContext = null;
		this.oscillator = null;
		this.timeout = null;
		this.isStarted = false;
		this.initialize();
	};

	Alarm.playMS = 1000;
	Alarm.pauseMS = 500;

	Alarm.prototype = {

		initialize: function () {
			this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
		},

		/** Starts the alarm */
		start: function () {
			if (!this.isStarted) {
				this.isStarted = true;
				this.soundOn();
			}
		},

		/** Stops the alarm */
		stop: function () {
			this.isStarted = false;
			this.soundOff(false);
		},

		/**
		 * Plays the sound for a second, and makes sure the sound is repeating
		 */
		soundOn: function () {
			this.oscillator = this.audioContext.createOscillator();
			this.oscillator.type = "square";
			this.oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
			this.oscillator.connect(this.audioContext.destination);
			this.oscillator.start();
			this.timeout = window.setTimeout(this.soundOff.bind(this, true), Alarm.playMS);
		},

		/**
		 * Pauses the sound, and optionally restarts it after half a second
		 * @param {Boolean} pDoLoop - If true, the sound will restart after the break
		 */
		soundOff: function (pDoLoop) {
			if (this.oscillator) {
				this.oscillator.stop();
				this.oscillator.disconnect();
				this.oscillator = null;
			}
			window.clearTimeout(this.timeout);
			if (pDoLoop) {
				this.timeout = window.setTimeout(this.soundOn.bind(this), Alarm.pauseMS);
			}
		},



	};

	Alarm.instance = null;

	Alarm.getInstance = function () {
		if (!Alarm.instance) {
			Alarm.instance = new Alarm();
		}
		return Alarm.instance;
	}

	return {
		Alarm: Alarm
	};

})();