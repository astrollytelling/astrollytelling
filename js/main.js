var svg = d3.select("#sticky-viz");

/* Define HR diagram */

var	marginHR = {top: 40, right: 40, bottom: 40, left: 50},
	width = window.innerWidth * 11/20;
	height = window.innerHeight * 4/5;

var x = d3.scaleLog()
	.range([0, width]);

var y = d3.scaleLog()
	.range([height, 0]);

var r = d3.scaleLinear()
	.range([2, 4]);

var line = d3.line();

// Setting up d3-tip
var tipMap = d3.tip()
    .attr('class', 'd3-tip')

/* Define slider */

var	marginSlider = {top: 10, right: 100, bottom: 10, left: 50},
	widthSlider = window.innerWidth * 2 / 5,
	heightSlider = marginHR.top,
	radiusSlider = 9;
var xSlider = d3.scaleLinear();
var ageToIndex = d3.scaleLinear();

/* Read data */

d3.json("data/00140M_evol_track.json", function(error, data) {
    d3.json("data/description.json", function(error, description) {

        if (error) throw error;

        /* Set global titles */
        d3.select("#notes").html('Notes:</br> ' +
            '&#8594; MIST</br>');

        console.log(data);
        console.log(description);

        /* Slider */

        var svgSlider = svg.append("svg")
            .attr("width", widthSlider + marginSlider.left + marginSlider.right)
            .attr("height", heightSlider + marginSlider.top + marginSlider.bottom)
            .append("g")
            .attr("transform", "translate(" + marginSlider.left + "," + marginSlider.top + ")");

        var slider = svgSlider.append("g")
            .attr("class", "slider")
            .attr("transform", "translate(" + marginSlider.left + "," + heightSlider / 2 + ")");


        xSlider.domain([data.star_age[0], data.star_age[data.star_age.length - 1]])
            .range([0, widthSlider - 2 * radiusSlider])
            .clamp(true);

        ageToIndex.domain([data.star_age[0], data.star_age[data.star_age.length - 1]])
            .range([0, data.star_age.length - 1])
            .clamp(true);

        var phasesTicks = [];
        var phases = _.uniq(data.phase);
        phases.forEach(function (e) {
            phasesTicks.push(ageToIndex.invert(data.phase.indexOf(e)));
        });

        slider.append("line")
            .attr("class", "track")
            .attr("x1", xSlider.range()[0])
            .attr("x2", xSlider.range()[1])
            .select(function () {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr("class", "track-inset")
            .select(function () {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr("class", "track-overlay");

        slider.append("g")
            .selectAll("line")
            .data(phasesTicks)
            .enter().append("line")
            .attr("class", "track-ticks")
            .attr("x1", function (d) {
                return xSlider(d);
            })
            .attr("x2", function (d) {
                return xSlider(d);
            })
            .attr("y1", 0)
            .attr("y2", 5);

        slider.insert("g", ".track-overlay")
            .attr("class", "ticks")
            .attr("transform", "translate(0," + 2 * radiusSlider + ")")
            .selectAll("text")
            .data(phasesTicks)
            .enter().append("text")
            .attr("x", function (d) {
                return xSlider(d);
            })
            .attr("text-anchor", "middle")
            .text(function (d, idx) {
                return getPhaseLabel(phases[idx]);
            });
        //.text(function(d, idx) { return ""+Math.round(d);});

        var handle = slider.insert("circle", ".track-overlay")
            .attr("class", "handle")
            .attr("r", radiusSlider);

        handle.style("fill", "url(#gradOffset)");

        /* HR diagram */

        var svgHR = svg.append("svg").datum(data)
            .attr("width", width + marginHR.left + marginHR.right)
            .attr("height", height + marginHR.top + marginHR.bottom)
            .append("g")
            .attr("transform", "translate(" + marginHR.left + "," + marginHR.top + ")")
            .call(tipMap);

        var dot = svgHR.selectAll(".dot");

        var body = d3.select('body').node();
        var container = d3.select('#container-viz');
        var content = d3.select('#content-viz');

        var scroll_length = content.node().getBoundingClientRect().height - window.innerHeight;

        /* Scroll to index */
        var scrollScale = d3.scaleLinear()
            .domain([0, window.innerHeight]) // This should be height(wrapper) - 100vh or something like that
            .range([0, data.star_age.length - 1])
            .clamp(true);

        /* Axis */

        x.domain([10**3.9, 10**(d3.extent(data.log_Teff)[0] - 0.1)]);
        y.domain([10**(-1.5), 10**(d3.extent(data.log_L)[1] + 0.2)]);
        r.domain([d3.extent(data.log_R)[0], d3.extent(data.log_R)[1]]);

        svgHR.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickValues([3000, 4000, 5000, 6000, 7000]).tickFormat(d3.format("")));

        svgHR.append("g")
            .attr("class", "axis axis--y")
            .attr("transform", "translate(0,0)")
            .call(d3.axisLeft(y).ticks(5)
                .tickFormat(d3.format("")));

        svgHR.append("text")
            .attr("x", 10)
            .attr("dy", "0.75em")
            .attr("class", "text-luminosity")
            .attr("transform", "rotate (-90) translate(-150,5)")
            .html("Luminosity (Solar Luminosity)");

        svgHR.append("text")
            .attr("x", width)
            .attr("y", height)
            .attr("dy", "0.75em")
            .attr("class", "text-temperature")
            .attr("transform", "translate(-100,-15)")
            .html("Temperature (Kelvin)");

        svgHR.append("text")
            .data([0])
            .attr("x", 10)
            .attr("y", height)
            .attr("dy", "0.75em")
            .attr("class", "text-mass")
            .attr("transform", "translate(0,-45)")
            .html(function (d) {
                return "Mass: " + data.star_mass[d].toFixed(4) + " Solar masses"
            });

        svgHR.append("text")
            .data([0])
            .attr("x", 10)
            .attr("y", height)
            .attr("dy", "0.75em")
            .attr("class", "text-age")
            .attr("transform", "translate(0,-25)")
            .html(function (d) {
                return "Age: " + data.star_age[d].toFixed(0) + " years"
            });

        /* Track */

        line.x(function (d) {
                return x(10**data.log_Teff[d])
            })
            .y(function (d) {
                return y(10**data.log_L[d])
            });

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

        /* Star gradient, from http://bl.ocks.org/nbremer/eb0d1fd4118b731d069e2ff98dfadc47 */

        var colorTemp = function (d) {
            var value = (d - d3.extent(data.log_Teff)[1]) / (d3.extent(data.log_Teff)[1] - d3.extent(data.log_Teff)[0] - 0.1);
            return d3.interpolateRdYlBu(1 + value);
        };

        var gradientOffset = svgHR.selectAll(".gradientOffset");

        var gradOffset = gradientOffset.data([0])
            .enter().append("radialGradient")
            .attr("class", "gradientOffset")
            .attr("cx", "25%")
            .attr("cy", "25%")
            .attr("r", "65%")
            .attr("id", "gradOffset");

        gradOffset.append("stop")
            .attr("id", "offset-0")
            .attr("offset", "0%")
            .attr("stop-color", function (d) {
                return d3.rgb(colorTemp(data.log_Teff[d])).brighter(1);
            });
        gradOffset.append("stop")
            .attr("id", "offset-40")
            .attr("offset", "40%")
            .attr("stop-color", function (d) {
                return colorTemp(data.log_Teff[d]);
            });
        gradOffset.append("stop")
            .attr("id", "offset-100")
            .attr("offset", "100%")
            .attr("stop-color", function (d) {
                return d3.rgb(colorTemp(data.log_Teff[d])).darker(1.5);
            });

        /* Star */

        var getPropertyText = function (d) {
            if (d > 1) {
                return d.toFixed(0)
            } else {
                return d.toFixed(2)
            }
        };

        tipMap.html(function (d) {
            return "<table><tr><th>Phase:</th><th> " + getPhaseLabel(data.phase[d]) + "</th></tr>" +
                "<th>Luminosity:</th><th> " + d3.format(",")(getPropertyText(10**data.log_L[d])) + " L<sub>&#9737</sub></th></tr>" +
                "<th>Temperature:</th><th> " + d3.format(",")((10**data.log_Teff[d]).toFixed(0)) + " K</th></tr>" +
                "<th>Radius:</th><th> " + getPropertyText(10**data.log_R[d]) + " R<sub>&#9737</sub></th></tr>" +
                "<th>Mass:</th><th> " + (data.star_mass[d]).toFixed(4) + " M<sub>&#9737</sub></th></tr>" +
                "<th>Age:</th><th> " + d3.format(",")((data.star_age[d]).toFixed(0)) + " yr</th></tr></table>"

        });

        dot.data([0])
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", function (d) {
                return x(10**data.log_Teff[d])
            })
            .attr("cy", function (d) {
                return y(10**data.log_L[d])
            })
            .attr("r", function (d) {
                return r(10**data.log_R[d])
            })
            .style("fill", "url(#gradOffset)")
            .on('mouseover', function (d) {
                tipMap.offset([r(10**data.log_R[d]) - 10, 0])
                    .show(d);
                d3.select(this).attr("stroke-width", "3px");
            })
            .on('mouseout', function (d) {
                tipMap.hide(d);
                d3.select(this).attr("stroke-width", "1px");
            });

        /* Star diagram */

        var phase_description = _.where(description, {phase_number: ""+data.phase[0]})[0]

        var phase_subtitle = d3.selectAll("#phase-subtitle"),
            phase_text = d3.selectAll("#phase-text");

        phase_subtitle.html("<h3>" + phase_description.phase_name + "</h3>");
        phase_text.html(phase_description.description);

        var phase_diagram = d3.selectAll("#phase-diagram");

        phase_diagram.selectAll("img")
            .attr("src","img/"+phase_description.phase_name_abb+".png");

        /* Implementing scroller */

        var scrollTop = 0;
        var newScrollTop = 0;

        container
            .on("scroll.scroller", function () {
                newScrollTop = container.node().scrollTop
            });

        var setDimensions = function () {
            width = window.innerWidth / 2;
            height = window.innerHeight;
            scroll_length = content.node().getBoundingClientRect().height - height;

            scrollScale.domain([0, window.innerHeight]); // double check this for other values
        };

        var render = function () {
            if (scrollTop !== newScrollTop) {
                scrollTop = newScrollTop;


                if (content.node().getBoundingClientRect().top < 0) {

                    //var idx = Math.round(scrollScale(scrollTop));
                    var idx = Math.round(scrollScale(-content.node().getBoundingClientRect().top));
                    var phase = data.phase[idx];

                    if (phase == 6) {
                        x.domain([10**(Math.max(data.log_Teff[idx], 3.8, d3.extent(data.log_Teff.slice(0, idx))[1]) + 0.1),
                            10**(d3.extent(data.log_Teff)[0] - 0.1)]);
                        svgHR.selectAll(".axis--x")
                            .call(d3.axisBottom(x).tickValues([3000, 5000, 10000, 30000, 50000, 100000]).tickFormat(d3.format("")));
                    } else {
                        x.domain([10**(3.9), 10**(d3.extent(data.log_Teff)[0] - 0.1)]);
                        svgHR.selectAll(".axis--x")
                            .call(d3.axisBottom(x).tickValues([3000, 4000, 5000, 6000, 7000]).tickFormat(d3.format("")));
                    }

                    line.x(function (d) {
                            return x(10**data.log_Teff[d])
                        })
                        .y(function (d) {
                            return y(10**data.log_L[d])
                        });


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

                    svgHR.selectAll("#offset-0")
                        .attr("offset", "0%")
                        .attr("stop-color", function (d) {
                            return d3.rgb(colorTemp(data.log_Teff[idx])).brighter(1);
                        });

                    svgHR.selectAll("#offset-40")
                        .attr("offset", "40%")
                        .attr("stop-color", function (d) {
                            return colorTemp(data.log_Teff[idx]);
                        });

                    svgHR.selectAll("#offset-100")
                        .attr("offset", "100%")
                        .attr("stop-color", function (d) {
                            return d3.rgb(colorTemp(data.log_Teff[idx])).darker(1.5);
                        });

                    svgHR.selectAll(".dot")
                        .datum([idx])
                        .attr("cx", function (d) {
                            return x(10**data.log_Teff[d])
                        })
                        .attr("cy", function (d) {
                            return y(10**data.log_L[d])
                        })
                        .attr("r", function (d) {
                            return r(10**data.log_R[d])
                        })
                        .style("fill", "url(#gradOffset)");

                    phase_description = _.where(description, {phase_number: ""+phase})[0]
                    var phase_transition = 1;

                    phase_subtitle.html("<h3>" + phase_description.phase_name + "</h3>");
                    phase_text.html(phase_description.description);

                    phase_diagram.selectAll("img").attr("src","img/"+phase_description.phase_name_abb+".png");


                    d3.selectAll(".text-mass").datum([idx])
                        .html(function (d) {
                            return "Mass: " + data.star_mass[d].toFixed(4) + " Solar masses"
                        });

                    d3.selectAll(".text-age").datum([idx])
                        .html(function (d) {
                            return "Age: " + d3.format(",")(data.star_age[d].toFixed(0)) + " years"
                        });

                    handle.attr("cx", xSlider(ageToIndex.invert(idx)))
                        .style("fill", "url(#gradOffset)");

                }
            }

            window.requestAnimationFrame(render);
        };
        window.requestAnimationFrame(render);

        window.onresize = setDimensions;
    });
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