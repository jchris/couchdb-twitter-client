function(doc) {
  doc.friendsTimelineOwner && doc.tweets && doc.tweets.forEach(function(tweet) {
    emit([doc.friendsTimelineOwner, tweet.id], tweet);    
  })
};
