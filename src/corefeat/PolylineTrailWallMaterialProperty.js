const Cesium = require('cesium/Cesium')
/**
 * 动态墙纹理
 * @param {} color 颜色
 * @param {} duration 持续时间毫秒
 **/

class PolylineTrailWallMaterialProperty {
    constructor(color, duration) {
        this._definitionChanged = new Cesium.Event();
        this._color = undefined;
        this._colorSubscription = undefined;
        this.color = color;
        this.duration = duration;
        this._time = (new Date()).getTime();
    }

    getType() {
        return 'PolylineTrailWall';
    }

    getValue(time, result) {
        if (!Cesium.defined(result)) {
            result = {};
        }
        result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
        result.image = Cesium.Material.PolylineTrailWallImage;
        result.time = (((new Date()).getTime() - this._time) % this.duration) / this.duration;
        return result;
    }

    equals(other) {
        return this === other || (other instanceof PolylineTrailWallMaterialProperty &&
            Property.equals(this._color, other._color))
    }
}


Cesium.PolylineTrailWallMaterialProperty = PolylineTrailWallMaterialProperty;
Cesium.Material.PolylineTrailWallType = "PolylineTrailWall";
Cesium.Material.PolylineTrailWallImage = require("../assets/polyline/red.png");
Cesium.Material.PolylineTrailWallSource =
    "czm_material czm_getMaterial(czm_materialInput materialInput)\n\
        {\n\
            czm_material material = czm_getDefaultMaterial(materialInput);\n\
            vec2 st = materialInput.st;\n\
            st *= 1.0;\n\
            st = fract(st);\n\
            vec4 colorImage = texture2D(image, vec2(fract(st.t - time), st.t));\n\
            material.alpha = colorImage.a * color.a;\n\
            material.diffuse = (colorImage.rgb+color.rgb)/2.0;\n\
            return material;\n\
        }";

Cesium.Material._materialCache.addMaterial(
    Cesium.Material.PolylineTrailWallType,
    {
        fabric: {
            type: Cesium.Material.PolylineTrailWallType,
            uniforms: {
                color: new Cesium.Color(1.0, 0.0, 0.0, 0.7),
                image: Cesium.Material.PolylineTrailWallImage,
                time: 0,
            },
            source: Cesium.Material.PolylineTrailWallSource,
        },
        translucent: function () {
            return true;
        },
    }
);

Object.defineProperties(PolylineTrailWallMaterialProperty.prototype, {
    isConstant: {
        get: function () {
            return false;
        }
    },
    definitionChanged: {
        get: function () {
            return this._definitionChanged;
        }
    },
    color: Cesium.createPropertyDescriptor('color')
});

export default new PolylineTrailWallMaterialProperty()