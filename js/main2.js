var scrollVis = function (evolution, description, stars, indices) {

    var margin = {top: 40, right: 40, bottom: 40, left: 50},
        width = window.innerWidth * 11/20,
        height = window.innerHeight * 4/5;

    var x = d3.scaleLog().range([0, width]),
        y = d3.scaleLog().range([height, 0]),
        r = d3.scaleLinear().range([2, 4]),
        line = d3.line(),
        scrollScale = d3.scaleLinear().domain([0, 1]);

    var colorTemp = function (d) {
        var value = (d - d3.extent(evolution.log_Teff)[1]) / (d3.extent(evolution.log_Teff)[1] - d3.extent(evolution.log_Teff)[0] - 0.1);
        return d3.interpolateRdYlBu(1 + value);
    };

    var lastIndex = -1;
    var activeIndex = 0;

    var svg = null;
    var g = null;

    var activateFunctions = [],
        updateFunctions = [];

    var transition_duration = 500;

    var chart = function (selection) {
        selection.each(function (rawData) {
            // create svg and give it a width and height
            svg = d3.select(this).selectAll('svg').data([rawData]);
            var svgE = svg.enter().append('svg');
            // @v4 use merge to combine enter and existing selection
            svg = svg.merge(svgE);

            svg.attr('width', width + margin.left + margin.right);
            svg.attr('height', height + margin.top + margin.bottom);

            svg.append('g');

            g = svg.select('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            x.domain([10**3.9, 10**(d3.extent(rawData.log_Teff)[0] - 0.1)]);
            y.domain([10**(-1.5), 10**(d3.extent(rawData.log_L)[1] + 0.2)]);
            r.domain([d3.extent(rawData.log_R)[0], d3.extent(rawData.log_R)[1]]);
            //scrollScale.range([0, rawData.star_age.length - 1]);

            setupVis(rawData);

            setupSections();
        });
    };
    
    var setupVis = function(evolution) {

        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickValues([3000, 4000, 5000, 6000, 7000]).tickFormat(d3.format("")));
        g.append("g")
            .attr("class", "axis axis--y")
            .attr("transform", "translate(0,0)")
            .call(d3.axisLeft(y).ticks(5)
                .tickFormat(d3.format("")));
        g.selectAll(".axis").attr("opacity", 0);

        g.append("text")
            .attr("x", 10)
            .attr("dy", "0.75em")
            .attr("class", "text-plot text-luminosity")
            .attr("transform", "rotate (-90) translate(-150,5)")
            .html("Luminosity (Solar Luminosity)");
        g.append("text")
            .attr("x", width)
            .attr("y", height)
            .attr("dy", "0.75em")
            .attr("class", "text-plot text-temperature")
            .attr("transform", "translate(-100,-15)")
            .html("Temperature (Kelvin)");
        g.append("text")
            .data([0])
            .attr("x", 10)
            .attr("y", height)
            .attr("dy", "0.75em")
            .attr("class", "text-plot text-mass")
            .attr("transform", "translate(0,-45)")
            .html(function (d) {
                return "Mass: " + evolution.star_mass[d].toFixed(4) + " Solar masses"
            });
        g.append("text")
            .data([0])
            .attr("x", 10)
            .attr("y", height)
            .attr("dy", "0.75em")
            .attr("class", "text-plot text-age")
            .attr("transform", "translate(0,-25)")
            .html(function (d) {
                return "Age: " + evolution.star_age[d].toFixed(0) + " years"
            });
        g.selectAll(".text-plot").attr("opacity", 0);


        /* Track */

        line.x(function (d) {
                return x(10**evolution.log_Teff[d])
            })
            .y(function (d) {
                return y(10**evolution.log_L[d])
            });
        g.append("g")
            .datum(d3.range(1)).append("path")
            .attr("class", "stellar-track")
            .attr("fill", "none")
            .attr("stroke", "gray")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.5)
            .attr("d", line);
        g.selectAll(".stellar-track").attr("opacity", 0);


        /* Star gradient, from http://bl.ocks.org/nbremer/eb0d1fd4118b731d069e2ff98dfadc47 */

        var colorTemp = function (d) {
            var value = (d - d3.extent(evolution.log_Teff)[1]) / (d3.extent(evolution.log_Teff)[1] - d3.extent(evolution.log_Teff)[0] - 0.1);
            return d3.interpolateRdYlBu(1 + value);
        };

        var gradientOffset = g.selectAll(".gradientOffset");

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
                return d3.rgb(colorTemp(evolution.log_Teff[d])).brighter(1);
            });
        gradOffset.append("stop")
            .attr("id", "offset-40")
            .attr("offset", "40%")
            .attr("stop-color", function (d) {
                return colorTemp(evolution.log_Teff[d]);
            });
        gradOffset.append("stop")
            .attr("id", "offset-100")
            .attr("offset", "100%")
            .attr("stop-color", function (d) {
                return d3.rgb(colorTemp(evolution.log_Teff[d])).darker(1.5);
            });
        gradientOffset.style("opacity", 0);

        // Star
        var dot = g.selectAll(".dot");

        dot.data([0])
            .enter().append("circle")
            .attr("class", "dot")
            .attr("cx", function (d) {
                return x(10**evolution.log_Teff[d])
            })
            .attr("cy", function (d) {
                return y(10**evolution.log_L[d])
            })
            .attr("r", function (d) {
                return r(10**evolution.log_R[d])
            })
            .attr("fill", "url(#gradOffset)");
            /*.on('mouseover', function (d) {
                tipMap.offset([r(10**data.log_R[d]) - 10, 0])
                    .show(d);
                d3.select(this).attr("stroke-width", "3px");
            })
            .on('mouseout', function (d) {
                tipMap.hide(d);
                d3.select(this).attr("stroke-width", "1px");
            });*/

        g.selectAll("circle").attr("opacity", 0);


    };

    var setupSections = function () {

        for (var i = 0; i < 20; i++) {
            activateFunctions[i] = setBackgroundBlack;
            updateFunctions[i] = function () {};
        }

        activateFunctions[0] = function() {changeBackgroundImage("img/bg.jpg");};
        activateFunctions[3] = function() {changeBackgroundImage("img/img2b_large.jpg");};
        activateFunctions[4] = function() {changeBackgroundImage("img/img3a_large.jpg");};
        activateFunctions[5] = function() {changeBackgroundImage("img/img3b_large.jpg");};
        activateFunctions[6] = setBackgroundBlack;
        activateFunctions[9] = hidePlot;
        activateFunctions[10] = showPlot;
        activateFunctions[12] = hideStar;

        for (i = 13; i < 19; i++){
            updateFunctions[i] = evolveHR;
        }

    };

    var setBackgroundBlack = function() {
        $("#bg-img").animate({opacity: 0}, transition_duration);
    };

    var changeBackgroundImage = function(img) {

        var bg_img = $("#bg-img");
        bg_img.animate({opacity: 0}, transition_duration);
        setTimeout(function(){
            bg_img.css("background-image", "url("+img+")")
                .animate({opacity: 1}, transition_duration);
        }, transition_duration);

    };

    function showPlot() {
        showAxis();
        showPlotText();
    }

    function hidePlot() {
        hideAxis();
        hidePlotText();
    }

    function showPlotText() {
        g.selectAll(".text-plot")
            .transition().duration(transition_duration)
            .attr("opacity", 1)
    }

    function hidePlotText() {
        g.selectAll(".text-plot")
            .transition().duration(transition_duration)
            .attr("opacity", 0)
    }

    function showAxis() {
        g.selectAll(".axis")
            .transition().duration(transition_duration)
            .attr("opacity", 1)
    }

    function hideAxis() {
        g.selectAll(".axis")
            .transition().duration(transition_duration)
            .attr("opacity", 0)
    }

    function hideStar(){
        hideDot();
        hideTrack();
    }

    function hideDot() {
        g.selectAll(".dot")
            .transition().duration(transition_duration)
            .attr("opacity", 0)
    }

    function hideTrack() {
        g.selectAll(".stellar-track")
            .transition().duration(transition_duration)
            .attr("opacity", 0)
    }

    function evolveHR(progress, idx) {

        g.selectAll(".stellar-track").attr("opacity", 1);
        g.selectAll("circle").attr("opacity", 1);

        scrollScale.range(indices[idx]);
        var this_idx = Math.round(scrollScale(progress));
        var phase = evolution.phase[this_idx];

        if (phase == 6) {
            x.domain([10**(Math.max(evolution.log_Teff[this_idx], 3.8, d3.extent(evolution.log_Teff.slice(0, this_idx))[1]) + 0.1),
                10**(d3.extent(evolution.log_Teff)[0] - 0.1)]);
            g.selectAll(".axis--x")
                .call(d3.axisBottom(x).tickValues([3000, 5000, 10000, 30000, 50000, 100000]).tickFormat(d3.format("")));
            console.log('si, 6')
        } else {
            x.domain([10**(3.9), 10**(d3.extent(evolution.log_Teff)[0] - 0.1)]);
            g.selectAll(".axis--x")
                .call(d3.axisBottom(x).tickValues([3000, 4000, 5000, 6000, 7000]).tickFormat(d3.format("")));
            console.log("no, otro")
        }

        line.x(function (d) {
                return x(10**evolution.log_Teff[d])
            })
            .y(function (d) {
                return y(10**evolution.log_L[d])
            });

        g.selectAll(".stellar-track")
            .attr("d", line);

        g.selectAll(".stellar-track")
            .datum(d3.range(this_idx))
            .attr("fill", "none")
            .attr("stroke", "gray")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.5)
            .attr("d", line);


        // Update star
        g.selectAll("#offset-0")
            .attr("offset", "0%")
            .attr("stop-color", function (d) {
                return d3.rgb(colorTemp(evolution.log_Teff[this_idx])).brighter(1);
            });

        g.selectAll("#offset-40")
            .attr("offset", "40%")
            .attr("stop-color", function (d) {
                return colorTemp(evolution.log_Teff[this_idx]);
            });

        g.selectAll("#offset-100")
            .attr("offset", "100%")
            .attr("stop-color", function (d) {
                return d3.rgb(colorTemp(evolution.log_Teff[this_idx])).darker(1.5);
            });

        g.selectAll(".dot")
            .datum([this_idx])
            .attr("cx", function (d) {
                return x(10**evolution.log_Teff[d])
            })
            .attr("cy", function (d) {
                return y(10**evolution.log_L[d])
            })
            .attr("r", function (d) {
                return r(10**evolution.log_R[d])
            })
            .attr("fill", "url(#gradOffset)");

        // Update text
        g.selectAll(".text-mass").datum([this_idx])
            .html(function (d) {
                return "Mass: " + evolution.star_mass[d].toFixed(4) + " Solar masses"
            });

        g.selectAll(".text-age").datum([this_idx])
            .html(function (d) {
                return "Age: " + d3.format(",")(evolution.star_age[d].toFixed(0)) + " years"
            });
    }

    chart.activate = function (index) {
        activeIndex = index;
        var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
        var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
        scrolledSections.forEach(function (i) {
            activateFunctions[i]();
        });
        lastIndex = activeIndex;
    };

    chart.update = function (index, progress) {
        updateFunctions[index](progress, index);
    };

    return chart;
};

