# js-unitypackage-utils

Unity Package（.unitypackage）ファイルをブラウザとNode.jsで操作するための軽量TypeScriptライブラリです。Unityのパッケージ形式と100%互換性のある完全なクライアントサイド処理機能を提供します。

## 概要

Unity PackageはUnityエディタで使用されるアセットパッケージで、内部的にはtar.gz形式で圧縮されたアーカイブです。このライブラリは以下の機能を提供します：

- **完全なtar.gzサポート**: nanotarライブラリによる高速で軽量な処理
- **Unity Package構造解析**: GUID/pathname/asset/meta形式の完全対応
- **汎用ファイル操作API**: 画像・テキストアセットの置き換え
- **クライアントサイド処理**: サーバー負荷なし、UGCアップロード不要

## インストール

```bash
npm install js-unitypackage-utils
```

必要な依存関係は自動的にインストールされます：
- `nanotar` - tar.gz圧縮・展開用
- `js-yaml` - Unityアニメーションファイル解析用

## クイックスタート

### 1. Unity Packageの読み込み

```typescript
import { extractTarGz, parseUnityPackage } from 'js-unitypackage-utils';

// パッケージファイルの読み込み
const response = await fetch('/path/to/package.unitypackage');
const packageData = await response.arrayBuffer();

// tar.gzの展開
const entries = await extractTarGz(packageData);

// Unity Package構造の解析
const packageInfo = parseUnityPackage(entries);

console.log(`アセット数: ${packageInfo.assets.size}`);
console.log('アセット一覧:', Array.from(packageInfo.assets.keys()));
```

### 2. アセット情報の取得

```typescript
import { listAssets, getPackageStats, findAssetsByPattern } from 'js-unitypackage-utils';

// 全アセットの取得
const assetPaths = listAssets(packageInfo);
assetPaths.forEach((path) => {
  const asset = packageInfo.assets.get(path);
  console.log(`${asset.assetPath} (${asset.guid})`);
});

// パッケージ統計情報
const stats = getPackageStats(packageInfo);
console.log(`総サイズ: ${stats.totalSize} bytes`);
console.log(`アセット数: ${stats.totalAssets}`);

// パターンによるアセット検索
const images = findAssetsByPattern(packageInfo, '.png');
const configs = findAssetsByPattern(packageInfo, '.json');
```

### 3. アセットの変更

#### 画像ファイルの置き換え

```typescript
// 画像アセットの直接操作
const imageAsset = packageInfo.assets.get('Assets/Textures/Page1.png');
if (imageAsset) {
  // 新しい画像データをアセットに設定
  const fileReader = new FileReader();
  fileReader.onload = () => {
    imageAsset.assetData = new Uint8Array(fileReader.result as ArrayBuffer);
    console.log('画像の置き換えが完了しました');
  };
  fileReader.readAsArrayBuffer(newImageFile);
}
```

#### テキストファイルの置き換え

```typescript
// JSONファイルの内容を更新
const newConfig = {
  pages: 10,
  title: '新しいタイトル',
  version: '2.0',
};

const configAsset = packageInfo.assets.get('Assets/Config/BookSettings.json');
if (configAsset) {
  configAsset.assetData = new TextEncoder().encode(
    JSON.stringify(newConfig, null, 2),
  );
}
```

### 4. Unity Packageの再構築とエクスポート

```typescript
import { rebuildPackageEntries, compressTarGz } from 'js-unitypackage-utils';

// パッケージエントリの再構築
const rebuiltEntries = rebuildPackageEntries(packageInfo);

// tar.gz形式に圧縮
const finalPackage = await compressTarGz(rebuiltEntries);

// ダウンロードリンクの生成
const blob = new Blob([finalPackage], { type: 'application/gzip' });
const url = URL.createObjectURL(blob);

// ダウンロードのトリガー
const link = document.createElement('a');
link.href = url;
link.download = 'modified-package.unitypackage';
link.click();

URL.revokeObjectURL(url);
```

## Unityアニメーションの編集

