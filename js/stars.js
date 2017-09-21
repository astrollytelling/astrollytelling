var div = d3.select(".viz");

var width = window.innerWidth,
    height = window.innerHeight,
    center = [width / 2, height / 2];


var canvas = div.append("canvas")
    .attr("width", width)
    .attr("height", height);

var context = canvas.node().getContext("2d");

var projection = d3.geoStereographic()
    .scale(600);

function getRetinaRatio() {
    var devicePixelRatio = window.devicePixelRatio || 1;
    var backingStoreRatio = context.webkitBackingStorePixelRatio ||
        context.mozBackingStorePixelRatio ||
        context.msBackingStorePixelRatio ||
        context.oBackingStorePixelRatio ||
        context.backingStorePixelRatio || 1;

    return devicePixelRatio / backingStoreRatio
}

var ratio = getRetinaRatio();
var scaledWidth = width * ratio;
var scaledHeight = height * ratio;

canvas.node().width = scaledWidth;
canvas.node().height = scaledHeight;
canvas
    .style("width", width + 'px')
    .style("height", height + 'px');

context.scale(ratio, ratio);

var path = d3.geoPath()
    .projection(projection)
    .context(context);

var bgRGB = d3.rgb('#113');

d3.json("data/stars.json", function(stars){

    var geoConstellations = [];
    var starsMag = [];
    stars = stars.map(function(constellation) {
        constellation.stars = constellation.stars.filter(function(star) {
            if (star.mag < 6) starsMag.push(star.mag);
            return star.mag < 6;
        });
        return constellation;
    });
    var minMaxMag = d3.extent(starsMag);
    var opacityScale = d3.scaleLinear()
        .domain(minMaxMag)
        .range([1, 0.4]);

    var magScale = d3.scaleLinear()
        .domain(minMaxMag)
        .range([10, 1.7]);

    stars.forEach(function (constellation) {
        var geometries = [];

        constellation.stars.map(function (star) {
            var rgb = d3.rgb(star.color);
            var rgba = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + opacityScale(star.mag) + ')'

            geometries.push({
                type: 'Point',
                coordinates: [-star.ra, star.dec],
                properties: {
                    color: rgba,
                    mag: magScale(star.mag)
                }
            })
        });

        var lines = constellation.lines.map(function (line) {
            var p1 = [-line.ra1, line.dec1];
            var p2 = [-line.ra2, line.dec2];

            return [p1, p2]
        });

        geometries.push({
            type: "MultiLineString",
            coordinates: lines
        });

        geometries = {
            type: 'GeometryCollection',
            geometries: geometries
        };

        var geoConstellation = {
            type: 'Feature',
            geometry: geometries,
            properties: {
                name: constellation.name,
                zodiac: constellation.zodiac,
                center: d3.geoCentroid(geometries)
            }
        };
        geoConstellations.push(geoConstellation)
    });

    var ra = Math.random() * 360 - 180;
    var dec = Math.random() * 360 - 180;

    draw(geoConstellations, [ra, dec]);

    var setDimensions = function () {

        width = window.innerWidth;
        height = window.innerHeight;
        center = [width / 2, height / 2];

        canvas
            .attr("width", width)
            .attr("height", height);

        scaledWidth = width * ratio;
        scaledHeight = height * ratio;

        canvas.node().width = scaledWidth;
        canvas.node().height = scaledHeight;
        canvas
            .style("width", width + 'px')
            .style("height", height + 'px');

        context.scale(ratio, ratio);

        path.context(context);

        draw(geoConstellations, [ra, dec]);

    };

    window.onresize = setDimensions;

});


function makeRadialGradient(x, y, r, color) {
    var radialgradient = context.createRadialGradient(x, y, 0, x, y, r);
    radialgradient.addColorStop(0.2, color);
    radialgradient.addColorStop(0.5,'rgba(' + bgRGB.r + ',' + bgRGB.g + ',' + bgRGB.b + ',0)');
    radialgradient.addColorStop(0.5,'rgba(' + bgRGB.r + ',' + bgRGB.g + ',' + bgRGB.b + ',1)');
    radialgradient.addColorStop(1,'rgba(' + bgRGB.r + ',' + bgRGB.g + ',' + bgRGB.b + ',0)');
    context.fillStyle = radialgradient
}

function distance(p) {
    var xRotate = center[0] - p[0];
    var yRotate = center[1] - p[1];

    return Math.sqrt(Math.pow(xRotate, 2) + Math.pow(yRotate, 2))
}

function draw(constellations, center) {

    var min = 0,
        minDistance = distance(projection(constellations[0].properties.center));

    if (center) projection.rotate(center);

    context.clearRect(0, 0, width, height);
    context.lineWidth = .4;
    context.strokeStyle = "#f2f237";

    constellations.forEach(function(constellation, i) {
        var currentDistance = distance(projection(constellations[i].properties.center));
        if (currentDistance < minDistance) {
            min = i;
            minDistance = currentDistance;
        }
        constellation.geometry.geometries.forEach(function(geo) {
            if (geo.type == 'Point') {
                makeRadialGradient(
                    projection(geo.coordinates)[0],
                    projection(geo.coordinates)[1],
                    geo.properties.mag,
                    geo.properties.color);
                path.pointRadius([geo.properties.mag]);
                context.beginPath(); path(geo); context.fill();
            } else if (geo.type == 'MultiLineString') {
                context.strokeStyle = "#999";
                context.beginPath(); path(geo); context.stroke();
            }
        })
    });

}
