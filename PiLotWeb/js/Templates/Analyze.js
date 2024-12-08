var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Analyze = {

	analyzePage: `
		<div class="fullHeight fullWidth flexColumn">
			<div class="fullWidth paddingLeftSmall paddingTopSmall paddingRightSmall">
				<h1 data-text="tackAngles"></h1>
			</div>
			<div class="pnlNoData feedbackWarning marginAllSmall" data-text="noData" hidden></div>
			<div class="flexRowWrap reverse grow">
				<div class="contentColumn marginLeftSmall marginRightSmall flex">
					<div class="easyShadow grow marginBottom">
						<div class="pnlMap" style="height: 100%; min-height: 70vh;"></div>
					</div>
				</div>
				<div class="contextColumn marginLeftSmall marginRightSmall">
					<div class="pnlSettings flexRowWrap easyShadow bgLight paddingAllSmall marginBottomSmall">
						<h3 data-text="settings"></h3>
						<div class="flexRowWrap paddingRight paddingBottomSmall">
							<span class="col6 marginRight" data-text="scale"></span>
							<div class="col10 flex">
								<select class="ddlSliderScale input8">
									<option value="1">1</option>
									<option value="10">10</option>
									<option value="100">100</option>
								</select>
							</div>
						</div>
						<div class="flexRowWrap paddingRight paddingBottomSmall">
							<span class="col6 marginRight" data-text="sample"></span>
							<div class="col10 flex">
								<input type="range" class="rngMinSampleLength input8 marginRightSmall" min="0" max="50" step="1" />
								<span class="lblMinSampleLength"></span>&nbsp;m
							</div>
						</div>
						<div class="flexRowWrap paddingRight paddingBottomSmall">
							<span class="col6 marginRight" data-text="maximalDeviation"></span>
							<div class="col10 flex">
								<input type="range" class="rngMaxSampleAngle input8 marginRightSmall" min="0" max="180" step="1" />
								<span class="lblMaxSampleAngle"></span>°
							</div>
						</div>
						<div class="flexRowWrap paddingRight paddingBottomSmall">
							<span class="col6 marginRight" data-text="minimalTackAngle"></span>
							<div class="col10 flex">
								<input type="range" class="rngMinTurnAngle input8 marginRightSmall" min="0" max="180" step="1" />
								<span class="lblMinTurnAngle"></span>°
							</div>
						</div>
						<div class="flexRowWrap paddingRight paddingBottomSmall">
							<span class="col6 marginRight" data-text="maximalTackDistance"></span>
							<div class="col10 flex">
								<input type="range" class="rngMaxTurnDistance input8 marginRightSmall" min="0" max="100" step="1" />
								<span class="lblMaxTurnDistance"></span>&nbsp;m
							</div>
						</div>
						<div class="flexRowWrap paddingRight paddingBottomSmall">
							<span class="col6 marginRight" data-text="minimalLeg1"></span>
							<div class="col10 flex">
								<input type="range" class="rngMinLeg1Length input8 marginRightSmall" min="0" max="100" step="1" />
								<span class="lblMinLeg1Length"></span>&nbsp;m
							</div>
						</div>
						<div class="flexRowWrap paddingRight paddingBottomSmall">
							<span class="col6 marginRight" data-text="minimalLeg2"></span>
							<div class="col10 flex">
								<input type="range" class="rngMinLeg2Length input8 marginRightSmall" min="0" max="100" step="1" />
								<span class="lblMinLeg2Length"></span>&nbsp;m
							</div>
						</div>
						<div class="flexRowWrap marginTop paddingRight paddingBottomSmall">
							<a href="#" class="lnkSaveSettings block"><i class="icon-floppy-disk marginRightSmall"></i><span data-text="saveSettings"></span></a>
							<div data-text="saveSettingsSuccess" class="pnlSaveSuccess feedbackGood marginTopSmall" hidden></div>
						</div>
					</div>
				</div>
			</div>
		</div>`,

	tackLineOptions: { color: 'rgb(238, 102, 102)', weight: 4 }
};