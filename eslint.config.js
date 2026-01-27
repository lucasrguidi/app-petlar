import baseConfig from './packages/config/eslint.base.js'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...baseConfig,
  {
    ignores: [
      'node_modules/',
      'dist/',
      '.next/',
      '.turbo/',
      '*.tsbuildinfo',
      'pnpm-lock.yaml',
    ],
  },
]
