function(doc) {
  doc.tweets && doc.tweets.forEach(function(tweet) {
    if (tweet.user.id && tweet.id)
      emit([tweet.user.id, tweet.id], tweet);
  });
};
