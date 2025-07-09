import {
  extractTarGz,
  parseUnityPackage,
  rebuildPackageEntries,
  compressTarGz,
  UnityAnimationEditor,
  formatFileSize,
  stringToUint8Array,
  uint8ArrayToString,
} from './index';

describe('tar.gz utilities', () => {
  test('extractTarGz should be a function', () => {
    expect(typeof extractTarGz).toBe('function');
  });

  test('compressTarGz should be a function', () => {
    expect(typeof compressTarGz).toBe('function');
  });
});

describe('Unity Package utilities', () => {
  test('parseUnityPackage should be a function', () => {
    expect(typeof parseUnityPackage).toBe('function');
  });

  test('rebuildPackageEntries should be a function', () => {
    expect(typeof rebuildPackageEntries).toBe('function');
  });
});

describe('Unity Animation Editor', () => {
  test('should create UnityAnimationEditor instance', () => {
    const editor = new UnityAnimationEditor();
    expect(editor).toBeInstanceOf(UnityAnimationEditor);
  });

  test('should have proper methods', () => {
    const editor = new UnityAnimationEditor();
    expect(typeof editor.getName).toBe('function');
    expect(typeof editor.setName).toBe('function');
    expect(typeof editor.getFloatCurves).toBe('function');
    expect(typeof editor.loadFromYaml).toBe('function');
    expect(typeof editor.exportToYaml).toBe('function');
  });

  test('should start with empty name', () => {
    const editor = new UnityAnimationEditor();
    expect(editor.getName()).toBe('');
  });

  test('should set and get name', () => {
    const editor = new UnityAnimationEditor();
    editor.setName('TestAnimation');
    expect(editor.getName()).toBe('TestAnimation');
  });

  test('should start with empty curves', () => {
    const editor = new UnityAnimationEditor();
    expect(editor.getFloatCurves()).toEqual([]);
  });
});

describe('File utilities', () => {
  test('formatFileSize should format bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
  });

  test('stringToUint8Array should convert string to bytes', () => {
    const text = 'Hello World';
    const bytes = stringToUint8Array(text);
    expect(bytes).toBeDefined();
    expect(bytes.length).toBeGreaterThan(0);
    expect(typeof bytes.length).toBe('number');
  });

  test('uint8ArrayToString should convert bytes to string', () => {
    const text = 'Hello World';
    const bytes = stringToUint8Array(text);
    const convertedText = uint8ArrayToString(bytes);
    expect(convertedText).toBe(text);
  });
});
