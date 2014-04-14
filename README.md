Visual Programming  [![Build Status](https://travis-ci.org/marclitchfield/VisualProgramming.png?branch=master)](https://travis-ci.org/marclitchfield/VisualProgramming)
==================

Visual code editor for programming on touch-based devices. This is very much a work in progress.

####Current status:

Focusing on javascript initially. Can currently build the UI from a synthetic syntax tree, drag existing expressions to make new expressions (copy and insert mode), rename symbols, and create new symbols and functions. 

####Demo:

* http://marclitchfield.github.io/VisualProgramming/editor/editor.html?anagram.json
* http://marclitchfield.github.io/VisualProgramming/editor/editor.html?wordCounts.json
* http://marclitchfield.github.io/VisualProgramming/editor/editor.html?beerSong.json


####Next steps:
* Building expressions from the palette
* Parse javascript into the syntax tree (will need to add support for more expression types)
* Editing modes: move and insert, move and replace, copy and insert, copy and replace
* Delete expressions
* Performance tuning for large javascript files (may swap out Knockout for Angular)
* js-git integration
* Undo/Redo stack
* Switch to text-based code editor (with syntax highlighting)
* Support for more languages
* Code formatting options
* Switch themes at runtime
* Precompile less to css

####Development setup:

Install dependencies
````
npm install
npm install grunt-cli -g
npm install karma-cli -g
````

Start watch process to compile jade (TODO: and less)

````grunt watch````

Start a test session in a new session

````karma start````

Host the project in a web server. A simple way is to run python's built in SimpleHTTPServer in the ```editor``` directory.

````python -m SimpleHTTPServer````
