<template>
  <div>
    <div id="cesiumContainer"></div>
    <div id="heatmap" v-show="false"></div>
  </div>
</template>

<script>


import heatmapFactory from '@/assets/util/heatmap.min.js'
export default {
  name: "CesiumScene",
  data() {
    return {
      len: 1000,
    };
  },
  methods: {
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
        animation: false             // 控制场景动画的播放速度控件
      };
      let viewer = new Cesium.Viewer(this.$el, viewerOption);
      viewer._cesiumWidget._creditContainer.style.display = "none";// 隐藏版权
      window.viewer = viewer;
      this.createCamera();

      let coordinate1 = [-109.0, 10.0, -80.0, 35.0];
      let heatMap1 = this.createHeatMap(this.getData(1000).max, this.getData(1000).data);
      this.createRectangle(viewer, coordinate1, heatMap1);
    },
    // 创建相机
    createCamera() {
      // 相机定位到到佛山
      var initialPosition = Cesium.Cartesian3.fromDegrees(113.565621, 22.241457, 753);
      viewer.camera.flyTo({
        destination: initialPosition,
        duration: 0
      })
    },
    createHeatMap(max, data) {
      // 创建热力图对象
      var heatmap = heatmapFactory.create({
          container: document.querySelector('#heatmap'),
          radius: 20,
          maxOpacity: .5,
          minOpacity: 0,
          blur: .75,
          gradient: {
            '0.9':'red',
            '0.8':'orange',
            '0.7':'yellow',
            '0.5':'blue',
            '0.3':'green',
          },
      });
      // 添加数据
      heatmap.setData({
          max: max,
          data: data
      });
      return heatmap;
    },
    createRectangle(viewer, coordinate, heatMap) {
      viewer.entities.add({
        name: 'Rotating rectangle with rotating texture coordinate',
        show: true,
        rectangle: {
          coordinates: Cesium.Rectangle.fromDegrees(coordinate[0], coordinate[1], coordinate[2], coordinate[3]),
          material: heatMap._renderer.canvas // 核心语句，填充热力图
        }
      });
    },
    // 生成len个随机数据
    getData(len) {
      //构建一些随机数据点
      var points = [];
      var max = 0;
      var width = 1000;
      var height = 1000;
      while (len--) {
        var val = Math.floor(Math.random() * 1000);
        max = Math.max(max, val);
        var point = {
          x: Math.floor(Math.random() * width),
          y: Math.floor(Math.random() * height),
          value: val
        };
        points.push(point);
      }
      return {max: max, data: points}
    }
  },
  mounted() {
    this.init();
  },
  beforeDestroy() {},
}
</script>

<style lang='less' scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>