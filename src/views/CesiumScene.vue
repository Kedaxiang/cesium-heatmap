<template>
  <div class="cesiumWrapper">
    <!-- cesium视图 -->
    <div id="cesiumContainer"></div>
    <div id="infoBox"></div>
    <!-- 热力图 -->
    <div id="heatmap" v-show="false"></div>
  </div>
</template>

<script>
import pointData from '@/assets/data/data.js'
import heatmapFactory from '@/assets/util/heatmap.min.js'
// import heatmapFactory from '@/assets/util/heatmap.js'
// import heatmapFactory from '@/assets/util/CesiumHeatmap.js'

export default {
  name: "CesiumScene",
  data() {
    return {
      // 热力图参数
      heatMap: {
        // 热力图范围大小
        bounds: {
          north: 22.238857,
          south: 22.252857,
          west: 113.557621,
          east: 113.571621
        },
        // 热力点对象数组
        pointsList: [
          {x: 113.569568, y:22.249437, value: 90, radius: 10},
          {x: 113.569768, y:22.250237, value: 80, radius: 20},
          {x: 113.570221, y:22.249857, value: 100, radius: 30},
        ],
        nuConfig: {
          maxOpacity: .5,  // 最高温处(默认红点处)的透明度
          minOpacity: 0,  // 最低温处（默认蓝色处）的透明度
          blur: .75,       // 热力图红点范围，数值越低红点范围越高
          gradient: {      // 设置渐变
            '0.9':'red',
            '0.8':'orange',
            '0.7':'yellow',
            '0.5':'green',
            '0.1':'blue',
          },
        }
      },
      activeShapePoints: [],    //折线的几个固定点
      showBuble: false,
    };
  },
  methods: {
    // 主文件入口
    init() {
      window.Cesium = this.$cesium;
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyZDNmODcyZS0yM2RmLTQzOTctOWRlZi1mMTc1NWU3NTQzNDYiLCJpZCI6NDAxNTEsImlhdCI6MTYwODM2NjU4M30.fylbo0NS8vGhNhQHrxeAFO-RbNOOA5oGopmXmZb0C78'
      let viewerOption = {
        geocoder: false,             // 地理位置查询定位控件
        homeButton: false,           // 默认相机位置控件
        timeline: false,             // 时间滚动条控件
        navigationHelpButton: false, // 默认的相机控制提示控件
        fullscreenButton: false,     // 全屏控件
        scene3DOnly: true,           // 每个几何实例仅以3D渲染以节省GPU内存
        baseLayerPicker: false,      // 底图切换控件
        animation: false,             // 控制场景动画的播放速度控件
        infoBox: false,
      };
      let viewer = new Cesium.Viewer(this.$el, viewerOption); 
      viewer._cesiumWidget._creditContainer.style.display = "none";
      viewer.scene.screenSpaceCameraController.enableTilt = false;
      //移除双击
      viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
      );
      window.viewer = viewer;
      console.log(new Cesium.CustomDataSource());
      // 热力图
      this.createHeatMap(this.heatMap.bounds, this.heatMap.pointsList);
      // 撒点
      this.addMarks();
      // 自定义气泡框
      this.getBubble();
      // 点聚合
      this.getDataSource();
    },
    /*
     *
     * 报错： Failed to execute 'getComputedStyle' on 'Window': parameter 1 is not of type 'Element'.
     * 
     */

    // createHeatMap() {
    //   let bounds = {
    //     west: 116.13833844,
    //     east: 116.13956899,
    //     south: 37.43582929,
    //     north: 37.43706916
		//   };
		//   // 初始化热力图

		//   let heatMap = heatmapFactory.create(
    //     viewer, // your cesium viewer
    //     bounds, // bounds for heatmap layer
    //     {
    //       // heatmap.js options go here
    //       maxOpacity: 0.75
    //     }
		//   );
    
    //                 //设置最大最小值
    //   let valueMin = 0;
    //   let valueMax = 100;
    //   // 将数据添加到热力图
    //   heatMap.setWGS84Data(valueMin, valueMax, data); 
    //   //定位到热力图的位置
    //   viewer.zoomTo(viewer.entities);
    // }

    /**
     * creatHeatMap() 将创建一个热力图，里面包含多个热力点
     *
     * @param {Object} bounds 热力图的范围，为一个对象
     * @param {Array} pointsList 热力点信息，里面应当包含点的坐标，热力值，半径， 为一个对象数组
     * @limit 最大半径为250，一个热力点覆盖整个热力图范围
     * @limit 热力图范围选择时，经纬度围成的图形需为矩形
     * @example
     * createHeatMap(
     *  {north: 22.248857,south: 22.252857,west: 113.568621,east: 113.572621},
     *  [
     *    {x：22.249637, y: 113.569568, value: 70, radius: 100},
     *    {x：22.250637, y: 113.569568, value: 80, radius: 150},
     *    {x：22.251637, y: 113.569568, value: 90, radius: 200},
     *  ]
     * );
     */
    createHeatMap(bounds, pointsList, nuConfig = this.heatMap.nuConfig) {
			let points = [];
			let max = 100;
			let width = 500;
			let height = 500;

      let {north, south, west, east} = bounds;

      for(let item of pointsList) {
        let point = {
          // 将点的地理坐标转换为canvas上的坐标,保留3位小数使得经纬度转换更加精确
          x: parseFloat((((item.x - west) / (east - west)) * height).toFixed(3)),
          y: parseFloat((((item.y - south) / (north - south)) * width).toFixed(3)),
          value: item.value,
          radius: item.radius,
        };
        max = Math.max(max, item.value);
        points.push(point);
      }
      // 创建热力图实例
      let heatmapInstance = heatmapFactory.create({
          container: document.querySelector('#heatmap'),
      });

      let data = {
        max: max,
        data: points
      };
      heatmapInstance.setData(data);
      heatmapInstance.configure(nuConfig)

			let canvas = document.getElementsByClassName('heatmap-canvas');
      // 查看设定的经纬度范围
      // viewer.entities.add({
			// 	name: 'heatmap',
			// 	rectangle: {
			// 		coordinates: Cesium.Rectangle.fromDegrees(west, north, east, south),
			// 		material:  Cesium.Color.RED.withAlpha(0.5)
			// 	}
      // });
      // console.log(canvas[0]);
			viewer.entities.add({
				name: 'heatmap',
				rectangle: {
					  coordinates: Cesium.Rectangle.fromDegrees(west, north, east, south),
					  material: new Cesium.ImageMaterialProperty({
						image: canvas[0],
						transparent: true
					})

				}
			});
      for(let item of this.heatMap.pointsList) {
        this.createPoint(Cesium.Cartesian3.fromDegrees(
          item.x,
          item.y,
        ),)
      }
			viewer.zoomTo(viewer.entities);
    },
    /**
     *  创建撒点以及广告牌
     */
    createPoint(worldPosition) {
      let point = viewer.entities.add({
          position: worldPosition,
          point: {
            color: Cesium.Color.WHITE,
            pixelSize: 5,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          }
      });
      return point;
    },
    addMarks: function() {
      // 添加广告牌实体
      let markEnetity = viewer.entities.add({
        name:  "",
        position: Cesium.Cartesian3.fromDegrees(
          113.569568,
          22.249437,
          10
        ),
        billboard: {
          image: require("../assets/video_point.png"),
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 0.5,
        },
        isVideoMark: true
      });
    },
    /**
     *  自定义气泡弹出框
     */
	  getBubble() {
      let self = this;
      const infoDiv = `
        <div id="trackPopUp" style="display:none;">
          <div id="trackPopUpContent" class="leaflet-popup" style="top:5px;left:0;">
            <a class="leaflet-popup-close-button" href="#">×</a>
            <div class="leaflet-popup-content-wrapper">
              <div id="trackPopUpLink" class="leaflet-popup-content" style="max-width:100%;"></div>
            </div>
            <div class="leaflet-popup-tip-container">
              <div class="leaflet-popup-tip"></div>
            </div>
          </div>
        </div>`;
      document.getElementById('infoBox').innerHTML = infoDiv;
      // 定义当前场景的画布元素的事件处理
      let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      //鼠标左键
      handler.setInputAction(function (movement) {
        let pickedFeature = viewer.scene.pick(movement.position);
        if(!!pickedFeature) {
          let earthPosition  = viewer.camera.pickEllipsoid(movement.position,viewer.scene.globe.ellipsoid);
          if(pickedFeature.id._isVideoMark) {
            // 显示气泡容器
            document.getElementById('trackPopUp').style.display = 'block';
            // 获取点的经纬度
            let ellipsoid = viewer.scene.globe.ellipsoid;
            let cartographic = ellipsoid.cartesianToCartographic(earthPosition);
            let lat = 22.249437;
            let lon = 113.569568;
            // 转换坐标
            let point = [lon/ Math.PI * 180, lat / Math.PI * 180];
            let  destination = Cesium.Cartesian3.fromDegrees(lon, lat, 3000.0);
            const content =`
              <div id="DisasterPointMapView" class="div-popup" >
                <div class="div-popup-main">
                  <div class="div-popup-title">视频点</div>
                  <div class="div-popup-content">
                    <video src="http://1251316161.vod2.myqcloud.com/29fe1275vodbj1251316161/ac852ba45285890810662380206/4Lgf1m3wOPQA.mp4" controls="controls">
                      您的浏览器不支持 video 标签。
                    </video>
                  </div>
                </div>     
            </div>`;
            // 核心，想要弹出的东西全部放在这里面
            let obj = {
              position: movement.position,
              destination,
              content
            };
            self.createBubble(obj);
          } else {
            document.getElementById('trackPopUp').style.display = 'none';
          }
        } else {
          document.getElementById('trackPopUp').style.display = 'none';
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },
    createBubble(obj) {
      let self = this;
      // 获取点击点的信息
      let pickedFeature = viewer.scene.pick(obj.position);
      console.log(pickedFeature);
      // 判断点是否被定义
      if(Cesium.defined(pickedFeature)) {
        // 获取id
        let id = Cesium.defaultValue(pickedFeature.id, pickedFeature.primitive.id);
        if(id) {
          if(obj.destination) {
            viewer.camera.flyTo({
              destination: obj.destination
            })
          }
          // 移除被选元素内的所有内容
          const contentBox = document.getElementById('trackPopUpLink')
          contentBox.innerHTML = '';
          // 填充被选元素的内容
          contentBox.innerHTML = obj.content;
          let pos = obj.position;
          document.getElementById('trackPopUp').style.display = 'block';
          self.positionPopUp(obj.position);
          // 实时更新位置
          const removeHandler = viewer.scene.postRender.addEventListener(function () {
            let changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, pickedFeature.primitive._actualPosition);
            // 我们转动地球,也会实时更新弹窗的位置.并不会一成不变
            if (pos && changedC && pos.x && changedC.x && pos.y && changedC.y) {
              if ((pos.x !== changedC.x) || (pos.y !== changedC.y)) {
                self.positionPopUp(changedC);
                pos = changedC;
              }
            }
            // 判断点是否已经不可见
            const ellipsoid=Cesium.Ellipsoid.WGS84;
            const camera=viewer.camera;//viewer为你的Cesium Viewer对象
            const point = Cesium.Cartesian3.fromDegrees(
              113.569568,
              22.249437,
              10
            )
            const occluder=new Cesium.EllipsoidalOccluder(ellipsoid,camera.position)
            const visible=occluder.isPointVisible(point);
            if(!visible) document.getElementById('trackPopUp').style.display = 'none';
          });
          // PopUp close button event handler
          document.getElementsByClassName('leaflet-popup-close-button')[0].onclick = function () {
            document.getElementById('trackPopUp').style.display = 'none';
            docuemnt.getElementById('trackPopUpLink').innerHTML = '';
            document.getElementsByClassName("cesium-selection-wrapper")[0].display.style = 'none';
            removeHandler.call();
            return false;
          };
        }
      }
    },
    getCenterPosition() {
      // 获取当前位置
      const result = viewer.camera.pickEllipsoid(Cesium.Cartesian2(viewer.canvas.clientWidth / 2, viewer.canvas.clientHeight / 2));
      const curPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(result);
      const lon = curPosition.longitude * 180 / Math.PI;
      const lat = curPosition.latitude * 180 / Math.PI;
      const height = this.getHeight(); 
      return {
        x: lon,
        y: lat,
        z: height
      }
    },
    getHeight() {
      //获取当前高度
      if (tdViewer) {
        const scene = viewer.scene;
        const ellipsoid = scene.globe.ellipsoid;
        const height = ellipsoid.cartesianToCartographic(viewer.camera.position).height;
        return height;
      }
    },
    positionPopUp(pos) {
      const popupContent = document.getElementById('trackPopUpContent')
      let x = pos.x - (popupContent.offsetWidth / 2);
      let y = pos.y - (popupContent.offsetHeight);
      // 为所有匹配元素(#trackPopUpContent)设置transform的值为 'translate3d(' + x + 'px, ' + y + 'px, 0)'
      popupContent.style.cssText = `transform: translate3d(${x + 200}px, ${y - 50}px, 0)`;
    },
    /**
     *  撒点点位聚合
     */
    getDataSource(){
      let options = {
        camera: viewer.scene.camera,
        canvas: viewer.scene.canvas,
      };
      let dataSourcePromise = viewer.dataSources.add(
        new Cesium.CustomDataSource()
      );
      // 创建聚簇点
      dataSourcePromise.then((dataSource) => {
        // 随机创建聚合类的点
        for(let i = 0; i < 100; i++) {
          dataSource.entities.add({
            position: Cesium.Cartesian3.fromDegrees(
              113.542724 + Math.random() * (113.569568 - 113.542724), 
              22.246437 + Math.random() * (22.255899 - 22.246437), 
              0
            ),
            billboard: {
              image: require("../assets/normal_point_128.png"),
              width: 30,//if width and height is set,it will cluster correctle when data first loaded
              height: 30
             } 
          })
        }
        // 聚合距离，两个点之间小于这个距离就会聚合
        const pixelRange = 30;
        // 每个聚合点的最小个数
        const minimumClusterSize = 3;
        // 是否开启聚合
        const enabled = true; 

        dataSource.clustering.enabled = enabled;
        dataSource.clustering.pixelRange = pixelRange;
        dataSource.clustering.minimumClusterSize = minimumClusterSize;
      
        // 创建聚合图标
        let pinBuilder = new Cesium.PinBuilder();
        let pin100 = pinBuilder
          .fromText("100+", Cesium.Color.RED, 48)
          .toDataURL();
        let pin50 = pinBuilder
          .fromText("50+", Cesium.Color.RED, 48)
          .toDataURL();
        let pin40 = pinBuilder
          .fromText("40+", Cesium.Color.ORANGE, 48)
          .toDataURL();
        let pin30 = pinBuilder
          .fromText("30+", Cesium.Color.YELLOW, 48)
          .toDataURL();
        let pin20 = pinBuilder
          .fromText("20+", Cesium.Color.GREEN, 48)
          .toDataURL();
        let pin10 = pinBuilder
          .fromText("10+", Cesium.Color.BLUE, 48)
          .toDataURL();
        let singleDigitPins = new Array(8);
        for(let i = 0; i < singleDigitPins.length; ++i) {
          singleDigitPins[i] = pinBuilder.fromText('' + (i + 2), Cesium.Color.VIOLET, 48).toDataURL();
        }
        let removeListener;
        function customStyle() {
          if (Cesium.defined(removeListener)) {
            removeListener();
            removeListener = undefined;
          } else {
            removeListener = dataSource.clustering.clusterEvent.addEventListener(
              (clusteredEntities, cluster) => {
                cluster.label.show = false;
                cluster.billboard.show = true;
                cluster.billboard.id = cluster.label.id;
                cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
                if (clusteredEntities.length >= 100) {
                  cluster.billboard.image = pin100;
                } else if (clusteredEntities.length >= 50) {
                  cluster.billboard.image = pin50;
                } else if (clusteredEntities.length >= 40) {
                  cluster.billboard.image = pin40;
                } else if (clusteredEntities.length >= 30) {
                  cluster.billboard.image = pin30;
                } else if (clusteredEntities.length >= 20) {
                  cluster.billboard.image = pin20;
                } else if (clusteredEntities.length >= 10) {
                  cluster.billboard.image = pin10;
                } else {
                  cluster.billboard.image =
                    singleDigitPins[clusteredEntities.length - 2];
                }
              }
            );
          }

          // // force a re-cluster with the new styling
          let pixelRange = dataSource.clustering.pixelRange;
          dataSource.clustering.pixelRange = 0;
          dataSource.clustering.pixelRange = pixelRange;
        }
        customStyle();

      });
    },

  },
  mounted() {
    this.init();
  },
}
</script>

<style lang='less'>
.cesiumWrapper {
  width: 100%;
  height: 100%;

  // #cesiumContainer {
  //   width: 100%;
  //   height: 100%;
  //   margin: 0;
  //   padding: 0;
  //   overflow: hidden;
  // }
  #heatmap{
    width: 500px;
    height: 500px;
  }
}

