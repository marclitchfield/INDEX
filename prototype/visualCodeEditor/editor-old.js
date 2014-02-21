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

  function appendExpressionBlock(expressions, parent) {
    var expressionBlock = $('<div>').addClass('expressions');
    appendExpressions(expressions, expressionBlock, null, { dropOrientation: 'horizontal', dropType: 'expression' });
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
    var dropInfo = dropInfo || {};
    var expressionType = _.keys(expression)[0];
    if (!(expressionType in renderers)) {
      throw 'No renderer for expression type: ' + expressionType;
    }
    var el = $('<div>').addClass(expressionType).addClass('expression');
    if (expressionClass) {
      el.addClass(expressionClass);
    }
    var expressionBody = expression[expressionType];
    renderers[expressionType](expressionBody, el);
    appendCall(el, expressionBody, dropInfo);
    appendSub(el, expressionBody, dropInfo);
    appendProp(el, expressionBody, dropInfo);
    parent.append(el);
    return el;
  }

  function appendCall(el, expression, dropInfo) {
    var callBody = expression['call'];
    if (!callBody) {
      return;
    }
    var callBlock = $('<div>').addClass('call');
    renderArgsBlock(callBody.args, callBlock);
    appendDropTarget(callBlock, { dropOrientation: 'vertical', dropType: 'callable' })
    appendCall(el, callBody, dropInfo);
    appendSub(el, callBody, dropInfo);
    appendProp(el, callBody, dropInfo);
    el.append(callBlock);
  }

  function renderArgsBlock(args, el) {
    var argsBlock = $('<div>').addClass('args');
    var expressionsBlock = $('<div>').addClass('expressions');
    appendExpressions(args, expressionsBlock, '', { dropOrientation: 'vertical', dropType: 'callarg' });
    argsBlock.append(expressionsBlock);
    appendDropTarget(argsBlock, { dropOrientation: 'vertical', replace: true, dropType: 'callable' })
    el.append(argsBlock);
  }  

  function appendSub(el, expression, dropInfo) {
    if (!expression.sub) {
      return;
    }
    var subBlock = $('<div>').addClass('sub');
    appendExpression(expression.sub, subBlock, '', dropInfo);
    appendDropTarget(subBlock, { dropOrientation: 'vertical', dropType: 'callable' })
    el.append(subBlock);
  }

  function appendProp(el, expression, dropInfo) {
    if (!expression.prop) {
      return;
    }
    var propBlock = $('<div>').addClass('prop');
    propBlock.append($('<div>').addClass('op').text('.'));
    appendExpression(expression.prop, propBlock, '', dropInfo);
    el.append(propBlock);
  }

  function appendDropTarget(el, dropInfo) {
    var dropInfo = _.clone(dropInfo) || {};
    dropInfo.dropOrientation = dropInfo.dropOrientation || 'vertical';
    dropInfo.method = dropInfo.method || 'append';
    var dropTarget = $('<div>').addClass('droppable');
    dropTarget.addClass(dropInfo.dropOrientation);
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
        var newElement = createDroppedElement(ui.draggable, $(event.target));
        dropElement(newElement, $(event.target), {
          dropOrientation: $(event.target).hasClass('horizontal') ? 'horizontal' : 'vertical',
          reparent: ui.draggable.data('drop-reparent') !== undefined,
          replace: $(event.target).hasClass('replace'),
        });
      }
    });
  }

  function createDroppedElement(draggable, droppable) {
    var expressionType = draggable.data('expression-type');
    if (expressionType) {
      var expression = {};
      expression[expressionType] = {};
      return appendExpression(expression, $('<div>'), '', { droppable: droppable, replace: true });
    } else {
      var newElement = draggable.clone();
      newElement.data('drop-target-types', draggable.data('drop-target-types'));
      return newElement;
    }
  }

  function dropElement(el, dropTarget, dropInfo) {
    dropTarget.after(el);
    if (dropInfo.reparent) {
      dropTarget.prependTo(el);
    }
    var dropInfo = _.clone(dropInfo);
    dropInfo.method = 'after';
    if (dropInfo.replace) {
      // Remove the drop target after this run of the event loop so another drop target does not become
      // available during this drop operation. If the drop target is removed in this run of the event loop, 
      // another 'drop' event can fire and the draggable can be dropped onto multiple targets.
      setTimeout(function() { dropTarget.remove(); }, 0);
    } else if (!dropInfo.reparent) {
      dropInfo.dropType = dropTarget.data('drop-type');
      appendDropTarget(el, dropInfo);
    }
    if (dropInfo.dropOrientation === 'horizontal') {
      el.addClass('expression');
    }
    resetDropTargets(el);
    bindDraggables(el.parent());
  }

  function resetDropTargets(el) {
    var dropTargets = el.find('[data-drop-type]');
    if (el.hasClass('symbol') && el.closest('.function > .args').length === 0) {
      if (dropTargets.length === 0) {
        appendDropTarget(el, { dropOrientation: 'vertical', replace: true, dropType: 'callable' });
      }
    } else {
      dropTargets.remove();
    }
  }

  var renderers = (function() {
    // Drop target types
    // -----------------
    // defarg:         an argument to a function definition (formal parameter)
    // callarg:        an argument to a function call (actual parameter)
    // func:           a function name
    // expression:     an expression within a function or module
    // callable:       an callable expression
    // symbol-missing: a symbol outline
    var symbolDropTargetTypes = ['expression', 'func', 'symbol-missing', 'defarg', 'callarg'];

    return {
      'module': function(module, el) {
        el.append($('<div>').addClass('name').text(module.name));
        appendExpressionBlock(module.expressions, el);
      },

      'assignment': function(assignment, el) {
        var lvalueBlock = $('<div>').addClass('lvalue');
        appendExpression(assignment.lvalue, lvalueBlock, 'lvalue');
        el.append(lvalueBlock);
        el.append($('<div>').addClass('op').text(assignment.op));
        appendExpression(assignment.rvalue, el, 'rvalue');
      },

      'var': function(variable, el) {
        el.append($('<div>').addClass('keyword').text('var'));
        if (variable.name) {
          var symbolBlock = $('<div>').addClass('symbol draggable').text(variable.name);
          symbolBlock.data('drop-target-types', symbolDropTargetTypes);
          el.append(symbolBlock);
        } else {
          appendDropTarget(el, { replace: true, dropOrientation: 'outline', dropType: 'symbol-missing' });
        }
      },

      'function': function(func, el) {
        el.append($('<div>').addClass('keyword').text('function'));
        el.append($('<div>').addClass('collapse expanded'));
        if (func.name) {
          var funcNameBlock = $('<div>').addClass('symbol draggable').text(func.name);
          funcNameBlock.data('drop-target-types', symbolDropTargetTypes);
          el.append(funcNameBlock);
        } else {
          appendDropTarget(el, { dropOrientation: 'vertical', replace: true, dropType: 'func' });
        }
        renderFunctionArgs(func.args, el);
        func.expressions = func.expressions || [];
        var expressionBlock = appendExpressionBlock(func.expressions, el);
        expressionBlock.addClass('collapsible expanded');
      },

      'ref': function(ref, el) {
        var symbolBlock = $('<div>').addClass('symbol draggable').text(ref.name);
        symbolBlock.data('drop-target-types', symbolDropTargetTypes);
        appendDropTarget(symbolBlock, { dropOrientation: 'vertical', dropType: 'callable' });
        el.append(symbolBlock);
      },

      'return': function(ret, el) {
        el.append($('<div>').addClass('keyword').text('return'));
        appendExpression(ret, el, '', { dropType: 'expression' });
      },

      'new': function(instantiation, el) {
        el.append($('<div>').addClass('keyword').text('new'));
        if (instantiation.name) {
          var symbolBlock = $('<div>').addClass('symbol draggable').text(instantiation.name);
          symbolBlock.data('drop-target-types', symbolDropTargetTypes);
          appendDropTarget(symbolBlock, { dropOrientation: 'vertical', dropType: 'callable' });
          el.append(symbolBlock);
        }
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

    function renderFunctionArgs(args, el) {
      var argsBlock = $('<div>').addClass('args');
      var args = args || [];
      args.forEach(function(arg) {
        appendDropTarget(argsBlock, { dropType: 'defarg' });
        argsBlock.append($('<div>').addClass('symbol draggable').text(arg).data('drop-target-types', symbolDropTargetTypes));
      });
      appendDropTarget(argsBlock, { dropType: 'defarg' });
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