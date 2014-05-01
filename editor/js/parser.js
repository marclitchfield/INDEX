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

    BinaryExpression: function(expression) {
      return {
        binary: {
          op: '+',
          left: translateExpression(expression.left),
          right: translateExpression(expression.right)
        }
      };
    },

    BlockStatement: function(expression) {
      return _.map(expression.body, function(e) { return translateExpression(e); });
    },

    CallExpression: function(expression) {
      return {
        call: {
          object: translateExpression(expression.callee),
          args: _.map(expression.arguments, function(a) { return translateExpression(a); })
        }
      };
    },

    ConditionalExpression: function(expression) {
      return {
        ternary: {
          'if': translateExpression(expression.test),
          'then': translateExpression(expression.consequent),
          'else': translateExpression(expression.alternate)
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
            name: expression.id !== null ? expression.id.name : ''
          },
          args: _.map(expression.params, function(p) { return { name: p.name }; }),
          expressions: _.map(expression.body.body, function(b) { return translateExpression(b); })
        }
      };
    },

    FunctionExpression: function(expression) {
      return this.FunctionDeclaration(expression);
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

    IfStatement: function(expression) {
      return {
        'if': {
          condition: translateExpression(expression.test),
          'then': { expressions: translateExpression(expression.consequent) },
          'else': { expressions: translateExpression(expression.alternate) }
        }
      }
    },

    Literal: function(expression) {
      if (expression.value instanceof RegExp) {
        return {
          literal: {
            type: 'regex',
            value: expression.value.toString()
          }
        };
      }

      return {
        literal: {
          type: typeof(expression.value),
          value: expression.value !== undefined ? expression.value : ''
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

    ObjectExpression: function(expression) {
      return {
        'hash': {
          entries: _.map(expression.properties, function(p) {
            return {
              key: translateExpression(p.key),
              value: translateExpression(p.value)
            };
          })
        }
      };
    },

    NewExpression: function(expression) {
      return {
        'new': this.CallExpression(expression)
      };
    },

    ReturnStatement: function(expression) {
      return {
        'return': translateExpression(expression.argument)
      };
    },

    UnaryExpression: function(expression) {
      return {
        unary: {
          op: expression.operator,
          operand: translateExpression(expression.argument)
        }
      };
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
      parseExpression: function(code) {
        var expression = pegParser.parse(code).body[0];
        return translateExpression(expression);
      },

      parseModule: function(moduleName, code) {
        return {
          module: {
            name: moduleName,
            expressions: [].concat(this.parseExpression(code))
          }
        };
      }
    };
  };

  return {
    load: function(grammarPath, callback) {
      $.get(grammarPath, function(grammar) {
        var pegParser = PEG.buildParser(grammar, { cache: true });
        callback(create(pegParser));
      });
    }
  };

})();