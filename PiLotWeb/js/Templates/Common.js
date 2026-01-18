var PiLot = PiLot || { };
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Common = {

	mainMenuHamburger: '<a href="#" class="vCenter"><i class="icon-menu"></i></a>',
	
	mainMenu: `
		<div class="mainMenu">
			<div class="menuSection menuSectionHome">
				<a data-page="home"><i class="icon-home"></i><span data-text="home"></span></a>
				<a data-page="display"><i class="icon-display"></i><span data-text="genericDisplay"></span></a>
				<a data-page="checklists"><i class="icon-checkmark5"></i><span data-text="checklists"></span></a>
			</div>
			<div class="menuSection menuSectionNav">
				<a data-page="map"><i class="icon-map3"></i><span data-text="map"></span></a>
				<a data-page="nav"><i class="icon-compass3"></i><span data-text="navigation"></span></a>
				<a data-page="analyze"><i class="icon-ruler2"></i><span data-text="tackAngles"></span></a>
				<a data-page="routes"><i class="icon-linegraph"></i><span data-text="routes"></span></a>
			</div>
			<div class="menuSection menuSectionLog">
				<a data-page="diary"><i class="icon-book3"></i><span data-text="diary"></span></a>
				<a data-page="logbook"><i class="icon-pen2"></i><span data-text="logbook"></span></a>
				<a data-page="stats"><i class="icon-chart4"></i><span data-text="statistics"></span></a>
			</div>
			<div class="menuSection menuSectionMeteo">
				<a data-page="measurements"><i class="icon-thermometer"></i><span data-text="measurements"></span></a>
			</div>
			<div class="menuSection menuSectionEntertainment">
				<a data-page="photos"><i class="icon-pictures"></i><span data-text="photos"></span></a>
				<a data-page="games"><i class="icon-gamepad"></i><span data-text="games"></span></a>
				<a data-page="library"><i class="icon-library"></i><span data-text="library"></span></a>
			</div>
			<div class="menuSection menuSectionSettings">
				<a data-page="boat"><i class="icon-sailing-boat-water1"></i><span data-text="boatConfig"></span></a>
				<a data-page="boatTime"><i class="icon-time2"></i><span data-text="boatTime"></span></a>
				<a data-page="language"><i class="icon-bubbles4"></i><span data-text="language"></span></a>
				<a data-page="fullscreen"><i class="icon-resize3"></i><span data-text="fullscreen"></span></a>
			</div>
			<div class="menuSection menuSectionTools">
				<a data-page="data"><i class="icon-database"></i><span data-text="gpsData"></span></a>
				<a data-page="tiles"><i class="icon-download2"></i><span data-text="localTiles"></span></a>
				<a data-page="pois"><i class="icon-location"></i><span data-text="pois"></span></a>
			</div>
			<div class="menuSection menuSectionAdmin">
				<a data-page="wifi"><i class="icon-connection"></i><span data-text="wifi"></span></a>
				<a data-page="services"><i class="icon-cogs"></i><span data-text="services"></span></a>
				<a data-page="systemTime"><i class="icon-time2"></i><span data-text="systemTime"></span></a>
				<a data-page="systemStatus"><i class="icon-thermometer"></i><span data-text="temperature"></span></a>
				<a data-page="logs"><i class="icon-stack"></i><span data-text="logfiles"></span></a>
				<a data-page="shutDown"><i class="icon-switch"></i><span data-text="shutDown"></span></a>
			</div>
		</div>
	`,

	clock: `<div class="display"><span class="lblTime value"></span></div>`,

	clockOffsetIcon: `
		<div class="vCenter biggerText">
			<a class="icoTimezoneOffset icon orange" href="#" hidden><i class="icon-time2"></i></a>
			<a class="icoTimeOffset icon red" href="#" hidden><i class="icon-time2"></i></a>
		</div>
	`,

	serviceErrorIcon: `
		<div class="vCenter" style="width:2.25em;" hidden>
			<a class="icoError icon red" href="#"><i class="icon-notification"></i></a>
		</div>
	`,

	serviceErrorsDialog:`
		<div class="pnlOverlay vCenter staticOverlay" hidden>
			<div class="pnlDialog dialogPanel hCenter" style="width:95vw;">
				<div class="">
					<div class="marginBottomSmall flexRow">
						<span class="grow paddingAllSmall bold" data-text="errors"></span>
						<a href="#" class="lnkCloseDialog noGrow paddingAllSmall"><i class="icon-cross"></i></a>
					</div>
					<div class="pnlTemplate flexColumn" style="border:1px solid #ccc;border-radius:4px;padding:4px;margin:2px 0px;background-color:#f8f4f4;" hidden>
						<div class="coreData flexRow" style="cursor:pointer;">
							<span class="marginRight lblTimestamp col3 noGrow"></span>
							<span class="marginRight lblType semiBold col2 noGrow"></span>
							<div class="marginRight col4 nogrow">Status: <span class="lblStatus"></span></div>
							<div class="lblUrl marginRight col10 grow"></div>
						</div>
						<div class="detailData flexColumn paddingLeft" style="word-wrap:break-word;">
							<div class="marginRight">Body: <span class="lblBody"></span></div>
							<div class="marginRight">Details: <span class="lblMessage"></span></div>
						</div>
					</div>
					<div class="plhErrors flexColumn paddingAllSmall marginBottomSmall"></div>
				</div>
				<div class="buttons paddingAllSmall reverse">
					<button class="btnClear linkButton semiBold"><span data-text="clearErrors"></span></button>
				</div>
			</div>
		</div>`,

	genericAnalogClock: `<canvas id="clockCanvas"></canvas>`,

	startPage: `<div class="homeContainer"></div>`,

	genericDisplayPage: `
		<div class="flexColumn fullWidth">
			<div class="pnlHeader flexRow" style="justify-content:space-between" hidden>
				<a href="#" class="lnkMainMenu biggerText paddingAllSmall"><i class="icon-menu"></i></a>
				<a href="#" class="lnkAddDisplay biggerText paddingAllSmall"><i class="icon-plus"></i></a>
			</div>
			<div class="plhMainMenu grow"></div>
			<div class="plhDisplays flexRowWrap grow" style="justify-content:center;"></div>
		</div>
	`,

	addGenericDisplayDialog: `
		<div class="pnlOverlay vCenter overlay" hidden>
			<div class="pnlDialog dialogPanel hCenter paddingAllSmall" style="width:30em; max-width:95%;">
				<span class="block marginBottomSmall semiBold" data-text="addDisplay"></span>
				<select class="ddlDisplayName marginBottom"></select>
				<div class="buttons reverse">
					<a href="#" class="btnAdd linkButton semiBold" data-text="add"></a>
					<a href="#" class="btnCancel linkButton" data-text="cancel"></a>
				</div>
			</div>
		</div>	
	`,

	genericDisplay: `
		<div class="genericDisplayContainer flexColumn marginAllSmall easyShadow grow">
			<div class="pnlHeader flexRow" style="position:relative;" hidden>
				<div class="absolute paddingAllSmall right bgLightTrans" style="left:0px; right: 0px">
					<a href="#" class="lnkEnlarge paddingAllSmall" hidden><i class="icon-enlarge2"></i></a>
					<a href="#" class="lnkShrink paddingAllSmall" hidden><i class="icon-shrink2"></i></a>
					<a href="#" class="lnkBiggerText paddingAllSmall"><span style="font-size:1.25em;">A<i class="icon-arrow-up2"></i></span></a>
					<a href="#" class="lnkSmallerText paddingAllSmall"><span style="font-size:0.85em;">A<i class="icon-arrow-down2"></i></span></a>
					<a href="#" class="lnkClose paddingAllSmall"><i class="icon-cross"></i></a>
				</div>
			</div>
			<div class="genericDisplay plhDisplay paddingAllSmall flexRowWrap grow"></div>
		</div>
	`,

	dayNightButtons: `
		<div class="vCenter biggerText">
			<a class="lnkNight yellow icon" href="#" data-title="nightMode"><i class="icon-moon"></i></a>
			<a class="lnkDay yellow icon" href="#" data-title="dayMode"><i class="icon-sun2"></i></a>
		</div>
	`,

	touchButtonsOptions: `
		<div class="sideMenu">
			<a href="#" class="expandCollapse">
				<i class="icon-circle-right expand"></i><i class="icon-circle-left collapse"></i>
			</a>
			<a href="#" class="option btnShowButtons">
				<span class="label">Touch Buttons</span>
				<span class="icon"><i class="icon-point-up"></i></span>
			</a>
			<a href="#" class="option btnFixButtons hidden">
				<span class="label">Buttons fixieren</span>
				<span class="icon"><i class="icon-locked"></i></span>
			</a>
		</div>`,

	touchButtonUp: `
		<div class="touchButton hidden" style="top:15em; left:0.5em;">
			<div class="dragHandle"></div>
			<div class="button">
				<i class="icon-arrow-up"></i>
			</div>
		</div>`,

	touchButtonDown: `
		<div class="touchButton hidden" style="top:23em; left:0.5em;">
			<div class="dragHandle"></div>
			<div class="button">
				<i class="icon-arrow-down"></i>
			</div>
		</div>`,

	touchButtonLeft: `
		<div class="touchButton hidden" style="top:15em; left:7em;">
			<div class="dragHandle"></div>
			<div class="button">
				<i class="icon-arrow-left"></i>
			</div>
		</div>`,

	touchButtonRight: `
		<div class="touchButton hidden" style="top:23em; left:7em;">
			<div class="dragHandle"></div>
			<div class="button">
				<i class="icon-arrow-right"></i>
			</div>
		</div>`,

	accessDenied: `
		<div class="fullWidth"><div class="feedbackBad marginAll" data-text="accessDenied"></div></div>
	`,

	loginForm: `
		<div class="dialogPanel round hCenter center" style="width:50vw; min-width: 20em; max-width: 30em;">
			<div class="pnlLoginFailed feedbackBad marginAll" hidden data-text="loginFailed"></div>
			<div class="pnlLoginForm marginAll feedbackWarning">
				<div class="center">
					<form id="frmLogin">
						<input type="text" class="tbUsername input8 marginBottomSmall" autocomplete="username" data-title="username" /><br />
						<input type="password" class="tbPassword input8 marginBottomSmall" placeholder="Passwort" autocomplete="current-password" /><br />
						<button class="btnLogin input8 marginBottomSmall" type="submit" data-text="login"></button><br />
						<button class="btnCancel input8" type="button" data-text="cancel"></button><br />
					</form>
				</div>
			</div>
		</div>
		`,

	userMenuIcon: `
		<a class="btnUserInfo vCenter icon" href="#" data-title="userinfo"><i class="icon-smile2"></i></a>
	`,

	userMenu: `
		<div class="pnlUserInfo dialogPanel shadow" hidden>
			<div class="semiBold"><span data-text="user"></span>: <span class="lblUsername"></span><span class="lblAnonymous">-</span></div>
			<div><span class="col1 marginRight"><i class="icon-checkmark icoReadAccess green"></i><i class="icon-cross icoNoReadAccess red"></i></span><span data-text="readAccess"></span></div>
			<div><span class="col1 marginRight"><i class="icon-checkmark icoWriteAccess green"></i><i class="icon-cross icoNoWriteAccess red"></i></span><span data-text="writeAccess"></span></div>
			<div><span class="col1 marginRight"><i class="icon-checkmark icoSettingsAccess green"></i><i class="icon-cross icoNoSettingsAccess red"></i></span><span data-text="settingsAccess"></span></div>
			<div><span class="col1 marginRight"><i class="icon-checkmark icoSystemAccess green"></i><i class="icon-cross icoNoSystemAccess red"></i></span><span data-text="systemAccess"></span></div>
			<div class="center">
				<button class="btnLogin linkButton input8 center marginTop" data-text="login"></button>
				<button class="btnLogout linkButton input8 center marginTop" data-text="logout"></button>
			</div>
		</div>
	`,

	checkbox: '<label class="marginRight inlineBlock flexRow top"><input type="checkbox" class="cbCheckbox" /><div class="lblLabel"></div></label>',

	expandIcon: '<span class="lnkExpand marginRightSmall"><i class="icon-circle-right"></i></span>',

	collapseIcon: '<span class="lnkCollapse marginRightSmall" hidden><i class="icon-circle-down"></i></span>'
};