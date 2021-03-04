      // var animationObj = {
      //   stepsRange: {
      //     start: 0,
      //     end: 100,
      //   },
      //   trails: 10,
      //   duration: 85,
      // };

      // var _range = animationObj.stepsRange.end - animationObj.stepsRange.start;

      // var isAvailable = function isAvailable(currentTime) {
      //   if (!Cesium.defined(currentTime)) {
      //     throw new Cesium.DeveloperError("time is required.");
      //   }

      //   var nMS =
      //     Cesium.JulianDate.toDate(currentTime).getTime() /
      //     animationObj.duration;
      //   var time = (nMS % _range) + animationObj.stepsRange.start;

      //   var trails = trails || 10;
      //   if (time && this.nameID > time - trails && this.nameID < time) {
      //     return true;
      //   } else {
      //     return false;
      //   }
      // };

      // var url = "/topo_lane_01.json"; /*json文件url*/
      // let request = this.$http({
      //   url,
      //   methods: "get",
      // });
      // let { data: res } = await request;
      // let list = res.features;
      // console.log(list);
      // list.forEach((content) => {
      //   // console.log(content.geometry.coordinates);
      //   content.geometry.coordinates.forEach((item) => {
      //     let lon = item[0];
      //     let lat = item[1];

      //     let entity = viewer.entities.add({
      //       position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      //       nameID: content.properties.gid,
      //       billboard: {
      //         image: "../assets/c2.png",
      //         width: 5,
      //         height: 5,
      //       },
      //     });
      //     console.log(lon, lat);
      //     entity.isAvailable = isAvailable
      //   });
      // });