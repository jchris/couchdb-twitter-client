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
      count : 80,
      success : function(json){
        cb(uniqueValues(json.rows), currentTwitterID);
      }
    });
  };
  
  function viewUserWordCloud(userid, cb) {
    design.view('userWordCloud', {
      startkey : [userid],
      endkey : [userid,{}],
      group_level : 2,
      success : function(data) {
        var cloud = [];
        $.each(data.rows, function(i,row) {
          if (row.value > 2) cloud.push([row.key[1], row.value]);
        });
        cb(cloud.sort(function(a,b) {
          return b[1] - a[1];
        }));
      }
    });
  };
  
  function apiCallProceed(force) {
    var previousCall = $.cookies.get('twitter-last-call');
    var d  = new Date;
    var now = d.getTime();
    if (!previousCall) {
      $.cookies.set('twitter-last-call', now);
      return true;
    } else {
      var minutes = force ? 1 : 3;
      if (now - previousCall > 1000 * 60 * minutes) {
        $.cookies.set('twitter-last-call', now);
        return true;
      } else {
        return false;
      }
    }
  };

  function getTwitterID(cb) {
    // todo what about when they are not logged in?
    var cookieID = $.cookies.get('twitter-user-id');
    if (cookieID) {
      currentTwitterID = cookieID;
      cb(publicMethods, currentTwitterID);
    } else {
      // this is hackish to get around the broken twitter cache
      var hasUserInfo = false;
      window.userInfo = function(data) {
        currentTwitterID = data[0].user.id;
        $.cookies.set('twitter-user-id', currentTwitterID);
        hasUserInfo = true;
        cb(publicMethods, currentTwitterID);
      };
      setTimeout(function() {
        if (hasUserInfo) return;
        alert("There seems to have been a problem getting your logged in twitter info. Please log into Twitter via twitter.com, and then return to this page.")
      },2000);
      cheapJSONP("http://"+host+"/statuses/user_timeline.json?count=1&callback=userInfo");      
    }
  };
  
  function getUserTimeline(userid, cb) {
    getJSON("/statuses/user_timeline/"+userid, {count:200}, function(tweets) {
      var doc = {
        tweets : tweets,
        userTimeline : userid
      };
      db.saveDoc(doc, {success:cb});
    });
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
  
  function searchToTweet(r, term) {
    return {
      search : term,
      text : r.text,
      user : {
        screen_name : r.from_user,
        name : r.from_user,
        profile_image_url : r.profile_image_url
      },
      created_at : r.created_at,
      id : r.id
    }
  };
  
  function viewSearchResults(term, cb) {
    design.view('searchResults',{
      startkey : [term,{}],
      endkey : [term],
      group :true,
      descending : true,
      count : 80,
      success : function(json){
        cb(uniqueValues(json.rows));
      }
    });
  };
  
  function getSearchResults(term, since_id, cb) {
    $.getJSON("http://search.twitter.com/search.json?callback=?", {q:term, since_id:since_id}, function(json) {
      var tweets = $.map(json.results,function(t) {
        return searchToTweet(t, json.query);
      });
      var d  = new Date;
      var now = d.getTime();
      var doc = {
        tweets : tweets,
        search : term,
        time : now
      }
      db.saveDoc(doc, {success:function() {
        viewSearchResults(term, cb);
      }});
    });    
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
    searchTerm : function(term, cb) {
      viewSearchResults(term, function(tweets) {
        var recent = 0, since_id = 0;
        $.each(tweets,function() {
          if (this.searched_at > recent) recent = this.searched_at;
          if (this.id > since_id) since_id = this.id;
        });
        var d  = new Date;
        var now = d.getTime();
        var searched = now - recent;
        if (searched > 1000*60*2) {
          getSearchResults(term, since_id, cb);
        } else {
          cb(tweets);
        }
      });
    },
    updateStatus : function(status) {
      // todo in_reply_to_status_id
      $.xdom.post('http://twitter.com/statuses/update.xml',{status:status});        
    },
    userInfo : function(userid, cb) {
      userid = parseInt(userid);
      design.view('userTweets', {
        startkey : [userid,{}],
        reduce : false,
        count : 1,
        descending: true,
        success : function(view) {
          cb(view.rows[0].value.user);
        }
      });
    },
    userWordCloud : function(userid, cb) {
      userid = parseInt(userid);
      // check to see if we've got the users back catalog.
      design.view('userTimeline', {
        key : userid,
        success : function(view) {
          // fetch it if not
          if (view.rows.length > 0) {
            viewUserWordCloud(userid, cb);
          } else {
            getUserTimeline(userid, function() {
              viewUserWordCloud(userid, cb);
            });
          }
        }
      });
    },
    userSettings : function(cb) {
      var docid = "settings:"+currentTwitterID;
      db.openDoc(docid,{
        success : function(doc) {
          cb(doc);
        },
        error : function() {          
          cb({"_id" : docid, searches : []});
        }
      });
    }
  };
  
  getTwitterID(callback);
};