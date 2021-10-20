"use strict";

exports.__esModule = true;
exports.computeAggregate = computeAggregate;
exports.default = void 0;

var L = _interopRequireWildcard(require("leaflet"));

var _simpleheat = _interopRequireWildcard(require("simpleheat"));

exports.SimpleHeat = _simpleheat.default;
exports.Gradient = _simpleheat.Gradient;

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/// <reference path="types.d.ts"/>
const max = arr => arr.reduce((_max, value) => Math.max(_max, value), Number.MIN_SAFE_INTEGER);

const min = arr => arr.reduce((_min, value) => Math.min(_min, value), Number.MAX_SAFE_INTEGER);

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

function computeAggregate(agg, intensity, aggregateType = 'sum') {
  const updateMeanAndSigma = (c, v) => {
    const newMean = agg.data.mean + fns.mean(agg.data.mean, c, v);
    agg.data.sigma += (v - newMean) * (v - agg.data.mean);
    agg.data.mean = newMean;
  };

  const fns = {
    mean: (m, c, v) => (v - m) / c,
    count: () => 1,
    sum: (m, c, v) => v,
    distinct: (m, c, v) => {
      agg.same.add(v);
      return agg.same.size;
    },
    min: (m, c, v) => Math.min(m, v),
    max: (m, c, v) => Math.max(m, v),
    variance: (m, c, v) => {
      updateMeanAndSigma(c, v);
      return c > 1 ? agg.data.sigma / (c - 1) : 0;
    },
    variancep: (m, c, v) => {
      updateMeanAndSigma(c, v);
      return c > 1 ? agg.data.sigma / c : 0;
    },
    stdev: (m, c, v) => Math.sqrt(fns.variance(m, c, v)),
    stdevp: (m, c, v) => Math.sqrt(fns.variancep(m, c, v))
  };
  const type = aggregateType.toLowerCase();

  if (!agg.data[type]) {
    if (type === 'min') {
      agg.data[type] = Number.MAX_SAFE_INTEGER;
    } else if (type === 'max') {
      agg.data[type] = Number.MIN_SAFE_INTEGER;
    } else if (['stdev', 'stdevp', 'variance', 'variancep'].includes(type)) {
      if (!agg.data.mean) {
        agg.data.mean = 0;
      }

      if (!agg.data.sigma) {
        agg.data.sigma = 0;
      }

      agg.data[type] = 0;
    } else {
      agg.data[type] = 0;
    }
  }

  const res = (fns[type] || fns.sum)(agg.data[type], agg.seen, intensity);

  if (['mean', 'count', 'sum'].includes(type)) {
    agg.data[type] += res;
  } else {
    agg.data[type] = res;
  }

  return agg.data[type];
}

class Heatmap extends L.Layer {
  constructor(options) {
    super(options);
    this.__el = void 0;
    this.__heatmap = void 0;
    this._frame = void 0;
    this.options = void 0;
    this.options = L.Util.setOptions(this, options);
  }

  get _heatmap() {
    if (!this.__heatmap) {
      this.__el = document.createElement('canvas');
      this.__heatmap = new _simpleheat.default(this.__el);
    }

    return this.__heatmap;
  }

  get _el() {
    if (!this.__el) {
      this.__el = document.createElement('canvas');
      this.__heatmap = new _simpleheat.default(this.__el);
    }

    return this.__el;
  }

  getPane() {
    var _super$getPane;

    return (_super$getPane = super.getPane()) != null ? _super$getPane : this._map.getPanes().overlayPane;
  }

  onAdd(map) {
    const canAnimate = map.options.zoomAnimation && L.Browser.any3d;
    const zoomClass = `leaflet-zoom-${canAnimate ? 'animated' : 'hide'}`;
    const mapSize = map.getSize();
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
  }

  onRemove() {
    const pane = this.getPane();

    if (pane.contains(this._el)) {
      pane.removeChild(this._el);
    }

    return this;
  }

  getEvents() {
    return {
      viewreset: this.reset,
      moveend: this.reset,
      zoomanim: this._animateZoom
    };
  }

  _animateZoom(e) {
    const _e = e;

    const scale = this._map.getZoomScale(_e.zoom);

    const offset = this._map.latLngToLayerPoint(_e.center).subtract(this._map.containerPointToLayerPoint(this._map.getSize().divideBy(2))).multiplyBy(-scale).subtract(this._map.layerPointToContainerPoint([0, 0]));

    L.DomUtil.setTransform(this._el, offset, scale);
  }

  fitBounds() {
    const {
      points,
      longitudeExtractor,
      latitudeExtractor
    } = this.options;
    const lngs = points.map(longitudeExtractor);
    const lats = points.map(latitudeExtractor);
    const ne = {
      lng: max(lngs),
      lat: max(lats)
    };
    const sw = {
      lng: min(lngs),
      lat: min(lats)
    };

    if (shouldIgnoreLocation(ne) || shouldIgnoreLocation(sw)) {
      return;
    }

    this._map.fitBounds(L.latLngBounds(L.latLng(sw), L.latLng(ne)));
  }

  resize() {
    if (!this._map) {
      return;
    }

    const size = this._map.getSize();

    if (size.x !== this._el.width || size.y !== this._el.height) {
      this._el.width = size.x;
      this._el.height = size.y;

      this._heatmap.resize();
    }
  }

  getMinOpacity() {
    var _this$options$minOpac;

    return (_this$options$minOpac = this.options.minOpacity) != null ? _this$options$minOpac : 0.01;
  }

