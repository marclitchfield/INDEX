(function palette() {

  $(document).on('dragstart', function(event, draggable) {
    var paletteBehavior = $(this).data('palette-behavior');
    if (paletteBehavior) {
      var behavior = paletteBehaviors[paletteBehavior];
      if (behavior.hasOwnProperty('menu')) {
        var dropTargetTypes = _.uniq(_.flatten(_.map(behavior.menu, function(item) {
          return item[_.keys(item)[0]].dropTargetTypes;
        })));
        $(this).data('drop-target-types', dropTargetTypes);
      }
    }
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
        { 'string':    { dropTargetTypes: ['literal'] } },
        { 'number':    { dropTargetTypes: ['literal'] } },
        { 'bool':      { dropTargetTypes: ['literal'] } },
        { 'null':      { dropTargetTypes: ['literal'] } },
        { 'undefined': { dropTargetTypes: ['literal'] } },
        { 'regex':     { dropTargetTypes: ['literal'] } }
      ]
    },
    operator: {
      menu: [
        { '=':    { dropTargetTypes: ['assignable'] } },
        { '+=':   { dropTargetTypes: ['assignable'] } },
        { '-=':   { dropTargetTypes: ['assignable'] } },
        { '*=':   { dropTargetTypes: ['assignable'] } },
        { '/=':   { dropTargetTypes: ['assignable'] } },
        { '%=':   { dropTargetTypes: ['assignable'] } },
        { '<<=':  { dropTargetTypes: ['assignable'] } },
        { '>>=':  { dropTargetTypes: ['assignable'] } },
        { '>>>=': { dropTargetTypes: ['assignable'] } },
        { '&=':   { dropTargetTypes: ['assignable'] } },
        { '^=':   { dropTargetTypes: ['assignable'] } }
        // { '|=':   { dropTargetTypes: ['assignable'] } },
        // { '-':    { dropTargetTypes: ['unary-prefix'] } },
        // { '~':    { dropTargetTypes: ['unary-prefix'] } },
        // { '!':    { dropTargetTypes: ['unary-prefix'] } },
        // { '++':   { dropTargetTypes: ['unary-prefix', 'unary-postfix'] } },
        // { '--':   { dropTargetTypes: ['unary-prefix', 'unary-postfix'] } },
        // { '()':   { dropTargetTypes: ['unary-postfix'] } },
        // { '[]':   { dropTargetTypes: ['unary-postfix'] } },
        // { '.':    { dropTargetTypes: ['binary-operator'] } },
        // { '==':   { dropTargetTypes: ['binary-operator'] } },
        // { '!=':   { dropTargetTypes: ['binary-operator'] } },
        // { '===':  { dropTargetTypes: ['binary-operator'] } },
        // { '!==':  { dropTargetTypes: ['binary-operator'] } },
        // { '>':    { dropTargetTypes: ['binary-operator'] } },
        // { '>=':   { dropTargetTypes: ['binary-operator'] } },
        // { '<':    { dropTargetTypes: ['binary-operator'] } },
        // { '<=':   { dropTargetTypes: ['binary-operator'] } },
        // { '+':    { dropTargetTypes: ['binary-operator'] } },
        // { '-':    { dropTargetTypes: ['binary-operator'] } },
        // { '*':    { dropTargetTypes: ['binary-operator'] } },
        // { '/':    { dropTargetTypes: ['binary-operator'] } },
        // { '%':    { dropTargetTypes: ['binary-operator'] } },
        // { ',':    { dropTargetTypes: ['binary-operator'] } },
        // { '&&':   { dropTargetTypes: ['binary-operator'] } },
        // { '||':   { dropTargetTypes: ['binary-operator'] } },
        // { '&':    { dropTargetTypes: ['binary-operator'] } },
        // { '|':    { dropTargetTypes: ['binary-operator'] } },
        // { '^':    { dropTargetTypes: ['binary-operator'] } },
        // { '<<':   { dropTargetTypes: ['binary-operator'] } },
        // { '>>':   { dropTargetTypes: ['binary-operator'] } },
        // { '>>>':  { dropTargetTypes: ['binary-operator'] } },
        // { '? :':  { dropTargetTypes: ['value'] } },
        // { '{hash}':  { dropTargetTypes: ['value'] } },
        // { '(paren)': { dropTargetTypes: ['expression', 'value', 'unary-prefix', 'unary-postfix'], regionSelect: true } }
      ]
    }
  }  

})();