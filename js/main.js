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
var svg = d3.select("#sticky-viz");


/* HR diagram */

var	marginHR = {top: 40, right: 40, bottom: 40, left: 30},
	width = window.innerWidth * 11/20;
	height = window.innerHeight * 4/5;

var x = d3.scaleLinear()
	.range([0, width]);

var y = d3.scaleLinear()
	.range([height, 0]);

var r = d3.scaleLinear()
	.range([2, 4]);

var line = d3.line();

/* SLIDER */

var	marginSlider = {top: 10, right: 100, bottom: 10, left: 50},
	widthSlider = window.innerWidth * 2 / 5,
	heightSlider = marginHR.top,
	radiusSlider = 9;
var xSlider = d3.scaleLinear();
var ageToIndex = d3.scaleLinear();

d3.json("data/00140M_evol_track.json", function(error, data) {
	if (error) throw error;

	spinner.stop();

	d3.select("#title").html("<h1>MIST Stellar Evolution</h1>");
	d3.select("#subtitle").html('A visualization by <a href="https://www.cfa.harvard.edu/~fbecerra">Fernando Becerra</a>' +
		' and <a href="https://www.cfa.harvard.edu/~jchoi">Jieun Choi</a>');
	d3.select("#notes").html('Notes:</br> ' +
		'&#8594; MIST</br>');

	console.log(data);

	/* Slider */

	var svgSlider = svg.append("svg")
		.attr("width", widthSlider + marginSlider.left + marginSlider.right)
		.attr("height", heightSlider + marginSlider.top + marginSlider.bottom)
		.append("g")
		.attr("transform", "translate(" + marginSlider.left + "," + marginSlider.top + ")");

	var slider = svgSlider.append("g")
		.attr("class", "slider")
		.attr("transform", "translate(" + marginSlider.left + "," + heightSlider / 2 + ")");

	var handle = slider.insert("circle", ".track-overlay")
		//.html("<polygon points='9.9, 1.1, 3.3, 21.78, 19.8, 8.58, 0, 8.58, 16.5, 21.78' style='fill-rule:nonzero;'/>")
		.attr("class", "handle")
		.attr("r", radiusSlider);

	xSlider.domain([data.star_age[0], data.star_age[data.star_age.length - 1]])
		.range([0, widthSlider - 2*radiusSlider])
		.clamp(true);

	ageToIndex.domain([data.star_age[0], data.star_age[data.star_age.length - 1]])
		.range([0, data.star_age.length - 1])
		.clamp(true);

	var phasesTicks = [];
	_.uniq(data.phase).forEach(function(e){
		phasesTicks.push(ageToIndex.invert(data.phase.indexOf(e)));
	});

	slider.append("line")
		.attr("class", "track")
		.attr("x1", xSlider.range()[0])
		.attr("x2", xSlider.range()[1])
		.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
		.attr("class", "track-inset")
		.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
		.attr("class", "track-overlay");
	
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
		.attr("transform", "translate(0," + 2*radiusSlider + ")")
		.selectAll("text")
		.data(phasesTicks)
		.enter().append("text")
		.attr("x", function(d){ return xSlider(d);})
		.attr("text-anchor", "middle")
		.text(function(d, idx) { return getPhaseLabel(idx); });
		//.text(function(d, idx) { return ""+Math.round(d);});

	/* HR diagram */

	var svgHR = svg.append("svg").datum(data)
		.attr("width", width + marginHR.left + marginHR.right)
		.attr("height", height + marginHR.top + marginHR.bottom)
		.append("g")
		.attr("transform", "translate(" + marginHR.left + "," + marginHR.top + ")");

	var dot = svgHR.selectAll(".dot");

	var body = d3.select('body').node();
	var container = d3.select('#container-viz');
	var content = d3.select('#content-viz');

	var scroll_length = content.node().getBoundingClientRect().height -  window.innerHeight;

	/* Scroll to index */
	var scrollScale = d3.scaleLinear()
		.domain([0, scroll_length])
		.range([0, data.star_age.length - 1])
		.clamp(true);

	/* Axis */

	x.domain([d3.extent(data.log_Teff)[1], d3.extent(data.log_Teff)[0]]);
	y.domain(d3.extent(data.log_L));
	r.domain([d3.extent(data.log_R)[0], d3.extent(data.log_R)[1]]);

	svgHR.append("g")
		.attr("class", "axis axis--x")
		.attr("transform", "translate(0," + height + ")")
		.call(d3.axisBottom(x));

	svgHR.append("g")
		.attr("class", "axis axis--y")
		.attr("transform", "translate(0,0)")
		.call(d3.axisLeft(y));

	svgHR.append("text")
		.attr("x", 10)
		.attr("dy", "0.75em")
		.attr("class", "text-luminosity")
		.attr("transform", "rotate (-90) translate(-90,10)")
		.html("Log(Luminosity)");

	svgHR.append("text")
		.attr("x", width)
		.attr("y", height)
		.attr("dy", "0.75em")
		.attr("class", "text-temperature")
		.attr("transform", "translate(-90,-20)")
		.html("Log(Temperature)");

	/* Track */

	line.x(function(d){ return x(data.log_Teff[d])})
		.y(function(d){ return y(data.log_L[d])});

	svgHR.append("g")
		.datum(d3.range(1)).append("path")
		.attr("class", "stellar-track")
		.attr("fill", "none")
		.attr("stroke", "gray")
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

	var scrollTop = 0;
	var newScrollTop = 0;

	container
		.on("scroll.scroller", function() {
			newScrollTop = container.node().scrollTop
		});

	var setDimensions = function() {
		width = window.innerWidth / 2;
		height = window.innerHeight;
		scroll_length = content.node().getBoundingClientRect().height - height;

		scrollScale.domain([0, scroll_length])
	};

	var render = function() {
		if (scrollTop !== newScrollTop) {
			scrollTop = newScrollTop;

			var idx = Math.round(scrollScale(scrollTop));

			svgHR.selectAll(".stellar-track")
				.datum(d3.range(idx))
				.attr("fill", "none")
				.attr("stroke", "gray")
				.attr("stroke-linejoin", "round")
				.attr("stroke-linecap", "round")
				.attr("stroke-width", 1.5)
				.attr("opacity", 0.5)
				.attr("d", line);

			svgHR.selectAll(".dot")
				.datum([idx])
				.attr("cx", function(d){ return x(data.log_Teff[d])})
				.attr("cy", function(d){ return y(data.log_L[d])})
				.attr("r", function(d){ return r(10**data.log_R[d])});

			handle.attr("cx", xSlider(ageToIndex.invert(idx)))

		}

		window.requestAnimationFrame(render);
	};
	window.requestAnimationFrame(render);

	window.onresize = setDimensions;

});


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