const Cesium = require('cesium/Cesium')

/**
 * 动态扩散圆纹理
 * @param {} color 颜色
 * @param {} duration 持续时间毫秒
 **/
class CircleScan {
    constructor(color, duration) {
        this._definitionChanged = new Cesium.Event();
        this._color = undefined;
        this._colorSubscription = undefined;
        this.color = color;
        this.duration = duration;
        this._time = (new Date()).getTime();
    }

    getType() {
        return 'CircleScan' 
    }

    getValue(time, result) {
        if (!Cesium.defined(result)) {
            result = {}
        }
        result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.ColorWHITE, result.color);
        result.time = ((new Date().getTime() - this._time) % this.duration) / this.duration;
        return result;
    }

    equals(other) {
        return this === other ||
            (other instanceof CircleScan && Property.equals(this._color, other._color))
    }
}

Object.defineProperties(CircleScan.prototype, {
    isConstant: {
        get: function () {
            return false
        }
    },
    definitionChanged: {
        get: function () {
            return this._definitionChanged
        }
    },
    color: Cesium.createPropertyDescriptor('color')
});

export default CircleScan