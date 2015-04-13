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
        'URIjs': 'bower_components/uri.js/src'
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
