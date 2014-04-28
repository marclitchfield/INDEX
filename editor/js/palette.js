(function palette() {

  $(document).on('dragstarted', function(event, draggable) {
    var paletteBehavior = $(draggable).data('palette-behavior');
    if (paletteBehavior) {
      var behavior = paletteBehaviors[paletteBehavior];
      if (behavior.hasOwnProperty('menu')) {
        var dropTargetTypes = _.uniq(_.flatten(_.map(behavior.menu, function(item) {
          return item[_.keys(item)[0]].dropTargetTypes;
        })));
        $(draggable).data('drop-target-types', dropTargetTypes);
      }
    }
  });

  $(document).on('expandpalette', function(event, menuElement, draggable, droppable) {
    var droppableType = $(droppable).data('drop-type');
    var menuItems = paletteBehaviors[$(draggable).data('palette-behavior')].menu;

    function matchesDropTargetTypes(menuDefinition) {
      return _(menuDefinition.dropTargetTypes).contains(droppableType);
    }

    function satisfiesConstraints(menuDefinition) {
      if (!menuDefinition.constraints)
        return true;
      return _.all(menuDefinition.constraints, function(constraint) {
        return paletteBehaviorConstraints[constraint](droppable);
      });
    }

    var choices = _.filter(menuItems, function(item) {
      var menuDefinition = item[_.keys(item)[0]];
      return matchesDropTargetTypes(menuDefinition) && satisfiesConstraints(menuDefinition);
    }).map(function(item) { 
      return { choice: _.keys(item)[0], dropType: item.expressionType };
    });

    ko.cleanNode(menuElement);
    ko.applyBindings({ menu: ko.observableArray(choices) }, menuElement);
    var position = $(droppable).offset();
    $(menuElement).css({ top: position.top, left: position.left });
    $(menuElement).show();
    $(menuElement).data('drop-target', droppable);
  });

  $(document).on('click', '.palette-menu .item', function(event) {
    var draggable = $(this)[0];
    var droppable = $(this).closest('.palette-menu').data('drop-target');
    $.event.trigger('itemdropped', [draggable, droppable]);
  });

  var paletteBehaviors = {
    action: {
      toggle: {
        selectedIndex: ko.observable(0),
        items: ['copy', 'move']
      }
    },
    modification: {
      toggle: {
        selectedIndex: ko.observable(0),
        items: ['ins', 'repl']
      }
    },
    keyword: {
      menu: [
        { 'do':         { dropTargetTypes: ['expression'] } },
        { 'while':      { dropTargetTypes: ['expression'] } },
        { 'for':        { dropTargetTypes: ['expression'] } },
        { 'break':      { dropTargetTypes: ['expression'], dropWithin: 'loop-body' } },
        { 'continue':   { dropTargetTypes: ['expression'], dropWithin: 'loop-body' } },
        { 'if':         { dropTargetTypes: ['expression', 'else-postfix'] } },
        { 'else':       { dropTargetTypes: ['if-postfix'] } },
        { 'switch':     { dropTargetTypes: ['expression'] } },
        { 'case':       { dropTargetTypes: ['switch-case'] } },
        { 'default':    { dropTargetTypes: ['switch-case'] } },
        { 'try':        { dropTargetTypes: ['expression'] } },
        { 'catch':      { dropTargetTypes: ['try-catch'] } },
        { 'finally':    { dropTargetTypes: ['try-finally'] } },
        { 'throw':      { dropTargetTypes: ['expression'] } },
        { 'var':        { dropTargetTypes: ['expression'] } },
        { 'this':       { dropTargetTypes: ['expression', 'callarg', 'value'] } },
        { 'delete':     { dropTargetTypes: ['expression'] } },
        { 'in':         { dropTargetTypes: ['binary-operator'] } },
        { 'instanceof': { dropTargetTypes: ['binary-operator'] } },
        { 'typeof':     { dropTargetTypes: ['expression', 'callarg', 'value'] } },
        { 'with':       { dropTargetTypes: ['expression'] } },
        { 'void':       { dropTargetTypes: ['expression', 'callarg', 'value'] } },
        { 'return':     { dropTargetTypes: ['expression'] } },
        { 'debugger':   { dropTargetTypes: ['expression'] } }
      ]
    },
    literal: {
      menu: [
        { 'string':    { dropTargetTypes: ['expression', 'callarg'] } },
        { 'number':    { dropTargetTypes: ['expression', 'callarg'] } },
        { 'bool':      { dropTargetTypes: ['expression', 'callarg'] } },
        { 'null':      { dropTargetTypes: ['expression', 'callarg'] } },
        { 'undefined': { dropTargetTypes: ['expression', 'callarg'] } },
        { 'regex':     { dropTargetTypes: ['expression', 'callarg'] } }
      ]
    },
    operator: {
      menu: [
        { '=':    { dropTargetTypes: ['ref-postfix', 'sub-postfix'], expressionType: 'assignment', constraints: ['assignable'] } },
        { '+=':   { dropTargetTypes: ['ref-postfix', 'sub-postfix'], expressionType: 'assignment', constraints: ['assignable'] } },
        { '-=':   { dropTargetTypes: ['ref-postfix', 'sub-postfix'], expressionType: 'assignment', constraints: ['assignable'] } },
        { '*=':   { dropTargetTypes: ['ref-postfix', 'sub-postfix'], expressionType: 'assignment', constraints: ['assignable'] } },
        { '/=':   { dropTargetTypes: ['ref-postfix', 'sub-postfix'], expressionType: 'assignment', constraints: ['assignable'] } },
        { '%=':   { dropTargetTypes: ['ref-postfix', 'sub-postfix'], expressionType: 'assignment', constraints: ['assignable'] } },
        { '<<=':  { dropTargetTypes: ['ref-postfix', 'sub-postfix'], expressionType: 'assignment', constraints: ['assignable'] } },
        { '>>=':  { dropTargetTypes: ['ref-postfix', 'sub-postfix'], expressionType: 'assignment', constraints: ['assignable'] } },
        { '>>>=': { dropTargetTypes: ['ref-postfix', 'sub-postfix'], expressionType: 'assignment', constraints: ['assignable'] } },
        { '&=':   { dropTargetTypes: ['ref-postfix', 'sub-postfix'], expressionType: 'assignment', constraints: ['assignable'] } },
        { '^=':   { dropTargetTypes: ['ref-postfix', 'sub-postfix'], expressionType: 'assignment', constraints: ['assignable'] } },
        { '|=':   { dropTargetTypes: ['ref-postfix', 'sub-postfix'], expressionType: 'assignment', constraints: ['assignable'] } },
        // { '-':    { dropTargetTypes: ['unary-prefix'] } },
        // { '~':    { dropTargetTypes: ['unary-prefix'] } },
        // { '!':    { dropTargetTypes: ['unary-prefix'] } },
        // { '++':   { dropTargetTypes: ['unary-prefix', 'unary-postfix'] } },
        // { '--':   { dropTargetTypes: ['unary-prefix', 'unary-postfix'] } },
        // { '[]':   { dropTargetTypes: ['unary-postfix'] } },
        { '()':   { dropTargetTypes: ['ref-postfix', 'sub-postfix', 'call-postfix'], expressionType: 'call' } },
        { '.':    { dropTargetTypes: ['binary-operator'], expressionType: 'prop' } },
        { '==':   { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '!=':   { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '===':  { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '!==':  { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '>':    { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '>=':   { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '<':    { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '<=':   { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '+':    { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '-':    { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '*':    { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '/':    { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '%':    { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { ',':    { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '&&':   { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '||':   { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '&':    { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '|':    { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '^':    { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '<<':   { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '>>':   { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } },
        { '>>>':  { dropTargetTypes: ['binary-operator'], expressionType: 'binary' } }
        // { '? :':  { dropTargetTypes: ['value'], expressionType: 'ternary' } },
        // { '{hash}':  { dropTargetTypes: ['value'], expressionType: 'hash' } },
        // { '(paren)': { dropTargetTypes: ['expression', 'value', 'unary-prefix', 'unary-postfix'], expressionType: 'paren', regionSelect: true } }
      ]
    }
  };

  var paletteBehaviorConstraints = {
    assignable: function(droppable) {
      var context = ko.contextFor(droppable).$parentContext;
      var root = rootRef(context);
      var isAssignable = root.isAssignable();
      return isAssignable;
    }
  };

  function rootRef(context) {
    if (context.$parentContext === undefined) {
      return context.$data;
    }
    var parentData = context.$parentContext.$data;
    if (parentData.ref) {
      return parentData;
    }
    return rootRef(context.$parentContext);
  }

})();