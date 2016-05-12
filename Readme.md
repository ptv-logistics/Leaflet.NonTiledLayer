While Leaflet handles the de-facto standard for stitching a map from tiles very well, 
i haven't found a concept for imagery data that cannot be queried in tiles.

Not all imagery providers can handle tiles properly, for example if they render labels dynamically.
So i've added a Leaflet.NonTiledLayer which gets the imagery for the complete map viewport whenever it changes.
Leaflet.NonTiledLayer.WMS is the implementation that makes WMS requests, similar to the TileLayer.WMS.

You can see a demo here:

http://ptv-logistics.github.io/Leaflet.NonTiledLayer/

It uses the WMS service of [PTV xServer internet](http://xserver.ptvgroup.com/en-uk/cookbook/home/), which requires a tiled/non-tiled hybrid approach (and that is the reason i've built this).
The sample also displays an OSM WMS overlay that also cannot be requested in tiles.

The supported options

* *attribution* - the attribution text for the layer data. Default: ```''```
* *opacity* - the opacity value between 0.0 and 1.0. Default: ```1.0```
* *minZoom* - the minimum zoom level for which the overlay is requested. Default: ```0```
* *maxZoom* - the maximum zoom level for which the overlay is requested. Default: ```18```
* *bounds* - the geographic bounds of the layer. Default: ```L.latLngBounds([-180, -85.05], [180, 85.05])```
* *zIndex* - z-index of the images. Default: ```undefined```
* *pane* - the name of the pane where the child div is inserted. Default: ```'overlayPane'``` 
* *pointerEvents* - the pointer-events style for the overlayer. Default: ```null```
* *errorImageUrl* - the url of the image displayed when the layer fails to load (invalid request or server error). Default: 1px transparent gif ```data:image/gif;base64,R0lGODlhAQABAHAAACH5BAUAAAAALAAAAAABAAEAAAICRAEAOw==```

The pane and zIndex properties allow to fine-tune the layer ordering. For example, it is possible to insert a NonTiledLayer between two layers the tilePane, like the labels [here](http://80.146.239.139/SpatialTutorial/05-SymbolScaling.html), or on top of the vector shapes, like the labels [here](http://ptv-logistics.github.io/fl-labs/) or [here](https://api-eu-test.cloud.ptvgroup.com/CodeSampleBrowser/index.jsp#samples/data-rendering-geoJson/view).

You can build your own NonTiledLayer by inheriting from NonTiledLayer and implementing either the function getImageUrl or getImageUrlAsync. The getImageUrl just returns an uri and is used by the WMS implementation. The getImageUrlAsync can be used for services that not only return images, but also additional context information for interaction. The project [here](https://github.com/ptv-logistics/Leaflet.PtvLayer) uses this method.
