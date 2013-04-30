var oHead = document.getElementsByTagName('HEAD').item(0);

var bootstrapCss= document.createElement('link');
bootstrapCss.rel = 'stylesheet';
bootstrapCss.type = 'text/css';
bootstrapCss.href = '/weekee/css/bootstrap.min.css';
oHead.appendChild(bootstrapCss);

var weekeeCss= document.createElement('link');
weekeeCss.rel = 'stylesheet';
weekeeCss.type = 'text/css';
weekeeCss.href = '/weekee/css/weekee-bootstrap.css';
oHead.appendChild(weekeeCss);

var highlightCss= document.createElement('link');
highlightCss.rel = 'stylesheet';
highlightCss.type = 'text/css';
highlightCss.href = '/weekee/css/github.css';
oHead.appendChild(highlightCss);

var oScript= document.createElement("script");
oScript.type = "text/javascript";
oScript.src="/weekee/js/highlight.pack.js";
oHead.appendChild(oScript);

$(function () {  
  $('button').addClass('btn');
  $('#weekee-create').addClass('btn-success');
  $('#weekee-save').addClass('btn-success');
  $('#weekee-newfolder').addClass('btn-success');
  $('#weekee-edit').addClass('btn-success');
  $('#weekee-cancle').addClass('btn-danger');
  $('#weekee-delete').addClass('btn-danger');
  $('#weekee-deletefolder').addClass('btn-danger');
  $('#weekee-header').addClass('clearfix'); 
  
  socket.on('readFileReply', function () {
    $('pre code').each(function(i, e) {hljs.highlightBlock(e, '  ')});
  });
});

