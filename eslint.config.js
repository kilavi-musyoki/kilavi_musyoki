import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactPlugin from 'eslint-plugin-react'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  // ── Browser & React Frontend Files ──
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      react: reactPlugin
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      'no-unused-vars': ['warn', {
        varsIgnorePattern:       '^_',   // only ignore _-prefixed vars (intentional non-use)
        argsIgnorePattern:       '^_',   // allow _param in function signatures
        caughtErrorsIgnorePattern: '^_', // allow catch (_) { /* ignore */ }
        destructuredArrayIgnorePattern:  '^_',
      }],
    },
    settings: {
      react: { version: 'detect' }
    }
  },
  // ── Serverless Backend API Files (Node.js) ──
  {
    files: ['api/**/*.js', 'vite.config.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        fetch: 'readonly',
      },
      parserOptions: {
        sourceType: 'module',
      }
    },
    rules: {
      'no-unused-vars': ['warn', { varsIgnorePattern: '^_' }],
    }
  }
])

