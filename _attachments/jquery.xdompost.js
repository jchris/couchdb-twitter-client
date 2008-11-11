// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License.  You may obtain a copy
// of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
// License for the specific language governing permissions and limitations under
// the License.

// Usage:
// $.xdom.post('http://example.com/post-to-here',{"foo":"bar"});
// Sends a POST to http://example.com/post-to-here with content foo=bar

(function($) {
  $.xdom = $.xdom || {};
  
  function now(){
  	return +new Date;
  }
  
  var ifc = now();
  
  $.fn.extend($.xdom,{
    post : function(url, data) {
      var ifr = "ifr" + ifc++;
    	var iid = 'xdom_' + ifr;
    	$('body').append('<iframe id="'+iid+'" name="'+iid+'"/>');
    	var iframe = $('#'+iid)[0];
    	var op8 = $.browser.opera && window.opera.version() < 9;
    	if ($.browser.msie || op8) iframe.src = 'javascript:false;document.write("");';
    	$(iframe).css({ position: 'absolute', top: '-1000px', left: '-1000px' });
    	
    	var fid = 'form_' + ifr;
    	$('body').append('<form id="'+fid+'" name="'+fid
    	  + '" method="POST" action="'+url+'" target="'+iid+'"/>');
    	var form = $('#'+fid)[0];
    	$(form).css({position: 'absolute', top: '-1000px', left: '-1000px' });
    	
    	$.each(data, function(key, value) {
    	  var inid = 'input_'+ifr+'_'+key;
    		$(form).append('<input id="' + inid + '" name="'
    		  + key +'" type="text"/>');
  		  $('#'+inid).val(value);
    	});
    	
    	form.submit();
    }
  });
})(jQuery);
