# three-glsl-test

このプロジェクトは、**Vite + React + TypeScript + three.js + GLSL (WebGL2)** を用いて、カスタムシェーダーによる3Dノイズやレイマーチング表現をWebアプリとして表示するサンプルです。

## 特徴
- **three.js + RawShaderMaterial + GLSL ES 3.0** による本格的なカスタムシェーダー開発
- GLSL（フラグメント/バーテックスシェーダ）はWebGL2/GLSL ES 3.0構文で記述
- シェーダーパラメータ（uniform）はReact/JSから動的に制御可能
- 画面サイズに自動追従する全画面canvas
- Viteによる高速な開発体験

## ディレクトリ構成
```
three-glsl-test/
├─ src/
│   ├─ App.tsx         # メインReactコンポーネント（three.js＋GLSL連携）
│   ├─ main.tsx        # エントリーポイント
│   ├─ shaders/        # GLSLファイル（必要に応じて）
│   └─ assets/         # 画像等のアセット
├─ public/             # 公開用静的ファイル
├─ package.json        # 依存管理
├─ vite.config.ts      # Vite設定
├─ tsconfig.json       # TypeScript設定
└─ README.md           # このファイル
```

## セットアップ・起動方法
1. 依存パッケージのインストール
   ```sh
   npm install
   # または
   yarn install
   ```
2. 開発サーバー起動
   ```sh
   npm run dev
   # または
   yarn dev
   ```
   ブラウザで `http://localhost:5173` などにアクセス

3. 本番ビルド
   ```sh
   npm run build
   # または
   yarn build
   ```

## 主な技術要素
- **three.js**: 3D描画・WebGLラッパー
- **GLSL (WebGL2/GLSL ES 3.0)**: カスタムシェーダー（RawShaderMaterial, in/out/uniform構文）
- **React**: UI構築
- **Vite**: 開発サーバー・ビルド
- **TypeScript**: 型安全な開発
- **vite-plugin-glsl**: GLSLファイルのimport（必要に応じて）

## カスタムシェーダー例
- GLSL内のuniformはJS/Reactから動的に制御可能
- 3Dノイズやレイマーチング、HSV色変換などの表現例を実装

## 注意点
- WebGL2対応ブラウザが必要です
- GLSL ES 3.0構文（in/out/uniform, #version不要, glslVersion: THREE.GLSL3指定）

---

ご質問・カスタマイズ要望などあればお気軽にどうぞ！
