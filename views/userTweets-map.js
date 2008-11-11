function(doc) {
  doc.tweets && doc.tweets.forEach(function(tweet) {
    emit([tweet.user.id, tweet.id], tweet);
  });
};
