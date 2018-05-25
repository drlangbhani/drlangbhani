
//Extenders

ko.extenders.formatTime = function(target){

    var f = {
        '12': "h:mm a",
        '24': "HH:mm"
    }

    target.extend({ notify: 'always' });

    target.formatted = ko.computed({
        read: function(){
            var clock = vm ? vm.clock() : "12";

            return target() == "" ? "" : moment.utc( target() * 1000 ).format(f[clock]);
        },
        write: function(d){
            
            //Parse the string
            //time is created using today's date, we subtract midnight today to make the time relative to the unix epoch.
            d = moment.utc( d, "h:mm a" ).unix() - moment.utc( "0000", "h:mm a" ).unix(); 

            //Write the value back to the underlying observable
            target( d );
            }
        }).extend({ notify: 'always' });

    return target;

}


ko.extenders.formatDuration = function(target, format) {

    target.extend({ notify: 'always' });

    target.formatted = ko.computed({
    	read: function(){
    		return target() == "" ? "" : moment.duration( target() ).asMinutes() + " minute" + (moment.duration( target() ).asMinutes() != 1 ? "s" : "");
    	},
    	write: function(d){
    		
    		//Parse the string
    		d = parseDuration( d ); //milliseconds

	        //Write the value back to the underlying observable
    		target( d );
    		}
    	}).extend({ notify: 'always' });

    return target;
};

//Extenders
ko.extenders.formatDistance = function(target, format) {

    var f = "0,0[.]00";

    target.extend({ notify: 'always' });

    target.formatted = ko.computed({
        read: function(){
            if(vm && vm.units() == "miles"){
                return target() == "" ? "" : numeral( (target() / 1609.34) ).format(f) + " miles";
            }else{
                return target() == "" ? "" : numeral( (target() / 1000) ).format(f) + " kms";
            }
        },
        write: function(d){
            
            //Parse the string
            d = parseDistance( d ); //metres

            //Write the value back to the underlying observable
            target( d );    
            }
        }).extend({ notify: 'always' });

    return target;
};


ko.extenders.truthy = function(target, format) {

    target.truthy = ko.computed(
    		function(){return String(target()).toLowerCase() === "true";}
        	);

    return target;
};


ko.extenders.range = function(target, options){

	var defaults = {
					max: Number.MAX_VALUE,
					min: Number.MIN_VALUE		
					}

	options = $.extend(defaults, options)

	target.extend({ notify: 'always' });

	var result = ko.computed({
		read: target,
		write: function(v){

            if(v == "" || v == 0){
                target( "" );
                return; //Quick way to let default values through
            }
			
			//Clamp the max value
            var max = typeof(options.max) == "function" ? options.max() : options.max;
            v = Math.min( v, max );

            //Clamp the min value
            var min = typeof(options.min) == "function" ? options.min() : options.min;
            v = Math.max( v, min );

			target( v );	
		}
	}).extend({ notify: 'always' });

	result(target());

	return result;

}



function parseDuration(str){


  var duration = /(-?\d*\.?\d+(?:e[-+]?\d+)?)\s*([a-zμ]*)/ig;

    /**
     * conversion ratios
     */
    var parse = {};
    parse.nanosecond =
    parse.ns = 1 / 1e6

    parse.μs =
    parse.microsecond = 1 / 1e3

    parse.millisecond =
    parse.ms = 1

    parse.second =
    parse.sec =
    parse.s = parse.ms * 1000

    parse.minute =
    parse.min =
    parse.m = parse.s * 60

    parse.hour =
    parse.hr =
    parse.h = parse.m * 60

    parse.day =
    parse.d = parse.h * 24

    parse.week =
    parse.wk =
    parse.w = parse.d * 7

    parse.month = parse.d * (365.25 / 12)

    parse.year =
    parse.yr =
    parse.y = parse.d * 365.25

  var result = 0
  // ignore commas
  str = str.replace(/(\d),(\d)/g, '$1$2')
  str.replace(duration, function(_, n, units){
    units = parse[units]
      || parse[units.toLowerCase().replace(/s$/, '')]
      || parse.minute //default unit is minutes
    result += parseFloat(n, 10) * units
  })
  return result
}


function parseDistance(str){


  var distance = /(-?\d*\.?\d+(?:e[-+]?\d+)?)\s*([a-zμ]*)/ig;

    /**
     * conversion ratios
     */
    var parse = {};
    parse.metre =
    parse.meter =
    parse.m = 1;

    parse.kilometre =
    parse.kms =
    parse.km =
    parse.k = parse.m * 1000;

    parse.miles =
    parse.mile = 
    parse.mi = parse.m * 1609.34;


  var result = 0
  // ignore commas
  str = str.replace(/(\d),(\d)/g, '$1$2')
  str.replace(distance, function(_, n, units){
    units = parse[units]
      || parse[units.toLowerCase().replace(/s$/, '')]
      || parse[vm.units()] //use current viewmodel units
    result += parseFloat(n, 10) * units
  })
  return result
}




