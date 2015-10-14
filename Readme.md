While Leaflet handles the de-facto standard for stitching a map from tiles very well, 
i haven't found a concept for imagery data that cannot be queried in tiles.

Not all imagery providers can handle tiles properly, for example if they render labels dynamically.
So i've added a Leaflet.NonTiledLayer which gets the imagery for the complete map viewport whenever it changes.
Leaflet.NonTiledLayer.WMS is the implementation that makes WMS requests, similar to the TileLayer.WMS.

You can see a demo here:

http://ptv-logistics.github.io/Leaflet.NonTiledLayer

It uses the WMS service of xMap-Server http://xserver.ptvgroup.com/en-uk/products/ptv-xserver/ptv-xmap/
from PTV Group, which requires a tiled/non-tiled hybrid approach (and that is the reason i've built this).
The sample also displays an OSM WMS overlay that also cannot be requested in tiles.

The supported options

* *attribution* - the attribution text for the layer data
* *opacity* - the opacity value between 0.0 and 1.0; default = 1.0
* *minZoom* - the minimum zoom level for which the overlay is requested
* *maxZoom* - the maximum zoom level for which the overlay is requested
* *zIndex* - z-index of the images
* *pane* - the name of the pane where the child div is inserted; default: 'overlayPane' 
* *pointerEvents* - the pointer-events style for the overlayer, default: null

The pane and zIndex properties allow to fine-tune the layer ordering. For example, it is possible to insert a NonTiledLayer between two layers the tilePane, like the labels in http://80.146.239.139/SpatialTutorial/05-SymbolScaling.html, or on top of the vector shapes, like the labels here http://ptv-logistics.github.io/fl-labs/ or here https://api-eu-test.cloud.ptvgroup.com/CodeSampleBrowser/index.jsp#samples/data-rendering-geoJson/

You can build your own NonTiledLayer by inheriting from NonTiledLayer and implementing either the function getImageUrl or getImageUrlAsync. The getImageUrl just returns an uri and is used by the WMS implementation. The getImageUrlAsync can be used for services that not only return images, but also additional context information for interaction. The project https://github.com/ptv-logistics/Leaflet.PtvLayer uses this method.
