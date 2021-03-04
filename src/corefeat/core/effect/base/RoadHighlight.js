
import '../../../PolylineTrailLinkMaterialProperty'

class RoadHighlight {
    constructor() {
        this._geojsonUrl = '';
        this._promiseEntity = undefined;
        this._temp = [];
        this._entities = undefined;
    }

    addRoad(url) {
        console.log(url);
        this._geojsonUrl = url;
        let promise = Cesium.GeoJsonDataSource.load(url);
        this._promiseEntity = viewer.dataSources.add(promise);
        promise.then(dataSource => {
            let entities = dataSource.entities.values;
            this._entities = entities
            for (let o = 0; o < entities.length; o++) {
                let r = entities[o];
                r.nameID = o;   //给每条线添加一个编号，方便之后对线修改样式
                r.polyline.width = 10;  //添加默认样式
                (r.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                    glowPower: .1, //一个数字属性，指定发光强度，占总线宽的百分比。
                    color: Cesium.Color.ORANGERED.withAlpha(.9)
                }), 10)
            }
        })
        // viewer.flyTo(this._promiseEntity)
    }

    highlightLine(nameid) {
        let exists = this._temp.indexOf(nameid);
        if (exists <= -1) {
            this.highlight(nameid, 50, 50);
            this._temp.push(nameid);  // 添加线nameID到数组，
        }
        else  //已经是高亮状态了 再次点击修改为原始状态
        {
            this.highlight(nameid, 10, 10);
            this._temp.splice(exists, 1);  //删除对应的nameID
        }
    }

    highlight(nameid, width1, width2) {
        for (let o = 0; o < this._entities.length; o++) {
            let m = this._entities[o];
            if (nameid == o) {
                m.polyline.width = width1;
                (m.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                    glowPower: .1, //一个数字属性，指定发光强度，占总线宽的百分比。
                    color: Cesium.Color.ORANGERED.withAlpha(.9)
                }), width2)
            }
        }
    }

    mouseEvent() {
        viewer.screenSpaceEventHandler.setInputAction((movement) => {
            let pickedFeature = viewer.scene.pick(movement.position);
            if (typeof (pickedFeature) != "undefined")   //鼠标是否点到线上
            {
                let name_id = pickedFeature.id.nameID;  //获取每条线的nameID
                this.highlightLine(name_id);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }
}

export default new RoadHighlight();