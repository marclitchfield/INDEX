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
      expect(paletteItem.data('drop-target-types')).toEqual(['ref-postfix', 'sub-postfix', 'binary-operator']);
    });

    var paletteItem;

    function givenPaletteItemWithBehavior(behavior) {
      paletteItem = $('<div/>').data('palette-behavior', behavior);
    }

    function whenDragStarted() {
      $(document).trigger('dragstarted', paletteItem);
    }
  });

  describe('on palettemenu', function() {
    describe('operator dropped', function() {
      it('on a terminal assignable ref target should include assignment operators', function() {
        givenRef("ref");
        whenPaletteExpandedOn("ref");
        expect(paletteMenuItems).toIncludeAll(assignmentOperators);
      })

      it('on a terminal non-assignable ref target should not include assignment operators', function() {
        givenRef("ref").withCall();
        whenPaletteExpandedOn("ref");
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      it('on a non-terminal assignable ref target should not include assignment operators', function() {
        givenRef("ref").withProp("prop");
        whenPaletteExpandedOn("ref");
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      it('on a non-terminal non-assignable ref target should not include assignment operators', function() {
        givenRef("ref").withProp("prop").withCall();
        whenPaletteExpandedOn("ref");
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      it('on a terminal assignable prop target should include assignment operators', function() {
        givenRef("ref").withProp('prop1').withProp('prop2');
        whenPaletteExpandedOn('prop2');
        expect(paletteMenuItems).toIncludeAll(assignmentOperators);
      });

      it('on a terminal non-assignable prop target should not include assignment operators', function() {
        givenRef("ref").withProp("prop1").withProp("prop2").withCall();
        whenPaletteExpandedOn("prop2");
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      it('on a non-terminal assignable prop target should not include assignment operators', function() {
        givenRef("ref").withProp("prop1").withProp("prop2");
        whenPaletteExpandedOn("prop");
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      it('on a non-terminal non-assignable prop target should not include assignment operators', function() {
        givenRef("ref").withProp("prop1").withCall().withProp("prop2");
        whenPaletteExpandedOn("prop");
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      it('on a terminal assignable sub target should include assignment operators', function() {
        givenRef("ref").withSub('sub');
        whenPaletteExpandedOn('sub');
        expect(paletteMenuItems).toIncludeAll(assignmentOperators);
      });

      it('on a terminal non-assignable sub target should not include assignment operators', function() {
        givenRef("ref").withSub("sub").withCall();
        whenPaletteExpandedOn("sub");
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      it('on a non-terminal assignable sub target should not include assignment operators', function() {
        givenRef("ref").withSub("sub1").withSub("sub2");
        whenPaletteExpandedOn('sub1');
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      it('on a non-terminal non-assignable sub target should not include assignment operators', function() {
        givenRef("ref").withSub("sub1").withCall().withSub("sub2");
        whenPaletteExpandedOn('sub1');
        expect(paletteMenuItems).toIncludeNo(assignmentOperators);
      });

      var ref;
      var draggable;
      var paletteMenu;
      var paletteMenuItems;
      var assignmentOperators = ['=','+=','-=','*=','/=','%=','<<=','>>=','>>>=','&=','^=','|='];

      function givenDraggable() {
        draggable = $('<div/>')
        draggable.withPaletteBehavior = withPaletteBehavior;
        return draggable;
      }

      function withPaletteBehavior(behavior) {
        this.data('palette-behavior', behavior);
        return this;
      }

      function givenRef(name) { 
        ref = { ref: { name: name } };
        var element = $('#fixture').append($('<div/>').attr('data-bind', '{ template: { name: template } }'));
        $(document).trigger('loadexpressions', [ref, element[0]]);
        expression = ko.toJS(ko.dataFor(element[0]));
        return fluent(ref);
      }

      function withProp(name) {
        var expression = { prop: { ref: { name: name } } };
        var prop = ko.toJS(this.addExpression(expression));
        return fluent(prop);
      }

      function withSub(name) {
        var expression = { sub: { ref: { name: name } } };
        var sub = ko.toJS(this.addExpression(expression));
        return fluent(sub);
      }

      function withCall() {
        var expression = { call: { args: [] } };
        var called = ko.toJS(this.addExpression(expression));
        return fluent(called);
      }

      function fluent(expression) {
        expression.withProp = withProp;
        expression.withSub = withSub;
        expression.withCall = withCall;
        return expression;
      }

      function whenPaletteExpandedOn(name) {
        var menuElement = $('.palette-menu')[0];
        var indicator = $('.symbol :contains("' + name + '")').closest('.symbol').next('.droppable')[0];
        $(document).trigger('expandpalette', [menuElement, draggable, indicator]);
        paletteMenuItems = ko.toJS(ko.dataFor(menuElement)).menu;
      }

      beforeEach(function() {
        paletteMenuItems = undefined;

        $('#fixture').remove();
        $('body').append($('<div/>').attr('id', 'fixture'));
        $('#fixture').append($('<div/>').html(window.__html__['templates/expressions.html']));
        $('#fixture').append($('<div/>').html(window.__html__['templates/palette.html']));
        paletteMenu = $('<div/>').addClass('palette-menu').attr('data-bind', 'template: { name: "palette-menu" }');
        $('#fixture').append(paletteMenu);

        givenDraggable().withPaletteBehavior('operator');

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
});