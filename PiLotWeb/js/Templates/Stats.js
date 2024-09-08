var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Stats = {

	trackStatsPage: `
		<div class="contentPadding paddingRight">
			<h1><span data-text="trackStatistics"></span></h1>
			<h3><a class="lnkTotalDistance" data-text="totalDistance"></a></h3>
			<div class="pnlTotalDistance">
				<div class="pnlTotalDistanceSettings flexRowWrap paddingBottom">
					<div class="plhTimeframe flexColumn marginRight grow" style="max-width:12em;">
						<span data-text="timeframe" class="bold"></span>
						<label><input type="radio" name="rblTotalDistanceTimeframe" value="0" class="rblTimeframe" /><span data-text="monthsSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceTimeframe" value="1" class="rblTimeframe" /><span data-text="yearsSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceTimeframe" value="2" class="rblTimeframe" /><span data-text="all"></span></label>
					</div>
					<div class="plhInterval flexColumn marginRight grow" style="max-width:12em;">
						<span data-text="groupBy" class="bold"></span>
						<label><input type="radio" name="rblTotalDistanceInterval" value="0" class="rblInterval" /><span data-text="daysSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceInterval" value="1" class="rblInterval" /><span data-text="weeksSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceInterval" value="2" class="rblInterval" /><span data-text="monthsSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceInterval" value="3" class="rblInterval" /><span data-text="yearsSingular"></span></label>
					</div>
					<div class="plhBoats flexColumn marginRight grow" style="max-width:12em;">
						<span data-text="boats" class="bold"></span>
						<div class="plhBoats"></div>
					</div>
					<div class="plhUnit marginRight grow" style="max-width:12em;">
						<span data-text="unit" class="bold"></span>
						
					</div>
				</div>
				<div class="pnlTotalDistanceChart fullWidth borderLight" style="min-height: 200px; max-height: 1000px; height:50vh;"></div>
			</div>
		</div>
	`
};