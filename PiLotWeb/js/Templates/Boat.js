var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Boat = {

	boatImageLink:
		'<object type="image/svg+xml" style="height:100%; max-height:100%; max-width:100%; position:absolute;"></object>',

	boatSetupForm:
		`<div class="pnlOverlay vCenter overlay" hidden>
			<div class="boatSetupForm dialogPanel hCenter paddingAllSmall">
				<span class="block semiBold marginBottom" data-text="boatSetup"></span>
				<div class="plhFeatures"></div>
				<div class="buttons reverse marginTop marginBottom">
					<a href="#" class="btnBoatSetupOk linkButton bold" data-text="ok"></a>
					<a href="#" class="btnBoatSetupCancel linkButton" data-text="cancel"></a>
				</div>
			</div>
		</div>`,

	boatFeatureSelect:
		`<div>
			<span class="lblFeatureName"></span>
			<select class="fullWidth marginBottomSmall selFeatureStates"></select>
		</div>`,

	boatPage:
		`<div>
			<div class="contentPadding marginRight">
				<h1><a href="#" class="lnkSettings" data-text="settings"></a> : <span data-text="boat"></span></h1>
			</div>
			<div class="plhBoatImages boatImages flexRowWrap" style="justify-content:center;"><div>
		</div>`,

	boatImage:
		`<div class="boatImage marginAll">
			<img class="imgBoat" style="width:100%;" />
			<span class="lblConfigName center"></span>
		</div>`,

	/*configSliderImageLeft: '<img style="height:100%;margin-left:-100%;" />',

	configSliderImageRight: '<img style="height:100%;" />',*/

	startPageBoatImage: `
		<div class="border startPageBoat">
			<div class="plhBoatSetupForm hidden"></div>
			<div class="divImageContainer"></div>
			<div class="plhAlternativeSetups">
				<div class="divAlternativeSetup"></div>
			</div>
		</div>`

};