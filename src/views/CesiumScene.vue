<template>
  <div class="cesiumWrapper">
    <!-- cesium视图 -->
    <div class="heatmap-control-wrap">
      <heatmap-control></heatmap-control>
    </div>
    <!-- 自定义气泡弹出框 -->
    <div id="infoBox"></div>
  </div>
</template>

<script>
// 引入经纬度转单位长度(km)的计算方法
import distanceCompute from "@/utils/distance.js";

// 引入热力图插件
import heatmapFactory from "@/utils/heatmap.min.js";
// import heatmapFactory from '@/utils/CesiumHeatmap.js'

// 引入组件
import HeatmapControl from "@/components/HeatmapControl";

import CircleScan from "../corefeat/CircleScanMaterialProperty";
import "../corefeat/PolylineTrailLinkMaterialProperty";
import "../corefeat/PolylineTrailMaterialProperty";
import "../corefeat/PolylineTrailWallMaterialProperty";

import ConditionsLayer from "../assets/data/geojson/topo_lane_xu.json";

import * as turf from "@turf/turf";

import { roadHighlight } from "../corefeat/core/effect/index";

export default {
  name: "CesiumScene",
  data() {
    return {
      // 热力图参数
      heatMap: {
        // 热力图范围大小
        bounds: {
          minLat: 22.230857,
          maxLat: 22.263857,
          minLng: 113.557621,
          maxLng: 113.582621,
        },
        // 热力点对象数组
        pointsList: [
          // {x: 113.569568, y:22.249437, value: 90, radius: 20},
          // {x: 113.569768, y:22.250237, value: 80, radius: 50},
          { x: 113.570221, y: 22.249857, value: 100, radius: 30 },
          { x: 113.570121, y: 22.244857, value: 100, radius: 200 },
        ],
        nuConfig: {
          maxOpacity: 0.5, // 最高温处(默认红点处)的透明度
          minOpacity: 0, // 最低温处（默认蓝色处）的透明度
          blur: 0.75, // 热力图红点范围，数值越低红点范围越高
          gradient: {
            // 设置渐变
            0.9: "red",
            0.8: "orange",
            0.7: "yellow",
            0.5: "green",
            0.1: "blue",
          },
        },
      },
      heatmapInstance: Object,
      // 热力图宽高
      width: Number,
      height: Number,
      point: {},
      startTime: undefined,
      alpha: 0.7,
      radius: 100,
    };
  },
  watch: {
    point(newPoint) {
      console.log(newPoint);
    },
  },
  components: {
    HeatmapControl,
  },
  methods: {
    // 主文件入口
    init() {
      window.Cesium = this.$cesium;
      Cesium.Ion.defaultAccessToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyZDNmODcyZS0yM2RmLTQzOTctOWRlZi1mMTc1NWU3NTQzNDYiLCJpZCI6NDAxNTEsImlhdCI6MTYwODM2NjU4M30.fylbo0NS8vGhNhQHrxeAFO-RbNOOA5oGopmXmZb0C78";
      let viewerOption = {
        geocoder: false, // 地理位置查询定位控件
        homeButton: false, // 默认相机位置控件
        timeline: false, // 时间滚动条控件
        baseLayerPicker: false, //是否显示图层选择控件
        selectionIndicator: false,
        navigationHelpButton: false, // 默认的相机控制提示控件
        fullscreenButton: false, // 全屏控件
        scene3DOnly: true, // 每个几何实例仅以3D渲染以节省GPU内存
        baseLayerPicker: false, // 底图切换控件
        animation: false, // 控制场景动画的播放速度控件
        infoBox: false,
      };
      let viewer = new Cesium.Viewer(this.$el, viewerOption);
      viewer._cesiumWidget._creditContainer.style.display = "none";
      viewer.scene.screenSpaceCameraController.enableTilt = true;
      // viewer.scene.globe.depthTestAgainstTerrain = true;
      //移除双击
      viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
      );
      window.viewer = viewer;
      // 此处热力图的边框如果是计算出来的话，会使得heatmap的数据无法塞入
      this.heatMap.bounds = this.getHeatmapBounds(this.heatMap.pointsList);
      // 热力图
      this.createHeatMap(this.heatMap.bounds, this.heatMap.pointsList);
      // 撒点
      this.addMarks();
      // 自定义气泡框
      this.getBubble();
      // 点聚合
      this.getDataSource();
      // 扩散圆
      this.addCirceScan();
      // 动态纹理线
      this.addPolyline();
      this.movePickPosition();
      // 添加半球
      this.addHemisphere();
      // 添加动态迁徙线
      this.addflyPath();
      // 添加动态墙
      this.createWall();
      // 添加路网
      this.createRoad();
    },
    /*
     *
     * 报错： Failed to execute 'getComputedStyle' on 'Window': parameter 1 is not of type 'Element'.
     *
     */

    // createHeatMap() {
    //   let bounds = {
    //     minLng: 116.13833844,
    //     maxLng: 116.13956899,
    //     maxLat: 37.43582929,
    //     minLat: 37.43706916
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
     *  {minLat: 22.248857,maxLat: 22.252857,minLng: 113.568621,maxLng: 113.572621},
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
      // console.log(bounds);
      // let bounds = {
      //     minLat: 22.230857,
      //     maxLat: 22.263857,
      //     minLng: 113.557621,
      //     maxLng: 113.582621
      //   }
      const { minLat, maxLat, minLng, maxLng } = bounds;
      const width = ((maxLng - minLng) * 10000).toFixed(0);
      const height = ((maxLat - minLat) * 10000).toFixed(0);
      [this.width, this.height] = [width, height];
      // 动态生成canvas
      this.createCanvas(width, height);
      // 获取半径比值
      const scale = this.getRadiusScale(bounds, width, height);

      for (let item of pointsList) {
        let point = {
          // 将点的地理坐标转换为canvas上的坐标,保留3位小数使得经纬度转换更加精确
          x: parseFloat(
            (((item.x - minLng) / (maxLng - minLng)) * width).toFixed(3)
          ),
          y: parseFloat(
            (((item.y - maxLat) / (minLat - maxLat)) * height).toFixed(3)
          ),
          value: item.value,
          // 将半径单位米转换为半径值
          radius: item.radius * scale,
        };
        max = Math.max(max, item.value);
        points.push(point);
      }
      // 创建热力图实例
      let heatmapInstance = heatmapFactory.create({
        container: document.querySelector("#heatmap"),
      });

      let data = {
        data: points,
      };
      heatmapInstance.setData(data);
      // console.log(heatmapInstance.setData);
      // console.log(heatmapInstance);
      heatmapInstance.configure(nuConfig);

      const canvas = document.getElementsByClassName("heatmap-canvas");
      // 查看设定的经纬度范围
      viewer.entities.add({
        name: "heatmapBox",
        rectangle: {
          coordinates: Cesium.Rectangle.fromDegrees(
            minLng,
            minLat,
            maxLng,
            maxLat
          ),
          material: Cesium.Color.RED.withAlpha(0.3),
        },
      });
      // console.log(canvas[0]);
      // 创建热力图
      let point = viewer.entities.add({
        name: "heatmap",
        rectangle: {
          coordinates: Cesium.Rectangle.fromDegrees(
            minLng,
            minLat,
            maxLng,
            maxLat
          ),
          material: new Cesium.ImageMaterialProperty({
            image: canvas[0],
            transparent: true,
          }),
        },
      });
      this.createEventHandlers(heatmapInstance);
      for (let item of this.heatMap.pointsList) {
        this.createPoint(Cesium.Cartesian3.fromDegrees(item.x, item.y));
        // console.log(item.x, item.y);
      }
      // viewer.zoomTo(point);
    },
    // todo: 同步的设定经纬度可以显示热力点，但是通过异步或者计算热力点就无法显示
    // 根据热力点列表获取到经纬度的范围
    getHeatmapBounds(pointsList) {
      let maxLatArr = [];
      let minLatArr = [];
      let maxLngArr = [];
      let minLngArr = [];
      pointsList.forEach((item) => {
        let { maxlat, minlat, maxlng, minlng } = distanceCompute.getBounds(
          item.x,
          item.y,
          item.radius
        );
        maxLatArr.push(maxlat);
        minLatArr.push(minlat);
        maxLngArr.push(maxlng);
        minLngArr.push(minlng);
      });
      return {
        minLat: Number(Math.min(...minLatArr).toFixed(6)),
        maxLat: Number(Math.max(...maxLatArr).toFixed(6)),
        minLng: Number(Math.min(...minLngArr).toFixed(6)),
        maxLng: Number(Math.max(...maxLngArr).toFixed(6)),
      };
    },
    // 根据实际经纬度范围创建相应的矩形
    createCanvas(width, height) {
      const heatDoc = document.createElement("div");
      heatDoc.setAttribute("id", `heatmap`);
      heatDoc.setAttribute(
        "style",
        `width: ${width}px; height: ${height}px; margin: 0px; display: none;`
      );
      document.getElementsByClassName("cesiumWrapper")[0].appendChild(heatDoc);
    },
    // 根据经纬度测量实际距离，计算出实际半径值(m)和热力图半径值(一个数值)的比例
    getRadiusScale(bounds, widthValue, heightValue) {
      const { minLng, maxLng, maxLat, minLat } = bounds;
      const width =
        distanceCompute.getDistance(maxLat, minLng, maxLat, maxLng) * 1000;
      const height =
        distanceCompute.getDistance(maxLat, minLng, minLat, minLng) * 1000;
      return Math.min(widthValue, heightValue) / Math.min(width, height);
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
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
      return point;
    },
    addMarks() {
      // 添加广告牌实体
      let markEnetity = viewer.entities.add({
        name: "",
        position: Cesium.Cartesian3.fromDegrees(113.569568, 22.249437, 10),
        billboard: {
          image: require("../assets/video_point.png"),
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          scale: 0.5,
        },
        isVideoMark: true,
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
      document.getElementById("infoBox").innerHTML = infoDiv;
      // 定义当前场景的画布元素的事件处理
      let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      //鼠标左键
      handler.setInputAction(function (movement) {
        let pickedFeature = viewer.scene.pick(movement.position);
        if (!!pickedFeature) {
          let earthPosition = viewer.camera.pickEllipsoid(
            movement.position,
            viewer.scene.globe.ellipsoid
          );
          if (pickedFeature.id._isVideoMark) {
            // 显示气泡容器
            document.getElementById("trackPopUp").style.display = "block";
            // 获取点的经纬度
            let ellipsoid = viewer.scene.globe.ellipsoid;
            let cartographic = ellipsoid.cartesianToCartographic(earthPosition);
            let lat = 22.249437;
            let lon = 113.569568;
            // 转换坐标
            let point = [(lon / Math.PI) * 180, (lat / Math.PI) * 180];
            let destination = Cesium.Cartesian3.fromDegrees(lon, lat, 3000.0);
            const content = `
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
              content,
            };
            self.createBubble(obj);
          } else {
            document.getElementById("trackPopUp").style.display = "none";
          }
        } else {
          document.getElementById("trackPopUp").style.display = "none";
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },
    createBubble(obj) {
      let self = this;
      // 获取点击点的信息
      let pickedFeature = viewer.scene.pick(obj.position);
      console.log(pickedFeature);
      // 判断点是否被定义
      if (Cesium.defined(pickedFeature)) {
        // 获取id
        let id = Cesium.defaultValue(
          pickedFeature.id,
          pickedFeature.primitive.id
        );
        if (id) {
          if (obj.destination) {
            viewer.camera.flyTo({
              destination: obj.destination,
            });
          }
          // 移除被选元素内的所有内容
          const contentBox = document.getElementById("trackPopUpLink");
          contentBox.innerHTML = "";
          // 填充被选元素的内容
          contentBox.innerHTML = obj.content;
          let pos = obj.position;
          document.getElementById("trackPopUp").style.display = "block";
          self.positionPopUp(obj.position);
          // 实时更新位置
          const removeHandler = viewer.scene.postRender.addEventListener(
            function () {
              let changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
                viewer.scene,
                pickedFeature.primitive._actualPosition
              );
              // 我们转动地球,也会实时更新弹窗的位置.并不会一成不变
              if (
                pos &&
                changedC &&
                pos.x &&
                changedC.x &&
                pos.y &&
                changedC.y
              ) {
                if (pos.x !== changedC.x || pos.y !== changedC.y) {
                  self.positionPopUp(changedC);
                  pos = changedC;
                }
              }
              // 判断点是否已经不可见
              const ellipsoid = Cesium.Ellipsoid.WGS84;
              const camera = viewer.camera; //viewer为你的Cesium Viewer对象
              const point = Cesium.Cartesian3.fromDegrees(
                113.569568,
                22.249437,
                10
              );
              const occluder = new Cesium.EllipsoidalOccluder(
                ellipsoid,
                camera.position
              );
              const visible = occluder.isPointVisible(point);
              if (!visible)
                document.getElementById("trackPopUp").style.display = "none";
            }
          );
          // PopUp close button event handler
          document.getElementsByClassName(
            "leaflet-popup-close-button"
          )[0].onclick = function () {
            document.getElementById("trackPopUp").style.display = "none";
            docuemnt.getElementById("trackPopUpLink").innerHTML = "";
            document.getElementsByClassName(
              "cesium-selection-wrapper"
            )[0].display.style = "none";
            removeHandler.call();
            return false;
          };
        }
      }
    },
    getCenterPosition() {
      // 获取当前位置
      const result = viewer.camera.pickEllipsoid(
        Cesium.Cartesian2(
          viewer.canvas.clientWidth / 2,
          viewer.canvas.clientHeight / 2
        )
      );
      const curPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(
        result
      );
      const lon = (curPosition.longitude * 180) / Math.PI;
      const lat = (curPosition.latitude * 180) / Math.PI;
      const height = this.getHeight();
      return {
        x: lon,
        y: lat,
        z: height,
      };
    },
    getHeight() {
      //获取当前高度
      if (tdViewer) {
        const scene = viewer.scene;
        const ellipsoid = scene.globe.ellipsoid;
        const height = ellipsoid.cartesianToCartographic(viewer.camera.position)
          .height;
        return height;
      }
    },
    positionPopUp(pos) {
      const popupContent = document.getElementById("trackPopUpContent");
      let x = pos.x - popupContent.offsetWidth / 2;
      let y = pos.y - popupContent.offsetHeight;
      // 为所有匹配元素(#trackPopUpContent)设置transform的值为 'translate3d(' + x + 'px, ' + y + 'px, 0)'
      popupContent.style.cssText = `transform: translate3d(${x + 200}px, ${
        y - 50
      }px, 0)`;
    },
    /**
     *  撒点点位聚合
     */
    getDataSource() {
      let self = this;
      let options = {
        camera: viewer.scene.camera,
        canvas: viewer.scene.canvas,
        clampToGround: true, //开启贴地
      };
      let dataSourcePromise = viewer.dataSources.add(
        new Cesium.CustomDataSource()
      );
      const clusterIcon = [
        {
          src: require("../assets/clusterIcon/blue.png"),
        },
        {
          src: require("../assets/clusterIcon/green.png"),
        },
        {
          src: require("../assets/clusterIcon/yellow.png"),
        },
        {
          src: require("../assets/clusterIcon/orange.png"),
        },
        {
          src: require("../assets/clusterIcon/red.png"),
        },
      ];
      // 创建聚簇点
      dataSourcePromise.then((dataSource) => {
        // 随机创建聚合类的点
        for (let i = 0; i < 1000; i++) {
          let entity = dataSource.entities.add({
            position: Cesium.Cartesian3.fromDegrees(
              113.272724 + Math.random() * (113.439568 - 113.272724),
              22.206437 + Math.random() * (22.305899 - 22.206437),
              0
            ),
            billboard: {
              image: require("../assets/normal_point_128.png"),
              width: 30, //if width and height is set,it will cluster correctle when data first loaded
              height: 30,
              // disableDepthTestDistance = Number.POSITIVE_INFINITY,
            },
          });
          entity.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;
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
        let removeListener;
        function customStyle() {
          if (Cesium.defined(removeListener)) {
            removeListener();
            removeListener = undefined;
          } else {
            removeListener = dataSource.clustering.clusterEvent.addEventListener(
              (clusteredEntities, cluster) => {
                let len = clusteredEntities.length;
                cluster.label.show = true;
                cluster.label.text = len + "";
                cluster.label.horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
                cluster.label.verticalOrigin = Cesium.VerticalOrigin.CENTER;
                cluster.label.disableDepthTestDistance =
                  Number.POSITIVE_INFINITY;
                cluster.label.pixelOffset = new Cesium.Cartesian2(0, -45);

                cluster.billboard.show = true;
                cluster.billboard.id = cluster.label.id;
                cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;

                if (len >= 100) {
                  cluster.label.text = "100+";
                  cluster.label.font = "normal 18px MicroSoft YaHei";
                  cluster.billboard.image = clusterIcon[4].src; // 聚合效果的背景
                  cluster.label.pixelOffset = new Cesium.Cartesian2(1, -25);
                  cluster.billboard.width = 50;
                  cluster.billboard.height = 50;
                } else if (len >= 50) {
                  cluster.label.font = "normal 30px MicroSoft YaHei";
                  cluster.billboard.image = clusterIcon[4].src; // 聚合效果的背景
                  cluster.label.pixelOffset = new Cesium.Cartesian2(1, -25);
                  cluster.billboard.width = 50;
                  cluster.billboard.height = 50;
                } else if (len >= 40) {
                  cluster.label.font = "normal 27px MicroSoft YaHei";
                  cluster.billboard.image = clusterIcon[3].src; // 聚合效果的背景
                  cluster.label.pixelOffset = new Cesium.Cartesian2(1, -22);
                  cluster.billboard.width = 45;
                  cluster.billboard.height = 45;
                } else if (len >= 30) {
                  cluster.label.font = "normal 24px MicroSoft YaHei";
                  cluster.billboard.image = clusterIcon[2].src; // 聚合效果的背景
                  cluster.label.pixelOffset = new Cesium.Cartesian2(1, -20);
                  cluster.billboard.width = 40;
                  cluster.billboard.height = 40;
                } else if (len >= 20) {
                  cluster.label.font = "normal 20px MicroSoft YaHei";
                  cluster.billboard.image = clusterIcon[1].src; // 聚合效果的背景
                  cluster.label.pixelOffset = new Cesium.Cartesian2(1, -17);
                  cluster.billboard.width = 35;
                  cluster.billboard.height = 35;
                } else {
                  cluster.label.font = "normal 16px MicroSoft YaHei";
                  cluster.label.pixelOffset = new Cesium.Cartesian2(1, -15);
                  cluster.billboard.image = clusterIcon[0].src; // 聚合效果的背景
                  cluster.billboard.width = 30;
                  cluster.billboard.height = 30;
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
      // viewer.zoomTo(dataSourcePromise)
    },
    /**
     *  定义在地图上的左键点击事件
     */
    createEventHandlers(x) {
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((event) => {
        let earthPosition = viewer.camera.pickEllipsoid(
          event.position,
          viewer.scene.globe.ellipsoid
        );
        let cartographic = Cesium.Cartographic.fromCartesian(
          earthPosition,
          viewer.scene.globe.ellipsoid,
          new Cesium.Cartographic()
        );
        let lat = Cesium.Math.toDegrees(cartographic.latitude);
        let lng = Cesium.Math.toDegrees(cartographic.longitude);
        // console.log(lng, lat);
        // console.log(distanceCompute.getBounds(lng, lat));
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },
    /**
     *  定义在地图上的鼠标移动事件，来添加标注信息
     */
    movePickPosition() {
      let entity = viewer.entities.add({
        label: {
          show: false,
          showBackground: true,
          font: "14px monospace",
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(15, 0),
        },
      });
      const scene = viewer.scene;
      // Mouse over the globe to see the cartographic pos ition
      const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
      handler.setInputAction(function (movement) {
        let cartesian = viewer.camera.pickEllipsoid(
          movement.endPosition,
          scene.globe.ellipsoid
        );
        entity.position = cartesian;
        entity.label.show = true;
        entity.label.text = "单击左键绘制，双击右键结束";
        // if (cartesian) {
        //   let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        //   let longitudeString = Cesium.Math.toDegrees(
        //     cartographic.longitude
        //   ).toFixed(2);
        //   let latitudeString = Cesium.Math.toDegrees(
        //     cartographic.latitude
        //   ).toFixed(2);

        //   entity.position = cartesian;
        //   entity.label.show = true;
        //   entity.label.text =
        //     "Lon: " +
        //     ("   " + longitudeString).slice(-7) +
        //     "\u00B0" +
        //     "\nLat: " +
        //     ("   " + latitudeString).slice(-7) +
        //     "\u00B0";
        // } else {
        //   entity.label.show = false;
        // }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    },
    /**
     *  cesium着色器，添加动态圆
     */
    addCirceScan() {
      Cesium.CircleScan = CircleScan;
      Cesium.Material.EllipsoidFadeType = "CircleScan";
      // 自定义着色器
      Cesium.Material.EllipsoidFadeSource =
        "czm_material czm_getMaterial(czm_materialInput materialInput)\n" +
        "{\n" +
        "  czm_material material = czm_getDefaultMaterial(materialInput);\n" +
        "  material.diffuse = 1.5 * color.rgb;\n" +
        "  vec2 st = materialInput.st;\n" +
        "  float dis = distance(st, vec2(0.5, 0.5));\n" +
        "  float per = fract(time);\n" +
        "  if(dis > per * 0.5) {\n" +
        "    material.alpha = 0.0;\n" +
        "    discard;\n" +
        "  }else{\n" +
        "    material.alpha = color.a * dis / per / 1.0;\n" +
        "  }\n" +
        "  return material;\n" +
        "}";
      Cesium.Material._materialCache.addMaterial(
        Cesium.Material.EllipsoidFadeType,
        {
          fabric: {
            type: Cesium.Material.EllipsoidFadeType,
            uniforms: {
              color: new Cesium.Color(1.0, 0.0, 0.0, 1),
              time: 0,
            },
            source: Cesium.Material.EllipsoidFadeSource,
          },
          translucent: function () {
            return true;
          },
        }
      );
      viewer.entities.add({
        name: "EllipsoidFade",
        position: Cesium.Cartesian3.fromDegrees(113.557621, 22.230857, 100.0),
        ellipse: {
          height: 0,
          semiMinorAxis: 300.0,
          semiMajorAxis: 300.0,
          material: new Cesium.CircleScan(Cesium.Color.RED, 2000),
        },
      });

      // viewer.zoomTo(viewer.entities);
    },
    /**
     *  cesium着色器，添加动态纹理线
     */
    addPolyline() {
      let lon = 113.547621;
      let lat = 22.240957;
      let entity = viewer.entities.add({
        name: "PolylineTrail",
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights([
            lon,
            lat,
            0,
            lon + 0.03,
            lat + 0.0113,
            0,
            lon + 0.045,
            lat + 0.0118,
            0,
            // lon + 10, lat + 10, 0,
          ]),
          width: 5,
          material: new Cesium.PolylineTrailLinkMaterialProperty(
            Cesium.Color.ORANGE,
            1000
          ),
        },
      });
    },
    /**
     *  半圆扩散
     */
    addHemisphere() {
      this.startTime = new Cesium.JulianDate.now();
      let hemisphere = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(113.570221, 22.249857),
        ellipsoid: {
          radii: new Cesium.CallbackProperty(this.getRadius, false),
          maximumCone: Cesium.Math.toRadians(90),
          material: new Cesium.ColorMaterialProperty(
            new Cesium.CallbackProperty(this.getColor, false)
          ),
          outlineWidth: 1,
        },
      });
    },
    getRadius(time) {
      this.radius =
        this.radius -
        10 * Cesium.JulianDate.secondsDifference(time, this.startTime);
      if (this.radius > 500) this.radius = 100;
      // console.log(-100 * Cesium.JulianDate.secondsDifference(time, this.startTime));
      return new Cesium.Cartesian3(this.radius, this.radius, this.radius);
    },
    getColor() {
      this.alpha = (1 - (this.radius - 100) / 400) * 0.8;
      if (this.alpha >= 1) this.alpha = 0.8;
      return new Cesium.Color.fromCssColorString("#FF3F3F").withAlpha(
        this.alpha
      );
    },
    /**
     *  cesium着色器，添加动态迁徙线
     */
    addflyPath() {
      var center = { lon: 114.302312702, lat: 30.598026044 };
      var cities = [
        { lon: 115.028495718, lat: 30.200814617 },
        { lon: 110.795000473, lat: 32.638540762 },
        { lon: 111.267729446, lat: 30.698151246 },
        { lon: 112.126643144, lat: 32.058588576 },
        { lon: 114.885884938, lat: 30.395401912 },
        { lon: 112.190419415, lat: 31.043949588 },
        { lon: 113.903569642, lat: 30.93205405 },
        { lon: 112.226648859, lat: 30.367904255 },
        { lon: 114.86171677, lat: 30.468634833 },
        { lon: 114.317846048, lat: 29.848946148 },
        { lon: 113.371985426, lat: 31.70498833 },
        { lon: 109.468884533, lat: 30.289012191 },
        { lon: 113.414585069, lat: 30.368350431 },
        { lon: 112.892742589, lat: 30.409306203 },
        { lon: 113.16085371, lat: 30.667483468 },
        { lon: 110.670643354, lat: 31.74854078 },
      ];
      let material = new Cesium.PolylineTrailMaterialProperty(
        new Cesium.Color.fromCssColorString("#FAF958"),
        3000
      );
      for (var j = 0; j < cities.length; j++) {
        var points = this.parabolaEquation({
          pt1: center,
          pt2: cities[j],
          height: 50000,
          num: 100,
        });
        var pointArr = [];
        for (var i = 0; i < points.length; i++) {
          pointArr.push(points[i][0], points[i][1], points[i][2]);
        }
        viewer.entities.add({
          name: "PolylineTrailLink" + j,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights(pointArr),
            width: 3,
            material: material,
          },
        });
      }

      const centerPoint = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(center.lon, center.lat, 0),
        point: {
          pixelSize: 6,
          color: Cesium.Color.BLUE,
        },
      });
      for (var i = 0; i < cities.length; i++) {
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(
            cities[i].lon,
            cities[i].lat,
            1
          ),
          point: {
            pixelSize: 6,
            color: Cesium.Color.RED,
          },
        });
      }
    },
    parabolaEquation(options, resultOut) {
      //方程 y=-(4h/L^2)*x^2+h h:顶点高度 L：横纵间距较大者
      let h = options.height && options.height > 5000 ? options.height : 5000;
      let L =
        Math.abs(options.pt1.lon - options.pt2.lon) >
        Math.abs(options.pt1.lat - options.pt2.lat)
          ? Math.abs(options.pt1.lon - options.pt2.lon)
          : Math.abs(options.pt1.lat - options.pt2.lat);
      let num = options.num && options.num > 50 ? options.num : 50;
      let result = [];
      let dlt = L / num;
      if (
        Math.abs(options.pt1.lon - options.pt2.lon) >
        Math.abs(options.pt1.lat - options.pt2.lat)
      ) {
        //以lon为基准
        let delLat = (options.pt2.lat - options.pt1.lat) / num;
        if (options.pt1.lon - options.pt2.lon > 0) {
          dlt = -dlt;
        }
        for (let i = 0; i < num; i++) {
          let tempH =
            h -
            (Math.pow(-0.5 * L + Math.abs(dlt) * i, 2) * 4 * h) /
              Math.pow(L, 2);
          let lon = options.pt1.lon + dlt * i;
          let lat = options.pt1.lat + delLat * i;
          result.push([lon, lat, tempH]);
        }
      } else {
        //以lat为基准
        let delLon = (options.pt2.lon - options.pt1.lon) / num;
        if (options.pt1.lat - options.pt2.lat > 0) {
          dlt = -dlt;
        }
        for (let i = 0; i < num; i++) {
          let tempH =
            h -
            (Math.pow(-0.5 * L + Math.abs(dlt) * i, 2) * 4 * h) /
              Math.pow(L, 2);
          let lon = options.pt1.lon + delLon * i;
          let lat = options.pt1.lat + dlt * i;
          result.push([lon, lat, tempH]);
        }
      }
      if (resultOut != undefined) {
        resultOut = result;
      }
      return result;
    },
    /**
     *  墙
     */
    createWall() {
      let positions = [
        [113.24215, 23.02556],
        [113.24247, 23.02556],
        [113.24247, 23.02581],
        [113.24215, 23.02581],
        [113.24215, 23.02556],
      ];
      const height = 20;
      let scale = 1;
      let wall = viewer.entities.add({
        name: "PolygonWall",
        wall: {
          positions: new Cesium.CallbackProperty(function () {
            scale += 0.06;
            if (scale > 6) {
              scale = 1;
            }
            var poly = turf.polygon([positions]);
            var scaledPoly = turf.transformScale(poly, scale);
            var newPositions = [];
            for (
              let i = 0;
              i < scaledPoly.geometry.coordinates[0].length;
              i++
            ) {
              scaledPoly.geometry.coordinates[0][i].forEach(function (element) {
                newPositions.push(element);
              });
              newPositions.push(height);
            }
            return Cesium.Cartesian3.fromDegreesArrayHeights(newPositions);
          }, false), //按比例缩放
          // material: new Cesium.PolylineTrailWallMaterialProperty(
          //   Cesium.Color.RED,
          //   3000
          // ),
          // material: require('../assets/polyline/color.png')
          material: new Cesium.ImageMaterialProperty({
            image: require("../assets/polyline/blue_2.png"),
            transparent: true,
            // color: new Cesium.ColorMaterialProperty(
            //   new Cesium.CallbackProperty(function() {
            //     alpha = 1 - ((scale - 1) / 5);
            //     if(alpha < 0) alpha = 1;
            //     // console.log(Cesium.Color.WHITE.withAlpha(alpha));
            //     return Cesium.Color.WHITE.withAlpha(alpha)
            //   }, false)
            // ),
            color: Cesium.Color.WHITE.withAlpha(0.3),
          }),
        },
      });
      // console.log(wall);
      // viewer.flyTo(wall); //相机到entity的位置
    },
    /**
     * 创建路网
     */
    createRoad() {
      // roadHighlight.addRoad(ConditionsLayer);
      // roadHighlight.mouseEvent();

      let promise = Cesium.GeoJsonDataSource.load(ConditionsLayer);
      this._promiseEntity = viewer.dataSources.add(promise);
      promise.then((dataSource) => {
        let entities = dataSource.entities.values;
        for (let o = 0; o < entities.length; o++) {
          let r = entities[o];
          r.nameID = o; //给每条线添加一个编号，方便之后对线修改样式
          r.polyline.width = 2; //添加默认样式
          r.polyline.material = new Cesium.PolylineTrailLinkMaterialProperty(
            Cesium.Color.ORANGE,
            1000
          )
        }
      });
      viewer.flyTo(promise);
    },
  },
  mounted() {
    this.init();
  },
};
</script>

<style lang='less'>
.cesiumWrapper {
  width: 100%;
  height: 100%;

  .heatmap-control-wrap {
    position: absolute;
    z-index: 999;
  }
}
</style>

<style lang="less">
// 自定义infoBox样式
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
  background: rgba(14, 36, 111, 0.85);
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
  background: rgba(0, 101, 196, 1);
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
  word-break: keep-all;
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
  color: rgba(255, 255, 255, 1);
}

video {
  width: 100%;
}
</style>