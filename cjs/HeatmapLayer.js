"use strict";

exports.__esModule = true;
exports.default = void 0;

var L = _interopRequireWildcard(require("leaflet"));

var _core = require("@react-leaflet/core");

var _Heatmap = _interopRequireDefault(require("./Heatmap"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

const HeatmapLayer = (() => (0, _core.createLayerComponent)(function createHeatmapLayer(props, context) {
  const instance = new _Heatmap.default(props);
  return {
    instance,
    context
  };
}, function updateHeatmapLayer(instance, {
  opacity,
  minOpacity,
  maxZoom,
  radius,
  blur,
  max,
  gradient,
  latitudeExtractor,
  longitudeExtractor,
  intensityExtractor,
  points,
  aggregateType,
  useLocalExtrema = true
}) {
  // if (props.fitBoundsOnUpdate) {
  //   instance.fitBounds()
  // }
  instance.updateSimpleHeat({
    opacity,
    minOpacity,
    maxZoom,
    radius,
    blur,
    max,
    gradient
  });
  L.Util.setOptions(instance, {
    latitudeExtractor,
    longitudeExtractor,
    intensityExtractor,
    points,
    aggregateType,
    useLocalExtrema
  });
  instance.reset();
}))();

var _default = HeatmapLayer;
exports.default = _default;