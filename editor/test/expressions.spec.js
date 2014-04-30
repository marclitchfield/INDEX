describe('expressions', function() {
  describe('isAssignable', function() {
    it('given a, a should be assignable', function() {
      given(a);
      expect(ref(a).isAssignable()).toBe(true);
    });

    it('given a(), a should not be assignable', function() {
      given(call(a));
      expect(ref(a).isAssignable()).toBe(false);
    });

    it('given a.b, a should not be assignable, b should be assignable', function() {
      given(prop(a, b));
      expect(ref(a).isAssignable()).toBe(false);
      expect(ref(b).isAssignable()).toBe(true);
    });

    it('given a.b(), none should not be assignable', function() {
      given(prop(a, call(b)));
      expect(ref(a).isAssignable()).toBe(false);
      expect(ref(b).isAssignable()).toBe(false);
    });

    it('given a().b, none should be assignable', function() {
      given(prop(call(a), b));
      expect(ref(a).isAssignable()).toBe(false);
      expect(ref(b).isAssignable()).toBe(false);
    });

    it('given a.b.c, a and b should not be assignable, c should be assignable', function() {
      given(prop(prop(a, b), c));
      expect(ref(a).isAssignable()).toBe(false);
      expect(ref(b).isAssignable()).toBe(false);
      expect(ref(c).isAssignable()).toBe(true);
    });

    it('given a.b.c(), none should be assignable', function() {
      given(prop(prop(a, b), call(c)));
      expect(ref(a).isAssignable()).toBe(false);
      expect(ref(b).isAssignable()).toBe(false);
      expect(ref(c).isAssignable()).toBe(false);
    });

    it('given a[b], a and b should be assignable', function() {
      given(sub(a, b));
      expect(ref(a).isAssignable()).toBe(true);
      expect(ref(b).isAssignable()).toBe(true);
    });

    it('given a[b()], a should be assignable, b should not be assignable', function() {
      given(sub(a, call(b)));
      expect(ref(a).isAssignable()).toBe(true);
      expect(ref(b).isAssignable()).toBe(false);
    });    

    it('given a[b](), a should not be assignable, b should be assignable', function() {
      given(call(sub(a, b)));
      expect(ref(a).isAssignable()).toBe(false);
      expect(ref(b).isAssignable()).toBe(true);
    });

    it('given a()[b], a should not be assignable, b should be assignable', function() {
      given(sub(call(a), b));
      expect(ref(a).isAssignable()).toBe(false);
      expect(ref(b).isAssignable()).toBe(true);
    });

    it('given a.b[c], a should be assignable, b and c should be assignable', function() {
      given(prop(a, sub(b, c)));
      expect(ref(a).isAssignable()).toBe(false);
      expect(ref(b).isAssignable()).toBe(true);
      expect(ref(c).isAssignable()).toBe(true);
    });

    it('given a[b][c], all should be assignable', function() {
      given(sub(sub(a, b), c));
      expect(ref(a).isAssignable()).toBe(true);
      expect(ref(b).isAssignable()).toBe(true);
      expect(ref(c).isAssignable()).toBe(true);
    });

    it('given a[b[c]], all should be assignable', function() {
      given(sub(a, sub(b, c)));
      expect(ref(a).isAssignable()).toBe(true);
      expect(ref(b).isAssignable()).toBe(true);
      expect(ref(c).isAssignable()).toBe(true);
    });

    it('given a[b.c], a and c should be assignable, b should not be assignable', function() {
      given(sub(a, prop(b, c)));
      expect(ref(a).isAssignable()).toBe(true);
      expect(ref(b).isAssignable()).toBe(false);
      expect(ref(c).isAssignable()).toBe(true);
    });

    it('given a[b.c()], a should be assignable, b and c should not be assignable', function() {
      given(sub(a, prop(b, call(c))));
      expect(ref(a).isAssignable()).toBe(true);
      expect(ref(b).isAssignable()).toBe(false);
      expect(ref(c).isAssignable()).toBe(false);
    });

    it('given a.b[c](), a and b should not be assignable, c should be assignable', function() {
      given(call(prop(a, sub(b, c))));
      expect(ref(a).isAssignable()).toBe(false);
      expect(ref(b).isAssignable()).toBe(false);
      expect(ref(c).isAssignable()).toBe(true);
    });

    it('given a.b()[c], a and b should not be assignable, c should be assignable', function() {
      given(sub(prop(a, call(b)), c));
      expect(ref(a).isAssignable()).toBe(false);
      expect(ref(b).isAssignable()).toBe(false);
      expect(ref(c).isAssignable()).toBe(true);
    });

    it('given a[b].c.d, a and c should not be assignable, b and d should be assignable', function() {
      given(prop(prop(sub(a,b),c),d));
      expect(ref(a).isAssignable()).toBe(false);
      expect(ref(b).isAssignable()).toBe(true);
      expect(ref(c).isAssignable()).toBe(false);
      expect(ref(d).isAssignable()).toBe(true);
    });

    it('given a=b, a should not be assignable, b should be assignable', function() {
      given(assignment(a, b))
      expect(ref(a).isAssignable()).toBe(false);
      expect(ref(b).isAssignable()).toBe(true);
    });

    it('given a=b(), none should be assignable', function() {
      given(assignment(a, call(b)));
      expect(ref(a).isAssignable()).toBe(false);
      expect(ref(b).isAssignable()).toBe(false);
    });

    it('given a=b.c, a and be should not be assignable, c should be assignable', function() {
      given(assignment(a, prop(b, c)));
      expect(ref(a).isAssignable()).toBe(false);
      expect(ref(b).isAssignable()).toBe(false);
      expect(ref(c).isAssignable()).toBe(true);
    });

    it('given a=b.c(), none should be assignable', function() {
      given(assignment(a, prop(b, call(c))));
      expect(ref(a).isAssignable()).toBe(false);
      expect(ref(b).isAssignable()).toBe(false);
      expect(ref(c).isAssignable()).toBe(false);
    });

    it('given var a, a should not be assignable (it is initializable)', function() {
      given(def(a));
      expect(ref(a).isAssignable()).toBe(false);
    });

    it('given var a=b, a should not be assignable (it is initializable), b should be assignable', function() {
      given(def(a, b));
      expect(ref(a).isAssignable()).toBe(false);
      expect(ref(b).isAssignable()).toBe(true);
    });
  });

  xdescribe('isInitializable', function() {
    it('given a, a should not be initializable', function() {
      given(a);
      expect(ref(a).isInitializable()).toBe(false);
    });

    it('given var a, a should be initializable', function() {
      given(def(a));
      expect(ref(a).isInitializable()).toBe(true);
    });

    it('given var a=b, a should not be initializable', function() {
      given(def(a, b));
      expect(ref(a).isInitializable()).toBe(false);
    });
  });

  var a = { ref: { name: 'a' } };
  var b = { ref: { name: 'b' } };
  var c = { ref: { name: 'c' } };
  var d = { ref: { name: 'd' } };
  var givenExpression;

  function given(value) {
    var element = $('<div/>');
    $(document).trigger('loadexpressions', [JSON.parse(JSON.stringify(value)), element[0]]);
    givenExpression = ko.dataFor(element[0]);
  }

  function call(object) {
    return { call: { object: object } };
  }

  function prop(object, key) {
    return { prop: { object: object, key: key } };
  }

  function sub(object, key) {
    return { sub: { object: object, key: key } };
  }

  function assignment(lvalue, rvalue) {
    return { assignment: { op: '=', lvalue: lvalue, rvalue: rvalue } };
  }

  function def(ref, init) {
    return { 'var': [ { def: ref, init: init } ] }
  }

  function ref(r) {
    return (function findRef(expression) {
      if (typeof(expression) === 'object') {
        if (expression.ref && expression.ref() && expression.ref().name() === r.ref.name) {
          return expression;
        } else {
          var keys = _.keys(expression);
          for (var i=0; i<keys.length; i++) {
            var k = keys[i];
            var found = ko.isObservable(expression[k]) ? findRef(expression[k]()) : findRef(expression[k]);
            if (found) { return found; }
          }
        }
      }
    })(givenExpression);
  }
});