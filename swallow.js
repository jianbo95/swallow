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

    var include = "function(filename,data){"
    +      "data=data||$data;"
    +      "var text=$utils.$include(filename,data,$filename);"
    +       concat
    +   "}";

	// 数组循环
	var foreach = function(list, handler){
		for (var i = 0; i < list.length; i++) {
			handler(list[i]);
		};
	}

	// 语法分析器
	var parser = function (code) {

	    code = code.replace(/^\s/, '');

	    var split = code.split(' ');
	    var key = split.shift();
	    var args = split.join(' ');

	    switch (key) {

	        case 'if':

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
	            
	            code =  '$each(' + object + ',function(' + param + '){';
	            break;

	        case '/each':

	            code = '});';
	            break;

	        case 'echo':

	            code = 'print(' + args + ');';
	            break;

	        case 'print':
	        case 'include':

	            code = key + '(' + split.join(',') + ');';
	            break;

	        default:
	        	code = '=' + code;
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

	        var escapeSyntax = escape && !/^=[=#]/.test(code);

	        code = code.replace(/^=[=#]?|[\s;]*$/g, '');

	        code = "$string(" + code + ")";

	        code = outList[1] + code + outList[2];

	    }
	    
	    // 提取模板中的变量名
	    // var variableList = getVariable(code);
	    // forEach(variableList, function (name) {
	        
	    //     // name 值可能为空，在安卓低版本浏览器下
	    //     if (!name || uniq[name]) {
	    //         return;
	    //     }

	    //     var value;

	    //     // 声明模板变量
	    //     // 赋值优先级:
	    //     // [include, print] > utils > helpers > data
	    //     if (name === 'print') {

	    //         value = print;

	    //     } else if (name === 'include') {
	            
	    //         value = include;
	            
	    //     } else if (utils[name]) {

	    //         value = "$utils." + name;

	    //     } else if (helpers[name]) {

	    //         value = "$helpers." + name;

	    //     } else {

	    //         value = "$data." + name;
	    //     }
	        
	    //     headerCode += name + "=" + value + ",";
	        
	    // });
	    
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

	function compiler (codeArray, module) {

	    var headerCode = "'use strict';";

	    var $data = module;
	    var model = "$each=foreach,nameArray=$data.nameArray,Catalog=$data.Catalog,$out='';";
	    headerCode += model;

	    var mainCode = outList[0];

    	var footerCode = "return new String(" + outList[3] + ");"

    	for (var i = 0; i < codeArray.length; i++) {
	        var code = codeArray[i];
	        // console.log(code);
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

		var val = new Function(code);
		console.log(val());

		return code;
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
			var codeArray = getCodeStream(source);
			// html与逻辑语法分离
			var code = compiler(codeArray, module);

			console.log(code);
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
