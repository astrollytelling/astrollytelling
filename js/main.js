var size = 140,
	padding = 10;

var filter = "";

/* SPINNER */

var opts = {
	lines: 13, // The number of lines to draw
	length: 6, // The length of each line
	width: 4, // The line thickness
	radius: 13, // The radius of the inner circle
	corners: 1, // Corner roundness (0..1)
	color: '#000', // #rgb or #rrggbb or array of colors
	speed: 1.5, // Rounds per second
	trail: 75, // Afterglow percentage
	shadow: false, // Whether to render a shadow
	hwaccel: false, // Whether to use hardware acceleration
	className: 'spinner', // The CSS class to assign to the spinner
	zIndex: 2e9, // The z-index (defaults to 2000000000)
	top: '50%', // Top position relative to parent
	left: '50%' // Left position relative to parent
};

var target = document.getElementById('vis-div');
var spinner = new Spinner(opts).spin(target);

/* SLIDER */

var svgSlider = d3.select("#slider").append("svg").attr("width", 960).attr("height", 100),
	marginSlider = {top: 80, right: 10, bottom: 10, left: 20},
	widthSlider = +svgSlider.attr("width") - marginSlider.left - marginSlider.right,
	heightSlider = +svgSlider.attr("height");

var xSlider = d3.scaleLinear();

var slider = svgSlider.append("g")
	.attr("class", "slider")
	.attr("transform", "translate(" + marginSlider.left + "," + heightSlider / 2 + ")");

var handle = slider.insert("circle", ".track-overlay")
    //.html("<polygon points='9.9, 1.1, 3.3, 21.78, 19.8, 8.58, 0, 8.58, 16.5, 21.78' style='fill-rule:nonzero;'/>")
	.attr("class", "handle")
	.attr("r", 9);

/* HR diagram */

var svg = d3.select("#HR-diagram").append("svg"),
	margin = {top: 40, right: 10, bottom: 10, left: 20},
	width = 960 - margin.left - margin.right,
	height = 500 - margin.top - margin.bottom;

var x = d3.scaleLinear()
	.range([0, width]);

var y = d3.scaleLinear()
	.range([height, 0]);

var r = d3.scaleLinear()
	.range([1, 50]);

var line = d3.line();

var dot = svg.selectAll(".dot");

d3.json("data/00140M_evol_track.json", function(error, data) {
	if (error) throw error;

	spinner.stop();

	d3.select("#title").html("<h1>MIST Stellar Evolution</h1>");
	d3.select("#subtitle").html('A visualization by <a href="https://www.cfa.harvard.edu/~fbecerra">Fernando Becerra</a>' +
		' and <a href="https://www.cfa.harvard.edu/~jchoi">Jieun Choi</a>');
	d3.select("#notes").html('Notes:</br> ' +
		'&#8594; MIST</br>');

	console.log(data);

	var phasesTicks = [];
	_.uniq(data.phase).forEach(function(e){
		phasesTicks.push(data.phase.indexOf(e));
	 });
	//phasesTicks.push(data.phase.length-1);

	/* Slider */

	// TODO: change domain to d3.range so that we get the index to make all other calculations easier
	//xSlider.domain(d3.extent(data.star_age))
	xSlider.domain([0, data.star_age.length - 1])
		.range([0, 500])
		.clamp(true);

	slider.append("line")
		.attr("class", "track")
		.attr("x1", xSlider.range()[0])
		.attr("x2", xSlider.range()[1])
		.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
		.attr("class", "track-inset")
		.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
		.attr("class", "track-overlay")
		.call(d3.drag()
			.on("start.interrupt", function() { slider.interrupt(); })
			.on("start drag", function() { plotStar(data, Math.round(xSlider.invert(d3.event.x)));
				handle.attr("cx", xSlider(xSlider.invert(d3.event.x))); }));

	slider.append("g")
		.selectAll("line")
		.data(phasesTicks)
		.enter().append("line")
		.attr("class", "track-ticks")
		.attr("x1", function(d){ return xSlider(d);})
		.attr("x2", function(d){ return xSlider(d);})
		.attr("y1", 0)
		.attr("y2", 5);

	slider.insert("g", ".track-overlay")
		.attr("class", "ticks")
		.attr("transform", "translate(0," + 18 + ")")
		.selectAll("text")
		.data(phasesTicks)
		.enter().append("text")
		.attr("x", function(d){ return xSlider(d);})
		.attr("text-anchor", "middle")
		.text(function(d, idx) { return getPhaseLabel(idx); });


	/* HR diagram */

	svg.datum(data)
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	/* Axis */

	x.domain([d3.extent(data.log_Teff)[1], d3.extent(data.log_Teff)[0]]);
	y.domain(d3.extent(data.log_L));
	r.domain([10**d3.extent(data.log_R)[0], 10**d3.extent(data.log_R)[1]]);

	svg.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x));

	svg.append("g")
		.attr("class", "axis axis--y")
		.attr("transform", "translate(" + margin.left + ",0)")
		.call(d3.axisLeft(y));

	/* Track */

	line.x(function(d){ return x(data.log_Teff[d])})
		.y(function(d){ return y(data.log_L[d])});

	svg.append("g")
		.datum(d3.range(1)).append("path")
		.attr("class", "stellar-track")
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-linejoin", "round")
		.attr("stroke-linecap", "round")
		.attr("stroke-width", 1.5)
		.attr("opacity", 0.5)
		.attr("d", line);

	/* Star */

	dot.data([0])
		.enter().append("circle")
		.attr("class", "dot")
		.attr("cx", function(d){ return x(data.log_Teff[d])})
		.attr("cy", function(d){ return y(data.log_L[d])})
		.attr("r", function(d){ return r(10**data.log_R[d])});

});

function plotStar(data, idx){

	svg.selectAll(".stellar-track")
		.datum(d3.range(idx))
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-linejoin", "round")
		.attr("stroke-linecap", "round")
		.attr("stroke-width", 1.5)
		.attr("opacity", 0.5)
		.attr("d", line);

	svg.selectAll(".dot")
		.datum([idx])
		.attr("cx", function(d){ return x(data.log_Teff[d])})
		.attr("cy", function(d){ return y(data.log_L[d])})
		.attr("r", function(d){ return r(10**data.log_R[d])});
}

function getPhaseLabel(phase){
	switch(phase) {
		case 0:
			return "PMS";
		case 1:
			return "MS";
		case 2:
			return "SGB+RGB";
		case 3:
			return "CHeB";
		case 4:
			return "EAGB";
		case 5:
			return "TPAGB";
		case 6:
			return "post-AGB+WDCS";
	}
}

function getColor(temp){
	/*Code here*/
}