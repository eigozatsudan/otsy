// Test setup file
import 'reflect-metadata';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn() as any,
  debug: jest.fn() as any,
  info: jest.fn() as any,
  warn: jest.fn() as any,
  error: jest.fn() as any,
};