require.config({
    baseUrl: './',
    urlArgs: 'cb=' + Math.random(),
    paths: {
        'Core': 'src/Core',

        'BackBone': 'bower_components/backbone/backbone',
        'jquery': 'bower_components/jquery/dist/jquery.min',
        'jsclass' : 'node_modules/jsclass/min/core',
        'underscore': 'bower_components/underscore/underscore-min',
        'nunjucks': 'bower_components/nunjucks/browser/nunjucks.min',
        'URIjs': 'bower_components/uri.js/src',

        'jasmine': 'node_modules/grunt-contrib-jasmine/vendor/jasmine-2.0.0/jasmine',
        'jasmine-html': 'node_modules/grunt-contrib-jasmine/vendor/jasmine-2.0.0/jasmine-html',
        'es5-shim': 'bower_components/es5-shim'
    },
    shim: {
        underscore: {
            exports: '_'
        },
        BackBone: {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        jasmine: {
            exports: 'jasmine'
        },
        'jasmine-html': {
            deps: ['jasmine'],
            exports: 'jasmine'
        }
    }
});
