precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 u_resolution;
uniform float u_time;

// HSVからRGBへの変換関数
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    // ピクセル座標
    vec2 fragCoord = vUv * u_resolution;

    // レイの初期設定
    vec3 rayDir = normalize(vec3(
        (fragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y, 
        0.7
    ));
    
    vec3 rayPos = vec3(0.0, 0.0, -1.0); // レイ開始位置
    vec3 color = vec3(0.0);             // 累積カラー
    float totalDistance = 0.0;          // レイの進行距離
    
    // レイマーチングループ
    for (int i = 0; i < 99; i++) {
        // 距離関数の評価位置
        vec3 samplePos = rayPos;
        
        // フラクタル変換
        float radius = length(samplePos);
        float logRad = log2(radius) - u_time;
        float expFactor = exp(1.0 - samplePos.z / radius);
        float angle = atan(samplePos.y, samplePos.x) + cos(u_time) * 0.2;
        samplePos = vec3(logRad, expFactor, angle);
        
        // フラクタル距離関数の評価
        float distEstimate = 0.0;
        float scale = 1.0;
        
        // フラクタル反復ループ
        for (float s = 1.0; s < 300.0; s *= 2.0) {
            // フラクタルノイズ関数
            vec3 sinPart = sin(samplePos.zxy * s) - 0.5;
            vec3 cosPart = 1.0 - cos(samplePos.yxz * s);
            distEstimate += sin(dot(sinPart, cosPart)) / s;
        }
        
        // 距離場の更新
        float distanceField = distEstimate - samplePos.y;
        
        // レイの進捗更新
        float stepSize = distanceField * radius * 0.1;
        totalDistance += stepSize;
        rayPos += rayDir * stepSize;
        
        // カラー加算 (フォグ効果)
        float fogFactor = min(distanceField * scale, 0.7 - distanceField) / 35.0;
        color += hsv2rgb(vec3(0.1, 0.2, fogFactor));
    }
    
    outColor = vec4(color, 1.0);
} 