{
    Properties
    {
        _Color ("Diffuse Material Color", Color) = (1,1,1,1)
        _UpperHemisphereColor ("Upper Hemisphere Color", Color) = (1,1,1,1)
        _LowerHemisphereColor ("Lower Hemisphere Color", Color) = (1,1,1,1)
        _UpVector ("Up Vector", Vector) = (0,1,0,0)
    }

    SubShader
    {
        Pass
        {
            GLSLPROGRAM

            uniform vec4 _Color;
            uniform vec4 _UpperHemisphereColor;
            uniform vec4 _LowerHemisphereColor;
            uniform vec3 _UpVector;

            uniform mat4 _Object2World;
            uniform mat4 _World2Object;

            #ifdef VERTEX
            //顶点着色器

            out vec4 desColor;

            void main()
            {
                mat4 modelMatrix = _Object2World;
                mat4 modelMatrixInverse = _World2Object;

                vec3 normalDirection = normalize(vec3(vec4(gl_Normal, 0.0) * modelMatrixInverse));
                vec3 upDirection = normalize(_UpVector);

                float w = 0.5 * (1.0 + dot(upDirection, normalDirection));
                desColor = (w * _UpperHemisphereColor + (1.0 - w) * _LowerHemisphereColor) * _Color;

                gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
            }

            #endif

            #ifdef FRAGMENT
            //片元着色器

            in vec4 desColor;

            void main()
            {
                gl_FragColor = desColor;
            }

            #endif

            ENDGLSL
        }
    }
}