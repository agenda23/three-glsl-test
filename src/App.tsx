import React, { useRef, useEffect } from "react";
import * as THREE from "three";

// vertexShader: GLSL ES 3.0 (RawShaderMaterial用)
const vertexShader = `
precision highp float;

in vec3 position;
// 頂点のUV座標（0〜1）
in vec2 uv;

// フラグメントシェーダーへ渡すUV
out vec2 vUv;

// 射影行列（three.jsが自動で渡す）
uniform mat4 projectionMatrix;
// モデルビュー行列（three.jsが自動で渡す）
uniform mat4 modelViewMatrix;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// fragmentShader: 例として3DノイズやHSVなど、GLSL ES 3.0構文で記述
const fragmentShader = `
precision highp float;

// 頂点シェーダーから受け取るUV座標
in vec2 vUv;
// 出力色
out vec4 outColor;

// 画面解像度（ピクセル単位）
uniform vec2 u_resolution; // キャンバスの幅・高さ
// アニメーション用の経過時間（秒）
uniform float u_time; // 経過時間

// HSV→RGB変換
vec3 hsv(float h,float s,float v){
  vec4 t=vec4(1.,2./3.,1./3.,3.);
  vec3 p=abs(fract(vec3(h)+t.xyz)*6.-vec3(t.w));
  return v*mix(vec3(t.x),clamp(p-vec3(t.x),0.,1.),s);
}

void main() {
  vec2 resolution = u_resolution; // 画面解像度
  vec2 fragCoord = gl_FragCoord.xy; // フラグメント座標
  float time = u_time; // 経過時間
  vec4 color = vec4(0.0, 0.0, 0.0, 1.0); // 出力色

  float iter = 0.0, accum = 0.0, grad = 0.0, radius = 0.0, scale = 0.0;
  vec3 rayOrigin = vec3(0.0);
  vec3 rayPos = vec3(0.0);
  vec3 rayDir = vec3((fragCoord.yx - 0.5 * resolution) / resolution.y, 0.8); // レイの方向

  rayOrigin.zy -= 1.0;

  for(iter = 0.0; iter < 99.0; iter += 1.0){
    accum += iter / 9e9;
    if(iter == 0.0) rayPos = vec3(0.0);
    color.rgb += hsv(rayPos.y, rayOrigin.y, min(accum * iter, .01));

    scale = 3.0;
    rayPos = rayOrigin += rayDir * accum * radius * 0.25;

    grad += rayPos.y / scale;

    rayPos = vec3(log2(radius = length(rayPos)) + time * 0.2,
                  exp2(mod(-rayPos.z, scale) / radius) - 0.23,
                  rayPos.x);

    for(accum = --rayPos.y; scale < 6000.0; scale += scale){
      accum += -abs(dot(sin(rayPos.xz * scale), cos(rayPos.zy * scale)) / scale * 0.5);
    }
  }
  outColor = color;
}
`;

const App: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 初期サイズをwindowサイズに
    let width = window.innerWidth;
    let height = window.innerHeight;

    // 既存canvasを全て削除
    if (mountRef.current) {
      while (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
    }

    // WebGL2コンテキストを取得
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      alert('WebGL2未対応のブラウザです');
      return;
    }
    const renderer = new THREE.WebGLRenderer({ canvas, context: gl });
    renderer.setSize(width, height);
    mountRef.current?.appendChild(renderer.domElement);

    // シーン・カメラ
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      width / -2, width / 2, height / 2, height / -2, 0.1, 10
    );
    camera.position.z = 1;

    // Planeジオメトリ
    const geometry = new THREE.PlaneGeometry(width, height);

    // RawShaderMaterial（GLSL ES 3.0用）
    const material = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_resolution: { value: new THREE.Vector2(width, height) },
        u_time: { value: 0.0 }
      },
      glslVersion: THREE.GLSL3
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // アニメーションループ
    const start = Date.now();
    let animationId: number;
    const animate = () => {
      material.uniforms.u_time.value = (Date.now() - start) * 0.001;
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    // リサイズ対応
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      renderer.setSize(width, height);
      camera.left = width / -2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = height / -2;
      camera.updateProjectionMatrix();
      material.uniforms.u_resolution.value.set(width, height);
      geometry.dispose();
      mesh.geometry = new THREE.PlaneGeometry(width, height);
    };
    window.addEventListener("resize", handleResize);

    // クリーンアップ
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  // divサイズも100vw, 100vhに
  return <div ref={mountRef} style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden" }} />;
};

export default App;
