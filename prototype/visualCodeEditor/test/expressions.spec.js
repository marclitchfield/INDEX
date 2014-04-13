describe('expressions', function() {
  describe('isAssignable', function() {
    it('ref should be assignable', function() {
      given(ref);
      expect(ref.isAssignable()).toBe(true);
    });

    it('ref() should not be assignable', function() {
      given(ref).withA(call);
      expect(ref.isAssignable()).toBe(false);
    });

    it('ref.prop should be assignable', function() {
      given(ref).withA(prop);
      expect(ref.isAssignable()).toBe(true);
    });

    it('ref.prop() should not be assignable', function() {
      given(ref).withA(prop).withA(call);
      expect(ref.isAssignable()).toBe(false);
    });

    it('ref.prop.prop2() should not be assignable', function() {
      given(ref).withA(prop).withA(prop2).withA(call);
      expect(ref.isAssignable()).toBe(false);
    });

    it('ref[sub] should be assignable', function() {
      given(ref).withA(sub);
      expect(ref.isAssignable()).toBe(true);
    });

    it('ref[sub]() should not be assignable', function() {
      given(ref).withA(sub).withA(call)
      expect(ref.isAssignable()).toBe(false);
    });

    it('ref()[sub] should not be assignable', function() {
      given(ref).withA(call).withA(sub);
      expect(ref.isAssignable()).toBe(false);
    });

    it('ref.prop[sub] should be assignable', function() {
      given(ref).withA(prop).withA(sub);
      expect(ref.isAssignable()).toBe(true);
    });

    it('ref.prop[sub]() should not be assignable', function() {
      given(ref).withA(prop).withA(sub).withA(call);
      expect(ref.isAssignable()).toBe(false);
    });

    it('ref.prop()[sub] should not be assignable', function() {
      given(ref).withA(prop).withA(call).withA(sub);
      expect(ref.isAssignable()).toBe(false);
    });

    it('ref=ref2 lvalue should not be assignable', function() {
      var assignment = givenAssignment(ref, ref2);
      expect(assignment.lvalue.isAssignable()).toBe(false);
    });

    it('ref=ref2 rvalue should be assignable', function() {
      givenAssignment(ref, given(ref2));
      expect(ref2.isAssignable()).toBe(true);
    });

    it('ref=ref2() rvalue should not be assignable', function() {
      given(ref2).withA(call);
      givenAssignment(ref, ref2);
      expect(ref2.isAssignable()).toBe(false);
    });

    it('ref=ref2.prop rvalue should be assignable', function() {
      given(ref2).withA(prop);
      givenAssignment(ref, ref2);
      expect(ref2.isAssignable()).toBe(true);
    });

    it('ref=ref2.prop() rvalue should not be assignable', function() {
      given(ref2).withA(prop).withA(call);
      givenAssignment(ref, ref2);
      expect(ref2.isAssignable()).toBe(false);
    });
  });

  describe('isTerminal', function() {
    describe('given ref', function() {
      beforeEach(function() { given(ref); })

      it('ref should be terminal', function() {
        expect(ref.isTerminal()).toBe(true);
      });
    });

    describe('given ref.prop', function() {
      beforeEach(function() { given(ref).withA(prop); })

      it('ref should not be terminal', function() {
        expect(ref.isTerminal()).toBe(false);
      });

      it('prop should be terminal', function() {
        expect(prop.isTerminal()).toBe(true);
      });
    });

    describe('given ref[sub]', function() {
      beforeEach(function() { given(ref).withA(sub); })

      it('ref should not be terminal', function() {
        expect(ref.isTerminal()).toBe(false);
      });

      it('sub should be terminal', function() {
        expect(sub.isTerminal()).toBe(true);
      });
    });

    describe('given ref().prop', function() {
      beforeEach(function() { given(ref).withA(call).withA(prop); })

      it('ref should not be terminal', function() {
        expect(ref.isTerminal()).toBe(false);
      });

      it('prop should be terminal', function() {
        expect(prop.isTerminal()).toBe(true);
      });
    });

    describe('given ref.prop()', function() {
      beforeEach(function() { given(ref).withA(prop).withA(call); })

      it('ref should not be terminal', function() {
        expect(ref.isTerminal()).toBe(false);
      });

      it('prop should not be terminal', function() {
        expect(prop.isTerminal()).toBe(false);
      });
    });

    describe('given ref[sub].prop', function() {
      beforeEach(function() { given(ref).withA(sub).withA(prop); })

      it('ref should not be terminal', function() {
        expect(ref.isTerminal()).toBe(false);
      });

      it('sub should not be terminal', function() {
        expect(sub.isTerminal()).toBe(false);
      });

      it('prop should be terminal', function() {
        expect(prop.isTerminal()).toBe(true);
      });
    });

    describe('given ref.prop[sub]', function() {
      beforeEach(function() { given(ref).withA(prop).withA(sub); })

      it('ref should not be terminal', function() {
        expect(ref.isTerminal()).toBe(false);
      });

      it('prop should not be terminal', function() {
        expect(prop.isTerminal()).toBe(false);
      });

      it('sub should be terminal', function() {
        expect(sub.isTerminal()).toBe(true);
      });
    });    
  });

  var ref, ref2, prop, call, sub;

  beforeEach(function() {
    ref = { ref: { name: 'ref' } };
    ref2 = { ref: { name: 'ref2' } };
    prop = { prop: { ref: { name: 'prop' } } };
    prop2 = { prop: { ref: { name: 'prop2' } } };
    call = { call: { args: [] } };
    sub = { sub: { ref: { name: 'sub' } } };
    assignment = { lvalue: {}, rvalue: {} };
  });

  function given(value) {
    var element = $('<div/>');
    $(document).trigger('loadexpressions', [value, element[0]]);
    return fluent(ko.toJS(ko.dataFor(element[0])));
  }

  function givenAssignment(lvalue, rvalue) {
    var assignment = { assignment: { lvalue: ko.toJS(lvalue), rvalue: ko.toJS(rvalue) } };
    return given(assignment)['assignment'];
  }

  function withA(value) {
    return fluent(ko.toJS(this.addExpression(value)));
  }

  function fluent(value) {
    value.withA = withA;
    return value;
  }
});