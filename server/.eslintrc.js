module.exports = {
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    globals: {
        AsyncFunction: true
    },
    // "plugins": ["promise"],
    rules: {
        'arrow-body-style': ['error', 'as-needed'],
        'array-bracket-spacing': ['error', 'never'],
        'array-callback-return': 'error',
        'arrow-parens': ['error', 'as-needed', { requireForBlockBody: true }],
        'arrow-spacing': 'error',
        'brace-style': ['error', '1tbs', {
            allowSingleLine: true
        }],
        'block-spacing': 'error',
        camelcase: ['error', {
            properties: 'never'
        }],
        'comma-dangle': ['error', 'never'],
        'comma-spacing': ['error', {
            before: false,
            after: true
        }],
        'comma-style': ['error', 'last'],
        'dot-notation': 'error',
        'eol-last': ['error', 'always'],
        'function-paren-newline': ['error', 'multiline'],
        'func-call-spacing': ['error', 'never'],
        'func-style': ['error', 'declaration', {
            allowArrowFunctions: true
        }],
        'id-length': ['error', {
            exceptions: ['i', 'j', 'k', 'x', 'y', '_', '$'],
            min: 2,
            properties: 'never'
        }],
        'implicit-arrow-linebreak': ['error', 'beside'],
        indent: ['error', 4, {
            SwitchCase: 1
        }],
        'key-spacing': ['error', {
            afterColon: true
        }],
        'keyword-spacing': ['error'],
        'max-len': ['error', {
            code: 200,
            ignoreUrls: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
            ignoreRegExpLiterals: true
        }],
        'newline-per-chained-call': ['error', {
            ignoreChainWithDepth: 2
        }],
        'new-cap': 'error',
        'nonblock-statement-body-position': ['error', 'beside'],
        'no-array-constructor': 'error',
        'no-confusing-arrow': 'error',
        // "no-console": "none",
        'no-duplicate-imports': 'error',
        'no-else-return': 'error',
        'no-eval': 'error',
        'no-iterator': 'error',
        'no-loop-func': 'error',
        'no-mixed-operators': 'error',
        'no-multiple-empty-lines': 'error',
        'no-nested-ternary': 'error',
        'no-new-func': 'error',
        'no-new-object': 'error',
        'no-new-wrappers': 'error',
        'no-param-reassign': 'error',
        'no-restricted-globals': [
            'error',
            {
                name: 'event',
                message: 'Use local parameter instead.'
            },
            {
                name: 'isNaN',
                message: 'Use Number.isNaN instead of global isNaN.'
            },
            {
                name: 'isFinite',
                message: 'Use Number.isFinite instead of global isFinite.'
            },
            {
                name: 'Ext',
                message: 'This is a reserved keyword.'
            }
        ],
        'no-restricted-properties': [2, {
            object: 'Math',
            property: 'pow',
            message: 'Use exponentiation operator ** when calculating exponentiations.'
        }],
        'no-trailing-spaces': 'error',
        'no-unneeded-ternary': 'error',
        'no-useless-constructor': 'error',
        'no-use-before-define': 'error',
        'no-useless-escape': 'error',
        'no-var': 'error',
        'no-whitespace-before-property': 'error',
        'object-curly-spacing': ['error', 'always'],
        'object-shorthand': 'error',
        'one-var': ['error', 'never'],
        'operator-linebreak': ['error', 'after'],
        'padded-blocks': ['error', 'never'],
        'prefer-arrow-callback': 'error',
        'prefer-const': ['error', {
            destructuring: 'any',
            ignoreReadBeforeAssign: false
        }],
        'prefer-destructuring': ['error', {
            object: true,
            array: true
        }],
        'prefer-rest-params': 'error',
        'prefer-spread': 'error',
        'prefer-template': 'error',
        quotes: ['error', 'single'],
        'quote-props': ['error', 'as-needed'],
        radix: 'error',
        semi: 'error',
        'sort-keys': 'error',
        'spaced-comment': ['error', 'always'],
        'space-before-blocks': 'error',
        'space-before-function-paren': ['error', 'always'],
        'space-infix-ops': ['error'],
        'space-in-parens': ['error', 'never'],
        'wrap-iife': ['error', 'any']
    },
    env: {
        node: true,
        es6: true
    },
    root: true,
    overrides: [
        {
            files: ['models/**/*', 'test.js'],
            rules: {
                'sort-keys': 'off'
            }
        }
    ]
};
