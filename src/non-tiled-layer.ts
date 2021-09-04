import type { LayerOptions } from 'leaflet';
import {
  bind,
  Bounds,
  Browser,
  DomUtil,
  extend,
  LatLng,
  LatLngBounds,
  Layer,
  setOptions,
  Util,
} from 'leaflet';

export interface NonTiledLayerOptions extends LayerOptions {
  /** The opacity value between 0.0 and 1.0. Default: `1.0` */
  opacity?: number;
  /** The minimum zoom level for which the overlay is requested. Default: `0` */
  minZoom?: number;
  /** The maximum zoom level for which the overlay is requested. Default: `18` */
  maxZoom?: number;
  /** The geographic bounds of the layer. Default: `LatLngBounds([-85.05, -180], [85.05, 180])` */
  bounds?: LatLngBounds
  /** z-index of the overlay. Default: `undefined` */
  zIndex?: number
  /** The pointer-events style for the overlay. Default: `undefined` */
  pointerEvents?: string;
  /**
   * The url of the image displayed when the layer fails to load (invalid request or server error).
   * Default: 1px transparent gif
   */
  errorImageUrl?: string;
  /**
   * Use the canvas to render the images, fixes flickering issues with Firefox, doesn't work on IE8.
   * Setting it to `undefined` will use canvas, if available. Default: `undefined`
   */
  useCanvas?: boolean;
  /**
   * Doubles the actual image size requested, if the browser is in retina mode. Default: `false`
   */
  detectRetina?: boolean;
  /**
   * Enables cross origin capabilities. Valid values are 'anonymous' and 'use-credentials'.
   * Default: `undefined`
   */
  crossOrigin?: 'anonymous' | 'use-credentials';
}

/*
 * NonTiledLayer is an addon for leaflet which renders dynamic image overlays
 */
