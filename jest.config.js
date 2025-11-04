module.exports = {
    preset: '@wordpress/jest-preset-default',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    moduleNameMapper: {
        '\\.(css|scss)$': 'identity-obj-proxy'
    },
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: {
                jsx: 'react',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true
            }
        }],
        '^.+\\.(js|jsx)$': ['babel-jest', {
            presets: [
                ['@babel/preset-env', { targets: { node: 'current' } }],
                '@babel/preset-react'
            ]
        }]
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@wordpress|@testing-library)/)',
    ],
    testMatch: [
        '**/tests/**/*.test.(ts|tsx|js)'
    ],
    collectCoverageFrom: [
        'blocks/components/**/*.{ts,tsx}',
        '!blocks/components/index.ts'
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    }
};