```typescript
import { UnityAnimationEditor } from 'js-unitypackage-utils';

// アニメーションファイルの読み込み
const animAsset = packageInfo.assets.get('Assets/Animations/Sample.anim');
if (animAsset) {
  const editor = new UnityAnimationEditor();
  const yamlContent = new TextDecoder().decode(animAsset.assetData);
  
  editor.loadFromYaml(yamlContent);
  
  // アニメーション曲線の取得
  const curves = editor.getFloatCurves();
  console.log('Float曲線:', curves);
  
  // アニメーションの変更
  editor.setName('ModifiedAnimation');
  
  // キーフレームの追加
  editor.addKeyframe('m_LocalPosition.x', 'Player', {
    time: 1.0,
    value: 5.0,
    inSlope: 0,
    outSlope: 0,
    tangentMode: 0,
    weightedMode: 0,
    inWeight: 0.33333334,
    outWeight: 0.33333334,
  });
  
  // 変更されたアニメーションのエクスポート
  const modifiedYaml = editor.exportToYaml();
  animAsset.assetData = new TextEncoder().encode(modifiedYaml);
}
```

## ユーティリティ関数

### ファイル操作

```typescript
import {
  formatFileSize,
  validateFileType,
  getMimeTypeFromExtension,
  convertImageFormat,
} from 'js-unitypackage-utils';

// ファイルサイズの表示
console.log(formatFileSize(1024 * 1024)); // "1.0 MB"

// ファイル形式の検証
const isPng = validateFileType(imageData, 'png');

// MIMEタイプの取得
const mimeType = getMimeTypeFromExtension('image.jpg'); // "image/jpeg"

// 画像形式の変換
const convertedImage = await convertImageFormat(
  originalImageData,
  'png',
  0.8, // 品質
);
```

### アセット検索

```typescript
import { getGuidByPath, getPathByGuid, hasAsset } from 'js-unitypackage-utils';

// パスからGUIDを取得
const guid = getGuidByPath(packageInfo, 'Assets/Scripts/Main.cs');

// GUIDからパスを取得
const path = getPathByGuid(packageInfo, 'abc123def456');

// アセットの存在確認
const exists = hasAsset(packageInfo, 'Assets/Textures/Background.png');
```

## API リファレンス

### 型定義

```typescript
interface TarGzEntry {
  name: string;
  data: Uint8Array;
  isDirectory: boolean;
}

interface UnityAsset {
  guid: string;
  assetPath: string;
  assetData: Uint8Array;
  metaData?: string;
}

interface UnityPackageInfo {
  assets: Map<string, UnityAsset>;
  guidToPath: Map<string, string>;
  pathToGuid: Map<string, string>;
}

interface Keyframe {
  time: number;
  value: number;
  inSlope: number;
  outSlope: number;
  tangentMode: number;
  weightedMode: number;
  inWeight: number;
  outWeight: number;
}

interface FloatCurve {
  attribute: string;
  path: string;
  keyframes: Keyframe[];
}
```

### 主要関数

| 関数名 | 説明 | 戻り値の型 |
|--------|------|-----------|
| `extractTarGz(data)` | tar.gzファイルを展開 | `Promise<Map<string, TarGzEntry>>` |
| `compressTarGz(entries)` | エントリをtar.gz形式に圧縮 | `Promise<ArrayBuffer>` |
| `parseUnityPackage(entries)` | Unity Package構造を解析 | `UnityPackageInfo` |
| `rebuildPackageEntries(info)` | パッケージエントリを再構築 | `Map<string, TarGzEntry>` |
| `listAssets(info)` | アセットパス一覧を取得 | `string[]` |
| `getPackageStats(info)` | パッケージ統計情報を取得 | `{ totalAssets: number; totalSize: number; assetTypes: object }` |
| `findAssetsByPattern(info, pattern)` | パターンによるアセット検索 | `UnityAsset[]` |

## パフォーマンス

- **小さなファイル** (< 1MB): < 40ms処理時間
- **中程度のファイル** (1-10MB): < 200ms処理時間  
- **大きなファイル** (> 10MB): メモリ効率的な処理

## 互換性

- ✅ **Unity 2019.4+** 完全サポート
- ✅ **システム生成パッケージ** 互換性確認済み
- ✅ **ブラウザサポート**: Chrome 80+, Firefox 75+, Safari 13+

## ライセンス

MIT License - 詳細はLICENSEファイルを参照してください。

## 貢献

貢献を歓迎します！お気軽にPull Requestを送信してください。