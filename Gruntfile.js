/*
 * Copyright (c) 2011-2013 Lp digital system
 *
 * This file is part of BackBee.
 *
 * BackBee is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * BackBee is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with BackBee. If not, see <http://www.gnu.org/licenses/>.
 */
module.exports = function (grunt) {
    'use strict';

    var path = (grunt.option('path') !== undefined) ? grunt.option('path') : undefined;
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        license: '/*\n * Copyright (c) 2011-2013 Lp digital system\n *\n * This file is part of BackBee.\n *\n * BackBee is free software: you can redistribute it and/or modify\n * it under the terms of the GNU General Public License as published by\n * the Free Software Foundation, either version 3 of the License, or\n * (at your option) any later version.\n *\n * BackBee is distributed in the hope that it will be useful,\n * but WITHOUT ANY WARRANTY; without even the implied warranty of\n * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\n * GNU General Public License for more details.\n *\n * You should have received a copy of the GNU General Public License\n * along with BackBee. If not, see <http://www.gnu.org/licenses/>.\n */\n',

        /**
         * toolbar files and directories
         */
        dir: {
            build: 'dist',
            lib: 'lib',
            specs: 'test'
        },

        concat: {
            options: {
                separator: '',
                process: function (src, filepath) {
                    return '\n/* ' + filepath + ' */\n' + src;
                }
            },
            dist: {
                src: ['src/Core.dist.js', 'src/Core.js', 'src/Core/*.js'],
                dest: 'dist/Core.js'
            }
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= pkg.version %> */\n<%= license %>'
            },
            core: {
                files: {
                    'dist/Core.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },

        /**
         * code style
         */
        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
            options: {
                jshintrc: '.jshintrc',
                predef: ['xdescribe']
            }
        },
        jslint: {
            grunt: {
                src: ['Gruntfile.js'],
                directives: {
                    predef: [
                        'module',
                        'require'
                    ]
                }
            },
            test: {
                src: ['test/**/*.js'],
                directives: {
                    node: true,
                    nomen: true,
                    predef: [
                        'define',
                        'require',
                        'it',
                        'expect',
                        '__dirname',
                        'describe',
                        'xdescribe',
                        'spyOn',
                        'jasmine',
                        'sessionStorage',
                        'window',
                        'before',
                        'beforeEach',
                        'after',
                        'afterEach',
                        'xit',
                        'xdescribe'
                    ]
                }
            },
            sources: {
                src: ['src/**/*.js'],
                directives: {
                    browser: true,
                    devel: true,
                    todo: true,
                    predef: [
                        'define',
                        'require',
                        'module',
                        'JS',
                        'load' // temp remove it
                    ]
                }
            }
        },

        requirejs: {
            dist: {
                options: {
                    name: 'Core',
                    out: 'dist/Core.js',
                    optimize: 'none',
                    include: [
                        'Core/Api',
                        'Core/ApplicationContainer',
                        'Core/ApplicationManager',
                        'Core/Config',
                        'Core/ControllerManager',
                        'Core/DriverHandler',
                        'Core/Exception',
                        'Core/Mediator',
                        'Core/Renderer',
                        'Core/Request',
                        'Core/RequestHandler',
                        'Core/Response',
                        'Core/RestDriver',
                        'Core/RouteManager',
                        'Core/Scope',
                        'Core/Utils'
                    ],
                    mainConfigFile: 'require.build.js',
                    generateSourceMaps: false,
                    preserveLicenseComments: true,
                    exclude: [
                        'BackBone',
                        'jquery',
                        'jsclass',
                        'underscore',
                        'nunjucks',
                        'URIjs/URI'
                    ]
                }
            },
            distmin: {
                options: {
                    name: 'Core',
                    out: 'dist/Core.min.js',
                    optimize: 'uglify2',
                    include: '<%= requirejs.dist.options.include %>',
                    mainConfigFile: 'require.build.js',
                    generateSourceMaps: false,
                    preserveLicenseComments: true,
                    exclude: '<%= requirejs.dist.options.exclude %>'
                }
            }
        },

        /**
         * application testing
         */
        jasmine: {

            test: {
                src: ['src/Core/*.js'],
                options: {
                    specs: path || 'test/Core/*.spec.js',
                    template: require('grunt-template-jasmine-requirejs'),
                    templateOptions: {
                        baseUrl: '',
                        requireConfigFile: 'test/require.config.js'
                    }
                }
            },

            build: {
                src: ['dist/Core.min.js'],
                options: {
                    specs: path || 'test/Core/*.spec.js',
                    template: require('grunt-template-jasmine-requirejs'),
                    templateOptions: {
                        baseUrl: '',
                        requireConfigFile: 'test/require.dist.config.js'
                    }
                }
            },

            coverage: {
                src: ['src/Core/*.js'],
                options: {
                    specs: path || 'test/Core/*.spec.js',
                    template: require('grunt-template-jasmine-istanbul'),
                    templateOptions: {
                        coverage: 'coverage/json/coverage.json',
                        report: [
                            {type: 'cobertura', options: {dir: 'coverage'}},
                            {type: 'lcov', options: {dir: 'coverage'}},
                            {type: 'text-summary'}
                        ],
                        template: require('grunt-template-jasmine-requirejs'),
                        templateOptions: {
                            baseUrl: '',
                            requireConfigFile: 'test/require.config.js'
                        }
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.loadNpmTasks('grunt-jslint');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.loadNpmTasks('grunt-contrib-requirejs');

    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-istanbul-coverage');

    // grunt tasks
    grunt.registerTask('default', ['jshint', 'jslint']);
    grunt.registerTask('test', ['jshint', 'jslint', 'jasmine:test']);
    grunt.registerTask('dist', ['concat', 'uglify', 'jasmine:build']);
    grunt.registerTask('all', ['jshint', 'jslint', 'concat', 'uglify', 'jasmine:coverage']);
};