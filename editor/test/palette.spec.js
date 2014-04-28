describe('palette', function() {
  describe('on dragstarted', function() {
    it('keyword should set dropTargetTypes', function() {
      givenPaletteItemWithBehavior('keyword');
      whenDragStarted();
      expect(paletteItem.data('drop-target-types')).toEqual(['expression', 'else-postfix', 'if-postfix', 'switch-case', 'try-catch', 'try-finally', 'callarg', 'value', 'binary-operator']);
    });

    it('literal should set dropTargetTypes', function() {
      givenPaletteItemWithBehavior('literal');
      whenDragStarted();
      expect(paletteItem.data('drop-target-types')).toEqual(['expression', 'callarg']);
    });

    it('operator should set dropTargetTypes', function() {
      givenPaletteItemWithBehavior('operator');
      whenDragStarted();
      expect(paletteItem.data('drop-target-types')).toEqual(['ref-postfix', 'sub-postfix', 'call-postfix', 'binary-operator']);
    });

    var paletteItem;

    function givenPaletteItemWithBehavior(behavior) {
      paletteItem = $('<div/>').data('palette-behavior', behavior);
    }

    function whenDragStarted() {
      $(document).trigger('dragstarted', paletteItem);
    }
  });

  describe('on expandpalette', function() {
    it('should set drop-target data', function() {
      given(a);
      var target = whenPaletteExpandedOn(a);
      expect($(paletteMenu).data('drop-target')).toBe(target);
    });

    describe('operator dropped', function() {
      it('on a terminal assignable ref target should include assignment operators', function() {
        given(a);
        whenPaletteExpandedOn(a);
        expect(paletteMenuItems).toIncludeAll(assignmentOperators);
      })

      it('on a terminal non-assignable ref target should not include assignment operators', function() {
        given(call(a));
        whenPaletteExpandedOn(a);
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      it('on a non-terminal assignable ref target should not include assignment operators', function() {
        given(prop(a, b));
        whenPaletteExpandedOn(a);
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      it('on a non-terminal non-assignable ref target should not include assignment operators', function() {
        given(prop(a, call(b)));
        whenPaletteExpandedOn(a);
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      it('on a terminal assignable prop target should include assignment operators', function() {
        given(prop(prop(a, b), c));
        whenPaletteExpandedOn(c);
        expect(paletteMenuItems).toIncludeAll(assignmentOperators);
      });

      it('on a terminal non-assignable prop target should not include assignment operators', function() {
        given(prop(prop(a, b), call(c)));
        whenPaletteExpandedOn(c);
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      it('on a non-terminal assignable prop target should not include assignment operators', function() {
        given(prop(prop(a, b), c));
        whenPaletteExpandedOn(b);
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      it('on a non-terminal non-assignable prop target should not include assignment operators', function() {
        given(prop(prop(a, call(b)), c))
        whenPaletteExpandedOn(b);
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      it('on a assignable sub target should include assignment operators', function() {
        given(sub(a, b));
        whenPaletteExpandedOn(b);
        expect(paletteMenuItems).toIncludeAll(assignmentOperators);
      });

      it('on a assignable nested sub target should include assignment operators', function() {
        given(sub(a, sub(b, c)));
        whenPaletteExpandedOn(c);
        expect(paletteMenuItems).toIncludeAll(assignmentOperators);
      });

      it('on a non-assignable sub target should not include assignment operators', function() {
        given(sub(a, call(b)))
        whenPaletteExpandedOn(b);
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      it('on a non-assignable nested sub target should not include assignment operators', function() {
        given(sub(a, sub(call(b), c)));
        whenPaletteExpandedOn(b);
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      it('on a assignable ref target with sub should include assignment operators', function() {
        given(sub(a, b));
        whenPaletteExpandedOn(a);
        expect(paletteMenuItems).toIncludeAll(assignmentOperators);
      });

      it('on a assignable ref target with nested sub should include assignment operators', function() {
        given(sub(a, sub(b, c)));
        whenPaletteExpandedOn(a);
        expect(paletteMenuItems).toIncludeAll(assignmentOperators);
      });      
    });

    var draggable;
    var paletteMenu;
    var paletteMenuItems;
    var assignmentOperators = ['=','+=','-=','*=','/=','%=','<<=','>>=','>>>=','&=','^=','|='];
    var a = { ref: { name: 'a' } };
    var b = { ref: { name: 'b' } };
    var c = { ref: { name: 'c' } };

    function givenDraggable(paletteBehavior) {
      draggable = $('<div/>')
      draggable.data('palette-behavior', paletteBehavior);
      return draggable;
    }

    function given(expression) {
      var element = $('#fixture').append($('<div/>').attr('data-bind', '{ template: { name: template } }'));
      $(document).trigger('loadexpressions', [JSON.parse(JSON.stringify(expression)), element[0]]);
    }

    function ref(name) {
      return { ref: { name: name } };
    }

    function call(object) {
      return { call: { object: object, args: [] } };
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

    function whenPaletteExpandedOn(symbol) {
      var menuElement = $('.palette-menu')[0];
      var targetElement = $('.symbol :contains("' + symbol.ref.name + '")').closest('.symbol');
      var indicator = targetElement.next('.droppable')[0];
      $(document).trigger('expandpalette', [menuElement, draggable, indicator]);
      paletteMenuItems = _.map(ko.toJS(ko.dataFor(menuElement)).menu, function(item) {
        return item.choice;
      });
      return indicator;
    }

    beforeEach(function() {
      paletteMenuItems = undefined;

      $('#fixture').remove();
      $('body').append($('<div/>').attr('id', 'fixture'));
      $('#fixture').append($('<div/>').html(window.__html__['templates/expressions.html']));
      $('#fixture').append($('<div/>').html(window.__html__['templates/palette.html']));
      paletteMenu = $('<div/>').addClass('palette-menu').attr('data-bind', 'template: { name: "palette-menu" }');
      $('#fixture').append(paletteMenu);

      givenDraggable('operator');

      jasmine.addMatchers({
        toIncludeAll: function() {
          return {
            compare: function(actual, expected) {
              return {
                pass: _.intersection(expected, actual).length === expected.length
              };
            }
          };
        },
        toIncludeNo: function() {
          return {
            compare: function(actual, expected) {
              return {
                pass: _.intersection(expected, actual).length === 0
              }
            }
          }
        }
      });
    });
  });
});