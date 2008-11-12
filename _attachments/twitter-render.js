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
  
  function linkify(body) {
    return body.replace(/https?\:\/\/\S+/g,function(a) {
      return '<a target="_blank" href="'+a+'">'+a+'</a>';
    }).replace(/\@([\w\-]+)/g,function(user,name) {
      return '<a target="_blank" href="http://twitter.com/'+name+'">'+user+'</a>';
    }).replace(/\#([\w\-]+)/g,function(word,term) {
      term = term.split(/-/).join(' ');
      return '<a target="_blank" href="http://search.twitter.com/search?q='+encodeURIComponent(term)+'">'+word+'</a>';
    });
  };
  
  function a(href, text, cls) {
    return '<a target="_blank" '+(cls?'class="'+cls+'"':'')+' href="'+href+'">'+text+'</a>'
  };
  
  function tweetUserDetails() {
    var li = $(this).parent('li');
    var userid = li.find('h3').attr('class');
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
          return '<span title="'+row[1]+'" style="font-size:'+(parseInt(row[1])+5)+'px">'+linkify(row[0])+'</span>';
        }).join(' ');
        li.find('.word-cloud').html(html);
      });
    });
    li.find('img.profile').unbind('click').click(function() {
      li.find('.user-details').toggle();
    });
  };
  
  var publicMethods = {
    renderTimeline : function(tweets, userid) {
      $("#tweets ul").html($.map(tweets, function(tweet) {
        var reply = (userid && tweet.in_reply_to_user_id && tweet.in_reply_to_user_id == userid);
        return '<li'+(reply?' class="reply"':'')
          + '><img title="Click for details" class="profile" src="'
          + tweet.user.profile_image_url + '" />'
          + '<h3 class="'+tweet.user.id+'"><a target="_blank" class="user" title="'
          + tweet.user.screen_name + '" href="http://twitter.com/'
          + tweet.user.screen_name + '">'
          + tweet.user.name
          +'</a></h3>'
          + linkify(tweet.text)
          + ' <span class="created_at">'
          + a('http://twitter.com/'+tweet.user.screen_name+'/status/'+tweet.id, prettyDate(tweet.created_at))  
          + ' via '
          + tweet.source  
          + '</span><br class="clear"/></li>'; 
      }).join(''));
      $("#tweets ul .created_at a").attr("target","_blank");
      $("#tweets img.profile").click(tweetUserDetails);
    }
  };
  return publicMethods;
};