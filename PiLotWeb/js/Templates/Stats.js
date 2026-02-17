var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Stats = {

	trackStatsPage: `
		<div class="contentPadding paddingRight">
			<h1><span data-text="trackStatistics"></span></h1>
			<h3 class="marginBottomSmall"><a class="lnkTotalDistance" data-text="totalDistance"></a></h3>
			<div class="pnlTotalDistanceChart marginBottomBig"></div>
			<h3 class="marginBottomSmall"><a class="lnkFastestSegments" data-text="fastestSegments"></a></h3>
			<div class="pnlFastestSegmentsChart marginBottomBig"></div>
			<h3 class="marginBottomSmall"><a class="lnkTracksList" data-text="tracks"></a></h3>
			<div class="pnlTracksList marginBottomBig"></div>
		</div>
	`,

	totalDistanceChart: `
		<div class="easyShadow">
			<div class="flexRow reverse bgLight paddingAllSmall" style="justify-content: space-between;">
				<div class="pnlSettings flexRowWrap grow">
					<div class="flexColumn paddingRight paddingBottom" style="width:12em;">
						<span data-text="timeframe" class="bold"></span>
						<label><input type="radio" name="rblTotalDistanceTimeframe" value="0" class="rblTimeframe" /><span data-text="monthsSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceTimeframe" value="1" class="rblTimeframe" /><span data-text="yearsSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceTimeframe" value="2" class="rblTimeframe" /><span data-text="all"></span></label>
					</div>
					<div class="flexColumn paddingRight paddingBottom" style="width:12em;">
						<span data-text="groupBy" class="bold"></span>
						<label><input type="radio" name="rblTotalDistanceInterval" value="0" class="rblInterval" /><span data-text="daysSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceInterval" value="1" class="rblInterval" /><span data-text="weeksSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceInterval" value="2" class="rblInterval" /><span data-text="monthsSingular"></span></label>
						<label><input type="radio" name="rblTotalDistanceInterval" value="3" class="rblInterval" /><span data-text="yearsSingular"></span></label>
					</div>
					<div class="flexColumn paddingRight paddingBottom" style="width:12em;">
						<span data-text="boats" class="bold"></span>
						<div class="plhBoats flexColumn"></div>
					</div>
					<div class="flexColumn paddingRight paddingBottom" style="width:12em;">
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

	totalDistanceChartTooltip: `
		{boat}<br />{date}:&nbsp;<span class="bold">{distance} {unit}</span>
	`,

	fastestSegmentsChart: `
		<div class="easyShadow">
			<div class="flexRow reverse bgLight paddingAllSmall" style="justify-content: space-between;">
				<div class="pnlSettings flexRowWrap">
					<div class="flexColumn paddingRight paddingBottom" style="width:12em;">
						<span data-text="segmentType" class="bold"></span>
						<select class="ddlSegmentTypes"></select>
					</div>
					<div class="flexColumn paddingRight paddingBottom" style="width:12em;">
						<span data-text="timeframe" class="bold"></span>
						<label><input type="radio" name="rblFastestSegmentTimeframe" value="0" class="rblTimeframe" /><span data-text="monthsSingular"></span></label>
						<label><input type="radio" name="rblFastestSegmentTimeframe" value="1" class="rblTimeframe" /><span data-text="yearsSingular"></span></label>
						<label><input type="radio" name="rblFastestSegmentTimeframe" value="2" class="rblTimeframe" /><span data-text="all"></span></label>
					</div>
					<div class="flexColumn paddingRight paddingBottom" style="width:12em;">
						<span data-text="boats" class="bold"></span>
						<div class="plhBoats flexColumn"></div>
					</div>
					<div class="plhUnit flexColumn paddingRight paddingBottom" style="width:12em;">
						<span data-text="unit" class="bold"></span>
						<label><input type="radio" name="rblFastestSegmentUnit" value="kn" class="rblUnit" /><span data-text="kn"></span></label>
						<label><input type="radio" name="rblFastestSegmentUnit" value="kmh" class="rblUnit" /><span data-text="kmh"></span></label>
					</div>
				</div>
				<div class="grow right"><a href="#" class="lnkToggleSettings"><i class="icon-cog"></i></a></div>
			</div>
			<div class="pnlNoData fullWidth feedbackInfo" data-text="noData" hidden></div>
			<div class="pnlChart chart fullWidth borderLight flexColumn">
				<div class="pnlLegend chartLegend fullWidth center marginBottom flexRowWrap"></div>
				<div class="plhData"></div>
			</div>
		</div>
	`,

	fastestSegmentsLegendItem: `<div class="marginRight flex"><div class="divColor color marginRightSmall"></div><span class="lblText text"></span></div>`,

	fastestSegmentsDataItem: `
		<div class="flexRow">
			<div class="divBar bar vCenter"><a class="lnkBarText link darkLink"></a></div>
			<span class="lblBarLabel barLabel vCenter marginLeftSmall"></span>
		</div>
	`,

	tracksList: `
		<div class="easyShadow">
			<div class="flexRow reverse bgLight paddingAllSmall" style="justify-content: space-between;">
				<div class="pnlSettings flexRowWrap">
					<div class="flexColumn paddingRight paddingBottom" style="width:12em;">
						<span data-text="timeframe" class="bold"></span>
						<div class="plhTimeframe"></div>
					</div>
					<div class="flexColumn paddingRight paddingBottom" style="width:12em;">
						<span data-text="boats" class="bold"></span>
						<div class="plhBoats flexColumn"></div>
					</div>
				</div>
				<div class="grow right"><a href="#" class="lnkToggleSettings"><i class="icon-cog"></i></a></div>
			</div>
			<div class="pnlNoData fullWidth feedbackInfo" data-text="noData" hidden></div>
			<div class="pnlTable tracksTable fullWidth borderLight flexColumn">
				<div class="pnlLegend chartLegend fullWidth center marginBottom flexRowWrap"></div>
				<div class="pnlHeader" class="semiBold">
					<span class="colBoat" data-text="boat"></span>
					<span class="colDate" data-text="date"></span>
					<span class="colTime" data-text="time"></span>
					<span class="colDuration" data-text="duration"></span>
					<span class="colDistance" data-text="distance"></span>
					<span class="colSpeed" data-text="averageSpeed ⌀"></span>
					<span class="colTrophies" data-text="trophies"></span>
				</div>
				<div class="plhTracks"></div>
				<div class="pnlTemplate" hidden>
					<span class="lblBoat colBoat"></span>
					<span class="lblDate colDate"></span>
					<span class="colTime">
						<span class="lblTimeFrom"></span> - <span class="lblTimeTo"></span>
					</span>
					<span class="lblDuration colDuration"></span>
					<span class="colDistance">
						<span class="lblDistance"></span> <span class="lblDistanceUnit"></span>
					</span>
					<span class="colSpeed">
						<span class="lblSpeed"></span> <span class="lblSpeedUnit"></span>
					</span>
					<span class="lblTrophies colTrophies"></span>
				</div>
			</div>
		</div>
	`,

	timeframeSelector: `
		<form><div class="flexColumn">
			<label><input type="radio" name="rblFastestSegmentTimeframe" value="0" class="rblTimeframe" /><span data-text="monthsSingular"></span></label>
			<label><input type="radio" name="rblFastestSegmentTimeframe" value="1" class="rblTimeframe" /><span data-text="yearsSingular"></span></label>
			<label><input type="radio" name="rblFastestSegmentTimeframe" value="2" class="rblTimeframe" /><span data-text="all"></span></label>
			<label class="marginBottomXSmall"><input type="radio" name="rblFastestSegmentTimeframe" value="3" class="rblTimeframe" /><span data-text="userdefined"></span></label>
			<div class="label pnlCustomDates" hidden>
				<div class="marginBottomXSmall">
					<span class="inlineBlock col2" data-text="from">:</span><input type="text" class="tbStartDate input4" /><div class="calStartDate" hidden></div><br />
				</div>
				<div class="marginBottomXSmall">
					<span class="inlineBlock col2" data-text="to">:</span><input type="text" class="tbEndDate input4" /><div class="calEndDate" hidden></div>
				</div>
			</div>
		</div></form>
	`
};