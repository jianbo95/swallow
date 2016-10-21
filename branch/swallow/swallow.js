/**
 * swallow : 前端模板引擎
 * version : 0.2
 * author : jianbo
 * time : 2016/10/21
 */

/**
 * 定义配置对象
 */
var Config = {};

Config.openTag = "{{"; // 左标签
Config.closeTag = "}}"; // 右标签
Config.compress = true; // 去除标签的占行

/**
 * 定义工具对象
 */
var Util = {};

// 数组循环
Util.foreach  = function(list, callback){
	if(list != undefined) {
		for (var i = 0; i < list.length; i++) {
			callback(list[i]);
		}
	}
};

// 打印错误信息
Util.error = function(str) {
	console.log("Error: "+str);
}

/**
 * 去除标签中的换行
 */
Util.compress = function(source, isCompress) {
	if(!isCompress) {
		return source;
	}
	var code = source;
	// 去除{{}}后面的回车符
	// 匹配开头的tab符，空格符，和末尾的回车符
	var ln = "[\s ]*\\r?\\n";
	var regList = [
		"[\t ]*{{each [^\r\n]*}}" + ln,
		"[\t ]*{{/each}}" + ln,
		"[\t ]*{{if [^\r\n]*}" + ln,
		"[\t ]*{{else if [^\n]*}" + ln,
		"[\t ]*{{/if}}" + ln,
		"[\t ]*{{else}}" + ln,
		"[\t ]*{{set [^\r\n]*}}" + ln,
	];
	for (var i = 0; i < regList.length; i++) {
		var regStr = regList[i];
		var mode = "gm";
		var reg = new RegExp(regStr, mode);
		var matchs = code.match(reg);
		if(matchs != undefined) {
			for (var j = 0; j < matchs.length; j++) {
				var match = (matchs[j]);
				// 去除结尾的换行符
				var match2 = match.replace(/\r?\n$/, "");
				// 去除开头的空白符
				var newMatch = match2.replace(/^[\t ]*/, "");
				code = code.replace(match, newMatch);
			};
		}
	}
	return code;
}; // end compress

// 数据模型映射模块
Util.Map = {
	model : "$model", // 模型变量名
	loopTimes : 0, // 记录循环次数
	loop : function() {
		this.loopTimes ++;
	},
	loopClose : function() {
		this.loopTimes --;
	},
	/**
	 * [map 获取模型映射]
	 * @param  name [变量名]
	 * @return      [模型.变量名]
	 */
	toMap : function(name) {
		if (this.loopTimes == 0) {
			// 循环外部
			return this.model + "." + name;
		} else {
			// 循环内部
			return name;
		}
	}
}; // End Map

// 语法分析器
Util.parser = function (code) {
	var Map = Util.Map;

	var split = code.split(' '); // 分离逻辑代码
	var key = split.shift(); // 获取逻辑关键字
	var args = split.join(' '); // 获取参数

	switch (key) {

		case 'if':
			var condition = Map.toMap(args);
			code = 'if(' + condition + '){';
			break;

		case 'else':
			if (split.shift() === 'if') {
				var condition = split.join(' ');
				condition = Map.toMap(condition);
				code = '}else if(' + condition + '){';
			} else {
				code = '}else{';
			}
			break;

		case '/if':
			code = '}';
			break;

		case 'each':
			
			var object = split[0] || '$data';
			var as     = split[1] || 'as';
			var value  = split[2] || '$value';
			var index  = split[3] || '$index';
			
			if (as !== 'as') {
				Util.error("{{"+code+"}} is invalid!");
			}

			object = Map.toMap(object);
			code =  '$each(' + object + ',function(' + value + ',' + index+ '){\n';
			code += 'var $value = '+value +';\n';
			code += 'var $index = '+index +';';
			Map.loop(); // 开启循环
			break;

		case '/each':

			if(code != "/each") {
				Util.error("{{"+code+"}} is invalid!");
			}
			Map.loopClose(); // 关闭循环
			code = '});';
			break;

		case 'set':
			code = Map.toMap(args);
			if(Map.loopTimes != 0) {
				code = '$value.' + code;
			}
			break;

		default:
			var param = Map.toMap(code);
			code = '=' + param;
			break;
	}
	return code;
};

(function(Util, Config){

	var foreach = Util.foreach;

	var swallow = function(){
		// 返回self对象
		self = {};
		
		// 渲染代码段
		var resolveElement = function(element) {
			// 逻辑语句
			var logic = function(code) {
				code = Util.parser(code);
				if (code.indexOf('=') === 0) {
					code = "$out+" + code + ";";
				}
				return code + "\n";
			}; // end logic

			// html语句
			var html = function(code) {
				// 字符串转义
				var stringify = function (code) {
					return "'" + code
					// 单引号与反斜杠转义
					.replace(/('|\\)/g, '\\$1')
					// 换行符转义(windows + linux)
					.replace(/\r/g, '\\r')
					.replace(/\n/g, '\\n') + "'";
				}
				code = "$out+=" + stringify(code) + ";" + "\n";
				return code;
			};

			if(element.type == "html") {
				return html(element.code);
			} else {
				return logic(element.code);
			}
		}

		/**
		 * 根据标签分割代码
		 */
		var splitCodeByTag = function(source) {
			var codes = new Array();
			var codeArray = new Array();

			// class
			var element = function(code, type) {
				this.code = code;
				this.type = type;
			};
			var getHtml = function(code) {
				return new element(code, "html");
			};
			var getLogic = function(code) {
				return new element(code, "logic");
			};

			foreach(source.split(Config.openTag), function(closeSource) {
				// list: [html]
				// list: [logic, html] 
				// closeTag的前面一定是逻辑语句
				var list = closeSource.split(Config.closeTag);
				if (list.length === 1) {
					codeArray.push(getHtml(list[0]));
				} else {
					codeArray.push(getLogic(list[0]));
					if (list[1]) {
						codeArray.push(getHtml(list[1]));
					}
				}
			});
			
			return codeArray;
		};

		/**
		 * 渲染模板
		 * @param  codeArray 代码数组
		 * @param  model     数据模型
		 * @return result
		 */
		var compile = function(codeArray, model) {

			var createMainCode = function(){
				var mainCode = "";
				for (var i = 0; i < codeArray.length; i++) {
					var element = codeArray[i];
					mainCode += resolveElement(element);
				};
				return mainCode;
			};

			var start = "'use strict';var $out = '';";
			var end = "return String($out)";
			
			var code = start + createMainCode() + end;

			var run = new Function('$model', '$each', code);
			var result = String(run(model, foreach));
			return result;
		};

		self.render = function(source, model) {
			var code = Util.compress(source, Config.compress);
			// 获取代码数组
			var codeArray = splitCodeByTag(code);
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

}(Util, Config));