(function() {

  function loadVisualEditor(container) {
    var astFile = document.location.search.replace('?', '') || 'anagram.json';
    $.getJSON('ast/' + astFile).success(function(ast) {
      container.append(buildVisualEditor(ast));
    });
  }

  function buildVisualEditor(ast) {
    var el = $('<div>');
    appendExpression(ast, el);
    bindDraggables(el);
    return el.children();
  }

  function appendExpression(expression, parent, expressionClass) {
    var expressionType = _.keys(expression)[0];
    if (!(expressionType in renderers)) {
      throw 'No renderer for expression type: ' + expressionType;
    }
    var el = $('<div>').addClass(expressionType);
    if (expressionClass) {
      el.addClass(expressionClass);
    }
    renderers[expressionType](expression[expressionType], el);
    if (expression[expressionType].prop !== undefined) {
      var propBlock = $('<div>').addClass('prop');
      propBlock.append($('<div>').addClass('op').text('.'));
      appendExpression(expression[expressionType].prop, propBlock);
      el.append(propBlock);
    }
    parent.append(el);
    return el;
  }

  function appendExpressions(expressions, parent, expressionClass) {
    expressions.forEach(function(expression) {
      appendExpression(expression, parent, expressionClass);
    });
  }

  function appendExpressionBlock(expressions, parent) {
    var expressionBlock = $('<div>').addClass('expressions');
    appendExpressions(expressions, expressionBlock);
    parent.append(expressionBlock);
    return expressionBlock;
  }

  function appendDropTarget(el) {
    el.append($('<div>').addClass('symbol-droppable'));
  }

  function bindDraggables(el) {
    el.find('.draggable').draggable({ 
      helper: 'clone', 
      zIndex: 100,
      // Fix for http://bugs.jqueryui.com/ticket/3740
      start: function (event, ui) {
        $(this).data('startingScrollTop', window.pageYOffset);
      },
      drag: function(event, ui){
        var st = parseInt($(this).data('startingScrollTop'));
        ui.position.top -= st;
      },
    });

    el.find('.symbol-droppable, .symbol-droppable-indicator').droppable({
      greedy: true,
      tolerance: 'touch-closest-to-mouse',
      hoverClass: 'symbol-drop-acceptable',
      activeClass: 'symbol-droppable-active',
      drop: function(event, ui) {
        var clone = ui.draggable.clone();
        $(this).after(clone);
        clone.after($('<div>').addClass('symbol-droppable'));
        bindDraggables(clone.parent());
      }
    });
  }

  var renderers = (function() {
    return {
      'module': function(module, el) {
        el.append($('<div>').addClass('name').text(module.name));
        appendExpressionBlock(module.expressions, el);
      },

      'assignment': function(assignment, el) {
        el.append($('<div>').addClass('op').text(assignment.op));
        var lvalueBlock = $('<div>').addClass('lvalue');
        appendExpression(assignment.lvalue, lvalueBlock, 'lvalue');
        var rvalueBlock = $('<div>').addClass('rvalue');
        appendExpression(assignment.rvalue, rvalueBlock, 'rvalue');
        el.append(lvalueBlock);
        el.append(rvalueBlock);
      },

      'var': function(variable, el) {
        el.append($('<div>').addClass('keyword').text('var'));
        el.append($('<div>').addClass('name').addClass('draggable').text(variable));
      },

      'function': function(func, el) {
        el.append($('<div>').addClass('keyword').text('function'));
        el.append($('<div>').addClass('collapse').addClass('expanded'));
        if (func.name) {
          el.append($('<div>').addClass('name').addClass('draggable').text(func.name));
        }
        var argsBlock = $('<div>').addClass('args');
        func.args.forEach(function(arg) {
          appendDropTarget(argsBlock);
          argsBlock.append($('<div>').addClass('arg').addClass('draggable').text(arg));
        });
        if (func.args.length === 0) {
          argsBlock.html('&nbsp;');
        }
        appendDropTarget(argsBlock);
        el.append(argsBlock);
        appendExpressionBlock(func.expressions, el).addClass('collapsible expanded');
      },

      'ref': function(ref, el) {
        el.append($('<div>').addClass('name').addClass('draggable').text(ref.name));
        if ('subs' in ref) {
          for(var sub in ref.subs) {
            var subBlock = $('<div>').addClass('sub');
            subBlock.append($('<span>').text('['))
            appendExpressions(ref.subs, subBlock);
            subBlock.append($('<span>').text(']'))
          }        
        }
      },

      'return': function(ret, el) {
        el.append($('<div>').addClass('keyword').text('return'));
        appendExpression(ret, el);
      },

      'call': function(call, el) {
        el.append($('<div>').addClass('name').addClass('draggable').text(call.name));
        renderArgsBlock(call.args, el)
      },

      'binary': function(binary, el) {
        appendExpression(binary.left, el, 'left');
        el.append($('<div>').addClass('op').text(binary.op));
        appendExpression(binary.right, el, 'right');
      },

      'parens': function(parens, el) {
        appendExpression(parens, el);
      },

      'literal': function(literal, el) {
        var literalValue = (literal.value === '' ? '&nbsp;' : literal.value).toString().replace(' ', '&nbsp;');
        el.append($('<div>').addClass(literal.type).html(literalValue));
        el.addClass('draggable');
      },

      'hash': function(hash, el) {
        el.append($('<span>').addClass('op').text('{'));
        if (hash.entries.length) {
          var entriesBlock = $('<div>').addClass('entries');
          hash.entries.forEach(function(entry) {
            var entryBlock = $('<div>').addClass('entry');
            entryBlock.append($('<div>').addClass('key').text(entry.key));
            entryBlock.append($('<span>').addClass('op').text(':'));
            appendExpression(entry.value, entryBlock);
            entriesBlock.append(entryBlock);
          });
          el.append(entriesBlock);
        }
        el.append($('<span>').addClass('op').text('}'));
      },

      'new': function(instantiation, el) {
        el.append($('<div>').addClass('keyword').text('new'));
        el.append($('<div>').addClass('name').addClass('draggable').text(instantiation.name));
        renderArgsBlock(instantiation.args, el)
      },

      'ternary': function(ternary, el) {
        appendExpression(ternary['if'], el);
        el.append($('<span>').addClass('then op').text('?'));
        appendExpression(ternary['then'], el);
        el.append($('<span>').addClass('else op').text(':'));
        appendExpression(ternary['else'], el);
      },

      'if': function(ifexpression, el) {
        el.append($('<div>').addClass('keyword').text('if'));
        appendExpression(ifexpression.condition, el);
        var thenBlock = $('<div>').addClass('then');
        appendExpression(ifexpression.then, thenBlock);
        el.append(thenBlock);
        if (ifexpression.else) {
          var elseContainer = $('<div>');
          elseContainer.append($('<div>').addClass('keyword').text('else'));
          var elseBlock = $('<div>').addClass('else');
          appendExpression(ifexpression.else, elseBlock);
          elseContainer.append(elseBlock);
          el.append(elseContainer);
        }
      }
    }

    function renderArgsBlock(args, el) {
      var argsBlock = $('<div>').addClass('args');
      appendExpressions(args, argsBlock, 'arg-expression');
      if (args.length === 0) {
        argsBlock.append('&nbsp;');
      }
      el.append(argsBlock);
    }
  })();

  loadVisualEditor($('.editor'));

  $('.editor').on('click', '.collapse', function() {
    var collapsible = $(this).parent().children('.collapsible:first');
    collapsible.toggleClass('expanded', collapsible.hasClass('collapsed'));
    collapsible.toggleClass('collapsed', !collapsible.hasClass('collapsed'));
    $(this).toggleClass('expanded', $(this).hasClass('collapsed'));
    $(this).toggleClass('collapsed', !$(this).hasClass('collapsed'));
  });

  // duck punch jQueryUI to add a 'touch-closest-to-mouse' tolerance.
  // when multiple droppables are under the draggable, only the one closest to the mouse position will be active.
  var defaultIntersect = $.ui.intersect;
  
  $.ui.intersect = function(draggable, droppable, toleranceMode) {
    if (toleranceMode !== 'touch-closest-to-mouse') {
      return defaultIntersect(draggable, droppable, toleranceMode);
    }
    var touching = defaultIntersect(draggable, droppable, 'touch');
    if (!touching) {
      return false;
    }
    var acceptable = _.filter($.ui.ddmanager.droppables.default, function(d) { 
      return d.offset !== undefined; 
    });
    var closest = _.min(acceptable, function(other) {
      var otherCenterX = other.offset.left + other.proportions().width / 2;
      var otherCenterY = other.offset.top + other.proportions().height / 2;
      var cursorX = event.clientX;
      var cursorY = event.clientY + window.pageYOffset;
      return Math.sqrt(Math.pow(otherCenterX - cursorX, 2) + Math.pow(otherCenterY - cursorY, 2));
    });
    return droppable === closest;
  };
})();