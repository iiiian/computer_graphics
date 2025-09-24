#version 300 es
precision highp float;

uniform float uTime;
uniform vec3 uViewPoint;
uniform vec4 uS; // sphere
uniform vec3 uC; // base color

in vec3 vPos;
out vec4 fragColor;

// ray sphere intersection test
vec2 raySphere(vec3 V, vec3 W, vec4 S) {
    V -= S.xyz;
    float b = dot(V, W);
    float d = b * b - dot(V, V) + S.w * S.w;
    if (d < 0.0) {
        return vec2(-1.0, -1.0);
    }
    return vec2(-b - sqrt(d), -b + sqrt(d));
}

float hash11(float p) {
    return fract(sin(p) * 43758.5453123);
}

float hash31(vec3 p) {
    return hash11(dot(p, vec3(12.9898, 78.2330, 37.7190)));
}

float rippleAt(vec3 n) {
    float lat = asin(clamp(n.y, -1.0, 1.0));
    float lon = atan(n.z, n.x);
    float base = sin(12.0 * lon + uTime * 3.0);
    float secondary = sin(16.0 * lat - uTime * 2.5);
    float noisy = sin(20.0 * (lon + lat) + uTime * 5.0 + hash31(n * 15.0) * 6.28318);
    return (base + 0.7 * secondary + 0.5 * noisy) * 0.03;
}

vec3 pickTangent(vec3 n) {
    vec3 axis = abs(n.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    return normalize(cross(n, axis));
}

vec3 shadeSphere(vec3 P, vec3 W) {
    vec3 center = uS.xyz;
    vec3 N0 = normalize(P - center);
    float ripple = rippleAt(N0);
    vec3 displacedP = P + ripple * N0;

    vec3 T1 = pickTangent(N0);
    vec3 T2 = normalize(cross(N0, T1));
    float eps = 0.1;
    float rp1 = rippleAt(normalize(N0 + eps * T1));
    float rp2 = rippleAt(normalize(N0 + eps * T2));
    vec3 N = normalize(N0 + ((rp1 - ripple) / eps) * T1 + ((rp2 - ripple) / eps) * T2);

    vec3 lightDir = normalize(vec3(-0.4, 0.8, 0.5));
    vec3 lightColor = vec3(0.8, 0.9, 1.0);
    vec3 baseColor = mix(uC, vec3(0.15, 0.28, 0.55), 0.8);

    float diff = max(dot(N, lightDir), 0.0);
    vec3 viewDir = normalize(uViewPoint - displacedP);
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(N, halfVec), 0.0), 80.0);

    float fresnel = pow(1.0 - max(dot(N, -viewDir), 0.0), 3.0);
    float shimmer = 0.5 + 0.5 * sin(uTime * 4.0 + hash31(N * 40.0) * 6.28318);

    vec3 color = baseColor * (0.25 + diff) + lightColor * spec * (0.6 + 0.4 * shimmer);
    color = mix(color, vec3(1.0), fresnel * 0.6);
    color *= 1.0 + 0.15 * ripple;

    return color;
}

void main() {
    vec4 F = vec4(0.0);
    vec3 V = uViewPoint;
    vec3 W = normalize(vPos - V);

    vec2 tt = raySphere(V, W, uS);
    if (tt.x >= 0.0 && tt.x < tt.y) {
        vec3 P = V + tt.x * W;
        F = vec4(shadeSphere(P, W), 1.0);
    }

    fragColor = vec4(sqrt(F.rgb), F.a);
}
