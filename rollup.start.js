import babel from '@rollup/plugin-babel';
import uglify from '@lopatnov/rollup-plugin-uglify';

export default {
    input: 'src/js/start/start.js',
    output: {
        file: 'public/js/start.js',
        format: 'cjs',
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
        })
    ]
};