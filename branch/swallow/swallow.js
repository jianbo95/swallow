/**
 * swallow : 前端模板引擎
 * version : 0.2
 * author : jianbo
 */

// 定义工具对象
var util = {};

// 数组循环
util.foreach  = function(list, handler){
	if(list != undefined) {
		for (var i = 0; i < list.length; i++) {
			handler(list[i]);
		}
	}
};

(function(Util){

	var foreach = Util.foreach;

	var swallow = function(){
		self = new object();

		/**
		 * 获取代码数组
		 */
		var getCodeArray = function(source) {
			var codes = new Array();
			foreach(source.split(openTag), function(closeSource) {
				// list: [html]
				// list: [logic, html] 
				// closeTag的前面一定是逻辑语句
				var list = closeSource.split(closeTag);
				codes.push(list);
			});
			return codes;
		};

		self.render = function(source, model) {
			// 获取代码数组
			var codeArray = getCodeArray(source);
			// 渲染模板
			var result = compile(codeArray, model);
			return result;
		};

		return self;
	}();

	// 导出Swallow
	if (typeof exports === 'object' && exports && typeof exports.nodeName !== 'string') {
		exports.Swallow = swallow; // CommonJS
	} else if (typeof define === 'function' && define.amd) {
		define(['exports'], function(){
			return swallow;
		}); // AMD
	} else {
		window.Swallow = swallow;
	}

}(util));
