While Leaflet handles the de-facto standard for stitching a map from tiles very well, 
i haven't found a concept for imagery data which cannot be queried in tiles.

Not all imagery providers can handle tiles properly, for example if they render labels dynamically.
So i've added a Leaflet.NonTiledLayer which gets the imagery for the complete map viewport whenever it changes.
Leaflet.NonTiledLayer.WMS is the implementation which makes WMS requests, similar to the TileLayer.WMS.

You can see a sample here

http://ptv-logistics.github.io/Leaflet.NonTiledLayer/NonTiledDemo.html

It uses the WMS service of xMap-Server http://xserver.ptvgroup.com/en-uk/products/ptv-xserver/ptv-xmap/
from PTV Group, which requires a tiled/non-tiled hybrid approach (and that is the reason i've built this).
The sample also displays an OSM WMS overlay which also cannot be requested in tiles.

The supported options

* attribution - the attribution text for the layer data
* opacity - the opacity value between 0.0 and 1.0; default = 1.0
* pane - the pane where the child div is inserted; default: null (div inserted at overlayPane)
* zIndex - z-index of the images

The pane and zIndex properties allow to fine-tune the layer ordering. For example, it is possible to insert a NonTiledLayer between two layers the tilePane, like the labels in http://80.146.239.139/SpatialTutorial/05-SymbolScaling.html
