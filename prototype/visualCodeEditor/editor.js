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

  function appendExpressionBlock(expressions, parent, dropInfo) {
    var expressionBlock = $('<div>').addClass('expressions');
    appendExpressions(expressions, expressionBlock, null, dropInfo);
    parent.append(expressionBlock);
    return expressionBlock;
  }

  function appendExpressions(expressions, parent, expressionClass, dropInfo) {
    var dropInfo = _.clone(dropInfo) || {};
    expressions.forEach(function(expression) {
      if (dropInfo) { appendDropTarget(parent, dropInfo); }
      appendExpression(expression, parent, expressionClass, dropInfo);
    });
    if (dropInfo) { appendDropTarget(parent, dropInfo); }
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
      appendExpression(expression[expressionType].prop, propBlock, '', dropInfo);
      el.append(propBlock);
    }
    parent.append(el);
    return el;
  }

  function appendDropTarget(el, dropInfo) {
    var dropInfo = _.clone(dropInfo) || {};
    dropInfo.dropOrientation = dropInfo.dropOrientation || 'vertical';
    dropInfo.method = dropInfo.method || 'append';
    var dropTarget = $('<div>').addClass('droppable');
    dropTarget.addClass(dropInfo.dropOrientation);
    console.log('appendDropTarget', dropInfo.dropType);
    dropTarget.attr('data-drop-type', dropInfo.dropType);
    if (dropInfo.replace) { 
      dropTarget.addClass('replace');
    }
    el[dropInfo.method](dropTarget);
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
        var newElement = createDroppedElement(ui.draggable);
        dropElement(newElement, $(event.target), {
          dropOrientation: $(event.target).hasClass('horizontal') ? 'horizontal' : 'vertical',
          replace: $(event.target).hasClass('replace')
        });
      }
    });
  }

  function createDroppedElement(draggable) {
    var expressionType = draggable.data('expression-type');
    if (expressionType) {
      var expression = {};
      expression[expressionType] = {};
      return appendExpression(expression, $('<div>'));
    } else {
      var newElement = draggable.clone();
      newElement.data('drop-target-types', draggable.data('drop-target-types'));
      return newElement;
    }
  }

  function dropElement(el, dropTarget, dropInfo) {
    var dropInfo = _.clone(dropInfo);
    dropTarget.after(el);
    dropInfo.method = 'after';
    if (dropInfo.replace) {
      // Remove the drop target after this run of the event loop so another drop target does not become
      // available during this drop operation. If the drop target is removed in this run of the event loop, 
      // another 'drop' event can fire and the draggable can be dropped onto multiple targets.
      setTimeout(function() { dropTarget.remove(); }, 0);
    } else {
      dropInfo.dropType = dropTarget.data('drop-type');
      appendDropTarget(el, dropInfo);
    }
    if (dropInfo.dropOrientation === 'horizontal') {
      el.addClass('expression');
    }
    bindDraggables(el.parent());
  }

  var renderers = (function() {
    // Drop target types
    // -----------------
    // defarg:         an argument to a function definition (formal parameter)
    // callarg:        an argument to a function call (actual parameter)
    // func:           a function name
    // expression:     an expression within a function or module
    // callable:       an existing callable symbol
    // symbol-missing: a symbol outline
    var symbolDropTargetTypes = ['expression', 'func', 'symbol-missing', 'defarg', 'callarg'];

    return {
      'module': function(module, el) {
        el.append($('<div>').addClass('name').text(module.name));
        appendExpressionBlock(module.expressions, el, { dropOrientation: 'horizontal', dropType: 'expression' });
      },

      'assignment': function(assignment, el) {
        var lvalueBlock = $('<div>').addClass('lvalue');
        appendExpression(assignment.lvalue, lvalueBlock, 'lvalue', { dropType: 'expression' });
        el.append(lvalueBlock);
        el.append($('<div>').addClass('op').text(assignment.op));
        appendExpression(assignment.rvalue, el, 'rvalue', { dropType: 'expression' });
      },

      'var': function(variable, el) {
        el.append($('<div>').addClass('keyword').text('var'));
        if (variable.name) {
          var symbolBlock = $('<div>').addClass('symbol draggable').text(variable.name);
          symbolBlock.attr('data-drop-type', 'callable').data('drop-target-types', symbolDropTargetTypes);
          el.append(symbolBlock);
        } else {
          appendDropTarget(el, { replace: true, dropOrientation: 'outline', dropType: 'symbol-missing' });
        }
      },

      'function': function(func, el) {
        el.append($('<div>').addClass('keyword').text('function'));
        el.append($('<div>').addClass('collapse expanded'));
        if (func.name) {
          var funcNameBlock = $('<div>').addClass('name draggable').text(func.name);
          funcNameBlock.data('drop-target-types', symbolDropTargetTypes);
          el.append(funcNameBlock);
        } else {
          appendDropTarget(el, { dropOrientation: 'vertical', replace: true, dropType: 'func' });
        }
        var argsBlock = $('<div>').addClass('args');
        func.args = func.args || [];
        func.expressions = func.expressions || [];
        func.args.forEach(function(arg) {
          appendDropTarget(argsBlock, { dropType: 'defarg' });
          argsBlock.append($('<div>').addClass('name draggable').text(arg).data('drop-target-types', symbolDropTargetTypes));
        });
        appendDropTarget(argsBlock, { dropType: 'defarg' });
        el.append(argsBlock);
        var expressionBlock = appendExpressionBlock(func.expressions, el, { dropOrientation: 'horizontal', dropType: 'expression' });
        expressionBlock.addClass('collapsible expanded');
      },

      'ref': function(ref, el) {
        var refBlock = $('<div>').addClass('symbol draggable').text(ref.name);
        refBlock.attr('data-drop-type', 'callable').data('drop-target-types', symbolDropTargetTypes);
        el.append(refBlock);
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
        appendExpression(ret, el, '', { dropType: 'expression' });
      },

      'call': function(call, el, child) {
        var callBlock = $('<div>').addClass('symbol draggable').text(call.name);
        callBlock.attr('data-drop-type', 'callable').data('drop-target-types', symbolDropTargetTypes);
        el.append(callBlock);
        call.args = call.args || [];
        renderArgsBlock(call.args, el)
      },

      'new': function(instantiation, el) {
        el.append($('<div>').addClass('keyword').text('new'));
        var newBlock = $('<div>').addClass('symbol draggable').text(instantiation.name);
        newBlock.attr('data-drop-type', 'callable').data('drop-target-types', symbolDropTargetTypes);
        el.append(newBlock);
        renderArgsBlock(instantiation.args, el)
      },

      'literal': function(literal, el) {
        var literalValue = (literal.value === '' ? '&nbsp;' : literal.value).toString().replace(' ', '&nbsp;');
        el.data('drop-target-types', ['expression', 'callarg']);
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

      'parens': function(parens, el) {
        appendExpression(parens, el);
      },

      'binary': function(binary, el) {
        appendExpression(binary.left, el, 'left', { dropType: 'expression' });
        el.append($('<div>').addClass('op').text(binary.op));
        appendExpression(binary.right, el, 'right', { dropType: 'expression' });
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
      appendExpressions(args, expressionsBlock, '', { dropOrientation: 'vertical', dropType: 'callarg' });
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