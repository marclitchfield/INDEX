(function editor() {
  var iOS = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );
  var astFile = document.location.search.replace('?', '') || 'anagram.json';

  $.getJSON('ast/' + astFile).success(function(ast) {
    var viewModel = makeObservable(ast);
    ko.applyBindings(viewModel, $('.editor')[0]);
    bindDraggables();
    repositionDroppables();
  });

  function makeObservable(expression) {
    var keys = _.keys(expression);
    if (keys.length === 1) {
      expression.template = keys[0] + '-template';
    }
    keys.forEach(function(k) {
      makeObservable(expression[k]);
      if (Array.isArray(expression[k])) {
        expression[k] = ko.observableArray(expression[k]);
      } else {
        expression[k] = ko.observable(expression[k]);
      }
      // TODO: only apply these properties to elements that need them
      if (!expression.hasOwnProperty('prop')) { expression.prop = ko.observable(); }
      if (!expression.hasOwnProperty('call')) { expression.call = ko.observable(); }
      if (!expression.hasOwnProperty('sub')) { expression.sub = ko.observable(); }
      if (!expression.hasOwnProperty('editing')) { expression.editing = ko.observable(false); }
    });
    return expression;
  }

  function bindDraggables() {
    $('.draggable').draggable({
      helper: 'clone',
      zIndex: 100,
      // Fix for http://bugs.jqueryui.com/ticket/3740
      start: function (event, ui) {
        if (!iOS) {
          if ($(this).closest('.palette').length === 0) {
            $(this).data('startingScrollTop', window.pageYOffset);
          }          
        }
      },
      drag: function(event, ui){
        $('.editing').blur();
        if (!iOS) {
          var st = parseInt($(this).data('startingScrollTop'));
          if (st) {
            ui.position.top -= st;
          }          
        }
        // I have performance concerns about this
        if ($('.drop-acceptable').length > 0) {
          $('.ui-draggable-dragging').addClass('draggable-overdrop');
        } else {
          $('.ui-draggable-dragging').removeClass('draggable-overdrop');
        }
      },
    });

    $('[data-drop-type]').droppable({
      greedy: true,
      tolerance: 'touch-closest-to-mouse',
      hoverClass: 'drop-acceptable',
      activeClass: 'droppable-active',
      accept: function(draggable) {
        var dropTargetTypes = $(draggable).data('drop-target-types');
        return _(dropTargetTypes).contains($(this).data('drop-type'));
      },
      drop: function(event, ui) {
        // Drop logic needs to be done on the next turn of the event loop. Without this, when a drop target 
        // is removed by the drop logic and another drop target is under the draggable, the other drop target
        // would become active and the drop callback would be fired twice. 
        setTimeout(function() {
          var dropType = $(event.target).data('drop-type');
          handleDrop(dropType, ui.draggable[0], event.target);
          bindDraggables();
          repositionDroppables();
        }, 0);
      }
    });
  }

  function dereference(data) {
    if (data.hasOwnProperty('ref')) {
      return data.ref();
    }
    if (data.hasOwnProperty('literal')) {
      return data.literal();
    }
    if (data.hasOwnProperty('var')) {
      return data['var']().ref();
    }
    if (data.hasOwnProperty('function')) {
      return data['function']().ref();
    }
    return data;
  }  

  function handleDrop(dropType, draggable, droppable) {
    var handlers = {
      'callarg': function(draggable, droppable) {
        var source = createSource(draggable);
        var targetArgs = ancestorWithProperty(ko.contextFor(droppable), 'args').args;
        var dropPosition = $(droppable).attr('data-drop-position');
        targetArgs.splice(dropPosition, 0, source);
        if (dereference(source).editing()) { makeEditable(dereference(source)); }
      },

      'defarg': function(draggable, droppable) {
        var source = createSource(draggable);
        if (source.hasOwnProperty('ref')) {
          source = source.ref();
        }
        var targetArgs = ancestorWithProperty(ko.contextFor(droppable), 'args').args;
        var dropPosition = $(droppable).attr('data-drop-position');
        targetArgs.splice(dropPosition, 0, source);
        if (dereference(source).editing()) { makeEditable(dereference(source)); }
      },

      'expression': function(draggable, droppable) {
        var source = createSource(draggable);
        var targetExpressions = ancestorWithProperty(ko.contextFor(droppable), 'expressions').expressions;
        var dropPosition = $(droppable).attr('data-drop-position');
        targetExpressions.splice(dropPosition, 0, source);
        if (dereference(source).editing()) { makeEditable(dereference(source)); }
      },

      'function-name': function(draggable, droppable) {
        var source = createSource(draggable);
        var targetFunction = ancestorWithProperty(ko.contextFor(droppable), 'function')['function']();
        targetFunction.ref().name(getText(source));
        if (dereference(source).editing()) { makeEditable(targetFunction.ref()); }
      },

      'callable': function(draggable, droppable) {
        var target = ko.contextFor(droppable).$parent;
        insertNewExpression(target, 'call');
      }
    };

    function insertNewExpression(target, property) {
      var existing = makeObservable(ko.toJS(target[property]));
      target[property](generateExpression(property)[property]);
      if (existing) {
        target[property]()()[property](existing);
      }
    }

    function getText(data) {
      var dereferenced = dereference(data);
      if (dereferenced.hasOwnProperty('name')) {
        return dereferenced.name();
      }
      if (dereferenced.hasOwnProperty('value')) {
        return dereferenced.value();
      }
    }

    function createSource(draggable) {
      var expressionType = $(draggable).data('expression-type');
      if (expressionType) {
        return generateExpression(expressionType);
      }
      var data = ko.dataFor(draggable);
      if (typeof data === 'object' && data.hasOwnProperty('literal')) {
        return makeObservable(ko.toJS(data));
      }
      return makeObservable({ ref: { name: dereference(data).name() } });
    }

    handlers[dropType](draggable, droppable);
  }

  function ancestorWithProperty(context, type) {
    if (!context) {
      return undefined;
    }
    if (typeof context.$data === 'object' && context.$data.hasOwnProperty(type)) {
      return context.$data;
    }
    return ancestorWithProperty(context.$parentContext, type);
  }

  function generateExpression(type) {
    var generators = {
      'function': function() {
        return { 'function': { 'ref': { name: '', editing: true }, args: [], expressions: [] } };
      },
      'var': function() {
        return { 'var': { 'ref': { name: '', editing: true } } };
      },
      'ref': function() {
        return { 'ref': { name: '', editing: true } };
      },
      'call': function() {
        return { 'call': { args: [] } };
      },
      'literal': function() {
        return { 'literal': { type: 'string', value: '', editing: true }}
      }
    };

    return makeObservable(generators[type]());
  }

  function makeEditable(data) {
    $('.editing').blur();
    data.editing(true);
    var textBox = $('.editing');
    var symbol = textBox.parent();
    var width = symbol.outerWidth();
    var height = symbol.outerHeight();
    textBox.css({ top: 0, left: 0, width: width, height: height });
    textBox.focus();
  }

  $('.editor').on('doubletap', '.symbol, .literal', function(event, data) {
    makeEditable(dereference(ko.dataFor($(this)[0])));
  });

  $('.editor').on('focusout', '.editing', function() {
    ko.dataFor($(this)[0]).editing(false);
    bindDraggables();
    repositionDroppables();
  });

  $(document).keydown(function(e) {
    if (e.keyCode === 27 || e.keyCode === 13) {
      $('.editing').blur();
    }
  });

  $('.editor').on('click', '.collapse', function() {
    var collapsible = $(this).parent().children('.collapsible:first');
    collapsible.toggleClass('expanded', collapsible.hasClass('collapsed'));
    collapsible.toggleClass('collapsed', !collapsible.hasClass('collapsed'));
    $(this).toggleClass('expanded', $(this).hasClass('collapsed'));
    $(this).toggleClass('collapsed', !$(this).hasClass('collapsed'));
  });

  (function() {
    var resizeAction;
    $(window).resize(function() {
      clearTimeout(resizeAction);
      resizeAction = setTimeout(resized, 100);
    });

    var resized = function() {
      repositionDroppables();  
    }
  })();

  function repositionDroppables() {
    $('.droppable.vertical').each(function() {
      var left = $(this).data('drop-mode') === 'before' ? leftOfPrevious($(this)) : rightOfPrevious($(this));
      $(this).css({ left: left, top: topOfPrevious($(this)) });
    });

    function topOfPrevious(element) {
      var previous = previousNonDroppable(element);
      if (previous.length === 0) { return verticalCenterWithinParent(element); }
      return previous.offset().top + (previous.outerHeight()/2 - element.outerHeight()/2) + 'px';
    }

    function leftOfPrevious(element) {
      var previous = previousNonDroppable(element);
      if (previous.length === 0) { return horizontalCenterWithinParent(element); }
      return previous.offset().left - element.outerWidth() + 'px';
    }

    function rightOfPrevious(element) {
      var previous = previousNonDroppable(element);
      if (previous.length === 0) { return horizontalCenterWithinParent(element); }
      return previous.offset().left + previous.outerWidth() + 'px';
    }

    function previousNonDroppable(element) {
      return element.prevAll(':not(.droppable)').first();
    }

    function verticalCenterWithinParent(element) {
      return element.parent().offset().top + (element.parent().outerHeight()/2 - element.outerHeight()/2) + 'px'
    }

    function horizontalCenterWithinParent(element) {
      return element.parent().offset().left + (element.parent().outerWidth()/2 - element.outerWidth()/2) + 'px'
    }
  }

})();

