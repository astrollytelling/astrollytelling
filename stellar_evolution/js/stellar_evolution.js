var scrollVis = function (evolution, description, tracks, indices) {

    /* HR diagram definitions */

    var margin = {top: window.innerHeight/25, right: window.innerWidth/20, bottom: window.innerHeight/25, left: window.innerWidth/20},
        width = window.innerWidth/2,
        height = window.innerHeight * 4/5;

    var x = d3.scaleLog().range([0, width]),
        y = d3.scaleLog().range([height, 0]),
        r = d3.scaleLinear().range([2, 4]),
        line = d3.line(),
        scrollScale = d3.scaleLinear().domain([0, 1]);


    var colorMass = function(i) {
        //var value = (80 - d) / (80 - 0.3);
        //return d3.rgb(d3.interpolateSpectral(1-value)).brighter(1);
        return d3.rgb(d3.schemeSpectral[10][i]).brighter(1)
    };

    var colorTemp = function(d) {
        var value = (d - d3.extent(evolution.log_Teff)[1]) / (d3.extent(evolution.log_Teff)[1] - d3.extent(evolution.log_Teff)[0] - 0.1);
        return d3.interpolateRdYlBu(1 + value);
    };

    /* Slider definitions */

    var	marginSlider = {top: 10, right: window.innerWidth/10, bottom: 10, left: window.innerWidth/10},
        widthSlider = window.innerWidth * 2 / 5,
        heightSlider = margin.top,
        radiusSlider = 9;

    var phases = _.uniq(evolution.phase),
        n_phases = phases.length,
        step_height = $(".step").height(),
        xSlider = d3.scaleLinear().range([0, widthSlider - 2 * radiusSlider])
            .domain([0, n_phases * step_height]).clamp(true),
        tick_values;

    /* Tooltip */

    var tipMap = d3.tip().attr('class', 'd3-tip');

    /* Other definitions */

    var lastIndex = -1;
    var activeIndex = 0;

    var svg = null,
        g = null,
        svgSlider = null,
        slider = null;

    var activateFunctions = [],
        updateFunctions = [];

    var transition_duration = 200;

    var chart = function (selection) {
        selection.each(function (rawData) {

            /* Slider svg */

            svgSlider = d3.select(this).selectAll('#vis').data([rawData]);
            svgE = svgSlider.enter().append('svg');
            svgSlider = svgSlider.merge(svgE);
            svgSlider.attr('width', widthSlider + marginSlider.left + marginSlider.right);
            svgSlider.attr('height', heightSlider + marginSlider.top + marginSlider.bottom);

            slider = svgSlider.append("g")
                .attr("class", "slider")
                .attr("transform", "translate(" + marginSlider.left + "," + heightSlider / 2 + ")");

            /* HR diagram svg */

            svg = d3.select(this).selectAll('#vis').data([0]);
            var svgE = svg.enter().append('svg');
            svg = svg.merge(svgE);
            svg.attr('width', width + margin.left + margin.right);
            svg.attr('height', height + margin.top + margin.bottom);

            g = svg.append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
                .call(tipMap);

            x.domain([10**5.7, 10**3.2]);
            y.domain([10**(-2.3), 10**6.5]);

            r.domain([d3.extent(rawData.log_R)[0], d3.extent(rawData.log_R)[1]]);

            /* Do the rest */

            setupVis(rawData);

            setupSections();
        });
    };
    
    var setupVis = function(evolution) {

        /* Slider */

        slider.append("line")
            .attr("class", "track")
            .attr("stroke", "#ddd")
            .attr("x1", xSlider.range()[0])
            .attr("x2", xSlider.range()[1]);
        slider.append("g")
            .selectAll("line")
            .data(d3.range(n_phases))
            .enter().append("line")
            .attr("class", "track-ticks")
            .attr("x1", function (d) {
                return xSlider(d * step_height);
            })
            .attr("x2", function (d) {
                return xSlider(d * step_height);
            })
            .attr("y1", 0)
            .attr("y2", 5);
        slider.insert("g", ".track-overlay")
            .attr("class", "ticks")
            .attr("transform", "translate(0," + 2 * radiusSlider + ")")
            .selectAll("text")
            .data(d3.range(n_phases))
            .enter().append("text")
            .attr("x", function (d) {
                return xSlider((d + 1/2) * step_height);
            })
            .attr("text-anchor", "middle")
            .html(function (d, idx) {
                var phase_name = ['PMS', 'MS', 'RGB', 'CHeB', 'AGB', 'PAGBWD'];
                return phase_name[idx];
            })
            .on("click", function(){ $('html,body').scrollTo("#"+$(this).text(), "#"+$(this).text())})
            .on("mouseover", function() { d3.select(this).style("cursor", "pointer"); })
            .on("mouseout", function() { d3.select(this).style("cursor", "default"); });


        var handle = slider.insert("circle", ".track-overlay")
            .attr("class", "handle")
            .attr("r", radiusSlider);
        handle.style("fill", "url(#gradOffset)");

        slider.attr("opacity", 0);

        /* HR diagram */

        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickValues([2000, 4000, 10000, 20000, 40000, 100000, 200000]).tickFormat(d3.format("")));
        g.append("g")
            .attr("class", "axis axis--y")
            .attr("transform", "translate(0,0)")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("")));
        g.selectAll(".axis").attr("opacity", 0);

        g.append("text")
            .attr("x", 10)
            .attr("dy", "0.75em")
            .attr("class", "text-axis text-luminosity")
            .attr("transform", "translate(5," + (margin.top * 6) + ") rotate(-90)")
            .html("Luminosity (Solar Luminosity)");
        g.append("text")
            .attr("x", width)
            .attr("y", height)
            .attr("dy", "0.75em")
            .attr("class", "text-axis text-temperature")
            .attr("transform", "translate(-" + (margin.left * 2) + ",-15)")
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
        g.selectAll(".text-axis").attr("opacity", 0);
        g.selectAll(".text-plot").attr("opacity", 0);

        /* Tracks */

        x.domain([10**5.7, 10**3.2]);
        y.domain([10**(-2.3), 10**6.5]);
        for(var i in Object.keys(tracks)){
            line.x(function (d) {
                    return x(10**tracks[i].log_Teff[d])
                })
                .y(function (d) {
                    return y(10**tracks[i].log_L[d])
                });
            g.append("g")
                .datum(d3.range(tracks[i].log_Teff.length)).append("path")
                .attr("class", "tracks")
                .attr("id", "stellar-track-"+i)
                .attr("fill", "none")
                .attr("stroke", colorMass(i))
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 1.5)
                .attr("opacity", 0.8)
                .attr("d", line);
            g.selectAll(".tracks").attr("opacity", 0);

            if (i == '4'){
                g.append("text")
                    .datum([0])
                    .attr("x", function(d){ return x(10**tracks[i].log_Teff[d])})
                    .attr("y", function(d){ return y(10**tracks[i].log_L[d])})
                    .attr("dy", "0.75em")
                    .attr("class", "text-track")
                    .attr("id", "text-track-beginning")
                    .attr("transform", "translate(3,-5)")
                    .html("Beginning");
                g.append("text")
                    .datum([tracks[i].log_Teff.length-1])
                    .attr("x", function(d){ return x(10**tracks[i].log_Teff[d])})
                    .attr("y", function(d){ return y(10**tracks[i].log_L[d])})
                    .attr("dy", "0.75em")
                    .attr("class", "text-track")
                    .attr("id", "text-track-end")
                    .attr("transform", "translate(-10,8)")
                    .html("End");
                g.selectAll(".text-track").attr("opacity", 0);

            }

            if (i == '0'){
                g.append("text")
                    .datum([tracks[i].log_Teff.length-1])
                    .attr("x", function(d){ return x(10**tracks[i].log_Teff[d])})
                    .attr("y", function(d){ return y(10**tracks[i].log_L[d])})
                    .attr("dy", "0.75em")
                    .attr("class", "text-tracks")
                    .attr("id", "text-track-low-mass")
                    .attr("transform", "translate(-100, 10)")
                    .html("Low-mass star");
                g.selectAll(".text-tracks").attr("opacity", 0);
            }

            if (i == '9'){
                g.append("text")
                    .datum([tracks[i].log_Teff.length-1])
                    .attr("x", function(d){ return x(10**tracks[i].log_Teff[d])})
                    .attr("y", function(d){ return y(10**tracks[i].log_L[d])})
                    .attr("dy", "0.75em")
                    .attr("class", "text-tracks")
                    .attr("id", "text-track-high-mass")
                    .attr("transform", "translate(0, 20)")
                    .html("High-mass star");
                g.selectAll(".text-tracks").attr("opacity", 0);
            }
        }


        /* Track */

        x.domain([10**3.9, 10**(d3.extent(evolution.log_Teff)[0] - 0.1)]);
        y.domain([10**(-1.5), 10**(d3.extent(evolution.log_L)[1] + 0.2)]);
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

        /* Star */

        // Tool tip
        var getPropertyText = function (d) {
            if (d > 1) {
                return d.toFixed(0)
            } else {
                return d.toFixed(2)
            }
        };

        tipMap.html(function (d) {
            var description_text = _.where(description, {phase_number: ""+evolution.phase[d]})[0];
            return "<table><tr><th>Phase:</th><th> " + description_text.phase_name_abb + "</th></tr>" +
                "<th>Luminosity:</th><th> " + d3.format(",")(getPropertyText(10**evolution.log_L[d])) + " L<sub>&#9737</sub></th></tr>" +
                "<th>Temperature:</th><th> " + d3.format(",")((10**evolution.log_Teff[d]).toFixed(0)) + " K</th></tr>" +
                "<th>Radius:</th><th> " + getPropertyText(10**evolution.log_R[d]) + " R<sub>&#9737</sub></th></tr>" +
                "<th>Mass:</th><th> " + (evolution.star_mass[d]).toFixed(4) + " M<sub>&#9737</sub></th></tr>" +
                "<th>Age:</th><th> " + d3.format(",")((evolution.star_age[d]).toFixed(0)) + " yr</th></tr></table>"

        });

        // Dot element
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
            .attr("fill", "url(#gradOffset)")
            .on('mouseover', function (d) {
                tipMap.offset([r(10**evolution.log_R[d]) - 10, 0])
                    .show(d);
                d3.select(this).attr("stroke-width", "3px");
            })
            .on('mouseout', function (d) {
                tipMap.hide(d);
                d3.select(this).attr("stroke-width", "1px");
            });

        g.selectAll("circle").attr("opacity", 0);


    };

    var setupSections = function () {

        for (var i = 0; i < 22; i++) {
            activateFunctions[i] = setBackgroundBlack;
            updateFunctions[i] = function () {};
        }

        activateFunctions[0] = function() {showTitle(); changeBackgroundImage("../img/stellar_evolution/bg.jpg");};
        activateFunctions[1] = function() {hideTitle(); setBackgroundBlack();};
        activateFunctions[2] = function() {changeBackgroundImage("../img/stellar_evolution/img2a_large.jpg");};
        activateFunctions[3] = function() {changeBackgroundImage("../img/stellar_evolution/img2b_large.jpg");};
        activateFunctions[4] = function() {changeBackgroundImage("../img/stellar_evolution/img3a_large.jpg");};
        activateFunctions[5] = function() {changeBackgroundImage("../img/stellar_evolution/img3b_large.jpg");};
        activateFunctions[6] = function() {changeBackgroundImage("../img/stellar_evolution/img4_large.jpg");};
        activateFunctions[9] = function() {setBackgroundBlack(); hideAxis();};
        activateFunctions[10] = function() {setBackgroundBlack(); showAxis(); hideExampleTrack(); hideTrackText();};
        activateFunctions[11] = function() {setBackgroundBlack(); hideTracks(); hideTracksText(); showExampleTrack();
                                            showTrackText();};
        activateFunctions[12] = function() {setBackgroundBlack(); hideTrackText(); showAxis(); showTracks();
                                            showTracksText()};
        activateFunctions[13] = function() {setBackgroundBlack(); hideTracks(); hideTrackText(); hideTracksText();
                                            hideAxis(); hideSlider(); hidePlotText(); hideStar();};
        activateFunctions[14] = function() {setBackgroundBlack(); showSlider(); showPlotText(); showStar(); showAxis();};
        activateFunctions[20] = function() {setBackgroundBlack(); showSlider(); showPlotText(); showStar(); showAxis();};
        activateFunctions[21] = function() {setBackgroundBlack(); hideSlider(); hidePlotText(); hideStar(); hideAxis();};

        for (i = 15; i < 21; i++){
            updateFunctions[i] = evolveHR;
        }

    };

    var showTitle = function() {
        $("#title-viz").animate({opacity: 1, "z-index": 200}, transition_duration);
    };

    var hideTitle = function() {
        $("#title-viz").animate({opacity:0, "z-index": 0}, transition_duration);
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

        var span = $("#bg-img span");
        img === '../img/stellar_evolution/bg.jpg' ? span.css("display", "block") : span.css("display", "none");

    };

    function showTracks() {
        tick_values = [2000, 4000, 10000, 20000, 40000, 100000, 200000];
        x.domain([10**5.7, 10**3.2]);
        y.domain([10**(-2.3), 10**6.5]);
        g.selectAll(".axis--x")
            .transition().duration(transition_duration)
            .call(d3.axisBottom(x).tickValues(tick_values).tickFormat(d3.format("")));
        g.selectAll(".axis--y")
            .transition().duration(transition_duration)
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("")));
        g.selectAll(".tracks").transition().duration(transition_duration)
            .attr("opacity", 1);
    }

    function hideTracks() {
        g.selectAll(".tracks").transition().duration(transition_duration)
            .attr("opacity", 0);
    }

    function showTracksText() {
        g.selectAll(".text-tracks")
            .transition().duration(transition_duration)
            .attr("opacity", 1)
    }

    function hideTracksText() {
        g.selectAll(".text-tracks")
            .transition().duration(transition_duration)
            .attr("opacity", 0)
    }


    function showExampleTrack() {
        g.selectAll("#stellar-track-4").transition().duration(transition_duration)
            .attr("opacity", 1);
    }

    function showTrackText() {
        g.selectAll(".text-track")
            .transition().duration(transition_duration)
            .attr("opacity", 1)
    }

    function hideTrackText() {
        g.selectAll(".text-track")
            .transition().duration(transition_duration)
            .attr("opacity", 0)
    }

    function hideExampleTrack(){
        g.selectAll("#stellar-track-4").transition().duration(transition_duration)
            .attr("opacity", 0);
    }

    function showSlider() {
        slider.transition().duration(transition_duration)
            .attr("opacity", 1)
    }

    function hideSlider() {
        slider.transition().duration(transition_duration)
            .attr("opacity", 0)
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
            //.transition().duration(transition_duration)
            .attr("opacity", 1);
        g.selectAll(".text-axis")
            .transition().duration(transition_duration)
            .attr("opacity", 1);
    }

    function hideAxis() {
        g.selectAll(".axis")
            //.transition().duration(transition_duration)
            .attr("opacity", 0);
        g.selectAll(".text-axis")
            .transition().duration(transition_duration)
            .attr("opacity", 0);
    }

    function showStar(){
        tick_values = [3000, 4000, 5000, 6000, 7000];
        x.domain([10**3.9, 10**(d3.extent(evolution.log_Teff)[0] - 0.1)]);
        y.domain([10**(-1.5), 10**(d3.extent(evolution.log_L)[1] + 0.2)]);
        g.selectAll(".axis--x")
            .transition().duration(transition_duration)
            .call(d3.axisBottom(x).tickValues(tick_values).tickFormat(d3.format("")));
        g.selectAll(".axis--y")
            .transition().duration(transition_duration)
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("")));
        g.selectAll(".dot")
            .transition().duration(transition_duration)
            .attr("opacity", 1)
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

    function hideEverything() {
        hideAxis();
        hideExampleTrack();
        hideTrackText();
        hideTracks();
        hideSlider();
        hidePlotText();
        hideStar();
    }

    function evolveHR(progress, idx) {

        g.selectAll(".stellar-track").attr("opacity", 1);
        g.selectAll("circle").attr("opacity", 1);

        scrollScale.range(indices[idx]);
        var this_idx = Math.round(scrollScale(progress));
        var phase = evolution.phase[this_idx];
        var idx_this_phase = _.indexOf(phases, phase);

        if (phase == 6) {
            tick_values = [3000, 5000, 10000, 30000, 50000, 100000];
            x.domain([10**(Math.max(evolution.log_Teff[this_idx], 3.8, d3.extent(evolution.log_Teff.slice(0, this_idx))[1]) + 0.1),
                10**(d3.extent(evolution.log_Teff)[0] - 0.1)]);
            g.selectAll(".axis--x")
                .call(d3.axisBottom(x).tickValues(tick_values).tickFormat(d3.format("")));
        } else {
            tick_values = [3000, 4000, 5000, 6000, 7000];
            x.domain([10**(3.9), 10**(d3.extent(evolution.log_Teff)[0] - 0.1)]);
            g.selectAll(".axis--x")
                .call(d3.axisBottom(x).tickValues(tick_values).tickFormat(d3.format("")));
        }

        line.x(function (d) {
                return x(10**evolution.log_Teff[d])
            })
            .y(function (d) {
                return y(10**evolution.log_L[d])
            });

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

        // Update handle
        slider.selectAll(".handle")
            .attr("cx", xSlider((idx_this_phase + progress) * step_height))
            .style("fill", "url(#gradOffset)");
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
    
    var setDimensions = function() {

        // HR
        margin = {top: window.innerHeight/25, right: window.innerWidth/20, bottom: window.innerHeight/25, left: window.innerWidth/20};
        width = window.innerWidth/2;
        height = window.innerHeight * 4/5;

        svg.attr('width', width + margin.left + margin.right);
        svg.attr('height', height + margin.top + margin.bottom);

        x.range([0, width]);
        y.range([height, 0]);

        g.selectAll(".axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickValues(tick_values).tickFormat(d3.format("")));

        g.selectAll(".axis--y")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("")));

        g.selectAll(".text-temperature")
            .attr("x", width)
            .attr("y", height);

        g.selectAll(".text-mass")
            .attr("y", height);

        g.selectAll(".text-age")
            .attr("y", height);

        x.domain([10**3.9, 10**(d3.extent(evolution.log_Teff)[0] - 0.1)]);
        y.domain([10**(-1.5), 10**(d3.extent(evolution.log_L)[1] + 0.2)]);

        g.selectAll(".dot")
            .attr("cx", function (d) {
                return x(10**evolution.log_Teff[d])
            })
            .attr("cy", function (d) {
                return y(10**evolution.log_L[d])
            });

        line.x(function (d) {
                return x(10**evolution.log_Teff[d])
            })
            .y(function (d) {
                return y(10**evolution.log_L[d])
            });

        g.selectAll(".stellar-track")
            .attr("d", line);

        x.domain([10**5.7, 10**3.2]);
        y.domain([10**(-2.3), 10**6.5]);

        for(var i in Object.keys(tracks)) {
            line.x(function (d) {
                    return x(10**tracks[i].log_Teff[d])
                })
                .y(function (d) {
                    return y(10**tracks[i].log_L[d])
                });

            g.selectAll("#stellar-track-"+i)
                .attr("d", line);

            if (i == '4'){
                g.selectAll("#text-track-beginning")
                    .datum([0])
                    .attr("x", function(d){ return x(10**tracks[i].log_Teff[d])})
                    .attr("y", function(d){ return y(10**tracks[i].log_L[d])});
                g.selectAll("#text-track-end")
                    .datum([tracks[i].log_Teff.length-1])
                    .attr("x", function(d){ return x(10**tracks[i].log_Teff[d])})
                    .attr("y", function(d){ return y(10**tracks[i].log_L[d])});
            }

            if (i == '0'){
                g.selectAll("#text-track-low-mass")
                    .datum([tracks[i].log_Teff.length-1])
                    .attr("x", function(d){ return x(10**tracks[i].log_Teff[d])})
                    .attr("y", function(d){ return y(10**tracks[i].log_L[d])});
            }

            if (i == '9'){
                g.selectAll("#text-track-high-mass")
                    .datum([tracks[i].log_Teff.length-1])
                    .attr("x", function(d){ return x(10**tracks[i].log_Teff[d])})
                    .attr("y", function(d){ return y(10**tracks[i].log_L[d])});
            }
        }

        // Slider

        marginSlider = {top: 10, right: window.innerWidth/10, bottom: 10, left: window.innerWidth/10};
        widthSlider = window.innerWidth * 2 / 5;
        heightSlider = margin.top;

        svgSlider.attr('width', widthSlider + marginSlider.left + marginSlider.right);
        svgSlider.attr('height', heightSlider + marginSlider.top + marginSlider.bottom);
        slider.attr("transform", "translate(" + marginSlider.left + "," + heightSlider / 2 + ")");

        xSlider.range([0, widthSlider - 2 * radiusSlider]);

        slider.selectAll(".track")
            .attr("x1", xSlider.range()[0])
            .attr("x2", xSlider.range()[1]);

        slider.selectAll(".track-ticks")
            .attr("x1", function (d) {
                return xSlider(d * step_height);
            })
            .attr("x2", function (d) {
                return xSlider(d * step_height);
            });
        slider.selectAll("text")
            .attr("x", function (d) {
                return xSlider((d + 1/2) * step_height);
            });
        
    };

    window.onresize = setDimensions;

    return chart;
};

function initVis(error, evolution, description, tracks){

    $(document).ready(function(){
        $(this).scrollTop(0);
    });

    // Fix AGB for phase=5
    evolution.phase.forEach(function(d, i){
        if (d == 5){
            evolution.phase[i] = 4;
        }
    });

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

    var plot = scrollVis(evolution, description, tracks, indices);

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
    .defer(d3.json, "data/tracks.json")
    .await(initVis);