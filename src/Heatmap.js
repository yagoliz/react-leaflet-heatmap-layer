"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeAggregate = exports.Gradient = exports.SimpleHeat = void 0;
var L = require("leaflet");
/// <reference path="types.d.ts"/>
var simpleheat_1 = require("simpleheat");
exports.SimpleHeat = simpleheat_1.default;
Object.defineProperty(exports, "Gradient", { enumerable: true, get: function () { return simpleheat_1.Gradient; } });
var max = function (arr) {
    return arr.reduce(function (_max, value) { return Math.max(_max, value); }, Number.MIN_SAFE_INTEGER);
};
var min = function (arr) {
    return arr.reduce(function (_min, value) { return Math.min(_min, value); }, Number.MAX_SAFE_INTEGER);
};
function isNumber(val) {
    return typeof val === 'number';
}
function isInvalid(num) {
    return !isNumber(num) && !num;
}
function isValid(num) {
    return !isInvalid(num);
}
function isValidLatLngArray(arr) {
    return arr.filter(isValid).length === arr.length;
}
function isInvalidLatLngArray(arr) {
    return !isValidLatLngArray(arr);
}
function shouldIgnoreLocation(loc) {
    return isInvalid(loc.lng) || isInvalid(loc.lat);
}
function computeAggregate(agg, intensity, aggregateType) {
    if (aggregateType === void 0) { aggregateType = 'sum'; }
    var updateMeanAndSigma = function (c, v) {
        var newMean = agg.data.mean + fns.mean(agg.data.mean, c, v);
        agg.data.sigma += (v - newMean) * (v - agg.data.mean);
        agg.data.mean = newMean;
    };
    var fns = {
        mean: function (m, c, v) { return (v - m) / c; },
        count: function () { return 1; },
        sum: function (m, c, v) { return v; },
        distinct: function (m, c, v) {
            agg.same.add(v);
            return agg.same.size;
        },
        min: function (m, c, v) { return Math.min(m, v); },
        max: function (m, c, v) { return Math.max(m, v); },
        variance: function (m, c, v) {
            updateMeanAndSigma(c, v);
            return c > 1 ? agg.data.sigma / (c - 1) : 0;
        },
        variancep: function (m, c, v) {
            updateMeanAndSigma(c, v);
            return c > 1 ? agg.data.sigma / c : 0;
        },
        stdev: function (m, c, v) { return Math.sqrt(fns.variance(m, c, v)); },
        stdevp: function (m, c, v) { return Math.sqrt(fns.variancep(m, c, v)); },
    };
    var type = aggregateType.toLowerCase();
    if (!agg.data[type]) {
        if (type === 'min') {
            agg.data[type] = Number.MAX_SAFE_INTEGER;
        }
        else if (type === 'max') {
            agg.data[type] = Number.MIN_SAFE_INTEGER;
        }
        else if (['stdev', 'stdevp', 'variance', 'variancep'].includes(type)) {
            if (!agg.data.mean) {
                agg.data.mean = 0;
            }
            if (!agg.data.sigma) {
                agg.data.sigma = 0;
            }
            agg.data[type] = 0;
        }
        else {
            agg.data[type] = 0;
        }
    }
    var res = (fns[type] || fns.sum)(agg.data[type], agg.seen, intensity);
    if (['mean', 'count', 'sum'].includes(type)) {
        agg.data[type] += res;
    }
    else {
        agg.data[type] = res;
    }
    return agg.data[type];
}
exports.computeAggregate = computeAggregate;
var Heatmap = /** @class */ (function (_super) {
    __extends(Heatmap, _super);
    function Heatmap(options) {
        var _this = _super.call(this, options) || this;
        _this.options = L.Util.setOptions(_this, options);
        return _this;
    }
    Object.defineProperty(Heatmap.prototype, "_heatmap", {
        get: function () {
            if (!this.__heatmap) {
                this.__el = document.createElement('canvas');
                this.__heatmap = new simpleheat_1.default(this.__el);
            }
            return this.__heatmap;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Heatmap.prototype, "_el", {
        get: function () {
            if (!this.__el) {
                this.__el = document.createElement('canvas');
                this.__heatmap = new simpleheat_1.default(this.__el);
            }
            return this.__el;
        },
        enumerable: false,
        configurable: true
    });
    Heatmap.prototype.getPane = function () {
        var _a;
        return (_a = _super.prototype.getPane.call(this)) !== null && _a !== void 0 ? _a : this._map.getPanes().overlayPane;
    };
    Heatmap.prototype.onAdd = function (map) {
        var canAnimate = map.options.zoomAnimation && L.Browser.any3d;
        var zoomClass = "leaflet-zoom-" + (canAnimate ? 'animated' : 'hide');
        var mapSize = map.getSize();
        this._el.className = zoomClass;
        this._el.style.transformOrigin = '50% 50%';
        this._el.width = mapSize.x;
        this._el.height = mapSize.y;
        this._heatmap.resize();
        this.getPane().appendChild(this._el);
        this.reset();
        if (this.options.fitBoundsOnLoad) {
            this.fitBounds();
        }
        this.updateSimpleHeat(this.getSimpleHeatOptions());
        return this;
    };
    Heatmap.prototype.onRemove = function () {
        var pane = this.getPane();
        if (pane.contains(this._el)) {
            pane.removeChild(this._el);
        }
        return this;
    };
    Heatmap.prototype.getEvents = function () {
        return {
            viewreset: this.reset,
            moveend: this.reset,
            zoomanim: this._animateZoom,
        };
    };
    Heatmap.prototype._animateZoom = function (e) {
        var _e = e;
        var scale = this._map.getZoomScale(_e.zoom);
        var offset = this._map
            .latLngToLayerPoint(_e.center)
            .subtract(this._map.containerPointToLayerPoint(this._map.getSize().divideBy(2)))
            .multiplyBy(-scale)
            .subtract(this._map.layerPointToContainerPoint([0, 0]));
        L.DomUtil.setTransform(this._el, offset, scale);
    };
    Heatmap.prototype.fitBounds = function () {
        var _a = this.options, points = _a.points, longitudeExtractor = _a.longitudeExtractor, latitudeExtractor = _a.latitudeExtractor;
        var lngs = points.map(longitudeExtractor);
        var lats = points.map(latitudeExtractor);
        var ne = { lng: max(lngs), lat: max(lats) };
        var sw = { lng: min(lngs), lat: min(lats) };
        if (shouldIgnoreLocation(ne) || shouldIgnoreLocation(sw)) {
            return;
        }
        this._map.fitBounds(L.latLngBounds(L.latLng(sw), L.latLng(ne)));
    };
    Heatmap.prototype.resize = function () {
        if (!this._map) {
            return;
        }
        var size = this._map.getSize();
        if (size.x !== this._el.width || size.y !== this._el.height) {
            this._el.width = size.x;
            this._el.height = size.y;
            this._heatmap.resize();
        }
    };
    Heatmap.prototype.getMinOpacity = function () {
        var _a;
        return (_a = this.options.minOpacity) !== null && _a !== void 0 ? _a : 0.01;
    };
    Heatmap.prototype.getOpacity = function () {
        var _a;
        return (_a = this.options.opacity) !== null && _a !== void 0 ? _a : 1;
    };
    Heatmap.prototype.getMax = function () {
        var _a;
        return (_a = this.options.max) !== null && _a !== void 0 ? _a : 3.0;
    };
    Heatmap.prototype.getRadius = function () {
        var _a;
        return (_a = this.options.radius) !== null && _a !== void 0 ? _a : 30;
    };
    Heatmap.prototype.getMaxZoom = function () {
        var _a;
        return (_a = this.options.maxZoom) !== null && _a !== void 0 ? _a : 18;
    };
    Heatmap.prototype.getBlur = function () {
        var _a;
        return (_a = this.options.blur) !== null && _a !== void 0 ? _a : 15;
    };
    Heatmap.prototype.getSimpleHeatOptions = function () {
        return {
            opacity: this.getOpacity(),
            minOpacity: this.getMinOpacity(),
            maxZoom: this.getMaxZoom(),
            radius: this.getRadius(),
            blur: this.getBlur(),
            max: this.getMax(),
            gradient: this.options.gradient,
        };
    };
    /**
     * Update various heatmap properties like radius, gradient, and max
     */
    Heatmap.prototype.updateSimpleHeat = function (options) {
        this.updateHeatmapRadius(options.radius, options.blur);
        this.updateHeatmapGradient(options.gradient);
        this.updateHeatmapMax(options.max);
    };
    /**
     * Update the heatmap's radius and blur (blur is optional)
     */
    Heatmap.prototype.updateHeatmapRadius = function (radius, blur) {
        if (isNumber(radius)) {
            this._heatmap.radius(radius, blur);
        }
    };
    /**
     * Update the heatmap's gradient
     */
    Heatmap.prototype.updateHeatmapGradient = function (gradient) {
        if (gradient) {
            this._heatmap.gradient(gradient);
        }
    };
    /**
     * Update the heatmap's maximum
     */
    Heatmap.prototype.updateHeatmapMax = function (maximum) {
        if (isNumber(maximum)) {
            this._heatmap.max(maximum);
        }
    };
    Heatmap.prototype.redraw = function () {
        if (!this._map) {
            return;
        }
        var r = this._heatmap._r;
        var size = this._map.getSize();
        var cellSize = r / 2;
        var panePos = this._map.layerPointToContainerPoint([0, 0]);
        var offsetX = panePos.x % cellSize;
        var offsetY = panePos.y % cellSize;
        var getLat = this.options.latitudeExtractor;
        var getLng = this.options.longitudeExtractor;
        var getIntensity = this.options.intensityExtractor;
        var inBounds = function (p, bounds) { return bounds.contains(p); };
        var filterUndefined = function (row) { return row.filter(function (c) { return c !== undefined; }); };
        var roundResults = function (results) {
            return results.reduce(function (result, row) {
                return filterUndefined(row)
                    .map(function (cell) { return [Math.round(cell[0]), Math.round(cell[1]), cell[2]]; })
                    .concat(result);
            }, []);
        };
        var aggregates = {};
        var accumulateInGrid = function (points, leafletMap, bounds, aggregateType) {
            return points.reduce(function (grid, point) {
                var latLng = [getLat(point), getLng(point)];
                //skip invalid points
                if (isInvalidLatLngArray(latLng)) {
                    return grid;
                }
                var p = leafletMap.latLngToContainerPoint(latLng);
                if (!inBounds(p, bounds)) {
                    return grid;
                }
                var x = Math.floor((p.x - offsetX) / cellSize) + 2;
                var y = Math.floor((p.y - offsetY) / cellSize) + 2;
                grid[y] = grid[y] || [];
                var cell = grid[y][x];
                var key = x + "-" + y;
                if (!aggregates[key]) {
                    aggregates[key] = {
                        data: {},
                        same: new Set(),
                        seen: 0,
                    };
                }
                aggregates[key].seen++;
                var intensity = getIntensity(point);
                var agg = computeAggregate(aggregates[key], intensity, aggregateType);
                if (!cell) {
                    grid[y][x] = [p.x, p.y, agg];
                }
                else {
                    cell[0] = (cell[0] * cell[2] + p.x * agg) / (cell[2] + agg); // x
                    cell[1] = (cell[1] * cell[2] + p.y * agg) / (cell[2] + agg); // y
                    cell[2] = agg;
                }
                return grid;
            }, []);
        };
        var getBounds = function () { return new L.Bounds(L.point([-r, -r]), size.add([r, r])); };
        var getDataForHeatmap = function (points, leafletMap, aggregateType) {
            return roundResults(accumulateInGrid(points, leafletMap, getBounds( /*leafletMap*/), aggregateType));
        };
        var data = getDataForHeatmap(this.options.points, this._map, this.options.aggregateType);
        var totalMax = max(data.map(function (m) { return m[2]; }));
        this._heatmap.clear();
        this._heatmap.data(data);
        if (this.options.useLocalExtrema) {
            this.updateHeatmapMax(totalMax);
        }
        try {
            this._heatmap.draw(this.getMinOpacity());
        }
        catch (DOMException) {
            // Safe to ignore - occurs if the width or height is 0
        }
        this._frame = null;
        if (this.options.onStatsUpdate && this.options.points && this.options.points.length > 0) {
            this.options.onStatsUpdate({
                min: min(data.map(function (m) { return m[2]; })),
                max: totalMax,
            });
        }
        this._el.style.opacity = this.getOpacity().toString();
    };
    Heatmap.prototype.reset = function () {
        if (!this._map) {
            return;
        }
        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._el, topLeft);
        this.resize();
        if (this._heatmap && !this._frame /*&& !this._map._animating*/) {
            this._frame = L.Util.requestAnimFrame(this.redraw, this);
        }
        this.redraw();
    };
    return Heatmap;
}(L.Layer));
exports.default = Heatmap;
