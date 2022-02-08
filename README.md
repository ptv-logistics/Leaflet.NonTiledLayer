# Leaflet.NonTiledLayer 

[![Build status](https://github.com/ptv-logistics/Leaflet.NonTiledLayer/workflows/CI/badge.svg)](https://github.com/ptv-logistics/Leaflet.NonTiledLayer/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/leaflet.nontiledlayer.svg)](https://www.npmjs.com/package/leaflet.nontiledlayer)
![Leaflet compatible!](https://img.shields.io/badge/Leaflet-1.7.x-blue.svg?style=flat)

## Purpose

While Leaflet handles the de-facto standard for stitching a map from tiles very well, 
there is no concept for imagery data that cannot be queried in tiles.

Not all imagery providers can handle tiles properly, for example if they render labels dynamically.
So we've added a Leaflet.NonTiledLayer, which gets the imagery for the complete map viewport whenever it changes.
Leaflet.NonTiledLayer.WMS is the implementation that makes WMS requests, similar to the TileLayer.WMS.

You can see a demo here:

https://ptv-logistics.github.io/Leaflet.NonTiledLayer/index.html

It uses the WMS service of [PTV xServer internet](https://www.ptvgroup.com/en/solutions/products/ptv-xserver/), which requires a tiled/non-tiled hybrid approach (and that is the reason we've built this).
The sample also displays some 3rd-party WMS overlays that also cannot be requested in tiles.

The layer supports Leaflet 1.7.x.

## Installation

Install using [`npm`](https://www.npmjs.com/package/leaflet.nontiledlayer):

```bash
npm install leaflet.nontiledlayer
```

Or [`yarn`](https://yarnpkg.com/en/package/leaflet.nontiledlayer):

```bash
yarn add leaflet.nontiledlayer
```

Or use the latest build at https://unpkg.com/leaflet.nontiledlayer/dist/

## The supported options

* *attribution* - the attribution text for the layer data. Default: ```''```
* *opacity* - the opacity value between 0.0 and 1.0. Default: ```1.0```
* *minZoom* - the minimum zoom level for which the overlay is requested. Default: ```0```
* *maxZoom* - the maximum zoom level for which the overlay is requested. Default: ```18```
* *bounds* - the geographic bounds of the layer. Default: ```L.latLngBounds([-85.05, -180], [85.05, 180])```
* *zIndex* - z-index of the overlay. Default: ```undefined```
* *pane* - the name of the pane where the child div is inserted. Default: ```'overlayPane'``` 
* *pointerEvents* - the pointer-events style for the overlay. Default: ```null```
* *errorImageUrl* - the url of the image displayed when the layer fails to load (invalid request or server error). Default: 1px transparent gif ```data:image/gif;base64,R0lGODlhAQABAHAAACH5BAUAAAAALAAAAAABAAEAAAICRAEAOw==```
* *useCanvas* - use the canvas to render the images, fixes flickering issues with Firefox, doesn't work on IE8. Setting it to ```undefined``` will use canvas, if available. Default: ```undefined``` 
* *detectRetina* - doubles the actual image size requested, if the Browser is in retina mode. Default: ```false```
* *crossOrigin* - enables cross origin capabilities. Valid values are 'anonymous' and 'use-credentials'. Default: ```undefined```

The pane and zIndex properties allow to fine-tune the layer ordering. For example, it is possible to insert a NonTiledLayer between two layers of the tilePane, like the labels [here](http://176.95.37.29/coveragedemo/), or on top of the vector shapes, like the labels [here](https://ptv-logistics.github.io/fl-labs/) or [here](https://api-eu-test.cloud.ptvgroup.com/samplebrowser/#samples/data-rendering-geoJson/view).

You can build your own NonTiledLayer by inheriting from NonTiledLayer and implementing either the function getImageUrl or getImageUrlAsync. The getImageUrl just returns an uri and is used by the WMS implementation. The getImageUrlAsync can be used for services that not only return images, but also additional context information for interaction. The project [here](https://ptv-logistics.github.io/Leaflet.PtvLayer/) uses this method.
