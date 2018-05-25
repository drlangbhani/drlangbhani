//Create View Model
function viewModel() {

	var self = this;

	//Defaults	
	var DISTANCE			= 20000, 		//20 Kms
		DISTANCE_MIN		= 2000,			//.5 Kms
		DISTANCE_MAX		= 100000,		//100 Kms
		DISTANCE_DEFAULT	= 50000,		//50 Kms

		DURATION			= 1800000,		//30 minutes
		DURATION_MIN		= 60000,		//1 minute
		DURATION_MAX		= 7200000,		//2 hours
		DURATION_DEFAULT	= 3600000,		//1 hour

		TIME				= "27000",		  	//7:30 am
		TIME_MIN			= "21600",			//6:00 am
		TIME_MAX			= "72000",			//8:00 pm
		TIME_DEFAULT		= "30600"			//8:30 am

		BOOLEAN_VALUES		= ["No (inherited)", "Yes", "No"]

	//Units
	var UNITS 				= "kms",
		CLOCK				= "12"


	self.units = ko.observable(UNITS);
	self.clock = ko.observable(CLOCK);


	self.distance 	= ko.observable(DISTANCE)
						.extend({
							range: {min: DISTANCE_MIN, max: DISTANCE_MAX},
							formatDistance: '',
							notify: "always"
						});
	self.distanceMin = ko.observable(DISTANCE_MIN).extend({formatDistance: ''});
	self.distanceMax = ko.observable(DISTANCE_MAX).extend({formatDistance: ''});
	self.distanceDefault	= ko.observable(DISTANCE_DEFAULT).extend({formatDistance: ''});

	self.duration 	= ko.observable(DURATION)
						.extend({
							range: {min: DURATION_MIN, max: DURATION_MAX},
							formatDuration: ''
						});
	self.durationMin = ko.observable(DURATION_MIN).extend({formatDuration: ''});
	self.durationMax = ko.observable(DURATION_MAX).extend({formatDuration: ''});
	self.durationDefault = ko.observable(DURATION_DEFAULT).extend({formatDuration: ''});


	self.time = ko.observable(TIME)
						.extend({
							range: {min: TIME_MIN, max: TIME_MAX},
							formatTime: ''
						});
	self.timeMin = ko.observable(TIME_MIN).extend({formatTime: '', notify: "always"});
	self.timeMax = ko.observable(TIME_MAX).extend({formatTime: '', notify: "always"});
	self.timeDefault	= ko.observable(TIME_DEFAULT).extend({formatTime: ''});

	self.boolean = ko.observableArray(BOOLEAN_VALUES);



	self.units.subscribe( function(){

		//Force values to refresh
		self.distance( self.distance() );
		self.distanceDefault( self.distanceDefault() );
		self.distanceMin( self.distanceMin() );
		self.distanceMax( self.distanceMax() );


	});


	self.clock.subscribe( function(){

		//Force values to refresh
		self.time( self.time() );
		self.timeMin( self.timeMin() );
		self.timeMax( self.timeMax() );
		self.timeDefault( self.timeDefault() );


	});

}



//UI
var vm; //Viewmodel

$(function(){

	//Apply the knockout viewmodel
	vm = new viewModel();
	ko.applyBindings(vm);

});