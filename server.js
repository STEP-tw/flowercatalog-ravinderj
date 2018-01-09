let fs = require('fs');
const http = require('http');
const timeStamp = require('./time.js').timeStamp;
const WebApp = require('./webapp');
let registered_users = [{userName:'bhanutv',name:'Bhanu Teja Verma'},{userName:'harshab',name:'Harsha Vardhana'}];
let comments = fs.readFileSync("data/comments.json","utf8");
comments = JSON.parse(comments);

let loadUser = (req,res)=>{
  let sessionid = req.cookies.sessionid;
  let user = registered_users.find(u=>u.sessionid==sessionid);
  if(sessionid && user){
    req.user = user;
  }
};

let redirectLoggedOutUserToLogin = (req,res)=>{
  if(req.urlIsOneOf(['/submitName']) && !req.user) {
    res.redirect('/login');
  }
}

const getContentType = function(file) {
  let extn = file.slice(file.lastIndexOf("."));
  let extenstions = {
    ".gif": "image/gif",
    ".jpg": "image/jpg",
    ".html": "text/html",
    ".css": "text/css",
    ".pdf": "application/pdf"
  }
  return extenstions[extn];
};

const getFilePath = function(file){
  let fileExtn = file.slice(file.lastIndexOf("."));
  let pathHandlers = {
    "js": "./public/js",
    "json": "./data/data.json",
    ".html": "./public",
    ".css": "./public/css",
    ".jpg": "./public/images",
    ".gif": "./public/images"
  }
  return pathHandlers[fileExtn]+file;
}

const addComments = function(file1Path,file2Path,commentData) {
  commentData.time = new Date().toLocaleString();
  comments.unshift(commentData);
  let stringifiedComments = JSON.stringify(comments, null, 2);
  fs.writeFile(file1Path, stringifiedComments, "utf8", (err) => console.log(err));
  fs.writeFile(file2Path, "let comments = " + stringifiedComments, "utf8", (err) => console.log(err))
}

const serveFile = function(req,res){
  if(req.url=="/") res.redirect("/index.html");
  let filePath = getFilePath(req.url);
  if(req.method == "GET" && fs.existsSync(filePath)){
    let fileContent = fs.readFileSync(filePath);
    res.setHeader("Content-Type",getContentType(filePath));
    res.write(fileContent);
    res.end();
  }
}

let app = WebApp.create();
app.use(logRequest);
app.use(loadUser);
app.use(serveFile);
app.use(redirectLoggedOutUserToLogin);
app.get('/login',(req,res)=>{
  res.setHeader('Content-type','text/html');
  if(req.cookies.logInFailed) res.write('<p>logIn Failed</p>');
  console.log(req.comments);
  res.write('<form method="POST"> <input name="userName"><input name="place"> <input type="submit"></form>');
  console.log(req.comments);
  res.end();
});

app.post('/login',(req,res)=>{
  let user = registered_users.find(u=>u.userName==req.body.userName);
  if(!user) {
    res.setHeader('Set-Cookie',`logInFailed=true`);
    res.redirect('/login');
    return;
  }
  let sessionid = new Date().getTime();
  res.setHeader('Set-Cookie',`sessionid=${sessionid}`);
  user.sessionid = sessionid;
  addComments("./data/comments.json","./public/js/data.js",req.body);
  res.redirect('/guest-page.html');
});

app.get('/logout',(req,res)=>{
  res.setHeader('Set-Cookie',[`logInFailed=false;expires=${new Date(1).toString()}`,`sessionid=0;expires=${new Date(1).toString()}`]);
  delete req.user.sessionid;
  res.redirect('/login');
});

const PORT = 5000;
let server = http.createServer(app);
server.on('error',e=>console.error('**error**',e.message));
server.listen(PORT,(e)=>console.log(`server listening at ${PORT}`));
