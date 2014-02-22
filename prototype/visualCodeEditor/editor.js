(function() {

  var astFile = document.location.search.replace('?', '') || 'anagram.json';

  $.getJSON('ast/' + astFile).success(function(ast) {
    applyTemplateFunctions(ast);
    var viewModel = ko.mapping.fromJS(ast);
    ko.applyBindings(viewModel);
    bindDraggables();
  });

  function applyTemplateFunctions(expression) {
    var keys = _.keys(expression);
    if (keys.length === 1) {
      expression.template = keys[0] + '-template';
    }
    keys.forEach(function(k) {
      applyTemplateFunctions(expression[k]);
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
        var targetArgs = ancestor(ko.contextFor(droppable), 'args').args;
        var dropPosition = $(droppable).attr('data-drop-position');
        targetArgs.splice(dropPosition, 0, source);
      },

      'defarg': function(draggable, droppable) {
        var sourceArg = getName(ko.dataFor(draggable));
        var targetArgs = ancestor(ko.contextFor(droppable), 'args').args;
        var dropPosition = $(droppable).attr('data-drop-position');
        targetArgs.splice(dropPosition, 0, sourceArg);
      },    

      'expression': function(draggable, droppable) {
        var source = createSource(draggable);
        var targetExpressions = ancestor(ko.contextFor(droppable), 'expressions').expressions;
        var dropPosition = $(droppable).attr('data-drop-position');
        targetExpressions.splice(dropPosition, 0, source);
      },

      'function-name': function(draggable, droppable) {
        var targetFunction = ancestor(ko.contextFor(droppable), 'name');
        targetFunction.name(getName(ko.dataFor(draggable))());
      }
    };

    function getName(data) {
      if (typeof data === 'object') {
        return data.name;
      }
      return ko.observable(data);
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
      return { ref: { name: getName(data) }, template: 'ref-template' };
    }    
  })();

  function ancestor(context, type) {
    if (typeof context.$data === 'object' && type in context.$data) {
      return context.$data;
    }
    return ancestor(context.$parentContext, type);
  }

  function generateExpression(type) {
    var generators = {
      'function': function() {
        return { 'function': { name: '', args: [], expressions: [] } };
      }
    };

    var expression = generators[type]();
    applyTemplateFunctions(expression)
    return ko.mapping.fromJS(expression);
  }

})();
