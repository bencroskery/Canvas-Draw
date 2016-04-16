import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
    entry: 'src/js/main.js',
    format: 'iife',
    sourceMap: true,
    plugins: [
        babel({
            presets: ['es2015-rollup']
        }),
        uglify({
            mangle: {
                except: ['canvas', 'draw']
            }
        }),
        nodeResolve({
            jsnext: true,
            main: true
        }),
        commonjs({
            // non-CommonJS modules will be ignored, but you can also
            // specifically include/exclude files
            include: 'node_modules/**'  // Default: undefined
        })
    ],
    dest: 'public/js/bundle.js'
};