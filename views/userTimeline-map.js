function(doc) {
  if (doc.userTimeline) {
    emit(doc.userTimeline, null)
  }
};
