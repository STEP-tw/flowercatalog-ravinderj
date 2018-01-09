let fs = require('fs');
const http = require('http');
const timeStamp = require('./time.js').timeStamp;
const WebApp = require('./webapp');
let registered_users = [{userName:'ravinder',name:'Ravinder Jajoria'},{userName:'neeraj',name:'Neeraj Jaiswal'}];
let comments = fs.readFileSync("./data/comments.json","utf8");
comments = JSON.parse(comments);

let toS = o=>JSON.stringify(o,null,2);

const isFile = function (fileName) {
  try {
    let stats = fs.statSync(fileName);
    return stats.isFile();
  } catch (error) {
    return false;
  }
};

const showLoginForm = function(commentPage,res){
  let loginForm = fs.readFileSync("./public/templates/loginbutton.html","utf8");
  commentPage = commentPage.replace(/COMMENT_FORM/,loginForm);
  res.write(commentPage);
  res.end();
}

const showCommentForm = function(commentPage,res){
  let commentForm = fs.readFileSync("./public/templates/commentForm.html","utf8");
  commentPage = commentPage.replace(/COMMENT_FORM/,commentForm);
  res.write(commentPage);
  res.end();
}

const serveGuestPage = function(req,res){
    res.setHeader("Content-Type",getContentType("guest-page.html"));
    fs.readFile("./public/templates/guest-page.html",(err,data)=>{
      if(err) return;
      if(req.user){
        showCommentForm(data.toString(),res);
        return;  
      }
      showLoginForm(data.toString(),res);
    });
}

const serveFile = function (req, res) {
  if(req.url=="/") req.url = "/index.html";
  let fileName = 'public' + req.url;
  if (req.method == 'GET' && isFile(fileName)) {
    res.setHeader("Content-Type",getContentType(fileName));
    let content = fs.readFileSync(fileName);
    res.write(content);
    res.end();
  }
};

let logRequest = (req,res)=>{
  let text = ['------------------------------',
  `${timeStamp()}`,
  `${req.method} ${req.url}`,
  `HEADERS=> ${toS(req.headers)}`,
  `COOKIES=> ${toS(req.cookies)}`,
  `BODY=> ${toS(req.body)}`,''].join('\n');
  fs.appendFile('request.log',text,()=>{});
  console.log(`${req.method} ${req.url}`);
}

let loadUser = (req,res)=>{
  let sessionid = req.cookies.sessionid;
  let user = registered_users.find(u=>u.sessionid==sessionid);
  if(sessionid && user){
    req.user = user;
  }
};

const sendData = function(req,res){
  res.setHeader("Content-Type","application/json");
  let commentsInfo = JSON.stringify(comments);
  res.write(commentsInfo);
  res.end();
}

const getContentType = function(file) {
  let extn = file.slice(file.lastIndexOf("."));
  let extenstions = {
    ".js": "text/javascript",
    ".json": "application/json",
    ".gif": "image/gif",
    ".jpg": "image/jpg",
    ".html": "text/html",
    ".css": "text/css",
    ".pdf": "application/pdf"
  }
  if(!extenstions[extn]){
    return "text/plain";
  }
  return extenstions[extn];
};

const addComments = function(req,res) {
  let filePath = "data/comments.json";
  let commentData = req.body;
  commentData.time = new Date().toLocaleString();
  comments.unshift(commentData);
  let stringifiedComments = JSON.stringify(comments, null, 2);
  fs.writeFileSync(filePath, stringifiedComments, "utf8");
  res.redirect("/guest-page.html");
  res.end();
}

let app = WebApp.create();
app.use(logRequest);
app.use(loadUser);
app.use(serveFile);
app.get("/data",sendData);
app.get("/guest-page.html",serveGuestPage);
app.post("/submitComment",addComments);
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
    res.redirect('/guest-page.html');
    return;
  }
  let sessionid = new Date().getTime();
  res.setHeader('Set-Cookie',`sessionid=${sessionid}`);
  user.sessionid = sessionid;
  res.redirect('/guest-page.html');
});

app.get('/logout',(req,res)=>{
  res.setHeader('Set-Cookie',[`logInFailed=false;expires=${new Date(1).toString()}`,`sessionid=0;expires=${new Date(1).toString()}`]);
  delete req.user.sessionid;
  res.redirect('/guest-page.html');
});

const PORT = 5000;
let server = http.createServer(app);
server.on('error',e=>console.error('**error**',e.message));
server.listen(PORT,(e)=>console.log(`server listening at ${PORT}`));
