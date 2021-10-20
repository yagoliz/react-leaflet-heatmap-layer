"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var L = require("leaflet");
var core_1 = require("@react-leaflet/core");
var Heatmap_1 = require("./Heatmap");
var HeatmapLayer = (function () {
    return (0, core_1.createLayerComponent)(function createHeatmapLayer(props, context) {
        var instance = new Heatmap_1.default(props);
        return { instance: instance, context: context };
    }, function updateHeatmapLayer(instance, _a) {
        var opacity = _a.opacity, minOpacity = _a.minOpacity, maxZoom = _a.maxZoom, radius = _a.radius, blur = _a.blur, max = _a.max, gradient = _a.gradient, latitudeExtractor = _a.latitudeExtractor, longitudeExtractor = _a.longitudeExtractor, intensityExtractor = _a.intensityExtractor, points = _a.points, aggregateType = _a.aggregateType, _b = _a.useLocalExtrema, useLocalExtrema = _b === void 0 ? true : _b;
        // if (props.fitBoundsOnUpdate) {
        //   instance.fitBounds()
        // }
        instance.updateSimpleHeat({ opacity: opacity, minOpacity: minOpacity, maxZoom: maxZoom, radius: radius, blur: blur, max: max, gradient: gradient });
        L.Util.setOptions(instance, {
            latitudeExtractor: latitudeExtractor,
            longitudeExtractor: longitudeExtractor,
            intensityExtractor: intensityExtractor,
            points: points,
            aggregateType: aggregateType,
            useLocalExtrema: useLocalExtrema,
        });
        instance.reset();
    });
})();
exports.default = HeatmapLayer;
