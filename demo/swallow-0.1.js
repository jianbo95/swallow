/**
 * swallow : 前端模板引擎
 * version : 0.1
 * author : jianbo
 */

(function(){

	var outList = ["$out='';", "$out+=", ";", "$out"];
	var concat = "$out+=text;return $out;";
	var print = "function(){"
	+      "var text=''.concat.apply('',arguments);"
	+       concat
	+  "}";

	// 配置
	var Config = {
		compress : true
	};

	// 打印错误信息
	var error = function(str) {
		console.log("Error: "+str);
	}

	// 去除标签中的换行
	var compress = function(source) {
		if(!Config.compress) {
			return source;
		}
		var code = source;
		// 对source进行预处理
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
		};
		return code;
	};
	
	// 数据模型映射模块
	var M = {
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
		map : function(name) {
			if (this.loopTimes == 0) {
				// 循环外部
				return this.model + "." + name;
			} else {
				// 循环内部
				return name;
			}
		}
	}; // End M

	// 数组循环
	var foreach = function(list, handler){
		if(list != undefined) {
			for (var i = 0; i < list.length; i++) {
				handler(list[i]);
			}
		}
	};

	// 语法分析器
	var parser = function (code) {

		code = code.replace(/^\s/, '');

		var split = code.split(' '); // 分离逻辑代码
		var key = split.shift(); // 获取逻辑关键字
		var args = split.join(' '); // 获取参数

		switch (key) {

			case 'if':

				var condition = M.map(args);
				
				code = 'if(' + condition + '){';
				break;

			case 'else':
				
				if (split.shift() === 'if') {
					var condition = split.join(' ');
					condition = M.map(condition);
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
				
				var param   = value + ',' + index;
				
				if (as !== 'as') {
					object = '[]';
				}

				object = M.map(object);

				code =  '$each(' + object + ',function(' + param + '){';

				M.loop(); // 开启循环
				break;

			case '/each':
				if(code.replace('/each', "") != "") {
					error("{{/each }} is contain blank!");
				}
				if(args.replace(/\s/, "") != "") {
					error("{{/each "+args+"}} is invalid!");
				}
				M.loopClose(); // 关闭循环
				code = '});';
				break;

			case 'echo':
				code = 'print(' + args + ');';
				break;

			default:
				var param = M.map(code);
				code = '=' + param;
				break;
		}
		
		return code;
	};

	// 将逻辑语句写进函数里执行
	function logic (code) {

		code = parser(code);
		
		// 输出语句. 编码: <%=value%> 不编码:<%=#value%>
		// <%=#value%> 等同 v2.0.3 之前的 <%==value%>
		if (code.indexOf('=') === 0) {

			code = code.replace(/^=[=#]?|[\s;]*$/g, '');

			code = "String(" + code + ")";

			code = outList[1] + code + outList[2];

		}
		
		return code + "\n";
	}; // end logic

	function html(code) {
		// 字符串转义
		var stringify = function (code) {
			return "'" + code
			// 单引号与反斜杠转义
			.replace(/('|\\)/g, '\\$1')
			// 换行符转义(windows + linux)
			.replace(/\r/g, '\\r')
			.replace(/\n/g, '\\n') + "'";
		}
		code = outList[1] + stringify(code) + outList[2] + "\n";
		return code;
	};

	function compiler (codeArray, model) {

		var headerCode = "'use strict';var $out;";

		var mainCode = outList[0];

		var footerCode = "return new String(" + outList[3] + ");"

		for (var i = 0; i < codeArray.length; i++) {
			var code = codeArray[i];

			var $0 = code[0];
			var $1 = code[1];

			// code: [html]
			if (code.length === 1) {
				mainCode += html($0);
			// code: [logic, html]
			} else {
				mainCode += logic($0);
				if ($1) {
					mainCode += html($1);
				}
			}
		};
		
		var code = headerCode + mainCode + footerCode;

		console.log(code);

		var val = new Function('$model', '$each', code);
		var result = val(model, foreach);

		//return code;
		return String(result);
	};
	
	var swallow = function(){

		var openTag = "{{";
		var closeTag = "}}";
			
		// code 与 tag分离
		var getCodeStream = function(source) {
			var codeStream = new Array();
			foreach(source.split(openTag), function(temp) {
				// list: [html]
				// list: [logic, html] 
				// closeTag的前面一定是逻辑语句
				var list = temp.split(closeTag);
				codeStream.push(list);
			});
			return codeStream;
		};
		
		var render = function(source, module) {
			var code = compress(source);
			var codeArray = getCodeStream(code);
			var result = compiler(codeArray, module);
			return result;
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
