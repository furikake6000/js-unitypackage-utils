import { UnityPackage, isUnityPackage } from './index';

describe('UnityPackage', () => {
  let unityPackage: UnityPackage;

  beforeEach(() => {
    unityPackage = new UnityPackage();
  });

  test('should create instance', () => {
    expect(unityPackage).toBeInstanceOf(UnityPackage);
  });

  test('should load file', async () => {
    const buffer = new ArrayBuffer(100);
    await unityPackage.load(buffer);
    // TODO: 実際のテストロジックを追加
    expect(true).toBe(true);
  });

  test('should get files list', () => {
    const files = unityPackage.getFiles();
    expect(Array.isArray(files)).toBe(true);
  });

  test('should export package', () => {
    const exported = unityPackage.export();
    expect(exported).toBeInstanceOf(ArrayBuffer);
  });
});

describe('isUnityPackage', () => {
  test('should return true for non-empty buffer', () => {
    const buffer = new ArrayBuffer(100);
    expect(isUnityPackage(buffer)).toBe(true);
  });

  test('should return false for empty buffer', () => {
    const buffer = new ArrayBuffer(0);
    expect(isUnityPackage(buffer)).toBe(false);
  });
});
