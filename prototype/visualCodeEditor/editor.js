(function() {

  var astFile = document.location.search.replace('?', '') || 'anagram.json';

  $.getJSON('ast/' + astFile).success(function(ast) {
    var viewModel = makeObservable(ast);
    ko.applyBindings(viewModel);
    bindDraggables();
  });

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
      if (!('prop' in expression)) { expression.prop = ko.observable(); }
      if (!('call' in expression)) { expression.call = ko.observable(); }
      if (!('sub' in expression)) { expression.sub = ko.observable(); }
    });
    return expression;
  }

  function bindDraggables() {
    $('.draggable').draggable({
      helper: 'clone',
      zIndex: 100,
      // Fix for http://bugs.jqueryui.com/ticket/3740
      start: function (event, ui) {
        if ($(this).closest('.palette').length === 0) {
          $(this).data('startingScrollTop', window.pageYOffset);
        }
        bindDroppables($(event.target).data('drop-target-types'));
      },
      drag: function(event, ui){
        var st = parseInt($(this).data('startingScrollTop'));
        if (st) {
          ui.position.top -= st;
        }
        // I have performance concerns about this
        if ($('.drop-acceptable').length > 0) {
          $('.ui-draggable-dragging').addClass('draggable-overdrop');
        } else {
          $('.ui-draggable-dragging').removeClass('draggable-overdrop');
        }
      },
    });
  }

  function bindDroppables(dropTargetTypes) {
    $('[data-drop-type]').droppable({
      greedy: true,
      tolerance: 'touch-closest-to-mouse',
      hoverClass: 'drop-acceptable',
      activeClass: 'droppable-active',
      accept: function(draggable) {
        return _(dropTargetTypes).contains($(this).data('drop-type'));
      },
      drop: function(event, ui) {
        setTimeout(function() {
          var dropType = $(event.target).data('drop-type');
          dropHandlers[dropType](ui.draggable[0], event.target);
          bindDraggables();
        }, 0);
      }
    });
  }


  var dropHandlers = (function() {
    return {
      'callarg': function(draggable, droppable) {
        var source = createSource(draggable);
        var targetArgs = ancestorWithProperty(ko.contextFor(droppable), 'args').args;
        var dropPosition = $(droppable).attr('data-drop-position');
        targetArgs.splice(dropPosition, 0, source);
      },

      'defarg': function(draggable, droppable) {
        var sourceArg = getName(ko.dataFor(draggable));
        var targetArgs = ancestorWithProperty(ko.contextFor(droppable), 'args').args;
        var dropPosition = $(droppable).attr('data-drop-position');
        targetArgs.splice(dropPosition, 0, sourceArg);
      },    

      'expression': function(draggable, droppable) {
        var source = createSource(draggable);
        var targetExpressions = ancestorWithProperty(ko.contextFor(droppable), 'expressions').expressions;
        var dropPosition = $(droppable).attr('data-drop-position');
        targetExpressions.splice(dropPosition, 0, source);
      },

      'function-name': function(draggable, droppable) {
        var targetFunction = ancestorWithProperty(ko.contextFor(droppable), 'name');
        targetFunction.name(getName(ko.dataFor(draggable)));
      },

      'symbol-missing': function(draggable, droppable) {
        var targetVar = ancestorWithProperty(ko.contextFor(droppable), 'name');
        targetVar.name(getName(ko.dataFor(draggable)));
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

    function getName(data) {
      if (typeof data === 'object') {
        return data.name();
      }
      return data;
    }

    function createSource(draggable) {
      var expressionType = $(draggable).data('expression-type');
      if (expressionType) {
        return generateExpression(expressionType);
      }

      var data = ko.dataFor(draggable);
      if (typeof data === 'object' && 'literal' in data) {
        return data;
      }
      return makeObservable({ ref: { name: getName(data) } });
    }    
  })();

  function ancestorWithProperty(context, type) {
    if (!context) {
      return undefined;
    }
    if (typeof context.$data === 'object' && type in context.$data) {
      return context.$data;
    }
    return ancestorWithProperty(context.$parentContext, type);
  }

  function generateExpression(type) {
    var generators = {
      'function': function() {
        return { 'function': { name: '', args: [], expressions: [] } };
      },

      'var': function() {
        return { 'var': { name: '' }};
      },

      'ref': function() {
        return { 'ref': { name: '' }};
      },

      'call': function() {
        return { 'call': { args: [] } };
      }
    };

    return makeObservable(generators[type]());
  }

  function refreshExpressionBindings(expressionNode) {
    if (expressionNode) {
      var expressionData = ko.dataFor(expressionNode);
      ko.cleanNode(expressionNode);
      ko.applyBindings(expressionData, expressionNode);
    }    
  }

  $('.editor').on('click', '.collapse', function() {
    var collapsible = $(this).parent().children('.collapsible:first');
    collapsible.toggleClass('expanded', collapsible.hasClass('collapsed'));
    collapsible.toggleClass('collapsed', !collapsible.hasClass('collapsed'));
    $(this).toggleClass('expanded', $(this).hasClass('collapsed'));
    $(this).toggleClass('collapsed', !$(this).hasClass('collapsed'));
  });

})();
