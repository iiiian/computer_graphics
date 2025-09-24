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
vec3 shadeSphere(vec4 S, vec3 P) {
    vec3 N = (P - S.xyz) / S.w;
    return C * (.1 + .5 * max(0., dot(N, L1))
            + .5 * max(0., dot(N, L2)));
}

vec4 S = vec4(0., 0., 0., .4);

void main() {
    vec4 F = vec4(0.);
    vec3 V = uViewPoint;
    vec3 W = normalize(vPos - V);
    vec2 tt = raySphere(V, W, S);
    if (tt.x < tt.y && tt.x > 0.) {
        vec3 P = V + tt.x * W;
        F = vec4(shadeSphere(S, P), 1.);
    }
    fragColor = vec4(sqrt(F.rgb), F.a);
}
