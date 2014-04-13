(function editor() {
  var astFile = document.location.search.replace('?', '') || 'anagram.json';

  $.getJSON('ast/' + astFile).success(function(ast) {
    $.event.trigger('loadexpressions', [ast, $('.editor')[0]]);
  });

  $(document).on('editing', function(event, data) {
    $('.editing').blur();
    data.editing(true);
    var textBox = $('.editing');
    var symbol = textBox.parent();
    var width = symbol.outerWidth();
    var height = symbol.outerHeight();
    textBox.css({ top: 0, left: 0, width: width, height: height });
    textBox.focus();
  });

  $('.editor').on('doubletap', '.symbol, .literal', function(event, data) {
    $.event.trigger('edit', $(this)[0]);
  });

  $('.editor').on('focusout', '.editing', function() {
    ko.dataFor($(this)[0]).editing(false);
    $.event.trigger('domchanged');
  });

  $(document).keydown(function(e) {
    if (e.keyCode === 27 || e.keyCode === 13) {
      $('.editing').blur();
      $('.palette-menu').hide();
    }
  });

  $(document).on('click', function() {
    $('.palette-menu').hide();
  });

  $('.editor').on('click', '.collapse', function() {
    var collapsible = $(this).parent().children('.collapsible:first');
    collapsible.toggleClass('expanded', collapsible.hasClass('collapsed'));
    collapsible.toggleClass('collapsed', !collapsible.hasClass('collapsed'));
    $(this).toggleClass('expanded', $(this).hasClass('collapsed'));
    $(this).toggleClass('collapsed', !$(this).hasClass('collapsed'));
    collapsible.bind('transitionend', function() {
      $.event.trigger('layoutchanged');
      $(this).unbind('transitionend');
    });
  });


  (function() {
    var resizeAction;
    $(window).resize(function() {
      clearTimeout(resizeAction);
      resizeAction = setTimeout(resized, 100);
    });

    var resized = function() {
      $.event.trigger('layoutchanged');  
    }
  })();

})();


