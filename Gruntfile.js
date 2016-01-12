module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        typescript: {
            base: {
                src: ['public/js/draw.ts'],
                dest: 'public/js',
                options: {
                    module: 'commonjs',
                    target: 'es5'
                }
            }
        },
        uglify: {
            options: {
                mangle: {
                    except: ['canvas', 'draw', 'game']
                }
            },
            targets: {
                files: {
                    'public/js/start.min.js': ['public/js/start.js']
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
                    "public/css/style.min.css": "public/css/style.less",
                    "public/css/start.min.css": "public/css/start.less"
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
                    'public/index.html': 'public/index.jade'
                }
            }
        },
        watch: {
            options: {
                atBegin: true
            },
            typescript: {
                files: ['public/css/*.less'],
                tasks: ['typescript']
            },
            less: {
                files: ['public/css/*.less'],
                tasks: ['less']
            },
            js: {
                files: ['public/js/start.js'],
                tasks: ['uglify']
            },
            jade: {
                files: ['public/*.jade'],
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