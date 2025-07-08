# js-unitypackage-utils

A lightweight TypeScript library for manipulating Unity Package (.unitypackage) files in browsers and Node.js. This library provides complete client-side processing capabilities with 100% compatibility with Unity's package format.

## Overview

Unity Packages are asset packages used by Unity Editor, internally stored as tar.gz compressed archives. This library provides:

- **Complete tar.gz support**: Fast and lightweight processing using nanotar library
- **Unity Package structure analysis**: Full support for GUID/pathname/asset/meta format
- **General file manipulation API**: Image and text asset replacement
- **Client-side processing**: No server load, no UGC uploads required

## Installation

```bash
npm install js-unitypackage-utils
```

Required dependencies will be installed automatically:
- `nanotar` - For tar.gz compression/decompression
- `js-yaml` - For Unity animation file parsing

## Quick Start

### 1. Loading Unity Package

```typescript
import { extractTarGz, parseUnityPackage } from 'js-unitypackage-utils';

// Load package file
const response = await fetch('/path/to/package.unitypackage');
const packageData = await response.arrayBuffer();

// Extract tar.gz
const entries = await extractTarGz(packageData);

// Parse Unity Package structure
const packageInfo = parseUnityPackage(entries);

console.log(`Asset count: ${packageInfo.assets.size}`);
console.log('Asset list:', Array.from(packageInfo.assets.keys()));
```

### 2. Asset Information

```typescript
import { listAssets, getPackageStats, findAssetsByPattern } from 'js-unitypackage-utils';

// Get all assets
const assetPaths = listAssets(packageInfo);
assetPaths.forEach((path) => {
  const asset = packageInfo.assets.get(path);
  console.log(`${asset.assetPath} (${asset.guid})`);
});

// Package statistics
const stats = getPackageStats(packageInfo);
console.log(`Total size: ${stats.totalSize} bytes`);
console.log(`Asset count: ${stats.totalAssets}`);

// Search assets by pattern
const images = findAssetsByPattern(packageInfo, '.png');
const configs = findAssetsByPattern(packageInfo, '.json');
```

### 3. Asset Modification

#### Image File Replacement

```typescript
// Direct image asset manipulation
const imageAsset = packageInfo.assets.get('Assets/Textures/Page1.png');
if (imageAsset) {
  // Set new image data to asset
  const fileReader = new FileReader();
  fileReader.onload = () => {
    imageAsset.assetData = new Uint8Array(fileReader.result as ArrayBuffer);
    console.log('Image replacement completed');
  };
  fileReader.readAsArrayBuffer(newImageFile);
}
```

#### Text File Replacement

```typescript
// Update JSON file content
const newConfig = {
  pages: 10,
  title: 'New Title',
  version: '2.0',
};

const configAsset = packageInfo.assets.get('Assets/Config/BookSettings.json');
if (configAsset) {
  configAsset.assetData = new TextEncoder().encode(
    JSON.stringify(newConfig, null, 2),
  );
}
```

### 4. Unity Package Rebuild and Export

```typescript
import { rebuildPackageEntries, compressTarGz } from 'js-unitypackage-utils';

// Rebuild package entries
const rebuiltEntries = rebuildPackageEntries(packageInfo);

// Compress to tar.gz format
const finalPackage = await compressTarGz(rebuiltEntries);

// Generate download link
const blob = new Blob([finalPackage], { type: 'application/gzip' });
const url = URL.createObjectURL(blob);

// Trigger download
const link = document.createElement('a');
link.href = url;
link.download = 'modified-package.unitypackage';
link.click();

URL.revokeObjectURL(url);
```

## Unity Animation Editing

```typescript
import { UnityAnimationEditor } from 'js-unitypackage-utils';

// Load animation file
const animAsset = packageInfo.assets.get('Assets/Animations/Sample.anim');
if (animAsset) {
  const editor = new UnityAnimationEditor();
  const yamlContent = new TextDecoder().decode(animAsset.assetData);
  
  editor.loadFromYaml(yamlContent);
  
  // Get animation curves
  const curves = editor.getFloatCurves();
  console.log('Float curves:', curves);
  
  // Modify animation
  editor.setName('ModifiedAnimation');
  
  // Add keyframe
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
  
  // Export modified animation
  const modifiedYaml = editor.exportToYaml();
  animAsset.assetData = new TextEncoder().encode(modifiedYaml);
}
```

## Utility Functions

### File Operations

```typescript
import {
  formatFileSize,
  validateFileType,
  getMimeTypeFromExtension,
  convertImageFormat,
} from 'js-unitypackage-utils';

// Display file size
console.log(formatFileSize(1024 * 1024)); // "1.0 MB"

// File format validation
const isPng = validateFileType(imageData, 'png');

// Get MIME type
const mimeType = getMimeTypeFromExtension('image.jpg'); // "image/jpeg"

// Convert image format
const convertedImage = await convertImageFormat(
  originalImageData,
  'png',
  0.8, // quality
);
```

### Asset Search

```typescript
import { getGuidByPath, getPathByGuid, hasAsset } from 'js-unitypackage-utils';

// Get GUID from path
const guid = getGuidByPath(packageInfo, 'Assets/Scripts/Main.cs');

// Get path from GUID
const path = getPathByGuid(packageInfo, 'abc123def456');

// Check asset existence
const exists = hasAsset(packageInfo, 'Assets/Textures/Background.png');
```

## API Reference

### Types

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

### Main Functions

| Function | Description | Return Type |
|----------|-------------|-------------|
| `extractTarGz(data)` | Extract tar.gz file | `Promise<Map<string, TarGzEntry>>` |
| `compressTarGz(entries)` | Compress entries to tar.gz | `Promise<ArrayBuffer>` |
| `parseUnityPackage(entries)` | Parse Unity Package structure | `UnityPackageInfo` |
| `rebuildPackageEntries(info)` | Rebuild package entries | `Map<string, TarGzEntry>` |
| `listAssets(info)` | Get asset path list | `string[]` |
| `getPackageStats(info)` | Get package statistics | `{ totalAssets: number; totalSize: number; assetTypes: object }` |
| `findAssetsByPattern(info, pattern)` | Search assets by pattern | `UnityAsset[]` |

## Performance

- **Small files** (< 1MB): < 40ms processing time
- **Medium files** (1-10MB): < 200ms processing time  
- **Large files** (> 10MB): Memory-efficient processing

## Compatibility

- ✅ **Unity 2019.4+** Full support
- ✅ **System-generated packages** Compatibility proven
- ✅ **Browser support**: Chrome 80+, Firefox 75+, Safari 13+

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.