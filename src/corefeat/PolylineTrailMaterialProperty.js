const Cesium = require('cesium/Cesium')

class PolylineTrailMaterialProperty {
    constructor(options) {
        options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);
        this._definitionChanged = new Cesium.Event();
        this._color = undefined;
        this._colorSubscription = undefined;
        this.color = options.color;
        this.duration = options.duration;
        this.trailImage = options.trailImage;
        this._time = performance.now();
    }

    getType(time) {
        return 'PolylineTrail'
    }

    getValue(time, result) {
        if (!Cesium.defined(result)) {
            result = {};
        }
        result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
        //result.image = Cesium.Material.PolylineTrailImage;
        result.image = this.trailImage;
        result.time = ((performance.now() - this._time) % this.duration) / this.duration;
        return result;
    }

    equals(other) {
        return this === other ||
            (other instanceof PolylineTrailMaterialProperty &&
                Cesium.Property.equals(this._color, other._color))
    }
}
Cesium.PolylineTrailMaterialProperty = PolylineTrailMaterialProperty;
Cesium.Material.PolylineTrailType = 'PolylineTrail';
Cesium.Material.PolylineTrailImage = require("../assets/polyline/color.png");
Cesium.Material.PolylineTrailSource =
    "czm_material czm_getMaterial(czm_materialInput materialInput)\n\
        {\n\
            czm_material material = czm_getDefaultMaterial(materialInput);\n\
            vec2 st = materialInput.st;\n\
            vec4 colorImage = texture2D(image, vec2(fract(st.s - time), st.t));\n\
            material.alpha = colorImage.a * color.a;\n\
            material.diffuse = (colorImage.rgb+color.rgb)/2.0;\n\
            return material;\n\
        }";
Cesium.Material._materialCache.addMaterial(Cesium.Material.PolylineTrailType, {
    fabric: {
        type: Cesium.Material.PolylineTrailType,
        uniforms: {
            color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
            image: Cesium.Material.PolylineTrailImage,
            time: 0
        },
        source: Cesium.Material.PolylineTrailSource
    },
    translucent: function (material) {
        return true;
    }
});


export default PolylineTrailMaterialProperty