precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 u_resolution;
uniform float u_time;

// --- 3D simplex noise 実装（Ashima Arts より）---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise3D(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.y;
  vec4 y = y_ *ns.x + ns.y;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

// 例: HSV関数やmainのロジックはそのまま
// ...

void main() {
    vec3 hitPoint;
    vec3 voxelIndex;
    vec3 normal;
    vec3 rayDir = vec3(0.0, 0.0, 1.0);
    float minDist = 1.0;
    float secDist = 1.0;
    float totalDist = 1.0;
    float depth = totalDist;
    vec4 outputColor = vec4(0.0);
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / 400.0;
    vec3 rayPos = vec3(uv, 1.0) * depth;
    for(depth = 1.0; depth < 7.0; depth += 1.0) {
        rayPos = vec3(uv, 1.0) * depth;
        voxelIndex = floor(rayPos);
        minDist = 9.0;
        secDist = 9.0;
        for(int i = 0; i < 64; i++) {
            vec3 localPos = vec3(
                i % 4,
                (i / 4) % 4,
                (i / 16) % 4
            );
            vec3 displacedPos = localPos - 1.5 + 0.5 * sin(
                u_time * 0.5 + 
                6.0 * snoise3D(voxelIndex + localPos)
            );
            vec3 distVec = abs(displacedPos - fract(rayPos));
            float manhattanDist = distVec.x + distVec.y + distVec.z;
            outputColor.rgb = vec3(clamp(manhattanDist, 0.0, 1.0)); // clampで制限
            // if(isnan(manhattanDist) || isinf(manhattanDist)) continue;
            // if(manhattanDist < minDist) {
            //     secDist = minDist;
            //     minDist = manhattanDist;
            // } 
            // else if(manhattanDist < secDist) {
            //     secDist = manhattanDist;
            // }
        }
        // スケール調整で明るさを確保
        if(secDist - minDist < 0.1) {
            outputColor.rgb += 200.0 * exp(-depth * 0.2); // スケール値さらに大きめ
            break;
        }
        hitPoint = rayPos;
    }
    outputColor.rgb = vec3(minDist); // minDistの値を可視化
    outColor = outputColor; // WebGL1対応
}