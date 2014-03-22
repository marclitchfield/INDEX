(function expressions() {

  $(document).on('loadexpressions', function(event, expressions, element) {
    var viewModel = makeObservable(expressions);
    ko.applyBindings(viewModel, element);
    $.event.trigger('domchanged');
  });

  $(document).on('itemdropped', function(event, draggable, droppable) {
    var dropType = $(droppable).data('drop-type');
    var source = dropHandlers[dropType](draggable, droppable);
    if (source && source.editing()) { 
      $.event.trigger('editing', source);
    }
  });

  $(document).on('edit', function(event, element) {
    $.event.trigger('editing', dereference(ko.dataFor(element)));
  });

  var dropHandlers = {
    'callarg': function(draggable, droppable) {
      var source = createSource(draggable);
      var targetArgs = ancestorWithProperty(ko.contextFor(droppable), 'args').args;
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

    'callable': function(draggable, droppable) {
      var target = ko.contextFor(droppable).$parent;
      insertNewExpression(target, 'call');
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
        return { 'var': { 'ref': { name: '', editing: true } } };
      },
      'ref': function() {
        return { 'ref': { name: '', editing: true } };
      },
      'call': function() {
        return { 'call': { args: [] } };
      },
      'literal': function() {
        return { 'literal': { type: 'string', value: '', editing: true }}
      }
    };

    return makeObservable(generators[type]());
  }

  function makeObservable(expression) {
    var keys = _.keys(expression);
    if (keys.length === 1) {
      expression.template = keys[0] + '-template';
    }
    keys.forEach(function(k) {
      makeObservable(expression[k]);
      if (Array.isArray(expression[k])) {
        expression[k] = ko.observableArray(expression[k]);
      } else {
        expression[k] = ko.observable(expression[k]);
      }
      // TODO: only apply these properties to elements that need them
      if (!expression.hasOwnProperty('prop')) { expression.prop = ko.observable(); }
      if (!expression.hasOwnProperty('call')) { expression.call = ko.observable(); }
      if (!expression.hasOwnProperty('sub')) { expression.sub = ko.observable(); }
      if (!expression.hasOwnProperty('editing')) { expression.editing = ko.observable(false); }
    });
    return expression;
  }

})();