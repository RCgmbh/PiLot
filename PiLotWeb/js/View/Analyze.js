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
					const analyzer = new PiLot.Model.Analyze.TackAnalyzer(pTracks[0], 1);
					console.log(analyzer.findTacks(50, 15, 30, 80));
				}				
			);
		},
		
		draw: function () {}

	};

	/// return the classes
	return {
		AnalyzePage: AnalyzePage
	};

})();
