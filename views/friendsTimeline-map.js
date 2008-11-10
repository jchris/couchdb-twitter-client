function(doc) {
  if (doc.friendsTimelineOwner && doc.tweets) {
    var k, t;
    for (k in doc.tweets) {
      t = doc.tweets[k];
      emit([doc.friendsTimelineOwner, t.id], t);
    }
  }
};
