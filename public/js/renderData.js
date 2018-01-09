const getCommentsInFormat = function(comments){
  return comments.reduce((formattedComment,comment)=>{
    formattedComment += `<hr><p>Name: ${comment.name}</p>`;
    formattedComment += `<p>Comment: ${comment.comment}</p>`;
    formattedComment += `<p>${comment.time}</p><br>`;
    return formattedComment;
  },"")
}

const printCommentData = function(){
  let comments = JSON.parse(this.responseText);
  let commentsDiv = document.getElementById("comments");
  let formattedComments = getCommentsInFormat(comments);
  commentsDiv.innerHTML = formattedComments;
}

const loadComments = function(){
  let req = new XMLHttpRequest();
  req.addEventListener("load",printCommentData);
  req.open("GET","/data");
  req.send();
}

window.onload = loadComments;