function(doc) {
  doc.search && doc.tweets && doc.tweets.forEach(function(tweet) {
    tweet.searched_at = doc.time;
    emit([doc.search, tweet.id], tweet);
  });
};
