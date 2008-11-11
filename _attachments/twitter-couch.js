function CouchDesign(db, name) {
  this.view = function(view, opts) {
    db.view(name+'/'+view, opts);
  };
};

function TwitterCouch(db, design, callback) {  
  var currentTwitterID = null;
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
        cb(uniqueValues(json.rows), currentTwitterID);
      }
    });
  };
  
  function apiCallProceed(force) {
    var previousCall = $.cookies.get('twitter-last-call');
    var d  = new Date;
    var now = d.getTime();
    if (force || !previousCall) {
      $.cookies.set('twitter-last-call', now);
      return true;
    } else {
      if (now - previousCall > 1000 * 60 * 2) {
        $.cookies.set('twitter-last-call', now);
        return true;
      } else {
        return false;
      }
    }
  };
  
  function getFriendsTimeline(cb, opts) {
    getJSON("/statuses/friends_timeline", opts, function(tweets) {
      if (tweets.length > 0) {
        var doc = {
          tweets : tweets,
          friendsTimelineOwner : currentTwitterID
        };
        db.saveDoc(doc, {success:function() {
          viewFriendsTimeline(currentTwitterID, cb);
        }});
      }
    });    
  };

  function getTwitterID(cb) {
    // todo what about when they are not logged in?
    var cookieID = $.cookies.get('twitter-user-id');
    if (cookieID) {
      currentTwitterID = cookieID;
      cb(publicMethods);
    } else {
      // this is hackish to get around the broken twitter cache
      window.userInfo = function(data) {
        currentTwitterID = data[0].user.id;
        $.cookies.set('twitter-user-id', currentTwitterID)
        callback(publicMethods);
      };
      cheapJSONP("http://"+host+"/statuses/user_timeline.json?count=1&callback=userInfo");      
    }
  };
  
  var publicMethods = {
    friendsTimeline : function(cb, force) {
      viewFriendsTimeline(currentTwitterID, function(storedTweets) {
        cb(storedTweets, currentTwitterID);
        if (apiCallProceed(force)) {
          var newestTweet = storedTweets[0];
          var opts = {};
          if (newestTweet) {
            opts.since_id = newestTweet.id;
          }
          getFriendsTimeline(cb, opts);
        }
      });
    },
    updateStatus : function(status) {
      // todo in_reply_to_status_id
      $.xdom.post('http://twitter.com/statuses/update.json',{status:status});        
    }
  };
  
  getTwitterID(callback);
};