Visual Programming
==================

Visual code editor for programming on touch-based devices. This is very much a work in progress.

###Current status:
* Focusing on javascript initially. Can currently build the UI from a synthetic syntax tree, drag existing expressions to make new expressions (copy and insert mode), rename symbols, and create new symbols and functions. 

###Next steps:
* Building expressions from the palette
* Parse javascript into the syntax tree (will need to add more expression types)
* Editing modes: move and insert, move and replace, copy and insert, copy and replace, delete
* Performance tuning for large javascript files
* js-git integration

###Development setup:

```npm install```

```grunt watch```

```karma start```

In editor directory:

```python -m SimpleHTTPServer```
