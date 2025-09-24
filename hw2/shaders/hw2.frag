#version 300 es
precision highp float;
uniform float uTime;
uniform vec3 uViewPoint;
in vec3 vPos;
out vec4 fragColor;

// Ray: V + r*W
// Sphere: center + radius
//
// return (t1, t2) if ray collides with sphere.
// else return (1001, 1000)
vec2 raySphere(vec3 V, vec3 W, vec4 S) {
    V -= S.xyz;
    float b = dot(V, W);
    float d = b * b - dot(V, V) + S.w * S.w;
    if (d < 0.)
        return vec2(1001., 1000.);
    return vec2(-b - sqrt(d), -b + sqrt(d));
}

const float PI = 3.14159265;
const float WOBBLE_AMPLITUDE = 0.05;

float polarOffset(float theta, float phi) {
    float waveTheta = sin(theta * 5.0 + uTime * 1.5);
    float wavePhi = sin(phi * 4.0 - uTime * 0.8);
    float waveMix = sin((theta + phi) * 3.0 + uTime * 0.25);
    return WOBBLE_AMPLITUDE * (0.5 * waveTheta * wavePhi + 0.3 * waveMix);
}

vec3 directionFromAngles(float theta, float phi) {
    float sinPhi = sin(phi);
    return vec3(cos(theta) * sinPhi,
        sin(theta) * sinPhi,
        cos(phi));
}

vec3 displacedPosition(vec4 S, float theta, float phi) {
    float radius = S.w + polarOffset(theta, phi);
    return S.xyz + radius * directionFromAngles(theta, phi);
}

vec3 displacedNormal(vec4 S, float theta, float phi) {
    // Sample displaced surface via small angular offsets to approximate the perturbed normal.
    float epsTheta = 0.01;
    float epsPhi = 0.01;
    float clampedPhi = clamp(phi, 0.001, PI - 0.001);
    vec3 p = displacedPosition(S, theta, clampedPhi);
    vec3 pTheta = displacedPosition(S, theta + epsTheta, clampedPhi);
    vec3 pPhi = displacedPosition(S, theta, clamp(clampedPhi + epsPhi, 0.001, PI - 0.001));
    vec3 tangentTheta = pTheta - p;
    vec3 tangentPhi = pPhi - p;
    vec3 N = normalize(cross(tangentTheta, tangentPhi));
    if (dot(N, p - S.xyz) < 0.)
        N = -N;
    return N;
}

// ambient light direction 1
vec3 L1 = vec3(1., 1., 1.) / 1.732;
// ambient light direction 2
vec3 L2 = vec3(-1., -1., -.5) / 1.5;
// base color
vec3 C = vec3(.5, .5, 1);

// Sphere: center + radius
// Collision Position P
//
// return rgb color
vec3 shadeSphere(vec3 N) {
    return C * (.1 + .5 * max(0., dot(N, L1))
            + .5 * max(0., dot(N, L2)));
}

vec4 S = vec4(0., 0., 0., .7);

void main() {
    vec4 F = vec4(0.);
    vec3 V = uViewPoint;
    vec3 W = normalize(vPos - V);
    vec4 baseSphere = S;

    float radius = baseSphere.w;
    float theta = 0.;
    float phi = 0.;
    bool hit = false;
    vec3 P = vec3(0.);

    // Iterate to align the ray-sphere hit with the wobbling radius defined in polar space.
    for (int i = 0; i < 3; ++i) {
        vec4 sphere = vec4(baseSphere.xyz, radius);
        vec2 tt = raySphere(V, W, sphere);
        if (!(tt.x < tt.y && tt.x > 0.)) {
            hit = false;
            break;
        }
        hit = true;
        P = V + tt.x * W;
        vec3 local = P - baseSphere.xyz;
        float lenLocal = length(local);
        if (lenLocal < 1e-4) {
            hit = false;
            break;
        }
        vec3 dir = local / lenLocal;
        theta = atan(dir.y, dir.x);
        phi = acos(clamp(dir.z, -1., 1.));
        radius = baseSphere.w + polarOffset(theta, phi);
    }

    if (hit) {
        vec4 sphere = vec4(baseSphere.xyz, radius);
        vec2 tt = raySphere(V, W, sphere);
        if (tt.x < tt.y && tt.x > 0.) {
            float t = tt.x;
            P = V + t * W;
            vec3 dir = normalize(P - baseSphere.xyz);
            theta = atan(dir.y, dir.x);
            phi = acos(clamp(dir.z, -1., 1.));
            float expectedRadius = baseSphere.w + polarOffset(theta, phi);

            if (abs(expectedRadius - sphere.w) > 1e-3) {
                sphere.w = expectedRadius;
                vec2 tt2 = raySphere(V, W, sphere);
                if (tt2.x < tt2.y && tt2.x > 0.) {
                    t = tt2.x;
                    P = V + t * W;
                    dir = normalize(P - baseSphere.xyz);
                    theta = atan(dir.y, dir.x);
                    phi = acos(clamp(dir.z, -1., 1.));
                }
            }

            radius = expectedRadius;

            vec3 N = displacedNormal(baseSphere, theta, phi);
            F = vec4(shadeSphere(N), 1.);
        }
    }
    fragColor = vec4(sqrt(F.rgb), F.a);
}
