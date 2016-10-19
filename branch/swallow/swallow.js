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
    var eachLoop = 0; // 记录循环次数

	// 数组循环
	var foreach = function(list, handler){
		if(list != undefined) {
			for (var i = 0; i < list.length; i++) {
				handler(list[i]);
			}
		}
	}

	// 语法分析器
	var parser = function (code) {

	    code = code.replace(/^\s/, '');

	    var split = code.split(' '); // 分离逻辑代码
	    var key = split.shift(); // 获取逻辑关键字
	    var args = split.join(' '); // 获取参数

	    switch (key) {

	        case 'if':

	        	console.log(args);

	            code = 'if(' + args + '){';
	            break;

	        case 'else':
	            
	            if (split.shift() === 'if') {
	                split = ' if(' + split.join(' ') + ')';
	            } else {
	                split = '';
	            }
	            
	            code = '}else' + split + '{';
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

	            // 从$model中取得变量
	            if (eachLoop == 0) {
	        		// 闭合，外部无循环
	        		object = "$model." + object;
	        	} else {
	        		// 未闭合，在循环内部
	        		object = object;
	        		// 在循环内部获取外部变量? 不太可能
	        	}

	            code =  '$each(' + object + ',function(' + param + '){';

	            eachLoop ++;
	            break;

	        case '/each':
	        	eachLoop --;
	            code = '});';
	            break;

	        case 'echo':
	            code = 'print(' + args + ');';
	            break;

	        default:
	        	var param;
	        	if (eachLoop == 0) {
	        		// 闭合，外部无循环
	        		param = "$model." + code;
	        	} else {
	        		// 未闭合，在循环内部
	        		param = code;
	        		// 在循环内部获取外部变量? 不太可能
	        	}
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
	} // end logic

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
	}

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
	}
	
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
			var codeArray = getCodeStream(source);
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
