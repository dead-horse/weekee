
var oHead = document.getElementsByTagName('HEAD').item(0);
var oScript= document.createElement("script");
oScript.type = "text/javascript";
oScript.src="/weekee/js/ace/ace.js";
oHead.appendChild( oScript);

$(function () {
  $('#weekee-edit, #weekee-create').click(function () {
    var $node = $('#weekee-edit-content');
    var h = $node.height();
    var w = $node.width();
    $node.before('<div id="weekee-aceedit-content" style="height:' + h + 'px; width:' + w + 'px; border: 1px solid #DDD; border-radius: 4px;"></div>');
    $node.hide();
    editor = ace.edit('weekee-aceedit-content');
    var heightUpdateFunction = function() {
      // http://stackoverflow.com/questions/11584061/
      var newHeight = editor.getSession().getScreenLength() * editor.renderer.lineHeight + 
        editor.renderer.scrollBar.getWidth();
      if (newHeight < h) {
        newHeight = h;
      }
      $('weekee-aceedit-content').height(newHeight + 'px');
      //$('#editor-section').height(newHeight.toString() + "px"); 

      // This call is required for the editor to fix all of
      // its inner structure for adapting to a change in size
      editor.resize();
    };

    // Set initial size to match initial content
    heightUpdateFunction();

    // Whenever a change happens inside the ACE editor, update
    // the size again
    editor.getSession().on('change', heightUpdateFunction);

    editor.getSession().setTabSize(2);
    editor.getSession().setUseSoftTabs(true);
    editor.getSession().setUseWrapMode(true);
    editor.setValue($node.val(), 1);
    editor.setTheme("ace/theme/chrome");
    editor.getSession().setMode("ace/mode/markdown");
    editor.getSession().on('change', function () {
      $node.val(editor.getValue());
    });         
  });
})
