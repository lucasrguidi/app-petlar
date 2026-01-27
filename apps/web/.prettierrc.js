import prettierConfig from '../../packages/config/prettier.base.js'

/** @type {import('prettier').Config} */
export default {
  ...prettierConfig,
  plugins: ['prettier-plugin-tailwindcss'],
}
