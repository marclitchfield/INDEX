var parser = (function() {

  function translateExpression(expression) {
    if (!expressionTranslators.hasOwnProperty(expression.type)) {
      throw new Error('No expression translator defined for ' + expression.type);
    }
    return expressionTranslators[expression.type](expression);
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
      var callee = translateExpression(expression.callee);
      callee[_.keys(callee)[0]]['call'] = {
        args: _.map(expression.arguments, function(a) { return translateExpression(a); })
      };
      return callee;
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
      return {
        ref: {
          name: expression.name
        }
      }
    },

    // f(x).g(y).h
    // member(call(member(call(f[x]).g)[y]).h)
    // ref(f,call([x]),member(ref(g,call([y]),member(ref(h)))))

    MemberExpression: function(expression) {
      var object = translateExpression(expression.object);
      var prop = translateExpression(expression.property);
      return object;
    },

    VariableDeclaration: function(expression) {
      return {
        'var': _.map(expression.declarations, function(d) { return translateExpression(d); })
      };
    },

    VariableDeclarator: function(expression) {
      if (expression.init) {
        return {
          assignment: {
            op: '=',
            lvalue: translateExpression(expression.id),
            rvalue: translateExpression(expression.init)
          }
        };
      } else {
        return translateExpression(expression.id);
      }
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