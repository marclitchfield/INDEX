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
    return el.children();
  }

  function appendExpression(expression, parent) {
    var expressionType = _.keys(expression)[0];
    if (!(expressionType in renderers)) {
      throw 'No renderer for expression type: ' + expressionType;
    }
    var el = $('<div>').addClass(expressionType);
    renderers[expressionType](expression[expressionType], el);
    if (expression[expressionType].prop !== undefined) {
      el.append($('<span>').addClass('prop op').text('.'));
      appendExpression(expression[expressionType].prop, el);
    }
    parent.append(el);
  }

  function appendExpressions(expressions, parent) {
    expressions.forEach(function(expression) {
      appendExpression(expression, parent);
    });
  }

  function appendExpressionBlock(expressions, parent) {
    var expressionBlock = $('<div>').addClass('expressions');
    appendExpressions(expressions, expressionBlock);
    parent.append(expressionBlock);
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
        el.append($('<span>').text('var'));
        el.append($('<div>').addClass('keyword').text(variable));
      },

      'function': function(func, el) {
        el.append($('<span>').text('function'));
        el.append($('<div>').addClass('collapse'));
        if (func.name) {
          el.append($('<div>').addClass('keyword').text(func.name));
        }
        var argsBlock = $('<div>').addClass('args');
        argsBlock.append($('<span>').text('('));
        func.args.forEach(function(arg) {
          argsBlock.append($('<div>').addClass('arg').text(arg));
        });
        if (func.args.length === 0) {
          argsBlock.html('&nbsp;');
        }
        argsBlock.append($('<span>').text(')'));
        el.append(argsBlock);
        appendExpressionBlock(func.expressions, el);
      },

      'ref': function(ref, el) {
        el.append($('<div>').addClass('keyword').text(ref.name));
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
        el.append($('<span>').text('return'));
        appendExpression(ret, el);
      },

      'call': function(call, el) {
        el.append($('<div>').addClass('keyword').text(call.name));
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
      },

      'hash': function(hash, el) {
        el.append($('<span>').addClass('op').text('{'));
        if (hash.entries.length) {
          var entriesBlock = $('<div>').addClass('entries');
          hash.entries.forEach(function(entry) {
            var entryBlock = $('<div>').addClass('entry');
            entryBlock.append($('<div>').addClass('key').text(entry.key));
            entryBlock.append($('<span>').text(':'));
            appendExpression(entry.value, entryBlock);
            entriesBlock.append(entryBlock);
          });
          el.append(entriesBlock);
        }
        el.append($('<span>').addClass('op').text('}'));
      },

      'new': function(instantiation, el) {
        el.append($('<span>').text('new'));
        el.append($('<div>').addClass('keyword').text(instantiation.name));
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
        el.append($('<span>').text('if'));
        appendExpression(ifexpression.condition, el);
        var thenBlock = $('<div>').addClass('then');
        appendExpression(ifexpression.then, thenBlock);
        el.append(thenBlock);
        if (ifexpression.else) {
          var elseContainer = $('<div>');
          elseContainer.append($('<span>').text('else'));
          var elseBlock = $('<div>').addClass('else');
          appendExpression(ifexpression.else, elseBlock);
          elseContainer.append(elseBlock);
          el.append(elseContainer);
        }
      }
    }

    function renderArgsBlock(args, el) {
      var argsBlock = $('<div>').addClass('args');
      argsBlock.append($('<span>').text('('));
      appendExpressions(args, argsBlock);
      if (args.length === 0) {
        argsBlock.append('&nbsp;');
      }
      argsBlock.append($('<span>').text(')'));
      el.append(argsBlock);
    }
  })();

  loadVisualEditor($('.editor'));

  $('.editor').on('click', '.collapse', function() {
    var expressions = $(this).closest('.function').children('.expressions:first');
    if (expressions.hasClass('collapsed')) {
      expressions.removeClass('collapsed');
      expressions.addClass('expanded');
      expressions.show(200, 'swing');
    } else {
      expressions.removeClass('expanded');
      expressions.addClass('collapsed');
      expressions.hide(200, 'swing');
    }
  });

})();