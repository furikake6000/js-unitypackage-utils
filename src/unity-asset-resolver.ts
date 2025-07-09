import { uint8ArrayToString } from './file-utils';
import { TarGzEntry } from './tar-gz-utils';

/**
 * Unityアセット情報
 */
export interface UnityAsset {
  guid: string;
  assetPath: string;
  assetData: Uint8Array;
  metaData?: string;
}

/**
 * Unityパッケージ内のアセット解析結果
 */
export interface UnityPackageInfo {
  assets: Map<string, UnityAsset>; // assetPath -> UnityAsset
  guidToPath: Map<string, string>; // guid -> assetPath
  pathToGuid: Map<string, string>; // assetPath -> guid
}

/**
 * UnityPackageのアセット構造を解析する
 * @param entries tar.gzから展開されたエントリ
 * @returns アセット情報マップ
 */
export function parseUnityPackage(
  entries: Map<string, TarGzEntry>,
): UnityPackageInfo {
  const assets = new Map<string, UnityAsset>();
  const guidToPath = new Map<string, string>();
  const pathToGuid = new Map<string, string>();

  // エントリをGUIDごとにグループ化
  const guidGroups = new Map<
    string,
    { asset?: TarGzEntry; meta?: TarGzEntry; pathname?: TarGzEntry }
  >();

  for (const entry of Array.from(entries.values())) {
    // UnityPackageの構造: {guid}/asset, {guid}/asset.meta, {guid}/pathname
    const pathParts = entry.name.split('/');
    if (pathParts.length >= 2) {
      const guid = pathParts[0];
      const fileName = pathParts[1];

      if (!guidGroups.has(guid)) {
        guidGroups.set(guid, {});
      }
      const group = guidGroups.get(guid)!;

      switch (fileName) {
        case 'asset':
          group.asset = entry;
          break;
        case 'asset.meta':
          group.meta = entry;
          break;
        case 'pathname':
          group.pathname = entry;
          break;
      }
    }
  }

  // 各GUIDグループからアセット情報を構築
  for (const [guid, group] of Array.from(guidGroups.entries())) {
    if (group.pathname && group.asset) {
      try {
        const assetPath = uint8ArrayToString(group.pathname.data).trim();
        const metaData = group.meta
          ? uint8ArrayToString(group.meta.data)
          : undefined;

        const asset: UnityAsset = {
          guid,
          assetPath,
          assetData: group.asset.data,
          metaData,
        };

        assets.set(assetPath, asset);
        guidToPath.set(guid, assetPath);
        pathToGuid.set(assetPath, guid);
      } catch (error) {
        // console.warn(`アセット解析エラー (GUID: ${guid}):`, error);
      }
    }
  }

  return { assets, guidToPath, pathToGuid };
}

/**
 * アセットパスからGUIDを取得する
 * @param packageInfo パッケージ情報
 * @param assetPath アセットパス
 * @returns GUID（見つからない場合はundefined）
 */
export function getGuidByPath(
  packageInfo: UnityPackageInfo,
  assetPath: string,
): string | undefined {
  return packageInfo.pathToGuid.get(assetPath);
}

/**
 * GUIDからアセットパスを取得する
 * @param packageInfo パッケージ情報
 * @param guid GUID
 * @returns アセットパス（見つからない場合はundefined）
 */
export function getPathByGuid(
  packageInfo: UnityPackageInfo,
  guid: string,
): string | undefined {
  return packageInfo.guidToPath.get(guid);
}

/**
 * アセットの存在確認
 * @param packageInfo パッケージ情報
 * @param assetPath アセットパス
 * @returns 存在する場合true
 */
export function hasAsset(
  packageInfo: UnityPackageInfo,
  assetPath: string,
): boolean {
  return packageInfo.assets.has(assetPath);
}

/**
 * パターンにマッチするアセットを検索
 * @param packageInfo パッケージ情報
 * @param pattern 検索パターン（部分一致）
 * @returns マッチしたアセットの配列
 */
export function findAssetsByPattern(
  packageInfo: UnityPackageInfo,
  pattern: string,
): UnityAsset[] {
  const results: UnityAsset[] = [];

  for (const [assetPath, asset] of Array.from(packageInfo.assets.entries())) {
    if (assetPath.includes(pattern)) {
      results.push(asset);
    }
  }

  return results;
}

/**
 * UnityPackageを再構築するためのエントリを作成
 * @param packageInfo パッケージ情報
 * @returns tar.gz用のエントリマップ
 */
export function rebuildPackageEntries(
  packageInfo: UnityPackageInfo,
): Map<string, TarGzEntry> {
  const entries = new Map<string, TarGzEntry>();

  for (const asset of Array.from(packageInfo.assets.values())) {
    const guid = asset.guid;

    // pathname エントリ
    entries.set(`${guid}/pathname`, {
      name: `${guid}/pathname`,
      data: new TextEncoder().encode(asset.assetPath),
      isDirectory: false,
    });

    // asset エントリ
    entries.set(`${guid}/asset`, {
      name: `${guid}/asset`,
      data: asset.assetData,
      isDirectory: false,
    });

    // asset.meta エントリ（存在する場合）
    if (asset.metaData) {
      entries.set(`${guid}/asset.meta`, {
        name: `${guid}/asset.meta`,
        data: new TextEncoder().encode(asset.metaData),
        isDirectory: false,
      });
    }
  }

  return entries;
}

/**
 * アセット一覧を取得（デバッグ用）
 * @param packageInfo パッケージ情報
 * @returns アセットパスの配列
 */
export function listAssets(packageInfo: UnityPackageInfo): string[] {
  return Array.from(packageInfo.assets.keys()).sort();
}

/**
 * パッケージの統計情報を取得
 * @param packageInfo パッケージ情報
 * @returns 統計情報
 */
export function getPackageStats(packageInfo: UnityPackageInfo): {
  totalAssets: number;
  totalSize: number;
  assetTypes: { [extension: string]: number };
} {
  let totalSize = 0;
  const assetTypes: { [extension: string]: number } = {};

  for (const asset of Array.from(packageInfo.assets.values())) {
    totalSize += asset.assetData.length;

    const pathParts = asset.assetPath.split('.');
    const extension =
      pathParts.length > 1
        ? pathParts.pop()?.toLowerCase() || 'unknown'
        : 'unknown';
    assetTypes[extension] = (assetTypes[extension] || 0) + 1;
  }

  return {
    totalAssets: packageInfo.assets.size,
    totalSize,
    assetTypes,
  };
}
