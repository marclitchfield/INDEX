var INDEX = INDEX || {};

INDEX.elements = (function() {

  function findAncestorWithProperty(context, property) {
    if (!context) {
      return undefined;
    }
    if (typeof context.$data === 'object' && context.$data.hasOwnProperty(property)) {
      return ko.toJS(context.$data);
    }
    return findAncestorWithProperty(context.$parentContext, property);
  }

  return {
    applyBindings: function(expression, element) {
      ko.applyBindings(expression, element);
    },

    makeObservable: function(expression) {
      if (Array.isArray(expression)) {
        return ko.observableArray(expression);
      } else {
        return ko.observable(expression);
      }
    },

    ancestorWithProperty: function(element, property) {
      return findAncestorWithProperty(ko.contextFor(element), property);
    },

    parentOf: function(element) {
      return ko.toJS(ko.contextFor(element).$parent);
    },

    dataFor: function(element) {
      return ko.toJS(ko.dataFor(element));
    }
  };

})();