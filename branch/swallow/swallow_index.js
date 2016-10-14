$(function(){

	var tpl;
	$.get('./tpl.data', function(data) {
		/*optional stuff to do after success */
		tpl = data;
		resolve();
	});

	var resolve = function() {
		var model = {
			title : "地上最强的人",
			article : "少年终将成为神话"
		};
		source = tpl;
		console.log(source);
		Swallow.render(source, model);	
	};

});
