/**
 * swallow : 前端模板引擎
 * version : 0.1
 * author : 
 */

(function(){

	// 数组循环
	var foreach = function(list, handler){
		for (var i = 0; i < list.length; i++) {
			handler(list[i]);
		};
	}
	
	var swallow = function(){

		var openTag = "{{";
		var closeTag = "}}";
			
		// code 与 tag分离
		var getCodeStream = function(source) {
			var codeStream = new Array();
			var code = new String(source);
			var closeList = code.split(openTag);
			var flag = true;
			foreach(closeList, function(temp) {
				// list: [html]
		        // list: [logic, html] 
		        // closeTag的前面一定是逻辑语句
				var list = temp.split(closeTag);
				codeStream.push(list);
			});
			return codeStream;
		};

		var render = function(source, module) {
			var codeStream = getCodeStream(source);
			console.log(codeStream);
		};

		return {
			render : render
		}
	}();

	if (typeof exports === 'object' && exports && typeof exports.nodeName !== 'string') {
		exports.Swallow = swallow; // CommonJS
	} else if (typeof define === 'function' && define.amd) {
		define(['exports'], function(){
			return swallow;
		}); // AMD
	} else {
		window.Swallow = swallow;
	}

}());
