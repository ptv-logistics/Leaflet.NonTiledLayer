import {
  CRS,
  extend,
  Layer,
  setOptions,
  Util,
} from 'leaflet';
import NonTiledLayer from './non-tiled-layer';

/*
 * NonTiledLayerWMS is used for putting WMS non tiled layers on the map.
 */
const NonTiledLayerWMS = NonTiledLayer.extend({

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

  initialize: function initialize(url, options) { // (String, Object)
    let i;

    this._wmsUrl = url;

    const wmsParams = extend({}, this.defaultWmsParams);

    // all keys that are not NonTiledLayer options go to WMS params
    for (i in options) {
      if (
        !Object.prototype.hasOwnProperty.call(NonTiledLayer.prototype.options, i)
        && !(Layer && Object.prototype.hasOwnProperty.call((Layer.prototype as any).options, i))
      ) {
        wmsParams[i] = options[i];
      }
    }

    this.wmsParams = wmsParams;

    setOptions(this, options);
  },

  onAdd: function onAdd(map) {
    this._crs = this.options.crs || map.options.crs;
    this._wmsVersion = parseFloat(this.wmsParams.version);

    const projectionKey = this._wmsVersion >= 1.3 ? 'crs' : 'srs';
    this.wmsParams[projectionKey] = this._crs.code;

    NonTiledLayer.prototype.onAdd.call(this, map);
  },

  getImageUrl: function getImageUrl(bounds, width, height) {
    const { wmsParams } = this;

    wmsParams.width = width;
    wmsParams.height = height;

    const nw = this._crs.project(bounds.getNorthWest());
    const se = this._crs.project(bounds.getSouthEast());
    const url = this._wmsUrl;
    const bbox = (this._wmsVersion >= 1.3 && this._crs === CRS.EPSG4326
      ? [se.y, nw.x, nw.y, se.x]
      : [nw.x, se.y, se.x, nw.y]).join(',');

    return url + Util.getParamString(this.wmsParams, url, this.options.uppercase) + (this.options.uppercase ? '&BBOX=' : '&bbox=') + bbox;
  },

  setParams: function setParams(params, noRedraw) {
    extend(this.wmsParams, params);

    if (!noRedraw) {
      this.redraw();
    }

    return this;
  },
});

export default NonTiledLayerWMS;
