/* Copyright (c) 2006-2010 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/Vector.js
 * @requires OpenLayers/Strategy/Fixed.js
 * @requires OpenLayers/Protocol/SOS.js
 * @requires OpenLayers/Format/SOSCapabilities.js
 */

/**
 * Class: OpenLayers.Layer.SOS
 * Convenience layer for accessing Sensor Observation Services (SOS).
 *
 * Inherits from:
 *  - <OpenLayers.Layer.Vector>
 */
OpenLayers.Layer.SOS = OpenLayers.Class(OpenLayers.Layer.Vector, {

    /**
     * APIProperty: url
     * {String} The url of the Sensor Observation Service (SOS)
     */
    url: null,

    /**
     * APIProperty: sosCache
     * {Object} Cache to use for storing parsed results from
     *     <OpenLayers.Format.SOSCapabilities.read>. If not provided,
     *     these will be cached on the prototype.
     */
    sosCache: {},

    /**
     * Constructor: OpenLayers.Layer.SOS
     * Create a new SOS layer object
     *
     * Example:
     * (code)
     * var sos = new OpenLayers.Layer.SOS("Weather stations",
     *     'http://myhost/sos?');
     * (end)
     *
     * Parameters:
     * name - {String} A name for the layer
     * url - {String} Base url for the Sensor Observation Service
     * options - {Ojbect} Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, url, options) {
        this.url = url;
        this.parser = new OpenLayers.Format.SOSCapabilities();
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, 
            [name, options]);
    },

    /**
     * Method: afterAdd
     * Called at the end of the map.addLayer sequence.  
     */
    afterAdd: function() {
        var params = {'service': 'SOS', 'request': 'GetCapabilities'};
        var url = OpenLayers.Util.urlAppend(this.url,
            OpenLayers.Util.getParameterString(params));
        this.events.triggerEvent("loadstart");
        OpenLayers.Request.GET({url: url, success: this.parseCapabilities,
            scope: this});
    },

    /**
     * Method: parseCapabilities
     * Parse the SOS GetCapabilities response and make sure the layer is fed
     *     with the actual data using a strategy and a protocol.
     *
     * Parameters:
     * response - {<OpenLayers.Protocol.Response>} The response object received.
     */
    parseCapabilities: function(response) {
        if (!this.sosCache[this.id]) {
            this.sosCache[this.id] =
                this.parser.read(response.responseXML || 
                    response.responseText);
            var strategy = new OpenLayers.Strategy.Fixed({suppressLoadstartEvent: true});
            this.strategies = [strategy];
            this.protocol = new OpenLayers.Protocol.SOS({
                formatOptions: {
                    internalProjection: this.map.getProjectionObject()
                },
                url: this.url,
                fois: this.getFois()
            });
            strategy.setLayer(this);
            strategy.activate();
        }
    },

    /**
     * Function: getFois
     * Get a list of the features of interest
     *
     * Returns:
     * {Array({String}) An array with the features of interest (foi)
     */
    getFois: function() {
        var result = [];
        var capabilities = this.sosCache[this.id];
        for (var name in capabilities.contents.offeringList) {
            var offering = capabilities.contents.offeringList[name];
            var fids = offering.featureOfInterestIds;
            for (var i=0, len=fids.length; i<len; i++) {
                var foi = fids[i];
                if (OpenLayers.Util.indexOf(result, foi) === -1) {
                    result.push(foi);
                }
            }
        }
        return result;
    },

    /**
     * APIMethod: destroy
     * Take care of things that are not handled in the superclass.
     */
    destroy: function() {
        delete this.sosCache[this.id];
        OpenLayers.Layer.Vector.prototype.destroy.apply(this, arguments);
    },

    CLASS_NAME: "OpenLayers.Layer.SOS" 
});
