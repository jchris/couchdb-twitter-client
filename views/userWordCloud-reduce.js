function(keys, values, rr) {
  if (rr) {
    return sum(values);
  } else {
    // operate on the unique set of keys
    var k, v, seen = {}, result = 0;
    for (var i = keys.length - 1; i >= 0; i--){
      k = keys[i];
      v = values[i];
      if (!seen[k]) {
        result = result + v;
        seen[k] = true;        
      }
    };
    return result;
  }
};