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
						<div class="plhTimeframe"></div>
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
						<div class="plhUnit"></div>
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
						<div class="plhTimeframe"></div>
					</div>
					<div class="flexColumn paddingRight paddingBottom" style="width:12em;">
						<span data-text="boats" class="bold"></span>
						<div class="plhBoats flexColumn"></div>
					</div>
					<div class="plhUnit flexColumn paddingRight paddingBottom" style="width:12em;">
						<span data-text="unit" class="bold"></span>
						<div class="plhUnit"></div>
					</div>
				</div>
				<div class="grow right"><a href="#" class="lnkToggleSettings"><i class="icon-cog"></i></a></div>
			</div>
			<div class="pnlNoData fullWidth feedbackInfo" data-text="noData" hidden></div>
			<div class="pnlChart chart fullWidth borderLight flexColumn">
				<div class="plhLegend"></div>
				<div class="plhData"></div>
			</div>
		</div>
	`,

	fastestSegmentsLegendItem: `<div class="marginRight flex"><div class="divColor boatColorBox marginRightSmall"></div><span class="lblText text"></span></div>`,

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
					<div class="flexColumn paddingRight paddingBottom" style="width:12em;">
						<span data-text="unit" class="bold"></span>
						<div class="plhUnit"></div>
					</div>
				</div>
				<div class="grow right"><a href="#" class="lnkToggleSettings"><i class="icon-cog"></i></a></div>
			</div>
			<div class="pnlNoData fullWidth feedbackInfo" data-text="noData" hidden></div>
			<div class="pnlData fullWidth">
				<div class="plhLegend"></div>
				<div class="pnlTable tracksTable fullWidth flexColumn">
					<div class="pnlHeader flexRowWrap tracksHeader bgLight trackRow semiBold">
						<div class="cellGroup group1">
							<span class="lblBoat colBoat trackCell" data-text="boat"></span>
							<span class="lblDate colDate trackCell pointer" data-sort="date" data-text="date"></span>
						</div>
						<div class="cellGroup group2">
							<span class="colTime trackCell" data-text="time"></span>
						</div>
						<div class="cellGroup group3">
							<span class="lblDuration colDuration trackCell pointer" data-sort="duration" data-text="duration"></span>
							<span class="lblDistance colDistance trackCell pointer" data-sort="distance" data-text="distance"></span>
						</div>
						<div class="cellGroup group4">
							<span class="lblSpeed colSpeed trackCell pointer" data-sort="speed" data-text="averageSpeed"></span>
							<span class="lblTrophies colTrophies trackCell pointer" data-sort="trophies" data-text="records"></span>
						</div>
					</div>
					<div class="plhTracks tracks"></div>
					<div class="pnlTemplate flexRowWrap trackRow" hidden>
						<div class="cellGroup group1">
							<div class="colBoat trackCell"><div class="lblBoat boatColorBox" ></div></div>
							<a href="#" class="lnkDate colDate trackCell"></a>
						</div>
						<div class="cellGroup group2">
							<span class="colTime trackCell">
								<span class="lblStartTime"></span> - <span class="lblEndTime"></span>
							</span>
						</div>
						<div class="cellGroup group3">
							<span class="lblDuration colDuration trackCell"></span>
							<span class="colDistance trackCell right">
								<span class="lblDistance"></span> <span class="lblDistanceUnit"></span>
							</span>
						</div>
						<div class="cellGroup group4">
							<span class="colSpeed trackCell right">
								<span class="lblSpeed"></span> <span class="lblSpeedUnit"></span>
							</span>
							<span class="lblTrophies colTrophies trackCell"></span>
						</div>
					</div>
					<div class="pnlSummary flexRowWrap tracksSummary bgLight trackRow">
						<div class="cellGroup group1">
							<span class="lblTracksCount colBoat trackCell "></span>
							<span class="colDate trackCell"></span>
						</div>
						<div class="cellGroup group2">
							<span class="colTime trackCell"></span>
						</div>
						<div class="cellGroup group3">
							<span class="lblTotalDuration colDuration trackCell"></span>
							<span class="colDistance trackCell right">
								<span class="lblTotalDistance"></span> <span class="lblTotalDistanceUnit"></span>
							</span>
						</div>
						<div class="cellGroup group4">
							<span class="colSpeed trackCell right">
								<span class="lblAverageSpeed"></span> <span class="lblAverageSpeedUnit"></span>
							</span>
							<span class="colTrophies trackCell"></span>
						</div>
					</div>
				</div>
				<div class="buttons paddingAll">
					<button class="btnShowOnMap linkButton"><i class="icon-map marginRightSmall"></i><span data-text="showOnMap"></span></button>
				</div>
			</div>
		</div>
	`,

	tracksMap:`
		<div class="flexColumn overlay" hidden>
			<div class="flexRowWrap paddingAllSmall bgLight">
				<span class="grow">
					<span class="lblLoadingTracks" data-text="loadingTracksXofY"></span>
				</span>
				<a href="#" class="lnkClose noGrow"><i class="icon-cross"></i></a>
			</div>
			<div class="pnlMap map grow">Map</div>
		</div>
	`,

	timeframeSelector: `
		<form><div class="flexColumn">
			<label><input type="radio" name="rblTimeframe" value="0" class="rblTimeframe" /><span data-text="monthsSingular"></span></label>
			<label><input type="radio" name="rblTimeframe" value="1" class="rblTimeframe" /><span data-text="yearsSingular"></span></label>
			<label><input type="radio" name="rblTimeframe" value="2" class="rblTimeframe" /><span data-text="all"></span></label>
			<label class="marginBottomXSmall"><input type="radio" name="rblTimeframe" value="3" class="rblTimeframe" /><span data-text="userdefined"></span></label>
			<div class="label pnlCustomDates" hidden>
				<div class="marginBottomXSmall">
					<span class="inlineBlock col2" data-text="from">:</span><input type="text" class="tbStartDate input4" /><div class="calStartDate" hidden></div><br />
				</div>
				<div class="marginBottomXSmall">
					<span class="inlineBlock col2" data-text="to">:</span><input type="text" class="tbEndDate input4" /><div class="calEndDate" hidden></div>
				</div>
			</div>
		</div></form>
	`,

	unitSelector: `
		<form><div class="flexColumn">
			<label><input type="radio" name="rblUnits" value="nautical" class="rblUnits" /><span data-text="unitsNautical"></span></label>
			<label><input type="radio" name="rblUnits" value="metric" class="rblUnits" /><span data-text="unitsMetric"></span></label>
		</div></form>
	`,

	boatsLegend: `<div class="pnlLegend boatsLegend fullWidth center marginBottom flexRowWrap"></div>`,

	boatsLegendItem: `<div class="marginRight flex"><div class="divColor boatColorBox marginRightSmall"></div><span class="lblText text"></span></div>`,

};