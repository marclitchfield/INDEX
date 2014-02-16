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
    bindDraggables($('.palette'));
    return el.children();
  }

  function appendExpression(expression, parent, expressionClass, dropInfo) {
    var expressionType = _.keys(expression)[0];
    if (!(expressionType in renderers)) {
      throw 'No renderer for expression type: ' + expressionType;
    }
    var el = $('<div>').addClass(expressionType).addClass('expression');
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

  function appendExpressions(expressions, parent, expressionClass, dropInfo) {
    expressions.forEach(function(expression) {
      if (dropInfo) { appendDropTarget(parent, dropInfo); }
      appendExpression(expression, parent, expressionClass, dropInfo);
    });
    if (dropInfo) { appendDropTarget(parent, dropInfo); }
  }

  function appendExpressionBlock(expressions, parent, dropInfo) {
    var expressionBlock = $('<div>').addClass('expressions');
    appendExpressions(expressions, expressionBlock, null, dropInfo);
    parent.append(expressionBlock);
    return expressionBlock;
  }

  function appendDropTarget(el, dropInfo) {
    var dropTarget = $('<div>').addClass('symbol-droppable');
    dropInfo = dropInfo || {};
    dropInfo.dropOrientation = dropInfo.dropOrientation || 'vertical';
    dropInfo.insert = dropInfo.insert || 'append';
    dropTarget.addClass(dropInfo.dropOrientation); 
    if (dropInfo.replace) { 
      dropTarget.addClass('replace'); 
    }
    el[dropInfo.insert](dropTarget);
    return dropTarget;
  }

  function createDropElement(draggable) {
    var expressionType = draggable.data('expression-type');
    return expressionType ? appendExpression(draggable.data('expression'), $('<div>')) : draggable.clone();
  }

  function dropElement(el, dropTarget, dropInfo) {
    dropTarget.after(el);
    dropInfo.insert = 'after';
    if (dropInfo.replace) {
      // Remove the drop target after this run of the event loop so another drop target does not become
      // available during this drop operation. If the drop target is removed in this run of the event loop, 
      // another 'drop' event can fire and the draggable can be dropped onto multiple targets.
      setTimeout(function() {
        dropTarget.remove();
      }, 0);
    } else {
      appendDropTarget(el, dropInfo);
    }
    if (dropInfo.dropOrientation === 'horizontal') {
      el.addClass('expression');
    }
    bindDraggables(el.parent());
  }

  function bindDraggables(el) {
    el.find('.draggable').draggable({ 
      helper: 'clone', 
      zIndex: 100,
      // Fix for http://bugs.jqueryui.com/ticket/3740
      start: function (event, ui) {
        if ($(this).closest('.palette').length === 0) {
          $(this).data('startingScrollTop', window.pageYOffset);
        }
      },
      drag: function(event, ui){
        var st = parseInt($(this).data('startingScrollTop'));
        if (st) {
          ui.position.top -= st;
        }
        // I have performance concerns about this
        if ($('.symbol-drop-acceptable').length > 0) {
          $('.ui-draggable-dragging').addClass('symbol-draggable-overdrop');
        } else {
          $('.ui-draggable-dragging').removeClass('symbol-draggable-overdrop');
        }
      },
    });

    el.find('.symbol-droppable, .symbol-droppable-indicator').droppable({
      greedy: true,
      tolerance: 'touch-closest-to-mouse',
      hoverClass: 'symbol-drop-acceptable',
      activeClass: 'symbol-droppable-active',
      drop: function(event, ui) {
        var newElement = createDropElement(ui.draggable);
        dropElement(newElement, $(this), { 
          dropOrientation: $(event.target).hasClass('horizontal') ? 'horizontal' : 'vertical',
          replace: $(event.target).hasClass('replace')
        });
      }
    });
  }

  var renderers = (function() {
    return {
      'module': function(module, el) {
        el.append($('<div>').addClass('name').text(module.name));
        appendExpressionBlock(module.expressions, el, { dropOrientation: 'horizontal' });
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
        } else {
          appendDropTarget(el, { dropOrientation: 'vertical', replace: true });
        }
        var argsBlock = $('<div>').addClass('args');
        func.args.forEach(function(arg) {
          appendDropTarget(argsBlock);
          argsBlock.append($('<div>').addClass('name').addClass('draggable').text(arg));
        });
        appendDropTarget(argsBlock);
        el.append(argsBlock);
        appendExpressionBlock(func.expressions, el, { dropOrientation: 'horizontal' }).addClass('collapsible expanded');
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
      var expressionsBlock = $('<div>').addClass('expressions');
      appendExpressions(args, expressionsBlock, 'arg-expression', { dropOrientation: 'vertical' });
      argsBlock.append(expressionsBlock);
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
})();