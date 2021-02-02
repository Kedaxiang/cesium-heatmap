#ifdef GL_ES
precision mediump float;
#endif
//Sci-fi radar based on the work of gmunk for Oblivion
//http://work.gmunk.com/OBLIVION-GFX

uniform vec2 u_resolution;
uniform float u_time;

#define SMOOTH(r,R) (1.0-smoothstep(R-1.0,R+1.0, r))
#define M_PI 3.1415926535897932384626433832795

#define scancolor vec3(0.1804, 0.9725, 0.0745)

float movingLine(vec2 uv, vec2 center, float radius)
{
    //angle of the line
    float theta0 = 90.0 * u_time;
    vec2 d = uv - center;
    float r = sqrt( dot( d, d ) );
    if(r<radius)
    {
        //compute the distance to the line theta=theta0
        vec2 p = radius*vec2(cos(theta0*M_PI/180.0),
                            -sin(theta0*M_PI/180.0));
        float l = length( d - p*clamp( dot(d,p)/dot(p,p), 0.0, 1.0) );
    	d = normalize(d);
        //compute gradient based on angle difference to theta0
   	 	float theta = mod(180.0*atan(d.y,d.x)/M_PI+theta0,360.0);
        float gradient = clamp(1.0-theta/90.0,0.0,1.0);
        return SMOOTH(l,1.0)+0.5*gradient;
    }
    else return 0.0;
}

float circle(vec2 uv, vec2 center, float radius, float width)
{
    float r = length(uv - center);
    return SMOOTH(r-width/2.0,radius)-SMOOTH(r+width/2.0,radius);
}

float _cross(vec2 uv, vec2 center, float radius)
{
    vec2 d = uv - center;
    int x = int(d.x);
    int y = int(d.y);
    float r = sqrt( dot( d, d ) );
    if( (r<radius) && ( (x==y) || (x==-y) ) )
        return 1.0;
    else return 0.0;
}

void main()
{
    vec3 finalColor;
    vec2 uv = gl_FragCoord.xy;
    //center of the image
    vec2 c = u_resolution.xy/2.0;
    finalColor = vec3( 0.3*_cross(uv, c, 280.0) );

    for(int i=100; i<280; i+=60){
        finalColor += circle(uv, c, float(i), 1.0) * scancolor;
    }
    
    finalColor += circle(uv, c, 280.0, 2.0) * scancolor;

    finalColor += movingLine(uv, c, 280.0) * scancolor;
    gl_FragColor = vec4( finalColor, 1.0 );
}