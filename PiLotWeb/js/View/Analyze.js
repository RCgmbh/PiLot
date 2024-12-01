/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

PiLot.View.Analyze = (function () {
	
	var AnalyzePage = function () {
		this.initialize();
	};

	AnalyzePage.prototype = {

		initialize: function(){
			PiLot.Service.Nav.TrackService.getInstance().loadTracksAsync(1728345600000, 1728432000000, true, true).then(
				function(pTracks){
					new PiLot.Model.Analyze.TackAnalyzer(pTracks[0], 10);
				}				
			);
			new PiLot.Model.Analyze.TackAnalyzer

		},
		
		draw: function () {}

	};

	/// return the classes
	return {
		AnalyzePage: AnalyzePage
	};

})();
