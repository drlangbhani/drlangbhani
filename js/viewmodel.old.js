



//Create View Model
function viewModel() {

	var self = this;

	//Constants
	var INTEREST_RATE			= .0895, 	//8.95%
		GROWTH_RATE				= .03,		//3%
		MORTGAGE_DISCHARGE_FEE	= 395,
		INITIAL_DRAWDOWN_FEE	= 1195,
		EQUITY_PROTECT_FEE 		= 295,
		TOPUP_FEE				= 125,


		PROPERTY_VALUE 			= 500000,
		PROPERTY_VALUE_MIN 		= 250000,		
		EQUITY_PROTECT 			= .25,
		EQUITY_PROTECT_MAX 		= .5,	
		
		LOAN_VALUE 				= 50000,	
		LOAN_CAP 				= 500000,
		LOAN_MIN 				= 10000,		
		AGE_OFFSET 				= 45,
		AGE_MIN 				= 65,
		AGE_MAX 				= 120,

		TOPUP_DEFAULT			= 5000,
		TOPUP_MIN				= 5000,
		TOPIP_


		LOAN_PERCENTAGE_CAP 	= .45,
		LOAN_TABLE_MAX_AGE		= 100,
		LOAN_TABLE_INTERVAL 	= 1,
		CHART_HSCALE_INTERVAL	= 1,
		CHART_VSCALE_STEPS		= 5;


	//Fees and constants
	self.initial_drawdown_fee 	= ko.observable(INITIAL_DRAWDOWN_FEE).extend({format: '$0,0[.]00'});
	self.equity_protect_fee 	= ko.observable(EQUITY_PROTECT_FEE).extend({format: '$0,0[.]00'});

	self.topup_min = ko.observable(TOPUP_MIN).extend({format: '$0,0[.]00'});


	//Borrowers

	self.borrower_count = ko.observable("1");

	self.borrower1_age = ko.observable(AGE_MIN).extend({ range: {min: AGE_MIN, max: AGE_MAX}, notify: 'always' });
	self.borrower2_age = ko.observable(AGE_MIN).extend({ range: {min: AGE_MIN, max: AGE_MAX}, notify: 'always' });

	self.youngest_borrower_age	= ko.computed(function(){
										if( self.borrower_count() == '2'){
											return Math.min( self.borrower1_age(), self.borrower2_age() );
										}else{
											return self.borrower1_age();
										}
									});

	//Equity Protection
	self.equity_protect 		= ko.observable( EQUITY_PROTECT ).extend({
										range: {min: 0, max: EQUITY_PROTECT_MAX},
										format: '0.00%'
									});		
	
	self.equity_protect_use		= ko.observable("false").extend({ truthy: '' });


	//Property Value
	self.property_value 			= ko.observable( PROPERTY_VALUE ).extend({
											range: {min: PROPERTY_VALUE_MIN},
											format: '$0,0[.]00'
										});

	self.property_value_unprotected = ko.computed( function(){
											return self.equity_protect_use.truthy() ? self.property_value() * (1 - self.equity_protect() ) : self.property_value();
										});

	//Loan Calculations
	self.loan_percentage 	= ko.computed(function(){										
									//Calculate loan percentage
									var percentage = (self.youngest_borrower_age() - AGE_OFFSET) / 100;
									//Clamp the percentage
									return Math.min( percentage, LOAN_PERCENTAGE_CAP) ;
								});

	self.loan_max_value 	= ko.computed( function(){										
									//Max loan is a percentage of the unprotected property value
									value = self.loan_percentage() * self.property_value_unprotected();

									//Clamp the loan to give the max loan value
									value = Math.min( value, LOAN_CAP);

									return value;
								}).extend({
									format: "$0,0[.]00"
								});


	//How much would you like to borrow initially?
	self.loan_value 			= ko.observable(LOAN_VALUE).extend({
										range: {min: LOAN_MIN, max: self.loan_max_value},
										format: '$0,0[.]00'
									});

	//Then add fees
	self.loan_initial_drawdown	= ko.computed(function(){
									var initial_drawdown = self.loan_value() + self.initial_drawdown_fee();

									if( self.equity_protect_use.truthy() ){
										initial_drawdown += self.equity_protect_fee();
									}

									var initial_drawdown = self.loan_value();

									return initial_drawdown;
									}).extend({
										format: '$0,0[.]00'
									});


	//Force the loan_value to recalculate, in case the max loan has gone down
	self.loan_max_value.subscribe(function(){ self.loan_value(self.loan_value());})


	//Top ups


	//Lightweight viewmodel for topups;
	self.topup = function(){
		var me = this;
		me.amount = ko.observable(TOPUP_DEFAULT).extend({ format: '$0,0[.]00'});
		me.year = ko.observable(1);
		
		//Find the minimum start year for this topup based on the year set for the previous topup
		me.startYear = function(){	
			var index = 0;
			var year = 0;
			while( !!self.loan_topups()[index] && self.loan_topups()[index] != me ){				
				year = self.loan_topups()[index++].year();				
			}
			return year;
		}

		//Generate a list of years list based on the year set for the previous topup
		me.availableYears = ko.computed(function(){	
			var year = me.startYear() + 1
			var years = [];
			while(year + self.youngest_borrower_age() < LOAN_TABLE_MAX_AGE){
				years.push(year++);
			}

			//TODO: Find a better place?
			//Remove this topup if the previous topup is taken in the last available year
			if(years.length == 0){
				self.loan_topups.remove(me);
			}

			return years;
		});
	}

	//Array of topups, empty by default
	self.loan_topups = ko.observableArray();

	//Calculate the topup total, and perform validation on topups
	self.loan_topup_total = ko.computed(function(){
								//Private function for calculating total
								function topup_total(){
									var total = 0;
									$(self.loan_topups()).each(function(){
										total += this.amount();
									})
									return total;
								}

								//Private function for calculating available topup
								//this duplicates the self.loan_topup_available to avoid circular dependancies
								function topup_available(){
									return self.loan_max_value() - self.loan_value() - topup_total();
								}
																
								while(topup_available() < 0){
									var topup = self.loan_topups.pop();									
									
									if(topup_available() > 0){
										topup.amount( topup_available() );
										self.loan_topups.push(topup);										
									}
								}

								//If total topup available is < TOPUP_MIN then just empty the array
								if( self.loan_max_value() - self.loan_value() < TOPUP_MIN ){
									self.loan_topups([]);
								}

								//Check if the first topup is over the TOPUP_MIN
								if(self.loan_topups().length > 0){
									var first = self.loan_topups()[0];

									if(first.amount() < TOPUP_MIN){
										first.amount(TOPUP_MIN);
									}
								}

								//Ensure all topups are over zero
								$(self.loan_topups()).each(function(){
									if( this.amount() < 0 ){
										self.loan_topups.remove(this);
									}
								});

								return topup_total();
								
								}).extend({
									format: '$0,000'
								});

	self.loan_topup_available 	= ko.computed(function(){
									return self.loan_max_value() - self.loan_value() - self.loan_topup_total();
								}).extend({
									format: '$0,000'
								});


	//Growth and Interest rates
	self.growth_rate 	= ko.observable(GROWTH_RATE).extend({
								range: {min: -.1, max: .1},
								format: '0.00%'
							});

	self.interest_rate 	= ko.observable(INTEREST_RATE).extend({
								range: {min: 0, max: .2},
								format: '0.00%'
							});

	self.add_topup = function(){
		var topup = new self.topup(vm);
		self.loan_topups.push( topup );
	}

	self.remove_topup = function(topup){
		self.loan_topups.remove(topup);
	}

	self.findTopupforYear = function(year){
		var topup;

		$(self.loan_topups()).each( function(){
			if( year == this.year() ){
				topup = this;
			}
		});

		return topup;
	}


	//We don't need to use a ko.observableArray because we don't need to manipulate the array later.	
	self.loan_table = ko.computed(generateLoanTable);
	//Generate the chart whenever the loan table is updated.
	self.loan_table.subscribe(generateChart);
	generateChart(); //First run

	//Private Functions
	function generateLoanTable(){
		
		var year = 0,
			age = self.youngest_borrower_age(),
			interest_rate = self.interest_rate(),
			loan_table = [],			
			loan_balance = self.loan_initial_drawdown();


		//Add loan table lines until we hit the table max age
		while(year + age < LOAN_TABLE_MAX_AGE){
			

			//Calculate values
			var equity_protect 				= self.equity_protect_use.truthy() ? self.equity_protect() : 0;
			var topup 						= self.findTopupforYear(year);
			var topup_amount				= topup != undefined ? topup.amount() : 0;

			if(year != 0){
				loan_balance = ( loan_balance * Math.pow( 1 + (interest_rate / 12), 12 ) ) + topup_amount;
			}

			//Assume that the mortgage discharge fee is added on loan maturity
			//Which means we only add it to the last line			
			if(year + age + 1 == LOAN_TABLE_MAX_AGE){
				loan_balance += MORTGAGE_DISCHARGE_FEE;
			}

			var property_value				= self.property_value() * Math.pow( 1 + self.growth_rate(), year);
			var property_value_unprotected	= property_value * (1 - equity_protect );
			var loan_balance_no_neg_equity 	= Math.min( property_value_unprotected, loan_balance );
			var remaining_equity 			= Math.max(0, property_value - loan_balance_no_neg_equity);


			//Create object for the table line
			line = {
				year: year,
				age: age + year,
				topup: topup_amount,
				loan_balance: loan_balance_no_neg_equity,
				property_value: property_value,
				property_value_unprotected: property_value_unprotected,
				remaining_equity: remaining_equity
			}
			
			//Add the line to the table
			loan_table.push(line);

			year += LOAN_TABLE_INTERVAL;
		}

		return loan_table;
	}


	//Generate a data for the chart by processing the loan table line by line
	function generateChart(){	

		/*if(!Modernizr.canvas ){
			return;
		}*/
		
		if($("#chart-equity").get(0).getContext == undefined){
			return;
		}


		var loan_table = self.loan_table(),
			labels = [],
			data_property_value = [],
			data_property_value_unprotected = [],
			data_remaining_equity = [],
			data_loan_balance = [],
			data_positive_topups = [],
			data_negative_topups = [],
			vmax = 1,
			vscalesteps = 1,
			vscaleinterval;


		$( loan_table ).each(function(index){
			//Generate chart data points
			if(index % CHART_HSCALE_INTERVAL == 0){
				labels.push(this.age);
				data_property_value.push(this.property_value);
				data_property_value_unprotected.push(this.property_value_unprotected);
				data_remaining_equity.push(this.remaining_equity);
				data_loan_balance.push(this.loan_balance);
				data_positive_topups.push(this.topup);
				data_negative_topups.push(-this.topup);

				//Keep a running total of the maximum vertical scale value
				vmax = Math.max(vmax, Math.max(this.loan_balance, this.property_value));
			}
		});

		//Calculate vertical scale
		vscaleinterval = Math.ceil( vmax / CHART_VSCALE_STEPS / 50000 ) * 50000;


		//TODO: shift the colours and options to constants

		options = {

			bezierCurve : false,
			scaleOverlay : true,
			scaleOverride : true,
			scaleSteps : CHART_VSCALE_STEPS,
			scaleStepWidth :  vscaleinterval,
			scaleStartValue : 0,
			scaleShowLabels : true,
			scaleLabel : "<%=value%>",
			scaleFontFamily : "'Arial'",			
			scaleFontSize : 10,		
			pointDot: false,
			scaleShowGridLines : true,
			animation : false
			
		}


		var data_equity = {
			labels: labels,
			datasets : [
							{
								fillColor : "rgba(220,220,220,0.5)",
								strokeColor : "rgba(200,200,200,1)",
								pointColor : "rgba(220,220,220,1)",
								pointStrokeColor : "#fff",
								data : data_property_value
							},
							{
								fillColor : "rgba(220,220,220,0.5)",
								strokeColor : "rgba(200,200,200,1)",
								pointColor : "rgba(220,220,220,1)",
								pointStrokeColor : "#fff",
								data : data_property_value_unprotected
							},
							{
								fillColor : "rgba(0,165,80,.25)",
								strokeColor : "rgba(0,165,80,1)",
								pointColor : "rgba(0,165,80,1)",
								pointStrokeColor : "#fff",
								data : data_remaining_equity,
								offsets: data_positive_topups
							}/*,
							{
								fillColor : "rgba(231,76,57,0.1)",
								strokeColor : "rgba(231,76,57,.75)",
								pointColor : "rgba(231,76,57,1)",
								pointStrokeColor : "#fff",
								data : data_loan_balance,								
								offsets: data_negative_topups
							}*/
						]
		}

		var data_loan = {
			labels: labels,
			datasets : [
							{
								fillColor : "rgba(220,220,220,0.5)",
								strokeColor : "rgba(200,200,200,1)",
								pointColor : "rgba(220,220,220,1)",
								pointStrokeColor : "#fff",
								data : data_property_value
							},
							{
								fillColor : "rgba(220,220,220,0.5)",
								strokeColor : "rgba(200,200,200,1)",
								pointColor : "rgba(220,220,220,1)",
								pointStrokeColor : "#fff",
								data : data_property_value_unprotected
							}/*,
							{
								fillColor : "rgba(0,165,80,.25)",
								strokeColor : "rgba(0,165,80,1)",
								pointColor : "rgba(0,165,80,1)",
								pointStrokeColor : "#fff",
								data : data_remaining_equity,
								offsets: data_positive_topups
							}*/,
							{
								fillColor : "rgba(231,76,57,0.1)",
								strokeColor : "rgba(231,76,57,.75)",
								pointColor : "rgba(231,76,57,1)",
								pointStrokeColor : "#fff",
								data : data_loan_balance,								
								offsets: data_negative_topups
							}
						]
		}

		//Set up chart
		var ctx = $("#chart-equity").get(0).getContext("2d");
		new Chart(ctx).Line(data_equity, options);

		var ctx = $("#chart-loan").get(0).getContext("2d");
		new Chart(ctx).Line(data_loan, options);
	}

}




