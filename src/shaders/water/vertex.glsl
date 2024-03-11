uniform float uBigWavesElevation;
uniform vec2 uBigWavesFrequency;
uniform float uBigWavesSpeed;
uniform float uTime;
uniform float uShift;

varying float vElevation;
varying vec3 vNormal;
varying vec3 vPosition;

#include ../includes/perlinClassic3D.glsl

float waveElevation(vec3 position) {
    float elevation = sin(position.x * -uBigWavesFrequency.x + uTime * uBigWavesSpeed) * 
                    sin(position.z * -uBigWavesFrequency.y + uTime * uBigWavesSpeed) * 
                    uBigWavesElevation;

    for(float i = 1.0; i <= 3.0; i++) {
        elevation -= abs(perlinClassic3D(vec3(position.xz * 3.0 * i, uTime * 0.2)) * 0.15 / i);
    }

    return elevation;

}

void main()
{
    // Base position
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec3 modelPositionA = modelPosition.xyz + vec3(uShift, 0.0, 0.0);
    vec3 modelPositionB = modelPosition.xyz + vec3(0.0, 0.0, - uShift);

    // Elevation
    float elevation = waveElevation(modelPosition.xyz);
    modelPosition.y += elevation;
    modelPositionA.y += waveElevation(modelPositionA);
    modelPositionB.y += waveElevation(modelPositionB);

    // Compute normal
    vec3 toA = normalize(modelPositionA - modelPosition.xyz);
    vec3 toB = normalize(modelPositionB - modelPosition.xyz);
    vec3 computeNormal = cross(toA, toB);

    // Final position
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Varying
    vElevation = elevation;
    vNormal = computeNormal;
    vPosition = modelPosition.xyz;
}