#trackPopUp {
  position: absolute;
  z-index: 1000;
}

.div-popup {
    // position: absolute;
    text-align: center;
    width: 500px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    top: 20vh;
    left: 25%;
    z-index: 999;
}

.div-popup-arrow {
    width: 22px;
    height: 12px;
}

.div-popup-main {
    background: rgba(14,36,111,0.85);
    border-radius: 4px;
    width: 100%;
    color: #ffffff;
}

.div-popup-title {
    font-size: 16px;
    font-family: PingFang SC;
    font-weight: 400;
    color: #ffffff;
    padding: 10px 0;
}

.div-popup-content {
    display: flex;
    border-top: 2px solid;
    border-bottom: 2px solid;
    margin: 0px 15px;
}

.div-popup-item {
    border-top: 2px solid;
    display: flex;
}

.div-popup-left {
    font-size: 14px;
    font-family: PingFang SC;
    font-weight: 400;
    border-right: 2px solid;
    padding: 10px 15px;
}

.div-popup-right {
    flex: 2;
    font-size: 14px;
    font-family: PingFang SC;
    font-weight: 400;
    padding: 10px 15px;
    text-align: left;
}

.div-popup-content-left {
    flex: 6;
}

.div-popup-content-right {
    border-left: 2px solid;
    padding: 5px;
    flex: 2;
}

    .div-popup-content-right img {
        width: 100%;
        height: 100%;
        min-width: 150px;
        max-width: 250px;
    }

.div-popup-bottom {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 10px;
    padding: 0px 30px;
}


.div-popup-bottom-item {
    background: rgba(0,101,196,1);
    /* border-radius:4px; */
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    padding: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0px 5px;
    text-decoration-line: none;
    width: 85px;
    overflow: hidden;
    word-break: keep-all
}

    .div-popup-bottom-item:hover {
        text-decoration-line: none;
    }

    .div-popup-bottom-item img {
        width: 20px;
        height: 20px;
        margin-right: 10px;
    }

    .div-popup-bottom-item span {
        font-size: 13px;
        font-family: PingFang SC;
        font-weight: 400;
        color: rgba(255,255,255,1);
    }

video {
  width: 100%;
}
</style>