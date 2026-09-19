/* .eslintrc.cjs — ESLint 8 legacy config.
 * The load-bearing rule is the src/xmp/lib/** override: the service and permission
 * seam must stay UI-free, so the mock API can be swapped for the real Supabase/
 * Postgres layer without touching a single screen. Enforced by no-restricted-imports.
 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {},
  ignorePatterns: ['dist', 'node_modules', 'vite.config.ts', '*.cjs'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      // Service/permission boundary — src/xmp/lib/** must be UI-free and router-free.
      files: ['src/xmp/lib/**/*.ts'],
      rules: {
        'no-restricted-imports': ['error', {
          paths: [
            { name: 'react', message: 'The lib seam must be pure — no React in src/xmp/lib/**.' },
            { name: 'react-dom', message: 'The lib seam must be pure — no ReactDOM in src/xmp/lib/**.' },
            { name: 'react-router-dom', message: 'The lib seam must be pure — no routing in src/xmp/lib/**.' },
            { name: 'lucide-react', message: 'The lib seam must be pure — no icons in src/xmp/lib/**.' },
          ],
          patterns: [
            { group: ['**/components/**', '**/pages/**'], message: 'The lib seam must not import components or pages.' },
            { group: ['**/session', '**/registry'], message: 'The lib seam must not depend on session or registry — they depend on it.' },
            { group: ['react', 'react/*', 'react-dom', 'react-dom/*'], message: 'The lib seam must be a pure, React-free module.' },
          ],
        }],
      },
    },
  ],
};
