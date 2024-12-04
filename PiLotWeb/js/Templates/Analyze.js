var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Analyze = {

	analyzePage: `
		<div class="fullHeight fullWidth">
			<div class="plhMainContent marginLeftSmall marginRightSmall">
				<div class="flexRow reverse bgLight paddingAllSmall" style="justify-content: space-between;">
					<div class="pnlSettings flexRowWrap grow">
						<div class="flexRow paddingRight paddingBottom">
							<span class="col6 marginRight">Sample</span>
							<div class="col10 flex">
								<input type="range" class="rngMinSampleLength input8 marginRightSmall" min="0" max="100" step="1" value="0" />
								<span class="lblMinSampleLength"></span>&nbsp;m
							</div>
						</div>
						<div class="flexRow paddingRight paddingBottom">
							<span class="col6 marginRight">Max. Abweichung</span>
							<div class="col10 flex">
								<input type="range" class="rngMaxSampleAngle input8" min="0" max="180" value="0" />
								<span class="lblMaxSampleAngle"></span>°
							</div>
						</div>
						<div class="flexRow paddingRight paddingBottom">
							<span class="col6 marginRight">Min. Wendewinkel</span>
							<div class="col10 flex">
								<input type="range" class="rngMinTurnAngle input8" min="0" max="180" value="0" />
								<span class="lblMinTurnAngle"></span>°
							</div>
						</div>
						<div class="flexRow paddingRight paddingBottom">
							<span class="col6 marginRight">Max Wendedistanz</span>
							<div class="col10 flex">
								<input type="range" class="rngMaxTurnDistance input8" min="0" max="500" value="0" />
								<span class="lblMaxTurnDistance"></span>&nbsp;m
							</div>
						</div>
						<div class="flexRow paddingRight paddingBottom">
							<span class="col6 marginRight">Min. Leg 1</span>
							<div class="col10 flex">
								<input type="range" class="rngMinLeg1Length input8" min="1" max="1000" value="0" />
								<span class="lblMinLeg1Length"></span>&nbsp;m
							</div>
						</div>
						<div class="flexRow paddingRight paddingBottom">
							<span class="col6 marginRight">Min. Leg 2</span>
							<div class="col10 flex">
								<input type="range" class="rngMinLeg2Length input8" min="1" max="1000" value="0" />
								<span class="lblMinLeg2Length"></span>&nbsp;m
							</div>
						</div>
					</div>
					<div class="grow right"><a href="#" class="lnkToggleSettings"><i class="icon-cog"></i></a></div>
				</div>
				<div class="pnlNoData feedbackWarning marginAll" data-text="noData" hidden></div>
				<div class="pnlMap fullWidth" style="height: 60vh;"></div>
			</div>
		</div>`,

	tackLineOptions: { color: '#ff0000', weight: 4 }
};