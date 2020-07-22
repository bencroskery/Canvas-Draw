import babel from '@rollup/plugin-babel';
import uglify from '@lopatnov/rollup-plugin-uglify';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';

export default {
    input: 'src/js/main.js',
    output: {
        file: 'public/js/bundle.js',
        format: 'iife',
        sourceMap: true
    },
    plugins: [
        babel({
            babelHelpers: 'bundled'
        }),
        uglify({
            mangle: {
                reserved: ['canvas', 'draw']
            }
        }),
        nodeResolve({
            mainFields: ['browser', 'jsnext:main']
        }),
        commonjs({
            // non-CommonJS modules will be ignored, but you can also
            // specifically include/exclude files
            include: 'node_modules/**'  // Default: undefined
        })
    ]
};