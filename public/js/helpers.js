module.exports = {
  splitDate: function(str){
		var t = str.toString();
		var c = t.slice(0,15);
		return c;
		},
	splitDate2: function(str){
		a = new Date(str);
		var b = a.getDate();
		if (b < 10) b = '0' + a.getDate();
		var c = a.getMonth()+1;
		if (c < 10) c =  '0' + a.getMonth()+1;
		var d = '' + b + c + a.getFullYear();
		return d;
		}
		}

/*
//var d = new Date().toISOString().replace(/T.+/,'');
	var divide = d.split('-');
   // var date = divide[0]+divide[1]+divide[2];


*/		
		
		
		
/*var register = function(Handlebars) {
  var helpers = {
    // put all of your helpers inside this object
    splitDate: function(str){
		var t = str.split("G");
		return t[0];
		}
  };

  if (Handlebars && typeof Handlebars.registerHelper === "function") {
    // register helpers
    for (var prop in helpers) {
        Handlebars.registerHelper(prop, helpers[prop]);
    }
  } else {
      // just return helpers object if we can't register helpers here
      return helpers;
  }

};

module.exports.register = register;
module.exports.helpers = register(null);*/   