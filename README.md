INDEX  [![Build Status](https://travis-ci.org/marclitchfield/VisualProgramming.png?branch=master)](https://travis-ci.org/marclitchfield/VisualProgramming)
==================

The INDEX code editor
For programming on touch-based devices. This is very much a work in progress.

####Current status:

The current implementation of INDEX runs in the context of a web page. It parses javascript source code into a syntax tree and renders it to the browser. The editor provides the ability to copy and insert symbols, rename symbols, and create expressions by dragging items from a palette onto the code. Currently using jade, less, knockout, PEG.js, jQuery, jQueryUI dragdrop, lo-dash, jasmine, karma, and grunt.

####Demo:

* http://marclitchfield.github.io/VisualProgramming/editor/editor.html?anagram.js
* http://marclitchfield.github.io/VisualProgramming/editor/editor.html?wordCounts.js
* http://marclitchfield.github.io/VisualProgramming/editor/editor.html?beerSong.js

####Next steps:
* Building expressions from the palette
* Parse javascript into the syntax tree (will need to add support for more expression types)
* Editing modes: move and insert, move and replace, copy and insert, copy and replace
* Delete expressions
* Code generation
* js-git integration
* Text-based code editor (with syntax highlighting)
* Performance tuning for large javascript files (may swap out Knockout for Angular)
* Undo/Redo stack
* Phonegap App
* Support for more languages
* Code formatting options

####Development setup:

Install dependencies
````
npm install
npm install grunt-cli -g
npm install karma-cli -g
````

Start watch process to compile jade and less, and run jshint.

````grunt watch````

Start karma in a new session. This will run the jasmine tests when any files are changed.

````karma start````

Host the project in a web server. A simple way is to run python's built-in SimpleHTTPServer in the ```editor``` directory.

````python -m SimpleHTTPServer````

There is a grunt task to automate the current process of commiting and pushing up to github and publish to gh-pages.

````grunt commit --m <commit message>````
