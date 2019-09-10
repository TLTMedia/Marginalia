function makeCommmentObject() {
  var dfd = new $.Deferred();
  var comment = {}

  loadComments().then(function(commentData) {

    comment.data = commentData;

    comment.fullname = comment.data.user.firstname + " " + comment.data.user.lastname

    // Gives us the user's netid
    comment.getUserNetID = function() {
      return comment.data.user.netid;
    }

    console.log("Comment Loaded")
    dfd.resolve(comment)
  })

  return dfd;
}


function loadComments() {
  var dfd = new $.Deferred();
  $.get("loadComments.php").then(function(data) {
    dfd.resolve(JSON.parse(data));
  }).fail(function($xhr) {
    var data = $xhr.responseJSON;
    console.log($xhr);
  });
  return dfd;
}
