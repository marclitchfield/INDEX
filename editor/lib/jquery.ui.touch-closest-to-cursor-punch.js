(function() {
  // duck punch jQueryUI to add a 'touch-closest-to-mouse' tolerance.
  // when multiple droppables are under the draggable, only the one closest to the mouse position will be active.
  var defaultIntersect = $.ui.intersect;
  var cursorX, cursorY;

  $(document).mousemove(function(e) {
    cursorX = e.pageX;
    cursorY = e.pageY;
  });

  $.ui.intersect = function(draggable, droppable, toleranceMode) {
    if (toleranceMode !== 'touch-closest-to-mouse') {
      return defaultIntersect(draggable, droppable, toleranceMode);
    }
    if (!defaultIntersect(draggable, droppable, 'touch')) {
      return false;
    }
    var acceptable = _.filter($.ui.ddmanager.droppables.default, function(d) { 
      return d.accept.call(d.element[0], draggable.element[0]) && defaultIntersect(draggable, d, 'touch') && VISIBILITY.isVisible(d.element[0]);
    });
    var closest = _.min(acceptable, function(other) {
      var otherCenterX = other.offset.left + other.proportions().width / 2;
      var otherCenterY = other.offset.top + other.proportions().height / 2;
      return Math.sqrt(Math.pow(otherCenterX - cursorX, 2) + Math.pow(otherCenterY - cursorY, 2));
    });
    return droppable === closest;
  };
})();