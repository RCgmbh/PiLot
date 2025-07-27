/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

PiLot.View.Media = (function () {

	/**
	 * The games overview page with just tiles
	 * */
	var GamesOverviewPage = function () {
		this.draw();
	};

	GamesOverviewPage.prototype = {

		/** Draws the page */
		draw: function () {
			const loader = PiLot.Utils.Loader;
			const pageContent = RC.Utils.stringToNode(PiLot.Templates.Media.gamesOverviewPage);
			loader.getContentArea().appendChild(pageContent);
		}
	};

	/**
	 * The library page showing the directory browser in an ifram
	 * */
	var LibraryPage = function () {
		this.iframe = null;
		this.draw();
	};

	LibraryPage.prototype = {

		blankTypes: ['.pdf', '.epub', '.docx', '.png', '.jpg', '.gif'],

		draw: function () {
			let loader = PiLot.Utils.Loader;
			const pageContent = RC.Utils.stringToNode(PiLot.Templates.Media.libraryPage);
			loader.getContentArea().appendChild(pageContent);
			this.iframe = pageContent.querySelector('iframe');
			this.iframe.src = PiLot.Config.Media.libraryUrl;
			this.iframe.addEventListener('load', this.setBlankTargets.bind(this));
		},

		/** sets the target of each .epub, .pdf etc. link to _blank */
		setBlankTargets: function () {
			const links = this.iframe.contentDocument.links;
			let href = null;
			let fileType = '';
			let dotIndex = -1;
			for (let i = 0; i < links.length; i++) {
				href = links[i].href;
				dotIndex = href.lastIndexOf('.');
				fileType = href.slice(dotIndex);
				if (this.blankTypes.indexOf(fileType) >= 0) {
					links[i].target = '_blank';
				}
			}
		}

	};

	/// return the classes
	return {
		GamesOverviewPage: GamesOverviewPage,
		LibraryPage: LibraryPage
	};

})();