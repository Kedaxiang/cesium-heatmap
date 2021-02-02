class Distance  {
    // 经纬度转换成三角函数中度分表形式。
    rad(d) {
        return d * Math.PI / 180.0; 
    }
    // 根据经纬度计算距离，参数分别为第一点的纬度，经度；第二点的纬度，经度
    getDistance(lat1, lng1, lat2, lng2) {
        const radLat1 = this.rad(lat1);
        const radLat2 = this.rad(lat2);
        const a = radLat1 - radLat2;
        const b = this.rad(lng1) - this.rad(lng2);
        let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
        Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
        s = s * 6378.137; // 地球半径
        s = Math.round(s * 10000) / 10000; //输出为公里
    
        // let distance = s;
        // let distance_str = "";
    
        // if (parseInt(distance) >= 1) {
        //     distance_str = distance.toFixed(1) + "km";
        // } else {
        //     distance_str = distance * 1000 + "m";
        // }
    
        //s=s.toFixed(4);
        return s;
    }
    // 已知经纬度坐标，求距该坐标指定距离(m)的经纬度坐标
    getBounds(lng, lat, radius = 300) {
        const y = (180 * radius) / (6378.137 * 1000 * Math.PI);
        const x = 180 * radius / (6378.137 * 1000 * Math.PI * Math.cos(this.rad(lat)))
        let [maxlat, minlat, maxlng, minlng] = [lat + y, lat - y, lng + x, lng - x];
        return {
            maxlat, minlat, maxlng, minlng
        }
    }
}
const distanceCompute = new Distance();

export default distanceCompute;