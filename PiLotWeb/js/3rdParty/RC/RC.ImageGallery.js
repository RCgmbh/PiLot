'use strict';
var RC = RC || {};

/// Requires zingtouch.js
///
/// The imageGallery offers an explorative shallow/deep-Zoom image gallery, using prerendered
/// image thumbnails to show an overview of image, which can be panned and zoomed. When zooming
/// in, images with higher resolutions will be added. 
///
/// Namespace for all Classes used by the ImageGallery

RC.ImageGallery = (function () {

	/// Class ImageGallery. Expects some stuff:
	/// pContainer: The HTML within which the gallery will be added. This should have position: relative to work well.
	/// pImagesCollections: an array of ImageCollection, providing the images
	/// pOptions: {
	///		paddingTop,			padding of the drawing area from the top
	///		paddingRight,		padding of the drawing area from the left
	///		paddingBottom,		padding of the drawing area from the bottom
	///		paddingLeft,		padding of the drawing area from the left
	///		imageSpaceH,		the horizontal space between images at zoom level 0
	///		imageSpaceV			the vertical space between images at zoom level 0
	///		minHeightUsed		images will be zoomed until this factor of the total gallery height is used
	///		autoFocus			if true, the gallery will get focus automatically enabling key interaction
	///	}

	var Gallery = function (pContainer, pImageCollection, pOptions) {
		this.gallery = null;						/// the div containing all the images etc.
		this.imageCollection = pImageCollection;	/// the image collection with all required data
		this.defaultZoomLevel = 0;					/// the zoom level initially used
		this.zoomLevel = null;						/// images will have a size of 2^zoom * imageBaseWidth by 2^zoom * imageBaseHeight
		this.offset = { x: 0, y: 0 };				/// the left and top offset of the gallery. Changed when zooming or panning
		this.paddingTop = 20;
		this.paddingRight = 20;
		this.paddingBottom = 20;
		this.paddingLeft = 20;
		this.imageSpaceH = 10;
		this.imageSpaceV = 10;
		this.minHeightUsed = 0.5;
		this.imageBaseWidth = 64;					/// the width of the box containing an image at zoom level 0;
		this.imageBaseHeight = 64;					/// the height of the box containing an image at zoom level 0;
		this.autoFocus = false;						///	if true, the gallery will get focus automatically
		this.rows = null;							/// the number of rows for the entire gallery
		this.columns = null;						/// the number of columns for the entire gallery
		this.galleryWidth = null;					/// the visible width of the gallery in pixels
		this.galleryHeight = null;					/// the visible height of the gallery in pixels
		this.images = null;							/// an array of objects {RC.ImageGallery.Image, row, col}

		this.mouseDownPosition = null;				/// the position where the mouse was clicked, used for dragging
		this.scrollLog = 0;							/// counts the scroll amount
		this.initialize(pContainer, pOptions);
	};

	/// Gallery Methods
	Gallery.prototype = {

		initialize: function (pContainer, pOptions) {
			this.readOptions(pOptions);
			this.draw(pContainer);
			this.calculateDimensions();
			this.createImages();
			this.placeImages(true);
			this.bindHandlers();
		},

		/// reads the options, if there are any
		readOptions: function (pOptions) {
			if (pOptions) {
				this.paddingTop = pOptions.paddingTop != null ? pOptions.paddingTop : this.paddingTop;
				this.paddingRight = pOptions.paddingRight != null ? pOptions.paddingRight : this.paddingRight;
				this.paddingBottom = pOptions.paddingBottom != null ? pOptions.paddingBottom : this.paddingBottom;
				this.paddingLeft = pOptions.paddingLeft != null ? pOptions.paddingLeft : this.paddingLeft;
				this.imageSpaceH = pOptions.imageSpaceH != null ? pOptions.imageSpaceH : this.imageSpaceH;
				this.imageSpaceV = pOptions.imageSpaceV != null ? pOptions.imageSpaceV : this.imageSpaceV;
				this.minHeightUsed = pOptions.minHeightUsed != null ? pOptions.minHeightUsed : this.minHeightUsed;
				this.imageBaseWidth = pOptions.imageBaseWidth != null ? pOptions.imageBaseWidth : this.imageBaseWidth;
				this.imageBaseHeight = pOptions.imageBaseHeight != null ? pOptions.imageBaseHeight : this.imageBaseHeight;
				this.autoFocus = pOptions.autoFocus != null ? pOptions.autoFocus : this.autoFocus;
			}
		},

		/// creates the gallery container, which is a child of pContainer
		draw: function (pContainer) {
			this.gallery = document.createElement('div');
			this.gallery.className = 'rcImageGallery';
			this.gallery.tabIndex = 0;
			pContainer.appendChild(this.gallery);
			if (this.autoFocus) {
				this.gallery.focus();
			}
		},

		/// binds a bunch of handlers to the gallery container
		bindHandlers: function () {
			document.body.onresize = this.body_resize.bind(this);
			this.gallery.addEventListener('wheel', this.gallery_onWheel.bind(this));
			this.gallery.addEventListener('pointerdown', this.gallery_pointerDown.bind(this));
			this.gallery.addEventListener('pointerup', this.gallery_pointerUp.bind(this));
			this.gallery.addEventListener('pointerleave', this.gallery_pointerLeave.bind(this));
			this.gallery.addEventListener('keydown', this.gallery_keydown.bind(this));
			document.addEventListener('scroll', this.document_scroll.bind(this));
			// ZingTouch events
			var zt = new ZingTouch.Region(this.gallery);
			var panEvent = new ZingTouch.Pan();
			var tapEvent = new ZingTouch.Tap();
			tapEvent.tolerance = 5;
			zt.bind(this.gallery, tapEvent, this.gallery_tap.bind(this));
			panEvent.threshold = 5;
			zt.bind(this.gallery, panEvent, this.gallery_pan.bind(this));
			var expandEvent = new ZingTouch.Expand();
			expandEvent.threshold = (this.galleryWidth + this.galleryHeight) / 100;
			zt.bind(this.gallery, expandEvent, this.gallery_expand.bind(this));
			var pinchEvent = new ZingTouch.Pinch();
			pinchEvent.threshold = 20;
			zt.bind(this.gallery, pinchEvent, this.gallery_pinch.bind(this));
			var swipeEvent = new ZingTouch.Swipe();
			zt.bind(this.gallery, swipeEvent, this.gallery_swipe.bind(this));
		},

		/// handles resizes of the body
		body_resize: function () {
			var columnsOld = this.columns;
			this.calculateDimensions();
			if (columnsOld !== this.columns) {
				this.rebuildImageArray();
			}
			this.placeImages();
		},

		/// handles scrolling the document
		document_scroll: function () { },

		/// handles key downs on the gallery.  
		gallery_keydown: function (event) {
			//console.log(event.key);
			switch (event.key) {
				case "ArrowLeft":
					this.handleArrowKey(event, -1, 0);
					break;
				case "ArrowRight":
					this.handleArrowKey(event, 1, 0);
					break;
				case "ArrowUp":
					this.handleArrowKey(event, 0, -1);
					break;
				case "ArrowDown":
					this.handleArrowKey(event, 0, 1);
					break;
				case "-":
					this.handleKey(event, function () { this.changeZoom(-0.5, null); }.bind(this));
					break;
				case "+":
					this.handleKey(event, function () { this.changeZoom(0.5, null); }.bind(this));
					break;
				case "0":
					this.handleKey(event, function () {
						this.resetView();
						this.placeImages(true);
					}.bind(this));
					break;
				case "Home":
					this.handleKey(event, function () {
						this.centerFirstImage();
					}.bind(this));		
					break;
				case "End":
					this.handleKey(event, function () {
						this.centerLastImage();
					}.bind(this));
					break;
			}
		},

		/// helper to handle key events, stopping propagation
		/// and preventing default behaviour
		handleKey: function (pEvent, pFunction) {
			pEvent.stopPropagation();
			pEvent.preventDefault();
			pFunction();
		},

		/// helper to handle arrow keys. If an image is in focus, the arrows
		/// go to the next/previous image. If we have zoome into an image, or
		/// have multiple images in view, the arrows just move the view a bit.
		handleArrowKey: function (pEvent, pX, pY) {
			this.handleKey(pEvent, function () {
				if (this.showNextImage(pX, pY, 0.3, 1.5) === null) {
					this.moveOffset(this.galleryWidth / 4 * pX, this.galleryHeight / 4 * pY);
					this.placeImages(false);
				}
			}.bind(this));
		},

		/// we keep track of the pointer down position for the pan handler
		gallery_pointerDown: function (event) {
			if (this.gallery !== document.activeElement) {
				this.gallery.focus();
				this.gallery.scrollIntoView();
			}
			this.mouseDownPosition = this.adjustPosition(event.clientX, event.clientY );
		},

		/// reset the pointer down position
		gallery_pointerUp: function (event) {
			this.mouseDownPosition = null;
		},

		/// reset the pointer down position
		gallery_pointerLeave: function (event) {
			this.mouseDownPosition = null;
		},

		/// handler for the scroll wheel, triggering a zoom. Handles different types of WheelEvents
		gallery_onWheel: function (event) {
			event.preventDefault();
			var amount = 0;
			if ('wheelDelta' in event) {
				amount = event.wheelDelta;
			} else {
				switch (event.deltaMode) {
					case 0: amount = event.deltaY;
						break;
					case 1: amount = event.deltaY * -40;
						break;
					default: amount = event.deltaY;
				}
			}
			/// amount will be around 120 for one scroll, which should translate to 0.25
			this.scrollLog += amount / -400;
			if (Math.abs(this.scrollLog) >= 0.25) {
				this.scrollLog = Math.round(this.scrollLog / 0.25) * -0.25
				this.changeZoom(this.scrollLog, this.adjustPosition(event.clientX, event.clientY), false);
				this.scrollLog = 0;
			}
		},

		/// ZingTouch tap/click handler, zooms to the image
		gallery_tap: function (event) {
			var eventDetail = event.detail.events[0];
			var clickPosition = this.normalizePosition(this.adjustPosition(eventDetail.clientX, eventDetail.clientY));
			var imageItem = this.getImageAt(clickPosition);
			if (imageItem) {
				this.zoomToImage(imageItem.image);
			}
		},

		/// ZingTouch pan / drag handler, moves the gallery canvas
		gallery_pan: function (event) {
			var eventDetail = event.detail.events[0];
			var eventPosition = this.adjustPosition(eventDetail.clientX, eventDetail.clientY);
			if (this.mouseDownPosition) {
				this.moveOffset(this.mouseDownPosition.x - eventPosition.x, this.mouseDownPosition.y - eventPosition.y);
				this.mouseDownPosition = eventPosition;
				this.placeImages(true);
			}
		},

		/// ZingTouch pinch handler, zooming out
		gallery_pinch: function (event) {
			this.changeZoom(-0.25, this.adjustPosition(event.detail.center.x, event.detail.center.y), true);
		},

		/// ZingTouch expand handler, zooming in
		gallery_expand: function(event) {
			this.changeZoom(0.25, this.adjustPosition(event.detail.center.x, event.detail.center.y), true);
		},

		/// ZingTouch swipe handler, jumping to the next image if we have a current image, 
		/// or doing other stuffs
		gallery_swipe: function (event) {
			var detail = event.detail.data[0];
			var direction = [[-1, 0], [0, 1], [1, 0], [0, -1]][Math.round((detail.currentDirection) / 90) % 4];
			this.showNextImage(direction[0], direction[1], 0.5, 10);
		},

		/// takes a client position (relative to the client dom) and
		/// calculates the position relative to the Gallery container, taking
		/// into consideration the container not beginning at 0:0, and
		/// the window being scrolled
		adjustPosition: function (pX, pY) {
			var offset = this.getGalleryOffset();
			return {
				x: pX - offset.left + window.scrollX,
				y: pY - offset.top + window.scrollY
			}
		},

		/// gets an object {left, top} representing the left and top offset
		/// of the gallery
		getGalleryOffset: function () {
			var galleryOffsetLeft = 0;
			var galleryOffsetTop = 0;
			var element = this.gallery;
			do {
				galleryOffsetLeft += element.offsetLeft;
				galleryOffsetTop += element.offsetTop;
				element = element.offsetParent;
			}
			while (element);
			return { left: galleryOffsetLeft, top: galleryOffsetTop };
		},

		/// gets the image at position pPosition. pPosition is in gallery coordinates, meaning it needs
		/// to be adjusted and normalized from clientx/y
		getImageAt: function (pPosition) {
			var col = Math.floor((pPosition.x - this.paddingLeft) / (this.imageBaseWidth + this.imageSpaceH));
			var row = Math.floor((pPosition.y - this.paddingTop) / (this.imageBaseHeight + this.imageSpaceV));
			return this.images.find(function (element) { return element.row === row && element.col === col });
		},

		/// Gets the image at the current center of the screen, but only if we have a zoom level that show the
		/// image at at least half the height or width of the screen
		getCurrentImage: function (pMinOverzoom, pMaxOverzoom) {
			var result = null;
			var imageItem = this.getImageAt(this.normalizePosition(this.adjustPosition(this.galleryWidth / 2, this.galleryHeight / 2)));
			if (imageItem) {
				var rect = imageItem.image.getImageRectangle();
				var vZoom = rect.height / this.galleryHeight;
				var hZoom = rect.width / this.galleryWidth;
				if (
					((vZoom >= pMinOverzoom) || (hZoom >= pMinOverzoom))
					&& (vZoom <= pMaxOverzoom)
					&& (hZoom <= pMaxOverzoom)
				) {
					result = imageItem;
				}
			}
			return result;
		},

		/// removes the current image collection and sets a new one
		setImageCollection: function (pImageCollection) {
			if (this.images !== null) {
				this.images.forEach(function(element){
					element.image.remove();
				}.bind(this));
			}
			this.imageCollection = pImageCollection;
			this.calculateDimensions();
			this.createImages();
			this.placeImages();
		},

		/// finds the currently displayed image, and if there is a currently displayed image,
		/// moves to the next, handling end of row / columns. Returns true, if we have moved, false otherwise
		/// returns the newly centered image, if anything happened
		showNextImage: function (pDeltaX, pDeltaY, pMinOverzoom, pMaxOverzoom) {
			var currentImage = this.getCurrentImage(pMinOverzoom, pMaxOverzoom);
			if (currentImage) {
				var col = currentImage.col + pDeltaX;
				var row = currentImage.row + pDeltaY;
				if (col >= this.columns) {
					col = 0;
					row += 1;
				} else if (col < 0) {
					col = this.columns - 1;
					row += pDeltaX;
				}
				if (row >= this.rows) {
					row = 0;
					col += 1;
				} else if (row < 0) {
					row = this.rows - 1;
					col += pDeltaY;
				}
			}
			return this.centerImage(col, row);
		},

		/// centers the image at pCol/pRow, not changing the zoom
		centerImage: function (pCol, pRow) {
			var image = this.images.find(function (element) { return element.row === pRow && element.col === pCol });
			if (image) {
				var zoomFactor = Math.pow(2, this.zoomLevel);
				this.calculateOffset(this.normalizePosition(
					{
						x: zoomFactor * (this.paddingLeft + (pCol * (this.imageBaseWidth + this.imageSpaceV)) + (this.imageBaseWidth / 2)) - this.offset.x,
						y: zoomFactor * (this.paddingTop + (pRow * (this.imageBaseHeight + this.imageSpaceH)) + (this.imageBaseHeight / 2)) - this.offset.y
					}
				));
				this.placeImages();
			}
			return image || null;
		},

		centerFirstImage: function () {
			this.centerImage(0, 0);
		},

		centerLastImage: function () {
			if (this.images.length > 0) {
				var lastImageItem = this.images[this.images.length - 1];
				this.centerImage(lastImageItem.col, lastImageItem.row);
			}
		},

		/// changes the zoom. When zooming, the center is re-set so that the image at the
		/// zoom center remains (more or less) stationary.
		changeZoom: function (pZoomChange, pCenter, pNoSmooth) {
			var newCenter;
			if ((pCenter === null)) {
				newCenter = this.normalizePosition({ x: this.galleryWidth / 2, y: this.galleryHeight / 2 });
			}
			else {
				var stretchFactor = Math.pow(2, pZoomChange);
				var galleryCenter = {
					x: this.galleryWidth / 2,
					y: this.galleryHeight / 2
				};
				var distX = galleryCenter.x - pCenter.x;
				var distY = galleryCenter.y - pCenter.y;
				newCenter = this.normalizePosition({
					x: pCenter.x + (distX / stretchFactor),
					y: pCenter.y + (distY / stretchFactor)
				});
			}
			this.zoomLevel += pZoomChange;
			this.calculateOffset(newCenter);
			this.placeImages(pNoSmooth);
		},

		/// adjust center and zoom in a way that pImage is displayed with a zoom
		/// level that fits to the gallery size.
		zoomToImage: function (pImage) {
			var rect = pImage.getImageRectangle();
			var adjustedImagePosition = this.adjustPosition(rect.left, rect.top);
			var center = {
				x: adjustedImagePosition.x + (rect.width / 2),
				y: adjustedImagePosition.y + (rect.height / 2)
			};
			var imageAspectRatio = rect.width / rect.height;
			var containerAspectRatio = this.imageBaseWidth / this.imageBaseHeight;
			var imageWidth, imageHeight;
			if (imageAspectRatio > containerAspectRatio) {
				imageWidth = this.imageBaseWidth;
				imageHeight = this.imageBaseWidth / imageAspectRatio;
			} else {
				imageWidth = this.imageBaseHeight * imageAspectRatio;
				imageHeight = this.imageBaseHeight;
			}
			var zoomH = Math.log2(this.galleryHeight / imageHeight);
			var zoomV = Math.log2(this.galleryWidth / imageWidth);
			var newZoom = Math.round(Math.min(zoomH, zoomV) / 0.25) * 0.25;
			var newCenter = this.normalizePosition(center);
			this.zoomLevel = newZoom;
			this.calculateOffset(newCenter);
			this.placeImages();
		},

		/// this takes a position on the screen and converts it to the position within the
		/// full gallery, projected to zoom level 0.
		normalizePosition: function (pPosition) {
			var scaleFactor = Math.pow(2, this.zoomLevel);
			return {
				x: (this.offset.x + pPosition.x) / scaleFactor,
				y: (this.offset.y + pPosition.y) / scaleFactor
			}
		},

		/// refreshes the top and left offset (the number of pixels of the gallery
		/// not visible to the left and to the top). This needs to be called
		/// whenever the viewport changes (zoom, center)
		calculateOffset: function(pCenter) {
			var scaleFactor = Math.pow(2, this.zoomLevel);
			var center = pCenter || {
				x: this.galleryWidth / 2,
				y: this.galleryHeight / 2
			};
			this.offset.x = (center.x * scaleFactor) - (this.galleryWidth / 2);
			this.offset.y = (center.y * scaleFactor) - (this.galleryHeight / 2);
		},

		moveOffset: function (pX, pY) {
			this.offset.x += pX;
			this.offset.y += pY;
		},

		/// creates the image objects
		createImages: function () {
			var imagesList = new Array();
			this.imageCollection.getImageNames().forEach(function (item) {
				var image = new RC.ImageGallery.Image(item, this.imageCollection);
				this.gallery.appendChild(image.draw());
				image.setSize(this.imageBaseWidth, this.imageBaseHeight);
				imagesList.push(image);
			}.bind(this));
			this.buildImageArray(imagesList);
		},

		/// places the images correctly based on the current offset and zoomLevel. Does try clever:
		/// images outside the current view are hidden in order to save rendering power. Images that
		/// could come into view soon are placed as placehoder in order to avoid lat appearance
		placeImages: function (pNoSmooth) {
			var scaleFactor = Math.pow(2, this.zoomLevel);
			var left, top;
			var imageSize = Math.max(this.imageBaseWidth * scaleFactor, this.imageBaseHeight * scaleFactor);
			var rowHeight = (this.imageBaseHeight + this.imageSpaceV) * scaleFactor;
			var visibleRows = Math.ceil(this.galleryHeight / rowHeight);
			var visibleMinRow = Math.floor((this.offset.y - (this.paddingTop * scaleFactor)) / rowHeight);
			var visibleMaxRow = visibleMinRow + visibleRows;
			var colWidth = (this.imageBaseWidth + this.imageSpaceH) * scaleFactor;
			var visibleColumns = Math.ceil(this.galleryWidth / colWidth);
			var visibleMinCol = Math.floor((this.offset.x - (this.paddingLeft * scaleFactor)) / colWidth);
			var visibleMaxCol = visibleMinCol + visibleColumns;
			var partylVisible = {
				minRow: Math.floor(visibleMinRow - visibleRows / 2),
				maxRow: Math.ceil(visibleMaxRow + visibleRows / 2),
				minCol: Math.floor(visibleMinCol - visibleColumns / 2),
				maxCol: Math.ceil(visibleMaxCol + visibleColumns / 2)
			};
			var noSmooth = pNoSmooth || (visibleRows * visibleColumns > 500);
			this.images.forEach(function (element) {
				var visibility = 0;
				if (
					(element.row >= visibleMinRow) && (element.row <= visibleMaxRow)
					&& (element.col >= visibleMinCol) && (element.col <= visibleMaxCol)
				) {
					visibility = 2;
				} else if (
					(element.row >= partylVisible.minRow) && (element.row <= partylVisible.maxRow)
					&& (element.col >= partylVisible.minCol) && (element.col <= partylVisible.maxCol)
				) {
					visibility = 1;
				}
				left = scaleFactor * (this.paddingLeft + (element.col * (this.imageBaseWidth + this.imageSpaceH))) - this.offset.x;
				top = scaleFactor * (this.paddingTop + (element.row * (this.imageBaseHeight + this.imageSpaceV))) - this.offset.y;
				element.image.transform(left, top, scaleFactor, imageSize, visibility, noSmooth);
			}.bind(this));
		},

		/// builds the array of objects {image, row, col} based on an array of
		/// image objects
		buildImageArray: function (pImages) {
			this.images = new Array();
			var row = 0;
			var col = 0;
			pImages.forEach(function (element) {
				if (col >= this.columns) {
					col = 0;
					row++;
				}
				this.images.push({ image: element, row: row, col: col });
				col++;
			}.bind(this));			
		},

		/// this takes the current images, converts them to a flat array and rebuilds the array
		/// of arrays. Useful when the number of columns changes.
		rebuildImageArray: function () {
			this.buildImageArray(this.images.map(function(element){return element.image;}));
		},

		/// calculates the image base dimensions, and the number of rows and columns based on the available
		/// space and the number of images to show. The goal is to best fit the images into the available space.
		/// Also calculates the gallery dimensions and defaults the viewport to the center of the gallery.
		calculateDimensions: function () {
			var imagesCount = this.imageCollection.getImageNames().length;
			if (imagesCount > 0) {
				this.galleryWidth = this.gallery.clientWidth;
				this.galleryHeight = this.gallery.clientHeight;
				var zoomLevel = 0;
				var zoomIncrement = 0.25;
				var zoomFactor = Math.pow(2, zoomLevel);
				var grid = this.calculateGrid(zoomFactor, imagesCount);
				while ((zoomFactor * (this.paddingTop + this.paddingBottom + (this.imageBaseHeight * grid.rows) + (this.imageSpaceV * (grid.rows - 1))) < this.galleryHeight * this.minHeightUsed)) {
					zoomLevel += zoomIncrement;
					zoomFactor = Math.pow(2, zoomLevel);
					grid = this.calculateGrid(zoomFactor, imagesCount);
				}
				this.defaultZoomLevel = zoomLevel;
				this.columns = grid.columns;
				this.rows = grid.rows;
				this.resetView();
			}
		},

		resetView: function () {
			this.zoomLevel = this.defaultZoomLevel;
			this.offset = { x: 0, y: 0 };
		},

		/// calculates the number of columns and rows needed to show pImageCount images
		/// at a certain zoomLevel. Returns an object with {columns, rows}.
		calculateGrid: function (pZoomFactor, pImagesCount) {
			var columns = Math.max(1, Math.floor((this.galleryWidth - pZoomFactor * (this.paddingLeft + this.paddingRight - this.imageSpaceH)) / (pZoomFactor * (this.imageBaseWidth + this.imageSpaceH))));
			var rows = Math.ceil(pImagesCount / columns);
			return {
				columns: columns,
				rows: rows
			};
		}
	};

	/// The collection containing all image infos for an image Gallery.
	/// pRootUrl: the url to be used with the zoomFolders to find the images
	/// pZoomFolders: an array of objects {maxSize: Number, folder: String}, maxSize null means full size
	/// pImageNames: an array with the filenames
	var ImageCollection = function (pRootUrl, pZoomFolders, pImageNames) {
		this.rootUrl = pRootUrl;
		this.zoomFolders = pZoomFolders;
		this.imageNames = pImageNames;
		this.zoomFolderMap = null;			/// a map giving quick access to the appropriate folder for a given maxWidth

		this.initialize();
	};

	ImageCollection.prototype = {

		initialize: function () {
			if (!this.rootUrl.endsWith('/')) {
				this.rootUrl += '/';
			}
			this.zoomFolderMap = new Map();
			this.zoomFolders.sort(function (x, y) { return x.maxSize - y.maxSize; });
		},

		/// returns the folder url for images no wider nor higher than pImageSize.
		/// The results are cached, using pImageSize as key
		calculateFolderUrl: function (pImageSize) {
			var result = this.zoomFolders.find(function (element) {
				return element.maxSize >= pImageSize;
			});
			if (!(result != null)) {
				result = this.zoomFolders.find(function (element) {
					return ((element.maxSize === null) || (element.maxSize === ''));
				});
			}
			return result.folder;
		},

		/// gets the folder url for images up to a certain size, defined by 
		/// the maximum of width and height (pImageSize)
		getFolderUrl: function (pImageSize) {
			pImageSize = Math.round(pImageSize);
			var zoomFolder = null;
			if (this.zoomFolderMap.has(pImageSize)) {
				zoomFolder = this.zoomFolderMap.get(pImageSize);
			} else {
				zoomFolder = this.calculateFolderUrl(pImageSize);
				this.zoomFolderMap.set(pImageSize, zoomFolder);
			}
			var result = this.rootUrl;
			if (zoomFolder) {
				result = result + zoomFolder + '/';
			} 
			return result;
		},

		/** @returns {String} the root url, where the original images can be found */
		getRootUrl: function () {
			return this.rootUrl;
		},

		/// gets the image names within the collection
		getImageNames: function(){
			return this.imageNames;
		},

		/// gets the number of images in this collection
		getImagesCount: function () {
			return this.imageNames.length;
		}
	};

	/// represents a single image within the image gallery. Is responsible for
	/// placing itself, loading image data, and knows 
	var Image = function (pImageName, pCollection) {
		this.imageName = pImageName;			// the name of the image (without path), e.g. P01234.jpg
		this.collection = pCollection;			// the collection this belongs to
		this.imageContainer = null;				// the HTMLElement representing the container to be used for positionning/scaling
		this.imageElement = null;				// the HTMLElement representing the image
		this.isHidden = false;					// quick access to whether this is hidden
		this.initialize();
	};

	Image.prototype = {

		initialize: function () {
			this.draw()
		},

		/// creates the image html element surrounded by two divs (which seems
		/// to be helpful when the outer has display flex, and the image
		/// needs to be properly scaled. Return the outer div for easy 
		/// adding to the gallery
		draw: function () {
			this.imageContainer = document.createElement('div');
			var div = document.createElement('div');
			this.imageContainer.appendChild(div);
			this.imageElement = document.createElement('img');
			div.appendChild(this.imageElement);
			return this.imageContainer;
		},

		/// removes the imageContainer
		remove: function () {
			this.imageContainer.parentElement.removeChild(this.imageContainer);
		},

		/// makes sure we have the correct imageUrl for the current zoom level
		ensureImageUrl: function (pImageSize) {
			var imageSize = pImageSize;
			if(imageSize){
				var imageUrl = this.collection.getFolderUrl(imageSize) + this.imageName;
				if ((this.imageElement.src !== imageUrl)) {
					this.imageElement.src = imageUrl;
				}
			}
		},

		/// moves/stretches/pinches the image. calls onEndTransform when done
		/// pX/pY: the new left/top of the image
		/// pScaleFactor: the factor used for scaling
		/// pImageSize: the max of height/width, used to check if reloading the image is necessary
		/// pVisibility: 0: not visible, hide the image; 1: soon visible, do translate, 2: fully visible
		/// pNoSmooth: for large numbers of visible images, we gain performance by avoiding css transform animation
		/// tricky is that the non-scaled image will be positionned using translate, so
		/// we need to add half the "grown" part of the image (see var x, var y)
		transform: function (pX, pY, pScaleFactor, pImageSize, pVisibility, pNoSmooth) {
			if (this.isHidden && pVisibility === 2) {
				this.unHideImage();
			}
			var doHide = !this.isHidden && (pVisibility < 2);
			var smooth = (pVisibility > 0) && !pNoSmooth;
			if (doHide) {
				if (smooth) {
					this.imageContainer.addEventListener('transitionend', function () {
						this.hideImage();
					}.bind(this), { once: true });
				} else {
					this.hideImage();
				}
			}
			if (pVisibility > 0) {
				this.imageContainer.className = smooth ? 'smooth' : '';
				if (pVisibility === 2) {
					if (smooth) {
						this.imageContainer.addEventListener('transitionend', function () {
							this.ensureImageUrl(pImageSize);
						}.bind(this), { once: true });
					} else {
						this.ensureImageUrl(pImageSize);
					}
				}
				var cssTransformValue = '';
				var x = pX + (pScaleFactor - 1) * this.imageContainer.clientWidth / 2;
				var y = pY + (pScaleFactor - 1) * this.imageContainer.clientHeight / 2;
				if ((x !== this.imageContainer.x) || (y !== this.imageContainer.y)) {
					cssTransformValue += `translate(${x}px, ${y}px) `;
				}
				if (pScaleFactor) {
					cssTransformValue += `scale(${pScaleFactor}) `;
				}
				if (cssTransformValue !== '') {
					if (cssTransformValue.trim() !== this.imageContainer.style.transform) {
						this.imageContainer.style.transform = cssTransformValue;
					} else {
						this.ensureImageUrl(pImageSize);
					}
				}
			} 
		},

		/// hides the image by setting the style of the image element to display: none. 
		/// Hiding images outside the view improves the responsiveness
		hideImage: function () {
			this.imageElement.style.display = 'none';
			this.isHidden = true;
		},

		/// unhides the images by removing the explicitly set display style property
		unHideImage: function(){
			this.imageElement.style.display = null;
			this.isHidden = false;
		},

		/// sets the size of the image container. Does not use transform, so this will not be 
		/// animated
		setSize: function (pWidth, pHeight) {
			if (pWidth && pHeight) {
				this.imageContainer.style.width = pWidth.toString() + 'px';
				this.imageContainer.style.height = pHeight.toString() + 'px';
			}
		},

		/// returns the bounding rectangle for the image. The result is a domClientRect, having
		/// top, left, height, width
		getImageRectangle: function () {
			return this.imageElement.getBoundingClientRect();
		}
	};

	/// Returning the classes
	return {
		Gallery: Gallery,
		ImageCollection: ImageCollection,
		Image: Image
	};
})();