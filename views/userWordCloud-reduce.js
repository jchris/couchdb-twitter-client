function(keys, values, rr) {
  if (rr) {
    log("rr")
    log(values)
    return sum(values);
  } else {
    // operate on the unique set of keys
    var k, v, seen = {}, result = 0;
    for (var i = keys.length - 1; i >= 0; i--){
      k = keys[i][0];
      v = values[i];
      log(k);
      log(v);
      if (!seen[k]) {
        result = result + v;
        seen[k] = true;        
      }
    };
    log("result "+result);
    return result;
  }
};