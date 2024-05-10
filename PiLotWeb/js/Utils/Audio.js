var PiLot = PiLot || {};
PiLot.Utils = PiLot.Utils || {};

/**
 * This namespace contains some classes helping with audio playback
 * */
PiLot.Utils.Audio = (function () {

	/**
	 * An alarm, that can start and stop. And play different melodies
	 * */
	var Alarm = function () {
		this.audioContext = null;
		this.oscillator = null;
		this.timeout = null;
		this.melody = null;
		this.noteIndex = 0;
		this.initialize();
	};

	Alarm.panic = [[523, 125], [659, 125]];
	Alarm.danger = [[523, 500], [0, 250], [659, 500], [0, 250]];
	Alarm.attention = [[523, 250], [659, 250], [783, 500], [0, 2000]]; //C-E-G
	Alarm.attention2 = [[523, 420], [622, 200], [783, 500], [0, 2000]]; //C-Eb-G
	Alarm.hint = [[523, 125], [0, 125], [523, 125], [0, 2500]]; 

	Alarm.prototype = {

		initialize: function () { 
			document.body.addEventListener('mousedown', this.document_interact.bind(this), {once:true});
			document.body.addEventListener('pointerdown', this.document_interact.bind(this), {once:true});
		},

		/**
		 * Because starting a sound without user interaction is not allowed, we check
		 * at user interaction, if the audioContext is suspended, and if so, resume it.
		 * */
		document_interact: function () { 
			if(this.audioContext && this.audioContext.state === "suspended"){
				this.audioContext.resume();
			}
		},

		/** Starts the alarm */
		start: function (pMelody) {
			if (pMelody) {
				this.audioContext = this.audioContext || new (window.AudioContext || window.webkitAudioContext)();
				if (pMelody !== this.melody) {
					this.melody = pMelody;
					this.noteIndex = 0;
					this.timeout && window.clearTimeout(this.timeout);
					this.playNextNote();
				}
			} else {
				this.stop();
			}
		},

		/** Stops the alarm */
		stop: function () {
			this.timeout && window.clearTimeout(this.timeout);
			this.melody = null;
			this.soundOff(false);
		},

		/** Plays the note for the current index, and sets a timeout to continue afterwards */
		playNextNote: function () {
			this.timeout && window.clearTimeout(this.timeout);
			const note = this.melody[this.noteIndex];
			this.noteIndex = (this.noteIndex + 1) % this.melody.length;
			this.playSound(note[0]);
			this.timeout = window.setTimeout(this.playNextNote.bind(this), note[1]);			
		},

		/**
		 * Plays the sound with a certain frequency. 0 works fine
		 * @param {Number} pFrequency - the frequency in hertz
		 */
		playSound: function (pFrequency) {
			if (!this.oscillator) {
				this.oscillator = this.audioContext.createOscillator();
				this.oscillator.type = "triangle";
				this.oscillator.connect(this.audioContext.destination);
				this.oscillator.start();
			}
			this.oscillator.frequency.setValueAtTime(pFrequency, this.audioContext.currentTime);
		},

		/** turns off the sound */
		soundOff: function (pDoLoop) {
			if (this.oscillator) {
				this.oscillator.stop();
				this.oscillator.disconnect();
				this.oscillator = null;
			}
		}
	};

	Alarm.instance = null;

	/** 
	 * Returns the instance. Use this to avoid having
	 * multiple alarms
	 * */
	Alarm.getInstance = function () {
		if (!Alarm.instance) {
			Alarm.instance = new Alarm();
		}
		return Alarm.instance;
	};

	return {
		Alarm: Alarm
	};

})();