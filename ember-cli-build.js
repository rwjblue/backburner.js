/* globals module, require */
'use strict';
const MergeTrees = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const Rollup = require('broccoli-rollup');
const path = require('path');
const typescript = require('broccoli-typescript-compiler').typescript;
const buble = require('rollup-plugin-buble');

module.exports = function () {
  const src = new MergeTrees([
    new Funnel(path.dirname(require.resolve('@types/qunit/package')), {
      destDir: 'qunit',
      include: [ 'index.d.ts' ]
    }),
    new Funnel(__dirname + '/lib', {
      destDir: 'lib'
    }),
    new Funnel(__dirname + '/tests', {
      destDir: 'tests'
    })
  ]);

  const compiled = typescript(src, {
    tsconfig: {
      compilerOptions: {
        baseUrl: '.',
        module: 'es2015',
        moduleResolution: 'node',
        paths: {
          backburner: ['lib/index.ts']
        },
        strictNullChecks: true,
        target: 'es2015'
      },
      files: ['qunit/index.d.ts', 'lib/index.ts', 'tests/index.ts']
    }
  });

  const backburner = new Rollup(compiled, {
    rollup: {
      dest: 'es6/backburner.js',
      entry: 'lib/index.js',
      format: 'es'
    }
  });

  return new MergeTrees([
    backburner,
    new Rollup(backburner, {
      rollup: {
        entry: 'es6/backburner.js',
        plugins: [
          buble()
        ],
        targets: [{
          dest: 'named-amd/backburner.js',
          exports: 'named',
          format: 'amd',
          moduleId: 'backburner'
        }, {
          dest: 'backburner.js',
          format: 'cjs'
        }]
      }
    }),
    new Rollup(compiled, {
      annotation: 'tests/tests.js',
      rollup: {
        entry: 'tests/index.js',
        external: ['backburner'],
        plugins: [
          buble()
        ],
        targets: [{
          dest: 'tests/tests.js',
          format: 'amd',
          moduleId: 'backburner-tests'
        }]
      }
    }),
    new Funnel(path.dirname(require.resolve('qunitjs')), {
      annotation: 'tests/qunit.{js,css}',
      destDir: 'tests',
      files: ['qunit.css', 'qunit.js']
    }),
    new Funnel(path.dirname(require.resolve('loader.js')), {
      annotation: 'tests/loader.js',
      destDir: 'tests',
      files: ['loader.js']
    }),
    new Funnel(__dirname + '/tests', {
      files: ['index.html'],
      destDir: 'tests'
    })
  ], {
    annotation: 'dist'
  });
};
