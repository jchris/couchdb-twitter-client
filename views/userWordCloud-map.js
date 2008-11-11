function(doc) {
  doc.tweets && doc.tweets.forEach(function(tweet) {
    var wordCounts = {};
    var words = tweet.text.toLowerCase().split(/\W/);
    words.forEach(function(word) {
      if (word.length > 1) {
        wordCounts[word] = wordCounts[word] || 0;
        wordCounts[word]++;        
      }
    });
    for (var w in wordCounts) {
      emit([tweet.user.id, w, tweet.id], wordCounts[w]);
    }
  });
};
