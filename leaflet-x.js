// PTV XServer support for leaflet

var X, originalX;

if (typeof exports !== undefined + '') {
    X = exports;
} else {
    originalX = window.X;
    X = {};

    X.noConflict = function () {
        window.X = originalX;
        return this;
    };

    window.X = X;
}

X.version = '0.5.1';

X.backgroundLayer = function (xMapWmsUrl, mapprovider) {
    return new L.TileLayer.WMS(xMapWmsUrl, {
        maxZoom: 19, minZoom: 0, opacity: 1.0, noWrap: true,
        layers: 'xmap-ajaxbg', format: 'image/gif', transparent: false,
        attribution: '<a href="http://www.ptvgroup.com">PTV</a>, ' + mapprovider
    });
};

X.labelLayer = function (xMapWmsUrl, mapprovider) {
    return new L.NonTiledLayer.WMS(xMapWmsUrl, {
        opacity: 1.0, 
        layers: 'xmap-ajaxfg', format: 'image/gif', transparent: true,
        attribution: '<a href="http://www.ptvgroup.com">PTV</a>, ' + mapprovider
    });
};