function initVis(error, evolution, description, stars){

    $(document).ready(function(){
        $(this).scrollTop(0);
    });

    // Fix AGB for phase=5
    evolution.phase.forEach(function(d, i){
        if (d == 5){
            evolution.phase[i] = 4;
        }
    });

    console.log(evolution)

    var steps = $(".step"),
        indices = [];

    // Prepare index data for each section
    var phase_labels = Object.values(description).map(function(d){
        return d.phase_name_abb;
    });

    for (i = 0; i < steps.length; i++){
        var step_id = steps[i].id;
        if ($.inArray(step_id, phase_labels) >= 0) {
            var phase_number = _.where(description, {phase_name_abb: step_id})[0].phase_number;
            indices.push([_.indexOf(evolution.phase, +phase_number), _.lastIndexOf(evolution.phase, +phase_number)])
        } else {
            indices.push([])
        }
    }
    var plot = scrollVis(evolution, description, stars, indices);

    d3.select('#vis')
        .datum(evolution)
        .call(plot);

    var scroll = scroller()
        .container(d3.select('#graphic'));

    scroll(d3.selectAll('.step'));

    var duration;

    scroll.on('active', function (index) {

        duration = index==0 ? 0 : 500;

        d3.selectAll('.step')
            .transition().duration(duration)
            .style('opacity', function (d, i) { return i === index ? 1 : 0; });
        plot.activate(index);
    });

    scroll.on('progress', function (index, progress) {
        plot.update(index, progress);
    });
}

queue()
    .defer(d3.json, "data/00140M_evol_track.json")
    .defer(d3.json, "data/description.json")
    .defer(d3.csv, "data/stars.csv")
    .await(initVis);