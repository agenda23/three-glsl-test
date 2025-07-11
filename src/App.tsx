import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import fragmentShader1 from './shaders/fragment.glsl';
import fragmentShader2 from './shaders/fragment2.glsl';

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
const fragmentShaders = [
  {
    code: fragmentShader1,
    getUniforms: (width: number, height: number) => ({
      u_resolution: { value: new THREE.Vector2(width, height) },
      u_time: { value: 0.0 }
    }),
    uniformMap: { resolution: 'u_resolution', time: 'u_time' },
    outColor: 'outColor',
  },
  {
    code: fragmentShader2,
    getUniforms: (width: number, height: number) => ({
      u_resolution: { value: new THREE.Vector2(width, height) },
      u_time: { value: 0.0 }
    }),
    uniformMap: { resolution: 'u_resolution', time: 'u_time' },
    outColor: 'outColor',
  }
];

const App: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const shaderIndexRef = useRef(0);
  const materialRef = useRef<THREE.RawShaderMaterial | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  let start: number;

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
    let scene: THREE.Scene;
    let camera: THREE.OrthographicCamera;
    let geometry: THREE.PlaneGeometry;
    let animationId: number;
    start = Date.now();

    const setupScene = (shaderIdx: number) => {
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(
        width / -2, width / 2, height / 2, height / -2, 0.1, 10
      );
      camera.position.z = 1;
      geometry = new THREE.PlaneGeometry(width, height);
      const frag = fragmentShaders[shaderIdx];
      const uniforms = frag.getUniforms(width, height);
      const material = new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader: frag.code,
        uniforms,
        glslVersion: THREE.GLSL3
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      materialRef.current = material;
      meshRef.current = mesh;
    };

    setupScene(0);

    const animate = () => {
      const frag = fragmentShaders[shaderIndexRef.current];
      if (materialRef.current) {
        materialRef.current.uniforms[frag.uniformMap.time].value = (Date.now() - start) * 0.001;
      }
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
      const frag = fragmentShaders[shaderIndexRef.current];
      if (materialRef.current) {
        materialRef.current.uniforms[frag.uniformMap.resolution].value.set(width, height);
      }
      geometry.dispose();
      if (meshRef.current) {
        meshRef.current.geometry = new THREE.PlaneGeometry(width, height);
      }
    };
    window.addEventListener("resize", handleResize);

    // キーボードでシェーダー切り替え
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= String(fragmentShaders.length)) {
        const idx = Number(e.key) - 1;
        if (idx !== shaderIndexRef.current) {
          cancelAnimationFrame(animationId);
          // 古いmesh/materialをsceneからremove/dispose
          if (meshRef.current) {
            scene.remove(meshRef.current);
            meshRef.current.geometry.dispose();
            if (meshRef.current.material instanceof THREE.Material) {
              meshRef.current.material.dispose();
            }
          }
          // 新しいものを生成
          const frag = fragmentShaders[idx];
          const uniforms = frag.getUniforms(width, height);
          const material = new THREE.RawShaderMaterial({
            vertexShader,
            fragmentShader: frag.code,
            uniforms,
            glslVersion: THREE.GLSL3
          });
          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);
          materialRef.current = material;
          meshRef.current = mesh;
          shaderIndexRef.current = idx;
          animate();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // クリーンアップ
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      if (materialRef.current) materialRef.current.dispose();
      if (meshRef.current) meshRef.current.geometry.dispose();
    };
  }, []);

  // divサイズも100vw, 100vhに
  return <div ref={mountRef} style={{ width: "100vw", height: "100vh", margin: 0, padding: 0, overflow: "hidden" }} />;
};

export default App;
