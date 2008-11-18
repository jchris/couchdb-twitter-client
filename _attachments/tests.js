
function setupDB(design) {
  var testPath = document.location.toString().split('?')[1];
  var pathParts = testPath.split('/');
  
  var appDB = new CouchDB(pathParts[1]);
  var thisDesign = appDB.open(unescape(pathParts[2]), {attachments:true});
  delete thisDesign._rev;
  
  var db = new CouchDB(pathParts[1]+"-test");
  db.deleteDb();
  db.createDb();
  db.save(thisDesign);
  
  return db;  
}

var tests = {
  unique_user_tweets : function(debug) {
    var db = setupDB();
    if (debug) debugger;
    
    var tweetDoc = {
      tweets : [{
        user : { id : 1 },
        id : 1
      },{
        user : { id : 1 },
        id : 2
      },{
        user : { id : 2 },
        id : 3
      },{
        user : { id : 2 },
        id : 4
      }]
    };

    // save it twice to show reduce makes them unique
    var result = db.save(tweetDoc);
    T(result.ok);
    delete tweetDoc._id;
    delete tweetDoc._rev;
    var result = db.save(tweetDoc);
    T(result.ok);
    
    // not unique
    var view = db.view('twitter-client/userTweets',{reduce: false});
    var keys = [
      [1,1],
      [1,1],
      [1,2],  
      [1,2],
      [2,3],      
      [2,3],
      [2,4],
      [2,4]
    ];
    for (var i=0; i < keys.length; i++) {
      T(equals(view.rows[i].key, keys[i]));
    };
    
    // unique because of group=true
    view = db.view('twitter-client/userTweets',{reduce: true, group:true});
    keys = [
      [1,1],
      [1,2],  
      [2,3],      
      [2,4],
    ];
    for (var i=0; i < keys.length; i++) {
      T(equals(view.rows[i].key, keys[i]));
    };
        
  },
  unique_tweets_user_word_count : function(debug) {
    var db = setupDB();
    if (debug) debugger;
    
    var tweetDoc = {
      tweets : [{
        user : { id : 1 },
        text : "The quick brown fox jumped over the lazy dog.",
        id : 1
      },{
        user : { id : 1 },
        text : "The brown fox is brown and quick.",
        id : 2
      },
      {
        user : { id : 1 },
        text : "The dog is lazy, not the brown fox.",
        id : 3
      }]
    };
    
    // save it twice cause that's the crazy world we're living in
    var result = db.save(tweetDoc);
    T(result.ok);
    delete tweetDoc._id;
    delete tweetDoc._rev;
    var result = db.save(tweetDoc);
    T(result.ok);
    
    // we query for the word count per user, and try to avoid getting it wrong if
    // we have more than one copy of the same tweet.
    var userID = 1; 
    view = db.view('twitter-client/userWordCloud',{
      reduce: true, 
      startkey : [1],
      endkey : [1,{}],
      group_level : 2
    });
    
    // Note: impedence mismatch... would be nice to have an async test client for
    // code reuse, and also direct functional testing of my app instead of just
    // unit tests on the views.
    var cloud = {};
    for (var i=0; i < view.rows.length; i++) {
      var row = view.rows[i];
      cloud[row.key[1]] = row.value;
    };
    T(equals(cloud["brown"], 4));
    T(equals(cloud["quick"], 2));
    T(equals(cloud["jumped"], 1));
    T(equals(cloud["the"], 5));
    
    // we skip 2 letter words
    T(!cloud["is"]);

    // test the total word count for a user
    view = db.view('twitter-client/userWordCloud',{
      reduce: true, 
      startkey : [1],
      endkey : [1,{}],
      group_level : 1
    });
    T(equals(view.rows[0].key, [1]));
    // skipping 2 letter words
    T(equals(view.rows[0].value, 22));
  },
  global_word_count : function(debug) {
    var db = setupDB();
    if (debug) debugger;
    
    var tweetDoc = {
      tweets : [{
        user : { id : 1 },
        text : "The quick brown fox jumped over the lazy dog.",
        id : 1
      },{
        user : { id : 1 },
        text : "The brown fox is brown and quick.",
        id : 2
      },
      {
        user : { id : 2 },
        text : "The dog is lazy.",
        id : 3
      }]
    };
    
    // save it twice cause that's the crazy world we're living in
    var result = db.save(tweetDoc);
    T(result.ok);
    delete tweetDoc._id;
    delete tweetDoc._rev;
    var result = db.save(tweetDoc);
    T(result.ok);
    
    var userID = 1; 
    view = db.view('twitter-client/globalWordCount',{
      reduce: true, 
      // startkey : [],
      // endkey : [{}],
      group_level : 1,
    });

    var cloud = {};
    for (var i=0; i < view.rows.length; i++) {
      var row = view.rows[i];
      cloud[row.key] = row.value;
    };

    T(equals(cloud["brown"], 3));
    T(equals(cloud["quick"], 2));
    T(equals(cloud["lazy"], 2));
    T(equals(cloud["jumped"], 1));
    T(equals(cloud["the"], 4));
    
    // we skip 2 letter words
    T(!cloud["is"]);
    
    // the total
    view = db.view('twitter-client/globalWordCount');
    T(equals(view.rows[0].value, 18));
  }
}