(function palette() {
  var paletteMenu = {
    mode: {
      selectedIndex: ko.observable(0),
      items: {
        'cpI': 'copy and insert',
        'cpR': 'copy and replace',
        'mvI': 'move and insert',
        'mvR': 'move and replace'
      }
    },
    keywords: {
      'do':         { dropTargetTypes: ['expression'] },
      'while':      { dropTargetTypes: ['expression'] },
      'for':        { dropTargetTypes: ['expression'] },
      'break':      { dropTargetTypes: ['expression'], dropWithin: 'loop-body' },
      'continue':   { dropTargetTypes: ['expression'], dropWithin: 'loop-body' },
      'if':         { dropTargetTypes: ['expression'] },
      'else':       { dropTargetTypes: ['if-postfix'] },
      'switch':     { dropTargetTypes: ['expression'] },
      'case':       { dropTargetTypes: ['switch-case'] },
      'default':    { dropTargetTypes: ['switch-case'] },
      'try':        { dropTargetTypes: ['expression'] },
      'catch':      { dropTargetTypes: ['try-postfix', 'catch-postfix'] },
      'finally':    { dropTargetTypes: ['catch-postfix'] },
      'throw':      { dropTargetTypes: ['expression'] },
      'var':        { dropTargetTypes: ['expression'] },
      'this':       { dropTargetTypes: ['expression', 'callarg', 'symbol'] },
      'delete':     { dropTargetTypes: ['expression'] },
      'in':         { dropTargetTypes: ['binary-operator'] },
      'instanceof': { dropTargetTypes: ['binary-operator'] },
      'typeof':     { dropTargetTypes: ['expression', 'callarg', 'symbol'] },
      'with':       { dropTargetTypes: ['expression'] },
      'void':       { dropTargetTypes: ['expression', 'callarg', 'symbol'] },
      'return':     { dropTargetTypes: ['expression'] },
      'debugger':   { dropTargetTypes: ['expression'] }
    },
    operators: {
      'assignment':    [['=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=', '&=', '^=', '|=']],
      'unary-prefix':  [['-', '~', '!', '++', '--']],
      'unary-postfix': [['.', '()', '[]', '++', '--']],
      'binary':        [['==', '!=', '===', '!==', '>', '>=', '<', '<='],
                        ['+', '-', '*', '/', '%', , ','],
                        ['&&', '||'],
                        ['&', '|', '^', '<<', '>>', '>>>']
                       ],
      'special':       [['? :', '{hash}', '(paren)']]
    }
  }  

  $('.palette > div').click(function() {

  });
})();

