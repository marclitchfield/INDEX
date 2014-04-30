var parser = (function() {

  function translateExpression(expression) {
    if (!expressionTranslators.hasOwnProperty(expression.type)) {
      throw new Error('No expression translator defined for ' + expression.type);
    }
    var translated = expressionTranslators[expression.type](expression);
    //console.log('xlate', JSON.stringify(expression), '-->', JSON.stringify(translated));
    return translated;
  }

  function leaf(expression) {
    if (expression.ref) {
      return leaf(expression.ref);
    }
    if (expression.prop) {
      return leaf(expression.prop);
    }
    return expression;
  }

  var expressionTranslators = {
    AssignmentExpression: function(expression) {
      return {
        assignment: {
          op: expression.operator,
          lvalue: translateExpression(expression.left),
          rvalue: translateExpression(expression.right)
        }
      };
    },

    CallExpression: function(expression) {
      return {
        call: {
          object: translateExpression(expression.callee),
          args: _.map(expression.arguments, function(a) { return translateExpression(a); })
        }
      };
    },

    ExpressionStatement: function(expression) {
      return translateExpression(expression.expression);
    },

    FunctionDeclaration: function(expression) {
      return {
        'function': {
          ref: {
            name: expression.id.name,
          },
          args: _.map(expression.params, function(p) { return { name: p.name }; }),
          expressions: _.map(expression.body.body, function(b) { return translateExpression(b); })
        }
      };
    },

    Identifier: function(expression) {
      if (expression.name === 'undefined') {
        return this.Literal({ value: undefined });
      }

      return {
        ref: {
          name: expression.name
        }
      }
    },

    Literal: function(expression) {
      return {
        literal: {
          type: typeof(expression.value),
          value: expression.value || ''
        }
      };
    },

    MemberExpression: function(expression) {
      var member = {};
      member[expression.computed ? 'sub' : 'prop'] = {
        object: translateExpression(expression.object),
        key: translateExpression(expression.property)
      };
      return member;
    },

    VariableDeclaration: function(expression) {
      return {
        'var': _.map(expression.declarations, function(d) { return translateExpression(d); })
      };
    },

    VariableDeclarator: function(expression) {
      return {
        def: translateExpression(expression.id),
        init: expression.init ? translateExpression(expression.init) : undefined
      };
    } 
  };

  var create = function(pegParser) {
    return {
      parse: function(code) {
        var expression = pegParser.parse(code).body[0];
        return translateExpression(expression);
      }
    };
  };

  return {
    load: function(grammarPath, callback) {
      $.get('base/js/lib/grammars/javascript.pegjs', function(grammar) {
        var pegParser = PEG.buildParser(grammar);
        callback(create(pegParser));
      });
    }
  };

})();