//UI
var vm; //Viewmodel

$(function(){
	


	//Use a dummy button to prevent enter key from triggering other buttons
	$(".dummy-button").on("click",function(e){		
		e.preventDefault();
	})

	//Use Bootstrap affix to fix the chart
	$('.chart').affix({
	    offset: {
	      top: 250
	    , 
	    bottom: function () {
	        return $(document).height() - $(".loan_table").offset().top + 50;
	      }
	    }
  	})	
	
	var a = function(){
		console.log("check");
		$(".chart").data("bs.affix").checkPosition();
	}
	
	setTimeout(a,250);

	//Apply the knockout viewmodel
	vm = new viewModel();
	ko.applyBindings(vm);


	vm.loan_table.subscribe(function(){
		setTimeout(a, 100);
	})

	//jQuery UI sliders for fields.
	//----
	//Range values are defined using data attributes
	//then we "subscribe" to viewmodel properties to update that slider

	$(".slider").each(function(){
		var slider = $(this),
			ko_property = vm[slider.data().koProperty],
			ko_max 		= slider.data().koMax,
			ko_min 		= slider.data().koMin,
			step 		= Number( slider.data().step || 1 ),
			max = typeof(vm[ko_max]) == "function" ? vm[ko_max]() : Number(ko_max),
			min = typeof(vm[ko_min]) == "function" ? vm[ko_min]() : Number(ko_min);
		

		//Setup the slider
		slider.slider({
			max: 	max,
			min: 	min,
			step: 	step,
			value: 	ko_property(),
			slide: 	function(event, ui){
						ko_property(ui.value);
						}
		});

		//Listen to updates on the viewmodel properties
		ko_property.subscribe( function(value){			
			slider.slider( "value", value );
		})

		if( typeof(vm[ko_max]) == "function" ){
			vm[ko_max].subscribe( function(value){		
				slider.slider( "option", "max", value );
			});
		}

	})

});