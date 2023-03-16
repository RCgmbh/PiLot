var PiLot = PiLot || {};
PiLot.Model = PiLot.Model || {};

PiLot.Model.Meteo = (function () {

	/** 
	 *  returns the moon phase at a given DateTime. The result is an object with 
	 *  {phase, type} where phase is a continuous value from 0 to 1 where 0
	 *  is new moon and 0.5 is full moon, and type is an integral value :
	 *  0: new moon, 1: waxing crescent, 2: first quarter, 3: waxing gibbous
	 *  4: full moon, 5: waning gibbous, 6: third quarter, 7: waning crescent
	 */
	var getMoonPhase = function (pDateTime) {
		var jsDate;
		if (pDateTime instanceof DateTime) {
			jsDate = pDateTime.toJSDate();
		} else if (pDateTime instanceof Date) {
			jsDate = pDateTime; 
		}
		const phase = SunCalc.getMoonIllumination(jsDate).phase;
		var type = Math.round(phase * 8);
		type = (type == 8) ? 0 : type;	// above 7.5, we again have new moon, which is 0
		return { phase: phase, type: type };
	};	

	return {
		getMoonPhase: getMoonPhase
	};

})();