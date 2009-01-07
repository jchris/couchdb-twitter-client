function(doc) {
  doc.friendsTimelineOwner && doc.tweets && doc.tweets.forEach(function(tweet) {
    if (tweet.id) emit([doc.friendsTimelineOwner, tweet.id], tweet);    
  })
};
