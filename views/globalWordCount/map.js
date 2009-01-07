function(doc) {
  doc.tweets && doc.tweets.forEach(function(tweet) {
    if (tweet.id && tweet.text) {
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
        emit([w, tweet.id], wordCounts[w]);
      }
    }
  });
};
