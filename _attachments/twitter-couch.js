function CouchDesign(db, name) {
  this.view = function(view, opts) {
    db.view(name+'/'+view, opts);
  };
};

function TwitterCouch(db, design, callback) {  
  var currentUser = null;
  var host = "twitter.com";
  function getJSON(path, params, cb) {
    var url = "http://"+host+path+".json?callback=?";
    $.getJSON(url, params, cb);
  };

  function cheapJSONP(url) {
    var s = document.createElement('script');
    s.src = url;
    s.type='text/javascript';
    document.body.appendChild(s);
  };

  function uniqueValues(rows) {
    var values = [];
    var keyMap = {};
    $.each(rows, function(i, row) {
      var key = row.key.toString();
      if (!keyMap[key]) {
        values.push(row.value);
        keyMap[key] = true;
      }
    });
    return values;
  };

  function viewFriendsTimeline(userId, cb) {
    design.view('friendsTimeline',{
      startkey : [userId,{}],
      endkey : [userId],
      group :true,
      descending : true,
      count : 50,
      success : function(json){
        cb(uniqueValues(json.rows));
      }
    });
  };
  
  var tw = {
    friendsTimeline : function(cb) {
      viewFriendsTimeline(currentUser.id, function(storedTweets) {
        cb(storedTweets);
        var newestTweet = storedTweets[0];
        var opts = {};
        if (newestTweet) {
          opts.since_id = newestTweet.id;
        }
        getJSON("/statuses/friends_timeline", opts, function(tweets) {
          if (tweets.length > 0) {
            var doc = {
              tweets : tweets,
              friendsTimelineOwner : currentUser.id
            };
            db.saveDoc(doc, {success:function() {
              viewFriendsTimeline(currentUser.id, cb);
            }});
          }
        });
      });
    }
  };

  // this is hackish to get around the brokenness of twitter cache
  window.userInfo = function(data) {
    currentUser = data[0].user;
    currentUser.last_tweet = data[0];
    callback(tw);
  };

  cheapJSONP("http://"+host+"/statuses/user_timeline.json?count=1&callback=userInfo");
};