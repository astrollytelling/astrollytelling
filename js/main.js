var svg = d3.select("#sticky-viz");

/* Define HR diagram */

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

/* Define slider */

var	marginSlider = {top: 10, right: 100, bottom: 10, left: 50},
	widthSlider = window.innerWidth * 2 / 5,
	heightSlider = marginHR.top,
	radiusSlider = 9;
var xSlider = d3.scaleLinear();
var ageToIndex = d3.scaleLinear();

/* Read data */

d3.json("data/00140M_evol_track.json", function(error, data) {
	if (error) throw error;

	/* Set global titles */
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
	var phases = _.uniq(data.phase);
	phases.forEach(function(e){
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
		.text(function(d, idx) { return getPhaseLabel(phases[idx]); });
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
		.domain([0, window.innerHeight]) // This should be height(wrapper) - 100vh or something like that
		.range([0, data.star_age.length - 1])
		.clamp(true);

	/* Axis */

	x.domain([3.9, d3.extent(data.log_Teff)[0] - 0.1])
	y.domain([-1.5, d3.extent(data.log_L)[1] + 0.2]);
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
		.attr("transform", "rotate (-90) translate(-85,5)")
		.html("Log(Luminosity)");

	svgHR.append("text")
		.attr("x", width)
		.attr("y", height)
		.attr("dy", "0.75em")
		.attr("class", "text-temperature")
		.attr("transform", "translate(-80,-15)")
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

	/* Star diagram */

	d3.selectAll("#star-text")
		.html("<h2>Stellar Evolution</h2>");

	var svgDiagram = d3.select("#star-diagram").append("svg")
		.attr("width", 200)
		.attr("height", 200);

	svgDiagram.selectAll(".diagram").data([0])
		.enter().append("circle")
		.attr("class", "diagram")
		.attr("cx", 100)
		.attr("cy", 100)
		.attr("r", function(d){ return r(10**data.log_R[d])});

	/* Implementing scroller */

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

		scrollScale.domain([0, window.innerHeight]) // double check this for other values
	};

	var render = function() {
		if (scrollTop !== newScrollTop) {
			scrollTop = newScrollTop;


			if (content.node().getBoundingClientRect().top < 0){

				//var idx = Math.round(scrollScale(scrollTop));
				var idx = Math.round(scrollScale(-content.node().getBoundingClientRect().top));
				var phase = data.phase[idx];

				if (phase == 6){
					x.domain([Math.max(data.log_Teff[idx], 3.8, d3.extent(data.log_Teff.slice(0,idx))[1]) + 0.1,
							  d3.extent(data.log_Teff)[0] - 0.1]);
				} else {
					x.domain([3.9, d3.extent(data.log_Teff)[0] - 0.1]);
				}

				line.x(function(d){ return x(data.log_Teff[d])})
					.y(function(d){ return y(data.log_L[d])});

				svgHR.selectAll(".axis--x")
					.call(d3.axisBottom(x));

				svgHR.selectAll(".stellar-track")
					.attr("d", line);

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

				svgDiagram.selectAll(".diagram")
					.datum([idx])
					.attr("cx", 100)
					.attr("cy", 100)
					.attr("r", function(d){ return r(10**data.log_R[d])});

				d3.selectAll("#star-text")
					.html("<h3>"+getText(phase)+"</h3>");

				handle.attr("cx", xSlider(ageToIndex.invert(idx)))

			}
		}

		window.requestAnimationFrame(render);
	};
	window.requestAnimationFrame(render);

	window.onresize = setDimensions;

});

function getText(phase){
	return getPhaseLabel(phase);
}


function getPhaseLabel(phase){
	switch(phase) {
		case -1:
			return "PMS";
		case 0:
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