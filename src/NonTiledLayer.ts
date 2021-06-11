import * as L from 'leaflet';

/*
 * L.NonTiledLayer is an addon for leaflet which renders dynamic image overlays
 */
var NonTiledLayer = (L.Layer || L.Class).extend({
  includes: L.Evented || L.Mixin.Events,

  emptyImageUrl: 'data:image/gif;base64,R0lGODlhAQABAHAAACH5BAUAAAAALAAAAAABAAEAAAICRAEAOw==', // 1px transparent GIF

  options: {
    attribution: '',
    opacity: 1.0,
    zIndex: undefined,
    minZoom: 0,
    maxZoom: 18,
    pointerEvents: null,
    errorImageUrl: 'data:image/gif;base64,R0lGODlhAQABAHAAACH5BAUAAAAALAAAAAABAAEAAAICRAEAOw==', // 1px transparent GIF
    bounds: L.latLngBounds([-85.05, -180], [85.05, 180]),
    useCanvas: undefined,
    detectRetina: false,
  },

  key: '',

  // override this method in the inherited class
  // getImageUrl: function (bounds, width, height) {},
  // getImageUrlAsync: function (bounds, width, height, f) {},

  initialize: function (options) {
    L.setOptions(this, options);
  },

  onAdd: function (map) {
    this._map = map;

    // don't animate on browsers without hardware-accelerated transitions or old Android/Opera
    // Leaflet 0.7
    if (typeof this._zoomAnimated === 'undefined') {
      this._zoomAnimated = L.DomUtil.TRANSITION
        && L.Browser.any3d
        && !L.Browser.mobileOpera
        && this._map.options.zoomAnimation;
    }

    if (L.version < '1.0') this._map.on(this.getEvents(), this);
    if (!this._div) {
      this._div = L.DomUtil.create('div', 'leaflet-image-layer');
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

    var canvasSupported = typeof window !== 'undefined' && !!window.HTMLCanvasElement;

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

  getPane: function () {
    if (L.Layer) {
      return L.Layer.prototype.getPane.call(this);
    }
    if (this.options.pane) {
      this._pane = this.options.pane;
    } else {
      this._pane = this._map.getPanes().overlayPane;
    }
    return this._pane;
  },

  onRemove: function () {
    if (L.version < '1.0') this._map.off(this.getEvents(), this);

    this.getPane().removeChild(this._div);

    if (this._useCanvas) {
      this._div.removeChild(this._bufferCanvas);
      this._div.removeChild(this._currentCanvas);
    } else {
      this._div.removeChild(this._bufferImage);
      this._div.removeChild(this._currentImage);
    }
  },

  addTo: function (map) {
    map.addLayer(this);
    return this;
  },

  _setZoom: function () {
    if (this._useCanvas) {
      if (this._currentCanvas._bounds) this._resetImageScale(this._currentCanvas, true);
      if (this._bufferCanvas._bounds) this._resetImageScale(this._bufferCanvas);
    } else {
      if (this._currentImage._bounds) this._resetImageScale(this._currentImage, true);
      if (this._bufferImage._bounds) this._resetImageScale(this._bufferImage);
    }
  },

  getEvents: function () {
    var events: any = {
      moveend: this._update,
    };

    if (this._zoomAnimated) {
      events.zoomanim = this._animateZoom;
    }

    // fix: no zoomanim for pinch with Leaflet 1.0!
    if (L.version >= '1.0') {
      events.zoom = this._setZoom;
    }

    return events;
  },

  getElement: function () {
    return this._div;
  },

  setOpacity: function (opacity) {
    this.options.opacity = opacity;
    if (this._div) {
      L.DomUtil.setOpacity(this._div, this.options.opacity);
    }
    return this;
  },

  setZIndex: function (zIndex) {
    if (zIndex) {
      this.options.zIndex = zIndex;
      if (this._div) {
        this._div.style.zIndex = zIndex;
      }
    }
    return this;
  },

  // TODO remove bringToFront/bringToBack duplication from TileLayer/Path
  bringToFront: function () {
    if (this._div) {
      this.getPane().appendChild(this._div);
    }
    return this;
  },

  bringToBack: function () {
    if (this._div) {
      this.getPane().insertBefore(this._div, this.getPane().firstChild);
    }
    return this;
  },

  getAttribution: function () {
    return this.options.attribution;
  },

  _initCanvas: function () {
    var canvas = L.DomUtil.create('canvas', 'leaflet-image-layer');

    this._div.appendChild(canvas);
    canvas._image = new Image();
    this._ctx = canvas.getContext('2d');

    if (this.options.crossOrigin) {
      canvas._image.crossOrigin = this.options.crossOrigin;
    }

    if (this._map.options.zoomAnimation && L.Browser.any3d) {
      L.DomUtil.addClass(canvas, 'leaflet-zoom-animated');
    } else {
      L.DomUtil.addClass(canvas, 'leaflet-zoom-hide');
    }

    L.extend(canvas._image, {
      onload: L.bind(this._onImageLoad, this),
      onerror: L.bind(this._onImageError, this),
    });

    return canvas;
  },

  _initImage: function () {
    var image = L.DomUtil.create('img', 'leaflet-image-layer');

    if (this.options.crossOrigin) {
      image.crossOrigin = this.options.crossOrigin;
    }

    this._div.appendChild(image);

    if (this._map.options.zoomAnimation && L.Browser.any3d) {
      L.DomUtil.addClass(image, 'leaflet-zoom-animated');
    } else {
      L.DomUtil.addClass(image, 'leaflet-zoom-hide');
    }

    // TODO createImage util method to remove duplication
    L.extend(image, {
      galleryimg: 'no',
      onselectstart: L.Util.falseFn,
      onmousemove: L.Util.falseFn,
      onload: L.bind(this._onImageLoad, this),
      onerror: L.bind(this._onImageError, this),
    });

    return image;
  },

  redraw: function () {
    if (this._map) {
      this._update();
    }
    return this;
  },

  _animateZoom: function (e) {
    if (this._useCanvas) {
      if (this._currentCanvas._bounds) this._animateImage(this._currentCanvas, e);
      if (this._bufferCanvas._bounds) this._animateImage(this._bufferCanvas, e);
    } else {
      if (this._currentImage._bounds) this._animateImage(this._currentImage, e);
      if (this._bufferImage._bounds) this._animateImage(this._bufferImage, e);
    }
  },

  _animateImage: function (image, e) {
    if (typeof L.DomUtil.setTransform === 'undefined') { // Leaflet 0.7
      var map = this._map;
      var scale = image._scale * map.getZoomScale(e.zoom);
      var nw = image._bounds.getNorthWest();
      var se = image._bounds.getSouthEast();

      var topLeft = map._latLngToNewLayerPoint(nw, e.zoom, e.center);
      var size = map._latLngToNewLayerPoint(se, e.zoom, e.center)._subtract(topLeft);
      var origin = topLeft._add(size._multiplyBy((1 / 2) * (1 - 1 / scale)));

      image.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(origin) + ' scale(' + scale + ') ';
    } else {
      var map = this._map;
      var scale = image._scale * image._sscale * map.getZoomScale(e.zoom);
      var nw = image._bounds.getNorthWest();
      var se = image._bounds.getSouthEast();

      var topLeft = map._latLngToNewLayerPoint(nw, e.zoom, e.center);

      L.DomUtil.setTransform(image, topLeft, scale);
    }

    image._lastScale = scale;
  },

  _resetImageScale: function (image) {
    var bounds = new L.Bounds(
      this._map.latLngToLayerPoint(image._bounds.getNorthWest()),
      this._map.latLngToLayerPoint(image._bounds.getSouthEast()),
    );
    var orgSize = image._orgBounds.getSize().y;
    var scaledSize = bounds.getSize().y;

    var scale = scaledSize / orgSize;
    image._sscale = scale;

    L.DomUtil.setTransform(image, bounds.min, scale);
  },

  _resetImage: function (image) {
    var bounds = new L.Bounds(
      this._map.latLngToLayerPoint(image._bounds.getNorthWest()),
      this._map.latLngToLayerPoint(image._bounds.getSouthEast()),
    );
    var size = bounds.getSize();

    L.DomUtil.setPosition(image, bounds.min);

    image._orgBounds = bounds;
    image._sscale = 1;

    if (this._useCanvas) {
      image.width = size.x;
      image.height = size.y;
    } else {
      image.style.width = size.x + 'px';
      image.style.height = size.y + 'px';
    }
  },

  _getClippedBounds: function () {
    var wgsBounds = this._map.getBounds();

    // truncate bounds to valid wgs bounds
    var mSouth = wgsBounds.getSouth();
    var mNorth = wgsBounds.getNorth();
    var mWest = wgsBounds.getWest();
    var mEast = wgsBounds.getEast();

    var lSouth = this.options.bounds.getSouth();
    var lNorth = this.options.bounds.getNorth();
    var lWest = this.options.bounds.getWest();
    var lEast = this.options.bounds.getEast();

    // mWest = (mWest + 180) % 360 - 180;
    if (mSouth < lSouth) mSouth = lSouth;
    if (mNorth > lNorth) mNorth = lNorth;
    if (mWest < lWest) mWest = lWest;
    if (mEast > lEast) mEast = lEast;

    var world1 = new L.LatLng(mNorth, mWest);
    var world2 = new L.LatLng(mSouth, mEast);

    return new L.LatLngBounds(world1, world2);
  },

  _getImageScale: function () {
    return this.options.detectRetina && L.Browser.retina ? 2 : 1;
  },

  _update: function () {
    var bounds = this._getClippedBounds();

    // re-project to corresponding pixel bounds
    var pix1 = this._map.latLngToContainerPoint(bounds.getNorthWest());
    var pix2 = this._map.latLngToContainerPoint(bounds.getSouthEast());

    // get pixel size
    var width = pix2.x - pix1.x;
    var height = pix2.y - pix1.y;

    var i;
    if (this._useCanvas) {
      // set scales for zoom animation
      this._bufferCanvas._scale = this._bufferCanvas._lastScale;
      this._currentCanvas._scale = this._currentCanvas._lastScale = 1;
      this._bufferCanvas._sscale = 1;

      this._currentCanvas._bounds = bounds;

      this._resetImage(this._currentCanvas);

      i = this._currentCanvas._image;

      L.DomUtil.setOpacity(i, 0);
    } else {
      // set scales for zoom animation
      this._bufferImage._scale = this._bufferImage._lastScale;
      this._currentImage._scale = this._currentImage._lastScale = 1;
      this._bufferImage._sscale = 1;

      this._currentImage._bounds = bounds;

      this._resetImage(this._currentImage);

      i = this._currentImage;

      L.DomUtil.setOpacity(i, 0);
    }

    if (
      this._map.getZoom() < this.options.minZoom
      || this._map.getZoom() > this.options.maxZoom
      || width < 32
      || height < 32
    ) {
      this._div.style.visibility = 'hidden';
      i.src = this.emptyImageUrl;
      this.key = i.key = '<empty>';
      i.tag = null;
      return;
    }

    // fire loading event
    this.fire('loading');

    width *= this._getImageScale();
    height *= this._getImageScale();

    // create a key identifying the current request
    this.key = '' + bounds.getNorthWest() + ', ' + bounds.getSouthEast() + ', ' + width + ', ' + height;

    if (this.getImageUrl) {
      i.src = this.getImageUrl(bounds, width, height);
      i.key = this.key;
    } else {
      this.getImageUrlAsync(bounds, width, height, this.key, function (key, url, tag) {
        i.key = key;
        i.src = url;
        i.tag = tag;
      });
    }
  },
  _onImageError: function (e) {
    this.fire('error', e);
    L.DomUtil.addClass(e.target, 'invalid');
    // prevent error loop if error image is not valid
    if (e.target.src !== this.options.errorImageUrl) {
      e.target.src = this.options.errorImageUrl;
    }
  },
  _onImageLoad: function (e) {
    if (e.target.src !== this.options.errorImageUrl) {
      L.DomUtil.removeClass(e.target, 'invalid');
      if (!e.target.key || e.target.key !== this.key) { // obsolete / outdated image
        return;
      }
    }
    this._onImageDone(e);

    this.fire('load', e);
  },
  _onImageDone: function (e) {
    if (this._useCanvas) {
      this._renderCanvas(e);
    } else {
      L.DomUtil.setOpacity(this._currentImage, 1);
      L.DomUtil.setOpacity(this._bufferImage, 0);

      if (this._addInteraction && this._currentImage.tag) {
        this._addInteraction(this._currentImage.tag);
      }

      var tmp = this._bufferImage;
      this._bufferImage = this._currentImage;
      this._currentImage = tmp;
    }

    if (e.target.key !== '<empty>') {
      this._div.style.visibility = 'visible';
    }
  },
  _renderCanvas: function () {
    var ctx = this._currentCanvas.getContext('2d');

    ctx.drawImage(this._currentCanvas._image, 0, 0,
      this._currentCanvas.width, this._currentCanvas.height);

    L.DomUtil.setOpacity(this._currentCanvas, 1);
    L.DomUtil.setOpacity(this._bufferCanvas, 0);

    if (this._addInteraction && this._currentCanvas._image.tag) {
      this._addInteraction(this._currentCanvas._image.tag);
    }

    var tmp = this._bufferCanvas;
    this._bufferCanvas = this._currentCanvas;
    this._currentCanvas = tmp;
  },

});

if (typeof window !== 'undefined' && typeof (window as any).L !== 'undefined') {
  (window as any).L.nonTiledLayer = function nonTiledLayer() {
    return new NonTiledLayer();
  };
}

/*
 * L.NonTiledLayer.WMS is used for putting WMS non tiled layers on the map.
 */
NonTiledLayer.WMS = NonTiledLayer.extend({

  defaultWmsParams: {
    service: 'WMS',
    request: 'GetMap',
    version: '1.1.1',
    layers: '',
    styles: '',
    format: 'image/jpeg',
    transparent: false,
  },

  options: {
    crs: null,
    uppercase: false,
  },

  initialize: function (url, options) { // (String, Object)
    this._wmsUrl = url;

    var wmsParams = L.extend({}, this.defaultWmsParams);

    // all keys that are not NonTiledLayer options go to WMS params
    for (var i in options) {
      if (
        !NonTiledLayer.prototype.options.hasOwnProperty(i)
        && !(L.Layer && L.Layer.prototype.options.hasOwnProperty(i))
      ) {
        wmsParams[i] = options[i];
      }
    }

    this.wmsParams = wmsParams;

    L.setOptions(this, options);
  },

  onAdd: function (map) {
    this._crs = this.options.crs || map.options.crs;
    this._wmsVersion = parseFloat(this.wmsParams.version);

    var projectionKey = this._wmsVersion >= 1.3 ? 'crs' : 'srs';
    this.wmsParams[projectionKey] = this._crs.code;

    NonTiledLayer.prototype.onAdd.call(this, map);
  },

  getImageUrl: function (bounds, width, height) {
    var wmsParams = this.wmsParams;
    wmsParams.width = width;
    wmsParams.height = height;

    var nw = this._crs.project(bounds.getNorthWest());
    var se = this._crs.project(bounds.getSouthEast());

    var url = this._wmsUrl;

    var bbox = (this._wmsVersion >= 1.3 && this._crs === L.CRS.EPSG4326
      ? [se.y, nw.x, nw.y, se.x]
      : [nw.x, se.y, se.x, nw.y]).join(',');

    return url + L.Util.getParamString(this.wmsParams, url, this.options.uppercase) + (this.options.uppercase ? '&BBOX=' : '&bbox=') + bbox;
  },

  setParams: function (params, noRedraw) {
    L.extend(this.wmsParams, params);

    if (!noRedraw) {
      this.redraw();
    }

    return this;
  },
});

L.nonTiledLayer.wms = function (url, options) {
  return new NonTiledLayer.WMS(url, options);
};

export default NonTiledLayer;
