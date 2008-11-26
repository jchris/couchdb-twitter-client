function(doc) {
  doc.tweets && doc.tweets.forEach(function(tweet) {
    if (tweet.text && tweet.id && tweet.user && tweet.user.id) {
      var wordCounts = {};
      var words = tweet.text.toLowerCase().split(/\s/);
      words.forEach(function(word) {
        word = word.replace(/[\.:,!]*$/,'');
        if (word.length > 2) {
          wordCounts[word] = wordCounts[word] || 0;
          wordCounts[word]++;        
        }
      });
      for (var w in wordCounts) {
        emit([tweet.user.id, w, tweet.id], wordCounts[w]);
      }
    }
  });
};
