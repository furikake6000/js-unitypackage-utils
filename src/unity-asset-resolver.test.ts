import {
  parseUnityPackage,
  getGuidByPath,
  getPathByGuid,
  hasAsset,
  findAssetsByPattern,
  rebuildPackageEntries,
  listAssets,
  getPackageStats,
  type UnityAsset,
  type UnityPackageInfo,
} from './unity-asset-resolver';
import { TarGzEntry } from './tar-gz-utils';

describe('unity-asset-resolver', () => {
  // テスト用のサンプルUnityPackageエントリを作成
  const createSampleUnityPackageEntries = (): Map<string, TarGzEntry> => {
    const entries = new Map<string, TarGzEntry>();

    // GUID1: スクリプトファイル
    const guid1 = 'abc123def456';
    entries.set(`${guid1}/pathname`, {
      name: `${guid1}/pathname`,
      data: new TextEncoder().encode('Assets/Scripts/PlayerController.cs'),
      isDirectory: false,
    });
    entries.set(`${guid1}/asset`, {
      name: `${guid1}/asset`,
      data: new TextEncoder().encode(
        'using UnityEngine;\n\npublic class PlayerController : MonoBehaviour\n{\n    // Player controller code\n}',
      ),
      isDirectory: false,
    });
    entries.set(`${guid1}/asset.meta`, {
      name: `${guid1}/asset.meta`,
      data: new TextEncoder().encode(
        'fileFormatVersion: 2\nguid: abc123def456\nMonoImporter:\n  externalObjects: {}\n  serializedVersion: 2\n  defaultReferences: []\n  executionOrder: 0\n  icon: {instanceID: 0}\n  userData: \n  assetBundleName: \n  assetBundleVariant: ',
      ),
      isDirectory: false,
    });

    // GUID2: テクスチャファイル
    const guid2 = 'def456ghi789';
    entries.set(`${guid2}/pathname`, {
      name: `${guid2}/pathname`,
      data: new TextEncoder().encode('Assets/Textures/player_texture.png'),
      isDirectory: false,
    });
    entries.set(`${guid2}/asset`, {
      name: `${guid2}/asset`,
      data: new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52,
      ]), // PNG header
      isDirectory: false,
    });
    entries.set(`${guid2}/asset.meta`, {
      name: `${guid2}/asset.meta`,
      data: new TextEncoder().encode(
        'fileFormatVersion: 2\nguid: def456ghi789\nTextureImporter:\n  internalIDToNameTable: []\n  externalObjects: {}\n  serializedVersion: 11\n  mipmaps:\n    mipMapMode: 0',
      ),
      isDirectory: false,
    });

    // GUID3: プレハブファイル（metaなし）
    const guid3 = 'ghi789jkl012';
    entries.set(`${guid3}/pathname`, {
      name: `${guid3}/pathname`,
      data: new TextEncoder().encode('Assets/Prefabs/Enemy.prefab'),
      isDirectory: false,
    });
    entries.set(`${guid3}/asset`, {
      name: `${guid3}/asset`,
      data: new TextEncoder().encode(
        '%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n--- !u!1 &1\nGameObject:\n  m_ObjectHideFlags: 0\n  m_CorrespondingSourceObject: {fileID: 0}\n  m_PrefabInstance: {fileID: 0}\n  m_PrefabAsset: {fileID: 0}\n  serializedVersion: 6\n  m_Component:\n  - component: {fileID: 4}\n  m_Layer: 0\n  m_Name: Enemy\n  m_TagString: Untagged\n  m_Icon: {fileID: 0}\n  m_NavMeshLayer: 0\n  m_StaticEditorFlags: 0\n  m_IsActive: 1',
      ),
      isDirectory: false,
    });

    // GUID4: 不完全なエントリ（assetのみ）
    const guid4 = 'jkl012mno345';
    entries.set(`${guid4}/asset`, {
      name: `${guid4}/asset`,
      data: new TextEncoder().encode('incomplete asset data'),
      isDirectory: false,
    });

    return entries;
  };

  // テスト用のUnityPackageInfoを作成
  const createSampleUnityPackageInfo = (): UnityPackageInfo => {
    const entries = createSampleUnityPackageEntries();
    return parseUnityPackage(entries);
  };

  describe('parseUnityPackage', () => {
    test('正常なUnityPackageエントリを解析できる', () => {
      const entries = createSampleUnityPackageEntries();

      const result = parseUnityPackage(entries);

      expect(result.assets.size).toBe(3); // 完全なエントリのみ
      expect(result.guidToPath.size).toBe(3);
      expect(result.pathToGuid.size).toBe(3);

      // 各アセットが正しく解析されているか確認
      expect(result.assets.has('Assets/Scripts/PlayerController.cs')).toBe(
        true,
      );
      expect(result.assets.has('Assets/Textures/player_texture.png')).toBe(
        true,
      );
      expect(result.assets.has('Assets/Prefabs/Enemy.prefab')).toBe(true);
    });

    test('不完全なエントリはスキップされる', () => {
      const entries = createSampleUnityPackageEntries();

      const result = parseUnityPackage(entries);

      // jkl012mno345はpathnameがないためスキップされる
      expect(result.assets.size).toBe(3);
      expect(result.guidToPath.has('jkl012mno345')).toBe(false);
    });

    test('空のエントリマップを処理できる', () => {
      const entries = new Map<string, TarGzEntry>();

      const result = parseUnityPackage(entries);

      expect(result.assets.size).toBe(0);
      expect(result.guidToPath.size).toBe(0);
      expect(result.pathToGuid.size).toBe(0);
    });

    test('無効なパス構造のエントリを処理できる', () => {
      const entries = new Map<string, TarGzEntry>();

      // 無効な構造のエントリ
      entries.set('invalid-entry', {
        name: 'invalid-entry',
        data: new TextEncoder().encode('invalid data'),
        isDirectory: false,
      });

      const result = parseUnityPackage(entries);

      expect(result.assets.size).toBe(0);
    });
  });

  describe('getGuidByPath', () => {
    test('存在するアセットパスからGUIDを取得できる', () => {
      const packageInfo = createSampleUnityPackageInfo();

      const guid = getGuidByPath(
        packageInfo,
        'Assets/Scripts/PlayerController.cs',
      );

      expect(guid).toBe('abc123def456');
    });

    test('存在しないアセットパスの場合はundefinedを返す', () => {
      const packageInfo = createSampleUnityPackageInfo();

      const guid = getGuidByPath(packageInfo, 'Assets/NonExistent.cs');

      expect(guid).toBeUndefined();
    });
  });

  describe('getPathByGuid', () => {
    test('存在するGUIDからアセットパスを取得できる', () => {
      const packageInfo = createSampleUnityPackageInfo();

      const path = getPathByGuid(packageInfo, 'def456ghi789');

      expect(path).toBe('Assets/Textures/player_texture.png');
    });

    test('存在しないGUIDの場合はundefinedを返す', () => {
      const packageInfo = createSampleUnityPackageInfo();

      const path = getPathByGuid(packageInfo, 'nonexistent-guid');

      expect(path).toBeUndefined();
    });
  });

  describe('hasAsset', () => {
    test('存在するアセットの場合はtrueを返す', () => {
      const packageInfo = createSampleUnityPackageInfo();

      const exists = hasAsset(packageInfo, 'Assets/Prefabs/Enemy.prefab');

      expect(exists).toBe(true);
    });

    test('存在しないアセットの場合はfalseを返す', () => {
      const packageInfo = createSampleUnityPackageInfo();

      const exists = hasAsset(packageInfo, 'Assets/NonExistent.prefab');

      expect(exists).toBe(false);
    });
  });

  describe('findAssetsByPattern', () => {
    test('ファイル拡張子でアセットを検索できる', () => {
      const packageInfo = createSampleUnityPackageInfo();

      const results = findAssetsByPattern(packageInfo, '.cs');

      expect(results).toHaveLength(1);
      expect(results[0].assetPath).toBe('Assets/Scripts/PlayerController.cs');
    });

    test('フォルダ名でアセットを検索できる', () => {
      const packageInfo = createSampleUnityPackageInfo();

      const results = findAssetsByPattern(packageInfo, 'Textures');

      expect(results).toHaveLength(1);
      expect(results[0].assetPath).toBe('Assets/Textures/player_texture.png');
    });

    test('マッチしないパターンの場合は空の配列を返す', () => {
      const packageInfo = createSampleUnityPackageInfo();

      const results = findAssetsByPattern(packageInfo, '.xyz');

      expect(results).toHaveLength(0);
    });

    test('複数のアセットがマッチする場合はすべて返す', () => {
      const packageInfo = createSampleUnityPackageInfo();

      const results = findAssetsByPattern(packageInfo, 'Assets/');

      expect(results).toHaveLength(3);
    });
  });

  describe('rebuildPackageEntries', () => {
    test('UnityPackageInfoからTarGzEntryを再構築できる', () => {
      const packageInfo = createSampleUnityPackageInfo();

      const entries = rebuildPackageEntries(packageInfo);

      expect(entries.size).toBe(8); // 3アセット × (pathname + asset) + 2メタファイル

      // 各アセットのエントリが存在するか確認
      expect(entries.has('abc123def456/pathname')).toBe(true);
      expect(entries.has('abc123def456/asset')).toBe(true);
      expect(entries.has('abc123def456/asset.meta')).toBe(true);
      expect(entries.has('def456ghi789/pathname')).toBe(true);
      expect(entries.has('def456ghi789/asset')).toBe(true);
      expect(entries.has('def456ghi789/asset.meta')).toBe(true);
      expect(entries.has('ghi789jkl012/pathname')).toBe(true);
      expect(entries.has('ghi789jkl012/asset')).toBe(true);
      // ghi789jkl012はmetaDataがないためasset.metaエントリがない
    });

    test('再構築されたエントリのデータが正しい', () => {
      const packageInfo = createSampleUnityPackageInfo();

      const entries = rebuildPackageEntries(packageInfo);

      const pathnameEntry = entries.get('abc123def456/pathname')!;
      const assetEntry = entries.get('abc123def456/asset')!;

      expect(new TextDecoder().decode(pathnameEntry.data)).toBe(
        'Assets/Scripts/PlayerController.cs',
      );
      expect(new TextDecoder().decode(assetEntry.data)).toContain(
        'PlayerController',
      );
    });
  });

  describe('listAssets', () => {
    test('すべてのアセットパスをソートして取得できる', () => {
      const packageInfo = createSampleUnityPackageInfo();

      const results = listAssets(packageInfo);

      expect(results).toEqual([
        'Assets/Prefabs/Enemy.prefab',
        'Assets/Scripts/PlayerController.cs',
        'Assets/Textures/player_texture.png',
      ]);
    });

    test('空のパッケージの場合は空の配列を返す', () => {
      const packageInfo: UnityPackageInfo = {
        assets: new Map(),
        guidToPath: new Map(),
        pathToGuid: new Map(),
      };

      const results = listAssets(packageInfo);

      expect(results).toEqual([]);
    });
  });

  describe('getPackageStats', () => {
    test('パッケージの統計情報を取得できる', () => {
      const packageInfo = createSampleUnityPackageInfo();

      const stats = getPackageStats(packageInfo);

      expect(stats.totalAssets).toBe(3);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.assetTypes).toHaveProperty('cs', 1);
      expect(stats.assetTypes).toHaveProperty('png', 1);
      expect(stats.assetTypes).toHaveProperty('prefab', 1);
    });

    test('空のパッケージの統計情報を取得できる', () => {
      const packageInfo: UnityPackageInfo = {
        assets: new Map(),
        guidToPath: new Map(),
        pathToGuid: new Map(),
      };

      const stats = getPackageStats(packageInfo);

      expect(stats.totalAssets).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.assetTypes).toEqual({});
    });

    test('拡張子のないファイルはunknownとして分類される', () => {
      const packageInfo: UnityPackageInfo = {
        assets: new Map([
          [
            'Assets/NoExtension',
            {
              guid: 'test-guid',
              assetPath: 'Assets/NoExtension',
              assetData: new Uint8Array([1, 2, 3]),
            },
          ],
        ]),
        guidToPath: new Map([['test-guid', 'Assets/NoExtension']]),
        pathToGuid: new Map([['Assets/NoExtension', 'test-guid']]),
      };

      const stats = getPackageStats(packageInfo);

      expect(stats.assetTypes).toHaveProperty('unknown', 1);
    });
  });

  describe('統合テスト', () => {
    test('解析から再構築までの往復処理', () => {
      const originalEntries = createSampleUnityPackageEntries();

      // 解析
      const packageInfo = parseUnityPackage(originalEntries);

      // 再構築
      const rebuiltEntries = rebuildPackageEntries(packageInfo);

      // 再度解析
      const repackagedInfo = parseUnityPackage(rebuiltEntries);

      // 元の情報と比較
      expect(repackagedInfo.assets.size).toBe(packageInfo.assets.size);
      expect(repackagedInfo.guidToPath.size).toBe(packageInfo.guidToPath.size);
      expect(repackagedInfo.pathToGuid.size).toBe(packageInfo.pathToGuid.size);

      // 各アセットが正しく再構築されているか確認
      for (const [path, asset] of packageInfo.assets) {
        expect(repackagedInfo.assets.has(path)).toBe(true);
        const rebuiltAsset = repackagedInfo.assets.get(path)!;
        expect(rebuiltAsset.guid).toBe(asset.guid);
        expect(rebuiltAsset.assetPath).toBe(asset.assetPath);
        expect(Array.from(rebuiltAsset.assetData)).toEqual(
          Array.from(asset.assetData),
        );
      }
    });

    test('複数の検索機能を組み合わせて使用', () => {
      const packageInfo = createSampleUnityPackageInfo();

      // パターン検索でスクリプトファイルを見つける
      const scripts = findAssetsByPattern(packageInfo, '.cs');
      expect(scripts).toHaveLength(1);

      // そのスクリプトのGUIDを取得
      const scriptGuid = getGuidByPath(packageInfo, scripts[0].assetPath);
      expect(scriptGuid).toBe('abc123def456');

      // GUIDからパスを再取得
      const scriptPath = getPathByGuid(packageInfo, scriptGuid!);
      expect(scriptPath).toBe('Assets/Scripts/PlayerController.cs');

      // アセットの存在確認
      expect(hasAsset(packageInfo, scriptPath!)).toBe(true);
    });
  });
});
