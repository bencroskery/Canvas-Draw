import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

export default {
    entry: 'src/js/start/start.js',
    format: 'cjs',
    sourceMap: true,
    plugins: [ babel({
        presets: [ 'es2015-rollup' ]
    }), uglify({
        mangle: {
            except: ['canvas', 'draw']
        }
    }) ],
    dest: 'public/js/start.js'
};