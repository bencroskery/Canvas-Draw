module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        typescript: {
            base: {
                src: ['src/js/*.ts'],
                dest: 'build',
                options: {
                    module: 'commonjs',
                    target: 'es5',
                    sourceMap: true
                }
            }
        },
        uglify: {
            start: {
                options: {
                    mangle: {
                        except: ['canvas', 'draw', 'game', 'settings', 'players']
                    }
                },
                files: {
                    'public/js/start.min.js': ['src/start/start.js']
                }
            },
            build: {
                options: {
                    mangle: true,
                    sourceMap: 'public/js/draw.min.map',
                    sourceMapIn: 'build/draw.js.map'
                },
                files: {
                    'public/js/draw.min.js': ['build/draw.js']
                }
            },
            main: {
                options: {
                    mangle: true,
                    sourceMap: 'public/js/bundle.min.map'
                },
                files: {
                    'public/js/bundle.min.js': [
                        'node_modules/socket.io-client/socket.io.js',
                        'node_modules/howler/howler.min.js',
                        'src/js/*.js'
                    ]
                }
            }
        },
        less: {
            targets: {
                options: {
                    plugins: [
                        new (require('less-plugin-clean-css'))({advanced: true})
                    ]
                },
                files: {
                    "public/css/style.min.css": "src/css/style.less",
                    "public/css/start.min.css": "src/css/start.less"
                }
            }
        },
        jade: {
            compile: {
                options: {
                    data: {
                        debug: false
                    }
                },
                files: {
                    'public/index.html': 'src/index.jade'
                }
            }
        },
        watch: {
            options: {
                atBegin: true
            },
            typescript: {
                files: ['src/js/*.ts'],
                tasks: ['typescript', 'uglify:build']
            },
            start: {
                files: ['src/start/start.js'],
                tasks: ['uglify:start']
            },
            main: {
                files: ['src/js/*.js'],
                tasks: ['uglify:main']
            },
            less: {
                files: ['src/css/*.less'],
                tasks: ['less']
            },
            jade: {
                files: ['src/*.jade'],
                tasks: ['jade']
            }
        }
    });

    // Load plugins for tasks.
    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default tasks.
    grunt.registerTask('default', ['typescript', 'uglify', 'less', 'jade']);
};