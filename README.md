
# weekee![travis-ci](https://secure.travis-ci.org/dead-horse/weekee.png) 

  A wiki base git and markdown, power by Node.js, and can be use with connect or express. Maybe you can also use it as a web editor.

-----------------------

### Install  

```
npm install -g weekee   
```

### Use As A Command Line Application   

After install by npm -g, you can use `weekee` like this:   
```
weekee -h

  Usage: weekee weekee [options]. To host a directory as a wiki in the browser.

  Options:

    -h, --help           output usage information
    -V, --version        output the version number
    -d, --directory <n>  target directory
    -p --port <n>        listen port, defualt is 8080
    -g, --git <n>        git origin url
    -n, --name <n>       git user.name
    -e, --email <n>      git user.email

```

`weekee` default listen at 8080, and host the current directory.You can change it by options.  

```
$ weekee   
   info  - socket.io started
weekee created! And start listen 8080
```

Defualt weekee  
![weekee](https://raw.github.com/dead-horse/weekee/master/weekee.png) 


### Use In Project  
You can both use weekee's default http server and your own http server write by connect/express/http.   
weekee's options are:    

```js
/**
 * Init a weekee
 * @param {Object} options 
 *   - {HttpServer} server         a http server or use connect/express
 *   - {Number} port               if use the defualt server, the default server will listen this port, defualt is 8080
 *   - {Function} configSocketIO   a function that set socketIO's config
 *   - {String} directory          the root directory of wiki
 *   - {Boolean} enableStatic      enable static files from weekee, and user can use `/weekee/js/weekee.js` to got script in frontend
 * @param {Object} git
 *   - {String} url            git remote url
 *   - {String} name           git user.name
 *   - {String} email          git user.email
 */
function weekee(options);
```

#### Use the default server:  

```js
var weekee = require('weekee');

weekee({
  directory: __dirname + '/wiki',
  git: {
    url: 'git://github.com/xxx/wiki.git',
    name: 'weekee',
    email: 'weekee@nodejs.org'
  },
  port: 8080
});
```

then you get a wiki in `http://localhost:8080`   

#### Use with own server   

In server side:  

```js
var weekee = require('weekee');
var connect = require('connect');
var http = require('http');

var server = http.createServer(function (req, res) {
  
}).listen(8080);

weekee({
  directory: __dirname + '/wiki',
  server: server,
  enableStatic: true,
  git: {
    url: 'git://github.com/xxx/wiki.git',
    name: 'weekee',
    email: 'weekee@nodejs.org'
  },
  configSocketIO: function (io) {
    io.set('log level', 1);
  }  
});
```

The server side weekee is ready. 

In front end, you need to connect to server side socket.io. Server side are listening these events:  

1. `readFile`: get file content.  
2. `readFolder`: get files in folder.  
3. `saveFile`: save file to path.  
4. `createFile`: create file in path.  
5. `createFolder`: create folder in path.  
6. `goBack`: go back to the upper folder.  
7. `removeFile`: remove file. If in git module, when remove the last file in folder, the folder will be remove at the same time. 
8. `removeFolder`: remove folder.  
9. `readFolderAndFile`: Read a file and it's directory. The server side will emit `readFileReply` and `readFolderReply`  

And server side socket.io will emit these events:  

1. `readFileReply`  
2. `readFolderReply`  
3. `saveFileReply`  
4. `createFileReply`  
5. `createFolderReply`  
6. `removeFileReply`  
7. `removeFolderReply`  

An easy way to create your own page, In front html, you must have tow container:  

```html
<div id="weekee-folder-container"></div>
<div id="weekee-file-container"></div>
```

Then include JS file:  

```html
<script src="/weekee/js/weekee.js"></script>
```

If your node server is listen at 7001, but use nginx in front of your node server listen at 80. Then you can try this:  
Bofore include `weekee.js`, You can use your own socket.io client to connect to your real node server.   

```html
<script>
  window.weekeeSocket = io.connect('localhost:7001');
</script>
<script src="/weekee/js/weekee.js"></script>
```

After these, front end can communicate with server side now. If you want to use the default bootstrap style. Just include the JS file.   

```html
<script src="/weekee/js/weekee-bootstrap.js"></script>
```

If you want to get a better editor with [ace](https://github.com/ajaxorg/ace), just inlcude:   

```html
<script src="/weekee/js/weekee-ace.js"></script>
```

Work with exist project  
![weekee project](https://raw.github.com/dead-horse/weekee/master/weekee_proj.png)  

### dependences   
* `Git`  

### todo   
1. add more unit test  
2. file change log  
3. a way to bind more event

### Licences
(The MIT License)

Copyright (c) 2013 dead-horse

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.