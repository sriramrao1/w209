(function () {
  var SmallMultiples, plotData, setupIsoytpe, transformData;

  SmallMultiples = function() {
    var area, bisect, caption, chart, circle, curYear, data, format, height, line, margin, mousemove, mouseout, mouseover, setupScales, width, xScale, xValue, yAxis, yScale, yValue;
    width = 250;
    height = 200;
    margin = {
      top: 15,
      right: 10,
      bottom: 40,
      left: 35
    };
    data = [];
    circle = null;
    caption = null;
    curYear = null;
    bisect = d3.bisector(function(d) {
      return d.date;
    }).left;
    format = d3.time.format("%Y");
    xScale = d3.time.scale().range([0, width]);
    yScale = d3.scale.linear().range([height, 0]);
    xValue = function(d) {
      return d.date;
    };
    yValue = function(d) {
      return d.MedalCount;
    };
    yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(4).outerTickSize(0).tickSubdivide(1).tickSize(-width);
    area = d3.svg.area().x(function(d) {
      return xScale(xValue(d));
    }).y0(height).y1(function(d) {
      return yScale(yValue(d));
    });
    line = d3.svg.line().interpolate("linear").x(function(d) {
      return xScale(xValue(d));
    }).y(function(d) {
      return yScale(yValue(d));
    });
    setupScales = function(data) {
      var extentX, maxY;
      maxY = d3.max(data, function(c) {
        return d3.max(c.values, function(d) {
          return yValue(d);
        });
      });
      maxY = maxY + (maxY * 1 / 4);
      yScale.domain([0, maxY]);
      extentX = d3.extent(data[0].values, function(d) {
        return xValue(d);
      });
      return xScale.domain(extentX);
    };
    chart = function(selection) {
      return selection.each(function(rawData) {
        var div, g, lines, svg;
        data = rawData;
        setupScales(data);
        div = d3.select(this).selectAll(".chart").data(data);
        div.enter().append("div").attr("class", "chart").append("svg").append("g");
        svg = div.select("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom);
        g = svg.select("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        g.append("rect").attr("class", "background").style("pointer-events", "all").attr("width", width + margin.right).attr("height", height).on("mouseover", mouseover).on("mousemove", mousemove).on("mouseout", mouseout);
        lines = g.append("g");
        lines.append("path").attr("class", "bluearea").style("pointer-events", "none").attr("d", function(c) {
          return area(c.values);
        });
        lines.append("path").attr("class", "blueline").style("pointer-events", "none").attr("d", function(c) {
          return line(c.values);
        });
        lines.append("text").attr("class", "title").attr("text-anchor", "middle").attr("y", height).attr("dy", margin.bottom / 2 + 5).attr("x", width / 2).text(function(c) {
          return c.key;
        });
        lines.append("text").attr("class", "static_year").attr("text-anchor", "start").style("pointer-events", "none").attr("dy", 13).attr("y", height).attr("x", 0).text(function(c) {
          return xValue(c.values[0]).getFullYear();
        });
        lines.append("text").attr("class", "static_year").attr("text-anchor", "end").style("pointer-events", "none").attr("dy", 13).attr("y", height).attr("x", width).text(function(c) {
          return xValue(c.values[c.values.length - 1]).getFullYear();
        });
        circle = lines.append("circle").attr("r", 2.2).attr("opacity", 0).style("pointer-events", "none");
        caption = lines.append("text").attr("class", "caption").attr("text-anchor", "middle").style("pointer-events", "none").attr("dy", -8);
        curYear = lines.append("text").attr("class", "year").attr("text-anchor", "middle").style("pointer-events", "none").attr("dy", 13).attr("y", height);
        return g.append("g").attr("class", "y axis").call(yAxis);
      });
    };
    mouseover = function() {
      circle.attr("opacity", 1.0);
      d3.selectAll(".static_year").classed("hidden", true);
      return mousemove.call(this);
    };
    mousemove = function() {
      var date, index, year;
      year = xScale.invert(d3.mouse(this)[0]).getFullYear();
      date = format.parse('' + year);
      index = 0;
      circle.attr("cx", xScale(date)).attr("cy", function(c) {
        index = bisect(c.values, date, 0, c.values.length - 1);
        return yScale(yValue(c.values[index]));
      });
      caption.attr("x", xScale(date)).attr("y", function(c) {
        return yScale(yValue(c.values[index]));
      }).text(function(c) {
        return yValue(c.values[index]);
      });
      return curYear.attr("x", xScale(date)).text(year);
    };
    mouseout = function() {
      d3.selectAll(".static_year").classed("hidden", false);
      circle.attr("opacity", 0);
      caption.text("");
      return curYear.text("");
    };
    chart.x = function(_) {
      if (!arguments.length) {
        return xValue;
      }
      xValue = _;
      return chart;
    };
    chart.y = function(_) {
      if (!arguments.length) {
        return yValue;
      }
      yValue = _;
      return chart;
    };
    return chart;
  };

  transformData = function(rawData) {
    var format, nest;
    format = d3.time.format("%Y");
    rawData.forEach(function(d) {
      d.date = format.parse(d.Edition);
      return d.MedalCount = +d.MedalCount;
    });
    nest = d3.nest().key(function(d) {
      return d.Country;
    }).sortValues(function(a, b) {
      return d3.ascending(a.date, b.date);
    }).entries(rawData);
    return nest;
  };

  plotData = function(selector, data, plot) {
    return d3.select(selector).datum(data).call(plot);
  };

  setupIsoytpe = function() {
    $("#vis").isotope({
      itemSelector: '.chart',
      layoutMode: 'fitRows',
      getSortData: {
        count: function(e) {
          var d, sum;
          d = d3.select(e).datum();
          sum = d3.sum(d.values, function(d) {
            return d.MedalCount;
          });
          return sum * -1;
        },
        name: function(e) {
          var d;
          d = d3.select(e).datum();
          return d.Id;
        }
      }
    });
    return $("#vis").isotope({
      sortBy: 'name'
    });
  };

  $(function() {
    var display, plot;
    plot = SmallMultiples();
    display = function(error, rawData) {
      var data;
      if (error) {
        console.log(error);
      }
      data = transformData(rawData);
      plotData("#vis", data, plot);
      return setupIsoytpe();
    };
    queue().defer(d3.tsv, "data/coldwar.tsv").await(display);
    return d3.select("#button-wrap").selectAll("div").on("click", function() {
      var id;
      id = d3.select(this).attr("id");
      d3.select("#button-wrap").selectAll("div").classed("active", false);
      d3.select("#" + id).classed("active", true);
      return $("#vis").isotope({
        sortBy: id
      });
    });
  });

}).call(this);
