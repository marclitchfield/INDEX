(function dragdrop() {
  var needsDragDropFix = !navigator.userAgent.match(/(iPad|iPhone|iPod|Chrome)/ig);

  $(document).on('domchanged', function() {
    bindDraggables();
    repositionDroppables();
  });

  $(document).on('layoutchanged', function() {
    repositionDroppables();
  });

  function bindDraggables() {
    $('.draggable').draggable({
      helper: 'clone',
      zIndex: 100,
      // Fix for http://bugs.jqueryui.com/ticket/3740
      start: function (event, ui) {
        if (needsDragDropFix) {
          if ($(this).closest('.palette').length === 0) {
            $(this).data('startingScrollTop', window.pageYOffset);
          }          
        }
        $.event.trigger('dragstarted', $(this));
        $('.palette-menu').hide();
      },
      drag: function(event, ui){
        $('.editing').blur();
        if (needsDragDropFix) {
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
          $.event.trigger('itemdropped', [ui.draggable[0], event.target]);
          $.event.trigger('domchanged');
        }, 0);
      }
    });
  }

  function repositionDroppables() {
    console.log('repositionDroppables');

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