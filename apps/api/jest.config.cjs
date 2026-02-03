/** Jest config for ESM + TypeScript (ts-jest) */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^@resbar/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
};
