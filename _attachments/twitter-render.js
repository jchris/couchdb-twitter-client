RegExp.escape = function(text) {
  if (!arguments.callee.sRE) {
    var specials = [
      '/', '.', '*', '+', '?', '|',
      '(', ')', '[', ']', '{', '}', '\\'
    ];
    arguments.callee.sRE = new RegExp(
      '(\\' + specials.join('|\\') + ')', 'g'
    );
  }
  return text.replace(arguments.callee.sRE, '\\$1');
}

function TwitterRender(tw) {
  function prettyDate(time){
  	var date = new Date(time),
  		diff = (((new Date()).getTime() - date.getTime()) / 1000),
  		day_diff = Math.floor(diff / 86400);

    // if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 ) return;

  	return day_diff < 1 && (
  			diff < 60 && "just now" ||
  			diff < 120 && "1 minute ago" ||
  			diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
  			diff < 7200 && "1 hour ago" ||
  			diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
  		day_diff == 1 && "yesterday" ||
  		day_diff < 7 && day_diff + " days ago" ||
  		day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago" ||
  		day_diff < 730 && Math.ceil( day_diff / 31 ) + " months ago" ||
  		Math.ceil( day_diff / 365 ) + " years ago";
  };
  
  function linkify(body, term) {
    // this is almost reliable...
    // if (term) {
    //   body = body.replace(new RegExp('[^\\@\\#]'+RegExp.escape(term),'i'),
    //     function(t) {
    //       return '<strong>'+t+'</strong>';
    //   });
    // }
    return body.replace(/https?\:\/\/\S+/g,function(a) {
      return '<a target="_blank" href="'+a+'">'+a+'</a>';
    }).replace(/\@([\w\-]+)/g,function(user,name) {
      return '<a target="_blank" href="http://twitter.com/'+name+'">'+user+'</a>';
    }).replace(/\#([\w\-]+)/g,function(word,term) {
      return '<a target="_blank" href="http://search.twitter.com/search?q='+encodeURIComponent(term)+'">'+word+'</a>';
    });
  };
  
  function a(href, text, cls, xtr) {
    return '<a target="_blank" '+(cls?'class="'+cls+'"':'')+' href="'+href+'" '+(xtr||'')+'>'+text+'</a>'
  };
  
  function tweetUserDetails() {
    var li = $(this).parent('li');
    var userid = li.find('h3').attr('class');
    // todo use a local hash to get userid from screen_name if we have it
    if (userid && userid != 'undefined') { 
      tw.userInfo(userid, function(user) {
        li.append('<div class="user-details"><dl><dt>Location:</dt><dd>'
        + user.location
        +'</dd><dt>Bio:</dt><dd>'
        + linkify(user.description)
        +'</dd>'+(user.url?('<dt>Web:</dt><dd>'
        + a(user.url, user.url)
        + '</dd>'):'')+'<dt>Followers:</dt><dd>'
        + a('http://twitter.com/'+user.screen_name+'/followers', user.followers_count)
        +'</dd></dl><div class="word-cloud">Loading word cloud...</div><br class="clear"></br></div>');
        tw.userWordCloud(userid, function(cloud) {
          var html = $.map(cloud,function(row) {
            return '<span title="'+row[1]+'" style="font-size:'+(parseInt(row[1])+8)+'px">'+linkify(row[0])+'</span>';
          }).join(' ');
          li.find('.word-cloud').html(html);
        });
      });
      li.find('img.profile').unbind('click').click(function() {
        li.find('.user-details').toggle();
      });
    }
  };
  
  function deHex(st) {
    return parseInt(st, 16);
  };
  
  function toColor(r,g,b) {
    return 'rgb('+r+', '+g+', '+b+')';
  };
  
  function colorForWord(word, dim) {
    var key = word.toString() + dim.toString();
    if (colorCache[key]) {
      return colorCache[key]
    }
    
    var color = hex_md4(word).substring(0,6);
    
    var rgb = [(color.substring(0,2)),(color.substring(2,4)),(color.substring(4,6))];
    for (var i=0; i < rgb.length; i++) {
      rgb[i] = Math.floor((deHex(rgb[i])) / dim);
    };
    colorCache[key] = toColor(rgb[0], rgb[1], rgb[2]);
    return colorCache[key];
  }
  
  var colorCache = {};
  
  var publicMethods = {
    renderTimeline : function(tweets, userid) {
      $("#tweets ul").html($.map(tweets, function(tweet) {
        var cls = false, color, dim, bright;
        if (userid && tweet.in_reply_to_user_id && tweet.in_reply_to_user_id == userid) {
          cls = "reply";
        } else if (tweet.search) {
          // cls = "search";
          color = colorForWord(tweet.search, 2.75);
          dim = colorForWord(tweet.search, 3.5);
          bright = colorForWord(tweet.search, 1.5);
        }
        return '<li'+(cls?' class="'+cls+'"':'')
          + (color ? ' style="border:4px solid '+color+'; background:'+dim+';"' : '')
          + '><img title="Click for details" class="profile" src="'
          + tweet.user.profile_image_url + '" />'
          + (tweet.search ? a('http://search.twitter.com/search?q='+encodeURIComponent(tweet.search),'#'+decodeURIComponent(tweet.search),'search',(bright?'style="color:'+bright+'"':'')) : '')
          + '<h3 class="'+tweet.user.id+'"><a target="_blank" class="user" title="'
          + tweet.user.screen_name + '" href="http://twitter.com/'
          + tweet.user.screen_name + '">'
          + tweet.user.name
          +'</a></h3>'
          + '<p>'+linkify(tweet.text) + '</p>'
          + ' <span class="created_at">'
          + a('http://twitter.com/'+tweet.user.screen_name+'/status/'+tweet.id, prettyDate(tweet.created_at))  
          + (tweet.source?' via ' + tweet.source:'')
          + '</span><br class="clear"/></li>'; 
      }).join(''));
      $("#tweets ul .created_at a").attr("target","_blank");
      $("#tweets img.profile").click(tweetUserDetails);
    }
  };
  return publicMethods;
};