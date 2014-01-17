$(function () {
  var FILE = {};
  var FOLDER = {};
  var CURRENT_DIRECTORY = '';
  var changingHash = false;

  var folderSidebar =
    '<div id="weekee-foldername"></div>\
     <ul id="weekee-folder"></ul>\
     <div id="weekee-folder-controllers">\
      <input type="text" style="width: 80%; display: none;" id="weekee-edit-folder"></input>\
      <button id="weekee-newfolder">New Folder</button>\
      <button id="weekee-deletefolder" style="display: none;">Del Folder</button>\
     </div>';

  var fileContainer =
    '<div id="weekee-header" class="clearfix">\
       <div id="weekee-title">Node Weekee</div>\
       <div id="weekee-file-controllers">\
         <button id="weekee-create">New</button>\
         <button id="weekee-edit" style="display: none;">Edit</button>\
         <button id="weekee-delete" style="display: none;">Delete</button>\
         <button id="weekee-cancle" style="display: none;">Cancle</button>\
         <button id="weekee-save" style="display: none;">Save</button>\
       </div>\
     </div>\
     <div id="weekee-content">Click on a file on the left to open it</div>';

  var edit =
    '<textarea style="width: 100%; height: 500px;" id="weekee-edit-content"></textarea>';

  var titleEdit =
    '<input type="text" style="width: 100%;" id="weekee-edit-title"></input>';

  var newFolderHtml =
  $('#weekee-file-container').html(fileContainer);
  $('#weekee-folder-container').html(folderSidebar);

  var buttonActions = {
    noFileOpen: function () {
      $('#weekee-create').show();
      $('#weekee-edit, #weekee-delete, #weekee-cancle, #weekee-save').hide();
    },
    fileOpen: function () {
      $('#weekee-create, #weekee-edit, #weekee-delete').show();
      $('#weekee-cancle, #weekee-save').hide();
    },
    edit: function () {
      $('#weekee-create, #weekee-edit, #weekee-delete').hide();
      $('#weekee-cancle, #weekee-save').show();
    }
  };

  function tplReplace(tpl, params){
    return tpl.replace(/\$(.*?)\$/g, function(t, i){
      return params[i];
    });
  }
  var sideLi = '<li class="files $selected$" data-name="$realName$"><a href="javascript:void(0)">$displayName$</a></li>';
  function renderSideBar(data) {
    var html = '';
    FOLDER = {};
    if (!data.isRoot) {
      html += tplReplace(sideLi, {
        displayName: '..',
        realName: '..',
        selected: ''
      });
    }
    data.files.forEach(function (row) {
      html += tplReplace(sideLi, {
        displayName: row.name + (row.isDir ? '/' : ''),
        realName: row.name,
        selected: row.name === FILE.fileName ? 'weekee-selected' : ''
      });
      FOLDER[row.name ] = !!row.isDir;
    });
    $('#weekee-folder').html(html);
  }

  function renderContent(data) {
    changingHash = true;
    window.location.hash = data.fileName ?
      ('#' + encodeURIComponent((CURRENT_DIRECTORY ? CURRENT_DIRECTORY + '/' : '') + data.fileName)) : '';
    $('.files').each(function (i, row) {
      if ($(row).data('name') === data.fileName) {
        $('.files').removeClass('weekee-selected');
        $(this).addClass('weekee-selected');
      }
    });
    FILE = data;
    if (data.fileName) {
      buttonActions.fileOpen();
      $('#weekee-title').html(data.fileName);
      $('#weekee-content').html(data.htmlContent || 'empty file');
    } else {
      buttonActions.noFileOpen();
      $('#weekee-title').html('Node Weekee');
      $('#weekee-content').html('Click on a file on the left to open it');
    }
  }
  var socket = window.weekeeSocket || io.connect(window.location.protocol + '//' + window.location.host);
  window.weekeeSocket = socket;

  var hash = window.location.hash;
  if (hash) {
    socket.emit('readFolderAndFile', decodeURIComponent(hash.slice(1)));
  } else {
    socket.emit('readFolder');
  }

  window.onhashchange = function () {
    if (changingHash) {
      changingHash = false;
      return;
    }
    var hash = window.location.hash;
    socket.emit('readFolderAndFile', decodeURIComponent(hash.slice(1)));
  };

  socket.on('error', function (msg) {
    console.log(msg);
  });

  socket.on('readFolderReply', function (data) {
    if (!data.isRoot && data.files.length === 0) {
      $('#weekee-deletefolder').show();
    } else {
      $('#weekee-deletefolder').hide();
    }
    $('#weekee-foldername').html(data.folderName || 'ROOT_DIR');
    CURRENT_DIRECTORY = data.directory;
    renderSideBar(data);
  });

  socket.on('readFileReply', function (data) {
    renderContent(data);
  });

  socket.on('saveFileReply', function (data) {
    renderContent(data);
  });

  socket.on('createFileReply', function (data) {
    renderContent(data);
    socket.emit('readFolder', {
      directory: CURRENT_DIRECTORY,
      folderName: ''
    });
  });

  socket.on('createFolderReply', function () {
    $('#weekee-edit-folder').hide().val('');
    socket.emit('readFolder', {
      directory: CURRENT_DIRECTORY,
      folderName: ''
    });
  });

  socket.on('removeFileReply', function () {
    renderContent({});
    socket.emit('readFolder', {
      directory: CURRENT_DIRECTORY,
      folderName: ''
    });
  });

  socket.on('removeFolderReply', function () {
    socket.emit('goBack', CURRENT_DIRECTORY);
  });

  $('#weekee-folder').delegate('.files', 'click', function () {
    var fileName = $(this).data('name');
    if (fileName === FILE.fileName) {
      return;
    }
    if (fileName === '..') {
      return socket.emit('goBack', CURRENT_DIRECTORY);
    }
    if (FOLDER[fileName]) {
      //is dir
      return socket.emit('readFolder', {
        folderName: fileName,
        directory: CURRENT_DIRECTORY
      });
    }
    socket.emit('readFile', {
      fileName: fileName,
      directory: CURRENT_DIRECTORY
    });
  });

  $('#weekee-edit-folder').keydown(function (e) {
    var code = e.keyCode;
    var $input = $(this);
    if (code === 27) {
      return $input.hide().val('');
    }
    if (code === 13) {
      var folderName = $input.val();
      if (!folderName) {
        return alert('must input a folder name');
      }
      socket.emit('createFolder', {
        folderName: folderName,
        directory: CURRENT_DIRECTORY
      });
    }
  });

  $('#weekee-newfolder').click(function () {
    $('#weekee-edit-folder').show();
    $('#weekee-edit-folder').focus();
  });

  $('#weekee-edit').click(function () {
    var editContent = $(edit);
    editContent.val(FILE.originContent);
    $('#weekee-content').html(editContent);
    buttonActions.edit();
  });

  $('#weekee-create').click(function () {
    $('#weekee-content').html(edit);
    $('#weekee-title').html(titleEdit);
    buttonActions.edit();
  });

  $('#weekee-delete').click(function () {
    var del = confirm('Really delete ' + FILE.fileName + '?');
    del && socket.emit('removeFile', {
      fileName: FILE.fileName,
      directory: CURRENT_DIRECTORY
    });
  });

  $('#weekee-deletefolder').click(function () {
    var del = confirm('Really delete the current directory?');
    del && socket.emit('removeFolder', CURRENT_DIRECTORY);
  });

  $('#weekee-cancle').click(function () {
    $('#weekee-title').html(FILE.fileName || 'Node Weekee');
    $('#weekee-content').html(FILE.htmlContent || '');
    FILE.fileName ? buttonActions.fileOpen() : buttonActions.noFileOpen();
  });

  $('#weekee-save').click(function () {
    var content = $('#weekee-edit-content').val();
    var newFile = !!$('#weekee-edit-title').length;
    var fileName = newFile ? $('#weekee-edit-title').val() : $('#weekee-title').html();
    if (newFile) {
      return socket.emit('createFile', {
        fileName: fileName,
        content: content,
        directory: CURRENT_DIRECTORY
      });
    }
    socket.emit('saveFile', {
      fileName: fileName,
      content: content,
      directory: CURRENT_DIRECTORY
    });
  });
});