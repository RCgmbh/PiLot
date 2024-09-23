var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Stats = {

	trackStatsPage: `
		<div class="contentPadding paddingRight">
			<h1><span data-text="trackStatistics"></span></h1>
			<h3><a class="lnkTotalDistance" data-text="totalDistance"></a></h3>
			<div class="pnlTotalDistanceChart marginBottom"></div>
			<h3><a class="lnkFastestSegments" data-text="fastestSegments"></a></h3>
			<div class="pnlFastestSegmentsChart marginBottom"></div>
		</div>
	`,

	totalDistanceChart: `
		<div>
			<div class="flexRow reverse" style="justify-content: space-between;">
				<div class="pnlSettings flexRowWrap grow paddingBottom" hidden>
					<div class="flexColumn paddingRight grow" style="max-width:12em;">
						<span data-text="timeframe" class="bold"></span>
						<label><input type="radio" name="rblTotalDistanceTimeframe" value="0" class="rblTimeframe" /><span data-text="monthsSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceTimeframe" value="1" class="rblTimeframe" /><span data-text="yearsSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceTimeframe" value="2" class="rblTimeframe" /><span data-text="all"></span></label>
					</div>
					<div class="flexColumn paddingRight grow" style="max-width:12em;">
						<span data-text="groupBy" class="bold"></span>
						<label><input type="radio" name="rblTotalDistanceInterval" value="0" class="rblInterval" /><span data-text="daysSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceInterval" value="1" class="rblInterval" /><span data-text="weeksSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceInterval" value="2" class="rblInterval" /><span data-text="monthsSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceInterval" value="3" class="rblInterval" /><span data-text="yearsSingular"></span></label>
					</div>
					<div class="flexColumn paddingRight grow" style="max-width:12em;">
						<span data-text="boats" class="bold"></span>
						<div class="plhBoats"></div>
					</div>
					<div class="flexColumn paddingRight grow" style="max-width:12em;">
						<span data-text="unit" class="bold"></span>
						<label><input type="radio" name="rblTotalDistanceUnit" value="nm" class="rblUnit" /><span data-text="nm"></span></label>
						<label><input type="radio" name="rblTotalDistanceUnit" value="km" class="rblUnit" /><span data-text="km"></span></label>
					</div>
				</div>
				<div class="grow right"><a href="#" class="lnkToggleSettings"><i class="icon-cog"></i></a></div>
			</div>
			<div class="pnlChart fullWidth borderLight" style="min-height: 200px; max-height: 1000px; height:50vh;"></div>
		</div>
	`,

	totalDistanceChartTooltip: `
		{boat}<br />{date}:&nbsp;<span class="bold">{distance} {unit}</span>
	`,

	fastestSegmentsChart: `
		<div>
			<div class="flexRow reverse" style="justify-content: space-between;">
				<div class="pnlSettings flexRowWrap grow paddingBottom" hidden>
					<div class="flexColumn paddingRight grow" style="max-width:12em;">
						<span data-text="segmentType" class="bold"></span>
						<select class="ddlSegmentTypes"></select>
					</div>
					<div class="flexColumn paddingRight grow" style="max-width:12em;">
						<span data-text="timeframe" class="bold"></span>
						<label><input type="radio" name="rblTotalDistanceTimeframe" value="0" class="rblTimeframe" /><span data-text="monthsSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceTimeframe" value="1" class="rblTimeframe" /><span data-text="yearsSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceTimeframe" value="2" class="rblTimeframe" /><span data-text="all"></span></label>
					</div>
					<div class="plhBoats flexColumn paddingRight grow" style="max-width:12em;">
						<span data-text="boats" class="bold"></span>
						<div class="plhBoats"></div>
					</div>
					<div class="plhUnit flexColumn paddingRight grow" style="max-width:12em;">
						<span data-text="unit" class="bold"></span>
						<label><input type="radio" name="rblTotalDistanceUnit" value="nm" class="rblUnit" /><span data-text="nm"></span></label>
						<label><input type="radio" name="rblTotalDistanceUnit" value="km" class="rblUnit" /><span data-text="km"></span></label>
					</div>
				</div>
				<div class="grow right"><a href="#" class="lnkToggleSettings"><i class="icon-cog"></i></a></div>
			</div>
			<div class="pnlNoData fullWidth feedbackInfo" data-text="noData" hidden></div>
			<div class="pnlChart fullWidth borderLight" style="min-height: 200px; max-height: 1000px; height:50vh;"></div>
		</div>
	`,
};