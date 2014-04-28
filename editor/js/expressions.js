(function expressions() {

  var nextId = 0;
  var tree = (function() {
    var parents = {};

    return {
      add: function(id, parent, edge) {
        parents[id] = { object: parent, edge: edge };
      },
      parentOf: function(id) {
        if (parents[id] === undefined) {
          return undefined;
        }
        return parents[id];
      },
      ancestorsOf: function(id) {
        var ancestors = [];
        var ancestor = { object: { id: id } };
        do {
          ancestor = this.parentOf(ancestor.object.id);
          if (ancestor) { ancestors.push(ancestor); }
        } while(ancestor !== undefined);
        return ancestors;
      }
    };
  })();

  var properties = (function() {
    var props = {};

    return {
      set: function(id, key, value) {
        props[id] = props[id] || {};
        props[id][key] = value;
      },
      get: function(id, key) {
        if (props[id] === undefined) {
          return undefined;
        }
        return props[id][key];
      }
    };
  })();

  $(document).on('loadexpressions', function(event, expressions, element) {
    var viewModel = makeObservable(expressions);
    ko.applyBindings(viewModel, element);
    $.event.trigger('domchanged');
    //dump(expressions);
  });

  $(document).on('itemdropped', function(event, draggable, droppable) {
    if ($(draggable).data('palette-behavior')) {
      $.event.trigger('expandpalette', [$('.palette-menu')[0], draggable, droppable]);
    } else {
      var dropType = $(droppable).data('drop-type');
      var source = dropHandlers[dropType](draggable, droppable);
      if (source && source.editing()) { 
        $.event.trigger('editing', source);
      }
    }
  });

  $(document).on('edit', function(event, element) {
    $.event.trigger('editing', dereference(ko.dataFor(element)));
  });

  var dropHandlers = {
    'callarg': function(draggable, droppable) {
      var source = createSource(draggable);
      var targetArgs = ancestorWithProperty(ko.contextFor(droppable), 'call').call().args;
      var dropPosition = $(droppable).attr('data-drop-position');
      targetArgs.splice(dropPosition, 0, source);
      return dereference(source);
    },

    'defarg': function(draggable, droppable) {
      var source = createSource(draggable);
      if (source.hasOwnProperty('ref')) {
        source = source.ref();
      }
      var targetArgs = ancestorWithProperty(ko.contextFor(droppable), 'args').args;
      var dropPosition = $(droppable).attr('data-drop-position');
      targetArgs.splice(dropPosition, 0, source);
      return dereference(source);
    },

    'expression': function(draggable, droppable) {
      var source = createSource(draggable);
      var targetExpressions = ancestorWithProperty(ko.contextFor(droppable), 'expressions').expressions;
      var dropPosition = $(droppable).attr('data-drop-position');
      targetExpressions.splice(dropPosition, 0, source);
      return dereference(source);
    },

    'function-name': function(draggable, droppable) {
      var source = createSource(draggable);
      var targetFunction = ancestorWithProperty(ko.contextFor(droppable), 'function')['function']();
      targetFunction.ref().name(getText(source));
      return dereference(source);
    },

    'ref-postfix': function(draggable, droppable) {
      var target = ko.contextFor(droppable).$parent;
      // TODO: Handle drop on ref-postfix
    },

    'sub-postfix': function(draggable, droppable) {
      var target = ko.contextFor(droppable).$parent;
      // TODO: Handle drop on sub-postfix
    }
  };

  function insertNewExpression(target, property) {
    var existing = makeObservable(ko.toJS(target[property]));
    target[property](generateExpression(property)[property]);
    if (existing) {
      target[property]()()[property](existing);
    }
  }

  function getText(data) {
    var dereferenced = dereference(data);
    if (dereferenced.hasOwnProperty('name')) {
      return dereferenced.name();
    }
    if (dereferenced.hasOwnProperty('value')) {
      return dereferenced.value();
    }
  }

  function createSource(draggable) {
    var expressionType = $(draggable).data('expression-type');
    if (expressionType) {
      return generateExpression(expressionType);
    }
    var data = ko.dataFor(draggable);
    if (typeof data === 'object' && data.hasOwnProperty('literal')) {
      return makeObservable(ko.toJS(data));
    }
    return makeObservable({ ref: { name: dereference(data).name() } });
  }

  function dereference(data) {
    if (data.hasOwnProperty('ref')) {
      return data.ref();
    }
    if (data.hasOwnProperty('literal')) {
      return data.literal();
    }
    if (data.hasOwnProperty('var')) {
      return data['var']().ref();
    }
    if (data.hasOwnProperty('function')) {
      return data['function']().ref();
    }
    return data;
  }      
  
  function ancestorWithProperty(context, type) {
    if (!context) {
      return undefined;
    }
    if (typeof context.$data === 'object' && context.$data.hasOwnProperty(type)) {
      return context.$data;
    }
    return ancestorWithProperty(context.$parentContext, type);
  }

  function generateExpression(type) {
    var generators = {
      'function': function() {
        return { 'function': { 'ref': { name: '', editing: true }, args: [], expressions: [] } };
      },
      'var': function() {
        return { 'var': [ { 'ref': { name: '', editing: true } } ] };
      },
      'ref': function() {
        return { 'ref': { name: '', editing: true } };
      },
      'literal': function() {
        return { 'literal': { type: 'string', value: '', editing: true }}
      }
    };

    return makeObservable(generators[type]());
  }

  function makeObservable(expression) {
    if (!expression) {
      return;
    }
    var keys = _.keys(expression);
    var expressionType = (keys.length === 1) ? keys[0] : undefined;

    expression.id = nextId++;
    if (expressionType) {
      properties.set(expression.id, 'type', expressionType);
    }
    if (expressionType === 'call') {
      properties.set(expression.id, 'call', true);
    }

    keys.forEach(function(k) {
      if (expression[k] !== undefined) {
        makeObservable(expression[k]);

        if (Array.isArray(expression[k])) {
          expression[k] = ko.observableArray(expression[k]);
        } else {
          expression[k] = ko.observable(expression[k]);
        }

        setChildExpression(expression[k], expression, k);

        if (!expression.hasOwnProperty('editing')) { expression.editing = ko.observable(false); }
      }6
    });

    if (expressionType) {
      expression.template = function() {
        return expressionType + '-template';
      }
    }

    expression.isAssignable = function() {
      var parent = tree.parentOf(expression.id);
      if (parent === undefined) {
        return true;
      }
      var ancestors = tree.ancestorsOf(expression.id);
      if (parent.edge === 'key') {
        var grandParent = ancestors[1].object;
        if (properties.get(grandParent.id, 'type') === 'sub') {
          return true;
        }
      }
      if (properties.get(expression.id, 'call') || properties.get(expression.id, 'lvalue')) {
        return false;
      }
      if (_.any(ancestors, function(a) {
        return properties.get(a.object.id, 'call') || properties.get(a.object.id, 'lvalue');
      })) {
        return false;
      }
      // element must be terminal to be assignable
      for(var i=0; i<ancestors.length; i++) {
        if (ancestors[i].edge === 'object' && properties.get(ancestors[i+1].object.id, 'type') === 'prop') {
          return false;
        }
      }
      return true;
    };

    expression.isInitializable = function() {
      return true;
    };

    function setChildExpression(child, parent, edge) {
      var id = child().id;
      if (id) {
        tree.add(id, parent, edge);

        if (edge === 'lvalue') {
          properties.set(id, 'lvalue', true);
        }

        if (properties.get(id, 'type')) {
          if (properties.get(id, 'call')) {
            properties.set(parent.id, 'call', true);
          }
        } 
      }
    }

    return expression;
  }

  function dump(expression, indent) {
    indent = indent || 0;
    if (!expression.id) {
      return;
    }
    var parent = tree.parentOf(expression.id);
    console.log(Array(indent * 2).join(' ') + expression.id + ': ' + (parent ? '(' + parent.object.id + '/' + parent.edge + ') ' : '') + properties.get(expression.id, 'type') + (properties.get(expression.id, 'call') ? ' (call)' : '') + (properties.get(expression.id, 'lvalue') ? ' (lvalue)' : ''));

    _.keys(expression).forEach(function(k) {
      if (ko.isObservable(expression[k])) {
        dump(expression[k](), indent + 1);
      }
    });
  }

})();