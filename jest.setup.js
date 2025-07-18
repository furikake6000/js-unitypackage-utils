// Jest setup file for additional configuration
// Add any global test setup here

const { TextEncoder, TextDecoder } = require('util');

// Mock browser APIs that might not be available in test environment
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;

// Mock URL.createObjectURL and URL.revokeObjectURL if URL is available
if (typeof URL !== 'undefined') {
  global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
  global.URL.revokeObjectURL = jest.fn();
}

// Mock Canvas API if needed
if (typeof HTMLCanvasElement !== 'undefined') {
  global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    drawImage: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    canvas: {
      width: 100,
      height: 100,
    },
  }));
}

// Mock Image constructor
global.Image = class MockImage {
  constructor() {
    this.onload = null;
    this.onerror = null;
  }

  set src(value) {
    // Simulate async loading
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
};
