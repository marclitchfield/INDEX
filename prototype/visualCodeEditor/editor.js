(function() {

  function loadVisualEditor(container) {
    $.get('ast/beerSong.json').success(function(ast) {
      container.append(buildVisualEditor(JSON.parse(ast)));
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
    var el = $('<div>');
    el.addClass(expressionType);
    renderers[expressionType](expression[expressionType], el);
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

  var renderers = {
    'module': function(module, el) {
      el.append($('<div>').addClass('name').text(module.name));
      appendExpressionBlock(module.expressions, el);
    },

    'assignment': function(assignment, el) {
      el.append($('<div>').addClass('op').text(assignment.op));
      appendExpression(assignment.lvalue, el);
      appendExpression(assignment.rvalue, el);
    },

    'var': function(variable, el) {
      el.append($('<span>').text('var'));
      el.append($('<div>').addClass('ref').text(variable));
    },

    'function': function(func, el) {
      el.append($('<span>').text('function'));
      el.append($('<div>').addClass('name').text(func.name));
      var args = $('<div>').addClass('args');
      func.args.forEach(function(arg) {
        args.append($('<div>').addClass('arg').text(arg));
      });
      el.append(args);
      appendExpressionBlock(func.expressions, el);
    },

    'ref': function(ref, el) {
      el.append($('<div>').addClass('name').text(ref.name));
      if ('subs' in ref) {
        for(var sub in ref.subs) {
          var subBlock = $('<div>').addClass('sub');
          subBlock.append($('<span>').text('['))
          appendExpressions(ref.subs, subBlock);
          subBlock.append($('<span>').text(']'))
        }        
      }
      if ('prop' in ref) {
        el.append($('<span>').addClass('prop').text('.'));
        appendExpression(ref.prop, el);
      }
    },

    'return': function(ret, el) {
      appendExpression(ret, el);
    },

    'call': function(call, el) {
      el.append($('<div>').addClass('name').text(call.name));
      var argsBlock = $('<div>').addClass('args');
      appendExpressions(call.args, argsBlock);
      el.append(argsBlock);
    },

    'binary': function(binary, el) {
      el.append($('<div>').addClass('op').text(binary.op));
      appendExpression(binary.left, el);
      appendExpression(binary.right, el);
    },

    'parens': function(parens, el) {
      appendExpression(parens, el);
    },

    'literal': function(literal, el) {
      el.append($('<div>').addClass(literal.type).text(literal.value));
    },

    'hash': function(hash, el) {
      var entriesBlock = $('<div>').addClass('entries');
      hash.entries.forEach(function(entry) {
        var entryBlock = $('<div>').addClass('entry');
        entryBlock.append($('<div>').addClass('key').text(entry.key));
        entryBlock.append($('<span>').text(':'));
        appendExpression(entry.value, entryBlock);
        entriesBlock.append(entryBlock);
      });
      el.append(entriesBlock);
    },

    'new': function(instantiation, el) {
      el.append($('<div>').addClass('name').text(instantiation.name));
      var argsBlock = $('<div>').addClass('args');
      appendExpressions(instantiation.args, argsBlock);
      el.append(argsBlock);
    }
  };

  loadVisualEditor($('.editor'));
})();