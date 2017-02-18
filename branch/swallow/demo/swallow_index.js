$(function(){

	var tpl;
	$.get('./tpl.data', function(data) {
		/*optional stuff to do after success */
		tpl = data;
		resolve();
	});

	var resolve = function() {
		model = {
			title : "史上最强的人",
			article : "天将降大任于斯人也，必先苦其心志",
			name : "LiangPeihua"
		};
		model.nameArray = [
			{name : "sword", age : 9},
			{name : "huang", age : 9},
			{name : "wave", age : 9}
		];
		model.Catalog = [
			{	
				catalog : "Chinese",
				name : "中文", 
				count : 3, 
				sonCatalog : [
					{name : "小说", count : 4},
					{name : "古诗", count : 5, sonCatalog :[
						{name : "天龙八部", count : 2},
						{name : "笑傲江湖", count : 1}
					]}
				]
			}, {
				catalog : "English",
				name : "英文",
				count : 4,
				sonCatalog : null
			}
		];
		source = tpl;

		var result = Swallow.render(source, model);
		$("#source").val(source);
		$("#target").val(result);
	};

});
