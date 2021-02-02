#ifdef GL_ES 
precision mediump float; 
#endif
// 外部传入的绘图区的宽高，用来将绘图区的坐标归一到0.0~0.1
uniform vec2 u_resolution;
void main() { 
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    // 设置点位坐标
    vec2 origin = vec2(1.0,0.0);
    // gl_FragColor是片元着色器的输入变量
    gl_FragColor = vec4(distance(st,origin), 0.0, 0.0, 1.0); 
}
