(function() {

  var astFile = document.location.search.replace('?', '') || 'anagram.json';

  $.getJSON('ast/' + astFile).success(function(ast) {
    applyTemplateFunctions(ast);
    var viewModel = ko.mapping.fromJS(ast);
    ko.applyBindings(viewModel);
  });

  function applyTemplateFunctions(expression) {
    var keys = _.keys(expression);
    console.log(expression, keys);
    if (keys.length === 1) {
      expression.template = keys[0] + '-template';
    }
    keys.forEach(function(k) {
      applyTemplateFunctions(expression[k]);
    });
  }

})();
