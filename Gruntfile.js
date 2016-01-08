module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
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
        uglify: {
            options: {
                mangle: {
                    except: ['canvas', 'draw']
                }
            },
            targets: {
                files: {
                    'public/js/start.min.js': ['public/js/start.js']
                }
            }
        }
    });

    // Load plugins for tasks.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');

    // Default tasks.
    grunt.registerTask('default', ['uglify','less']);
};