const NonTiledLayer = Layer.extend({
  emptyImageUrl: 'data:image/gif;base64,R0lGODlhAQABAHAAACH5BAUAAAAALAAAAAABAAEAAAICRAEAOw==', // 1px transparent GIF

  options: {
    attribution: '',
    opacity: 1.0,
    zIndex: undefined,
    minZoom: 0,
    maxZoom: 18,
    pointerEvents: undefined,
    errorImageUrl: 'data:image/gif;base64,R0lGODlhAQABAHAAACH5BAUAAAAALAAAAAABAAEAAAICRAEAOw==', // 1px transparent GIF
    bounds: new LatLngBounds([-85.05, -180], [85.05, 180]),
    useCanvas: undefined,
    detectRetina: false,
  },

  key: '',

  // override this method in the inherited class
  // getImageUrl: function (bounds, width, height) {},
  // getImageUrlAsync: function (bounds, width, height, f) {},

  initialize: function initialize(options: NonTiledLayerOptions) {
    setOptions(this, options);
  },

  onAdd: function onAdd(map) {
    this._map = map;

    if (!this._div) {
      this._div = DomUtil.create('div', 'leaflet-image-layer');
      if (this.options.pointerEvents) {
        this._div.style['pointer-events'] = this.options.pointerEvents;
      }
      if (typeof this.options.zIndex !== 'undefined') {
        this._div.style.zIndex = this.options.zIndex;
      }
      if (typeof this.options.opacity !== 'undefined') {
        this._div.style.opacity = this.options.opacity;
      }
    }

    this.getPane().appendChild(this._div);

    const canvasSupported = !!window.HTMLCanvasElement;

    if (typeof this.options.useCanvas === 'undefined') {
      this._useCanvas = canvasSupported;
    } else {
      this._useCanvas = this.options.useCanvas;
    }

    if (this._useCanvas) {
      this._bufferCanvas = this._initCanvas();
      this._currentCanvas = this._initCanvas();
    } else {
      this._bufferImage = this._initImage();
      this._currentImage = this._initImage();
    }

    this._update();
  },

  onRemove: function onRemove() {
    this.getPane().removeChild(this._div);

    if (this._useCanvas) {
      this._div.removeChild(this._bufferCanvas);
      this._div.removeChild(this._currentCanvas);
    } else {
      this._div.removeChild(this._bufferImage);
      this._div.removeChild(this._currentImage);
    }
  },

  addTo: function addTo(map) {
    map.addLayer(this);
    return this;
  },

  _setZoom: function setZoom() {
    if (this._useCanvas) {
      if (this._currentCanvas._bounds) this._resetImageScale(this._currentCanvas, true);
      if (this._bufferCanvas._bounds) this._resetImageScale(this._bufferCanvas);
    } else {
      if (this._currentImage._bounds) this._resetImageScale(this._currentImage, true);
      if (this._bufferImage._bounds) this._resetImageScale(this._bufferImage);
    }
  },

  getEvents: function getEvents() {
    const events: any = {
      moveend: this._update,
    };

    if (this._zoomAnimated) {
      events.zoomanim = this._animateZoom;
    }

    events.zoom = this._setZoom;

    return events;
  },

  getElement: function getElement() {
    return this._div;
  },

  setOpacity: function setOpacity(opacity) {
    this.options.opacity = opacity;
    if (this._div) {
      DomUtil.setOpacity(this._div, this.options.opacity);
    }
    return this;
  },

  setZIndex: function setZIndex(zIndex) {
    if (zIndex) {
      this.options.zIndex = zIndex;
      if (this._div) {
        this._div.style.zIndex = zIndex;
      }
    }
    return this;
  },

  // TODO remove bringToFront/bringToBack duplication from TileLayer/Path
  bringToFront: function bringToFront() {
    if (this._div) {
      this.getPane().appendChild(this._div);
    }
    return this;
  },

  bringToBack: function bringToBack() {
    if (this._div) {
      this.getPane().insertBefore(this._div, this.getPane().firstChild);
    }
    return this;
  },

  getAttribution: function getAttribution() {
    return this.options.attribution;
  },

  _initCanvas: function initCanvas() {
    const canvas = DomUtil.create('canvas', 'leaflet-image-layer') as HTMLCanvasElement & { _image: HTMLImageElement };

    this._div.appendChild(canvas);
    canvas._image = new Image();
    this._ctx = canvas.getContext('2d');

    if (this.options.crossOrigin) {
      canvas._image.crossOrigin = this.options.crossOrigin;
    }

    if (this._map.options.zoomAnimation && Browser.any3d) {
      DomUtil.addClass(canvas, 'leaflet-zoom-animated');
    } else {
      DomUtil.addClass(canvas, 'leaflet-zoom-hide');
    }

    extend(canvas._image, {
      onload: bind(this._onImageLoad, this),
      onerror: bind(this._onImageError, this),
    });

    return canvas;
  },

  _initImage: function initImage() {
    const image = DomUtil.create('img', 'leaflet-image-layer');

    if (this.options.crossOrigin) {
      image.crossOrigin = this.options.crossOrigin;
    }

    this._div.appendChild(image);

    if (this._map.options.zoomAnimation && Browser.any3d) {
      DomUtil.addClass(image, 'leaflet-zoom-animated');
    } else {
      DomUtil.addClass(image, 'leaflet-zoom-hide');
    }

    // TODO createImage util method to remove duplication
    extend(image, {
      galleryimg: 'no',
      onselectstart: Util.falseFn,
      onmousemove: Util.falseFn,
      onload: bind(this._onImageLoad, this),
      onerror: bind(this._onImageError, this),
    });

    return image;
  },

  redraw: function redraw() {
    if (this._map) {
      this._update();
    }
    return this;
  },

  _animateZoom: function animateZoom(e) {
    if (this._useCanvas) {
      if (this._currentCanvas._bounds) this._animateImage(this._currentCanvas, e);
      if (this._bufferCanvas._bounds) this._animateImage(this._bufferCanvas, e);
    } else {
      if (this._currentImage._bounds) this._animateImage(this._currentImage, e);
      if (this._bufferImage._bounds) this._animateImage(this._bufferImage, e);
    }
  },

  _animateImage: function animateImage(image, e) {
    const map = this._map;
    const scale = image._scale * image._sscale * map.getZoomScale(e.zoom);
    const nw = image._bounds.getNorthWest();
    const topLeft = map._latLngToNewLayerPoint(nw, e.zoom, e.center);

    DomUtil.setTransform(image, topLeft, scale);

    image._lastScale = scale;
  },

  _resetImageScale: function resetImageScale(image) {
    const bounds = new Bounds(
      this._map.latLngToLayerPoint(image._bounds.getNorthWest()),
      this._map.latLngToLayerPoint(image._bounds.getSouthEast()),
    );
    const orgSize = image._orgBounds.getSize().y;
    const scaledSize = bounds.getSize().y;

    const scale = scaledSize / orgSize;
    image._sscale = scale;

    DomUtil.setTransform(image, bounds.min, scale);
  },

  _resetImage: function resetImage(image) {
    const bounds = new Bounds(
      this._map.latLngToLayerPoint(image._bounds.getNorthWest()),
      this._map.latLngToLayerPoint(image._bounds.getSouthEast()),
    );
    const size = bounds.getSize();

    DomUtil.setPosition(image, bounds.min);

    image._orgBounds = bounds;
    image._sscale = 1;

    if (this._useCanvas) {
      image.width = size.x;
      image.height = size.y;
    } else {
      image.style.width = `${size.x}px`;
      image.style.height = `${size.y}px`;
    }
  },

  _getClippedBounds: function getClippedBounds() {
    const wgsBounds = this._map.getBounds();

    // truncate bounds to valid wgs bounds
    let mSouth = wgsBounds.getSouth();
    let mNorth = wgsBounds.getNorth();
    let mWest = wgsBounds.getWest();
    let mEast = wgsBounds.getEast();

    const lSouth = this.options.bounds.getSouth();
    const lNorth = this.options.bounds.getNorth();
    const lWest = this.options.bounds.getWest();
    const lEast = this.options.bounds.getEast();

    // mWest = (mWest + 180) % 360 - 180;
    if (mSouth < lSouth) mSouth = lSouth;
    if (mNorth > lNorth) mNorth = lNorth;
    if (mWest < lWest) mWest = lWest;
    if (mEast > lEast) mEast = lEast;

    const world1 = new LatLng(mNorth, mWest);
    const world2 = new LatLng(mSouth, mEast);

    return new LatLngBounds(world1, world2);
  },

  _getImageScale: function getImageScale() {
    return this.options.detectRetina && Browser.retina ? 2 : 1;
  },

  _update: function update() {
    const bounds = this._getClippedBounds();

    // re-project to corresponding pixel bounds
    const pix1 = this._map.latLngToContainerPoint(bounds.getNorthWest());
    const pix2 = this._map.latLngToContainerPoint(bounds.getSouthEast());

    // get pixel size
    let width = pix2.x - pix1.x;
    let height = pix2.y - pix1.y;

    let i;
    if (this._useCanvas) {
      // set scales for zoom animation
      this._bufferCanvas._scale = this._bufferCanvas._lastScale;
      this._currentCanvas._scale = 1;
      this._currentCanvas._lastScale = this._currentCanvas._scale;
      this._bufferCanvas._sscale = 1;

      this._currentCanvas._bounds = bounds;

      this._resetImage(this._currentCanvas);

      i = this._currentCanvas._image;

      DomUtil.setOpacity(i, 0);
    } else {
      // set scales for zoom animation
      this._bufferImage._scale = this._bufferImage._lastScale;
      this._currentImage._scale = 1;
      this._currentImage._lastScale = this._currentImage._scale;
      this._bufferImage._sscale = 1;

      this._currentImage._bounds = bounds;

      this._resetImage(this._currentImage);

      i = this._currentImage;

      DomUtil.setOpacity(i, 0);
    }

    if (
      this._map.getZoom() < this.options.minZoom
      || this._map.getZoom() > this.options.maxZoom
      || width < 32
      || height < 32
    ) {
      this._div.style.visibility = 'hidden';
      i.src = this.emptyImageUrl;
      i.key = '<empty>';
      this.key = i.key;
      i.tag = null;
      return;
    }

    // fire loading event
    this.fire('loading');

    width *= this._getImageScale();
    height *= this._getImageScale();

    // create a key identifying the current request
    this.key = [bounds.getNorthWest(), bounds.getSouthEast(), width, height].join(', ');

    if (this.getImageUrl) {
      i.src = this.getImageUrl(bounds, width, height);
      i.key = this.key;
    } else {
      this.getImageUrlAsync(bounds, width, height, this.key, (key, url, tag) => {
        i.key = key;
        i.src = url;
        i.tag = tag;
      });
    }
  },

  _onImageError: function onImageError(e) {
    this.fire('error', e);
    DomUtil.addClass(e.target, 'invalid');
    // prevent error loop if error image is not valid
    if (e.target.src !== this.options.errorImageUrl) {
      e.target.src = this.options.errorImageUrl;
    }
  },

  _onImageLoad: function onImageLoad(e) {
    if (e.target.src !== this.options.errorImageUrl) {
      DomUtil.removeClass(e.target, 'invalid');
      if (!e.target.key || e.target.key !== this.key) { // obsolete / outdated image
        return;
      }
    }
    this._onImageDone(e);

    this.fire('load', e);
  },

  _onImageDone: function onImageDone(e) {
    let tmp;

    if (this._useCanvas) {
      this._renderCanvas(e);
    } else {
      DomUtil.setOpacity(this._currentImage, 1);
      DomUtil.setOpacity(this._bufferImage, 0);

      if (this._addInteraction && this._currentImage.tag) {
        this._addInteraction(this._currentImage.tag);
      }

      tmp = this._bufferImage;
      this._bufferImage = this._currentImage;
      this._currentImage = tmp;
    }

    if (e.target.key !== '<empty>') {
      this._div.style.visibility = 'visible';
    }
  },

  _renderCanvas: function renderCanvas() {
    const ctx = this._currentCanvas.getContext('2d');

    ctx.drawImage(this._currentCanvas._image, 0, 0,
      this._currentCanvas.width, this._currentCanvas.height);

    DomUtil.setOpacity(this._currentCanvas, 1);
    DomUtil.setOpacity(this._bufferCanvas, 0);

    if (this._addInteraction && this._currentCanvas._image.tag) {
      this._addInteraction(this._currentCanvas._image.tag);
    }

    const tmp = this._bufferCanvas;
    this._bufferCanvas = this._currentCanvas;
    this._currentCanvas = tmp;
  },

});

export default NonTiledLayer;