  getOpacity() {
    var _this$options$opacity;

    return (_this$options$opacity = this.options.opacity) != null ? _this$options$opacity : 1;
  }

  getMax() {
    var _this$options$max;

    return (_this$options$max = this.options.max) != null ? _this$options$max : 3.0;
  }

  getRadius() {
    var _this$options$radius;

    return (_this$options$radius = this.options.radius) != null ? _this$options$radius : 30;
  }

  getMaxZoom() {
    var _this$options$maxZoom;

    return (_this$options$maxZoom = this.options.maxZoom) != null ? _this$options$maxZoom : 18;
  }

  getBlur() {
    var _this$options$blur;

    return (_this$options$blur = this.options.blur) != null ? _this$options$blur : 15;
  }

  getSimpleHeatOptions() {
    return {
      opacity: this.getOpacity(),
      minOpacity: this.getMinOpacity(),
      maxZoom: this.getMaxZoom(),
      radius: this.getRadius(),
      blur: this.getBlur(),
      max: this.getMax(),
      gradient: this.options.gradient
    };
  }
  /**
   * Update various heatmap properties like radius, gradient, and max
   */


  updateSimpleHeat(options) {
    this.updateHeatmapRadius(options.radius, options.blur);
    this.updateHeatmapGradient(options.gradient);
    this.updateHeatmapMax(options.max);
  }
  /**
   * Update the heatmap's radius and blur (blur is optional)
   */


  updateHeatmapRadius(radius, blur) {
    if (isNumber(radius)) {
      this._heatmap.radius(radius, blur);
    }
  }
  /**
   * Update the heatmap's gradient
   */


  updateHeatmapGradient(gradient) {
    if (gradient) {
      this._heatmap.gradient(gradient);
    }
  }
  /**
   * Update the heatmap's maximum
   */


  updateHeatmapMax(maximum) {
    if (isNumber(maximum)) {
      this._heatmap.max(maximum);
    }
  }

  redraw() {
    if (!this._map) {
      return;
    }

    const r = this._heatmap._r;

    const size = this._map.getSize();

    const cellSize = r / 2;

    const panePos = this._map.layerPointToContainerPoint([0, 0]);

    const offsetX = panePos.x % cellSize;
    const offsetY = panePos.y % cellSize;
    const getLat = this.options.latitudeExtractor;
    const getLng = this.options.longitudeExtractor;
    const getIntensity = this.options.intensityExtractor;

    const inBounds = (p, bounds) => bounds.contains(p);

    const filterUndefined = row => row.filter(c => c !== undefined);

    const roundResults = results => results.reduce((result, row) => filterUndefined(row).map(cell => [Math.round(cell[0]), Math.round(cell[1]), cell[2]]).concat(result), []);

    const aggregates = {};

    const accumulateInGrid = (points, leafletMap, bounds, aggregateType) => points.reduce((grid, point) => {
      const latLng = [getLat(point), getLng(point)]; //skip invalid points

      if (isInvalidLatLngArray(latLng)) {
        return grid;
      }

      const p = leafletMap.latLngToContainerPoint(latLng);

      if (!inBounds(p, bounds)) {
        return grid;
      }

      const x = Math.floor((p.x - offsetX) / cellSize) + 2;
      const y = Math.floor((p.y - offsetY) / cellSize) + 2;
      grid[y] = grid[y] || [];
      const cell = grid[y][x];
      const key = `${x}-${y}`;

      if (!aggregates[key]) {
        aggregates[key] = {
          data: {},
          same: new Set(),
          seen: 0
        };
      }

      aggregates[key].seen++;
      const intensity = getIntensity(point);
      const agg = computeAggregate(aggregates[key], intensity, aggregateType);

      if (!cell) {
        grid[y][x] = [p.x, p.y, agg];
      } else {
        cell[0] = (cell[0] * cell[2] + p.x * agg) / (cell[2] + agg); // x

        cell[1] = (cell[1] * cell[2] + p.y * agg) / (cell[2] + agg); // y

        cell[2] = agg;
      }

      return grid;
    }, []);

    const getBounds = () => new L.Bounds(L.point([-r, -r]), size.add([r, r]));

    const getDataForHeatmap = (points, leafletMap, aggregateType) => roundResults(accumulateInGrid(points, leafletMap, getBounds(), aggregateType));

    const data = getDataForHeatmap(this.options.points, this._map, this.options.aggregateType);
    const totalMax = max(data.map(m => m[2]));

    this._heatmap.clear();

    this._heatmap.data(data);

    if (this.options.useLocalExtrema) {
      this.updateHeatmapMax(totalMax);
    }

    try {
      this._heatmap.draw(this.getMinOpacity());
    } catch (DOMException) {// Safe to ignore - occurs if the width or height is 0
    }

    this._frame = null;

    if (this.options.onStatsUpdate && this.options.points && this.options.points.length > 0) {
      this.options.onStatsUpdate({
        min: min(data.map(m => m[2])),
        max: totalMax
      });
    }

    this._el.style.opacity = this.getOpacity().toString();
  }

  reset() {
    if (!this._map) {
      return;
    }

    const topLeft = this._map.containerPointToLayerPoint([0, 0]);

    L.DomUtil.setPosition(this._el, topLeft);
    this.resize();

    if (this._heatmap && !this._frame
    /*&& !this._map._animating*/
    ) {
      this._frame = L.Util.requestAnimFrame(this.redraw, this);
    }

    this.redraw();
  }

}

exports.default = Heatmap;