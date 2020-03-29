var csv_data = [];
const margin = { top: 60, bottom: 150, left: 100, right: 100 };
var svg_fh, svg_sh = null;
var canvas_fh, canvas_sh = null;
var height, width = null;
var xScale,yScale = null;
var tooltip = null;

/**
 * Initialises svg containers as well as other components such as the navbar.
 */
function initialise() {
    include_navbar();
    make_nav_item_active("scatterplot-chart-item");
    tooltip= generate_tooltip();
    svg_fh = generate_svg("#scatterplot-chart",600,550,"svg_fh");
    svg_sh = generate_svg("#scatterplot-chart",600,550,"svg_sh");
    canvas_fh = add_canvas(svg_fh);
    canvas_sh = add_canvas(svg_sh);
    [width,height] = svg_dimensions(svg_fh);
}




d3.csv("dataset/understat_per_game.csv", function(d) {

    return {
        year:d.year,
        xG:parseFloat(d.xG),
        npxG:parseFloat(d.npxG),
        scored:+d.scored,
        team:d.team,

    }
}).then(function (data) {
    initialise();
    csv_data = data;
    allTeams = extract_all_teams(data);
    generateInput(allTeams,"team-dropdown","plot_scatterplot_chart","(this)");
    var initial_data_scored = extract_data_scatterplot_chart(data,"Barcelona","scored","xG");
    var initial_data_npxG = extract_data_scatterplot_chart(data,"Barcelona","npxG","xG");
    axisLabel(svg_fh,width/2 + margin.left, height + 2*margin.top, "Number of goals");
    axisLabel(svg_sh, width/2 + margin.left, height + 2*margin.top, "npxG");
    axisLabel(svg_fh,margin.left/2 , height/2, "xG","rotate(-90)");
    axisLabel(svg_sh,margin.left/2 , height/2, "xG","rotate(-90)");

    scatterplot_chart(svg_fh,canvas_fh, initial_data_scored);
    scatterplot_chart(svg_sh, canvas_sh, initial_data_npxG);

});

/**
 * Generates initial scatterplot chart.
 * @param svg svg container
 * @param canvas chart container
 * @param data
 */
function scatterplot_chart(svg, canvas, data) {

    labels = [];
    svg.selectAll(".axis-label").each(function() {
        labels.push($(this)[0].textContent);
    });

    console.log(labels);

    chart_title(svg,data[0].team + ", " + labels[0] + " " + "vs " +  labels[1],(0.5*width+margin.left),margin.top/2);

    var [max_x_value,max_y_value] = compute_extreme_values(data);
    [xScale, yScale] = axisScales(height, width);
    [xScale,yScale] = axisDomains(data);

    var line = fit_line(data);

    var circles = canvas.append("g")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle");

    scatterplot_circles(circles);

    var x_ticks = Number.isInteger(max_x_value) ? max_x_value : max_x_value /0.5;

    generate_axis(canvas, x_ticks, max_y_value / 0.5);

    plot_fit_line(svg,canvas,line,data);
    apply_axis_style();
}

/**
 * Updates the scatterplot chart according to the new data.
 * @param svg svg container
 * @param canvas chart container
 * @param data
 */
function update_scatterplot_chart(svg, canvas, data)
{

    var current_text =  svg.select(".chart-title").node().innerHTML;
    var fields = current_text.split(",");
    fields[0] = data[0].team;
    var newText = fields.join(",");
    svg.select(".chart-title").text( newText);

    var [max_x_value,max_y_value] = compute_extreme_values(data);


    [xScale, yScale] = axisScales(height, width);


    var line = fit_line(data);

    [xScale,yScale] = axisDomains(data);
    update_axis(max_x_value,max_y_value,canvas);
    var circles = canvas.select("g")
        .selectAll("circle")
        .data(data)
        .join("circle");

    scatterplot_circles(circles);


    canvas.select("#line_" + $(svg)[0].attr("id")).remove();

    plot_fit_line(svg,canvas,line,data);

    apply_axis_style();

}

/**
 * Plots the line of best fit for the given scatterplot chart.
 * @param svg svg container
 * @param canvas chart container
 * @param line best fit line.
 * @param data
 */
function plot_fit_line(svg,canvas,line,data) {
    canvas.append("path")
        .datum(data)
        .transition()
        .duration(3000)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("id","line_" + $(svg)[0].attr("id"))
        .attr("d", line);
}

/**
 * Add area line to the chart
 * @param max_x_value
 * @param max_y_value
 * @param canvas
 */
function update_axis(max_x_value, max_y_value,canvas) {
    canvas
        .select("#y-axis")
        .transition()
        .duration(2000)
        .call(d3.axisLeft(yScale).ticks(max_y_value / 0.5));

    var x_ticks = Number.isInteger(max_x_value) ? max_x_value : max_x_value /0.5;

    canvas
        .select("#x-axis")
        .transition()
        .duration(2000)
        .call(d3.axisBottom(xScale).ticks(x_ticks));
}

/**
 * Computes the domains of the axis.
 * @param data
 * @return {*[]}
 */
function axisDomains(data)
{
    xScale.domain(d3.extent(data, function (d) {
        return d.x_attribute;
    }));
    yScale.domain(d3.extent(data, function (d) {
        return d.y_attribute;
    }));
    return [xScale,yScale];
}

/**
 * Adds the circles of the scatterplot chart.
 * @param circles circle objects
 */
function scatterplot_circles(circles)
{
    circles.transition()
        .delay(function (d, i) {
            return (i * 3)
        })
        .duration(2000)
        .attr("cx", function (d) {
            return xScale(d.x_attribute);
        })
        .attr("cy", function (d) {
            return yScale(d.y_attribute);
        })
        .attr("r", 3.5)
        .attr("fill-opacity", 0.4)
        .style("fill","red");
}

/**
 * Computes the biggest values for both the x_attribute and y_attribute.
 * @param data
 * @return {(never|number)[]}
 */
function compute_extreme_values(data)
{
    var max_x_value = d3.max(data, function (d) {
        return d.x_attribute;
    });

    var max_y_value = d3.max(data, function (d) {
        return d.y_attribute;
    });

    return [max_x_value,max_y_value];
}

/**
 * Generates the best fit line.
 * @param data
 * @return {}
 */
function fit_line(data)
{

    var [slope, intercept] = compute_fit_line_equation(data);
    console.log(slope);
    console.log(intercept);


    return d3.line()
        .x(function (d) {
            return xScale(d.x_attribute);
        })
        .y(function (d) {
            return yScale(d.x_attribute* slope + intercept);
        })
        .curve(d3.curveLinear);
}

/**
 *
 * @param data
 * @param team
 * @param x_attribute
 * @param y_attribute
 * @return {*}
 */
function extract_data_scatterplot_chart(data, team, x_attribute, y_attribute)
{
    d = data.filter(function (e) {
        return e.team === team
    });

    return d.map(function (e) {
        return{
            team:e.team,
            x_attribute: e[x_attribute],
            y_attribute:e[y_attribute],
            season:e.year
        }
    })
}

/**
 * Computes the equation of the line of best fit.
 * @param data
 * @return {number[]}
 */
function compute_fit_line_equation(data)
{
    console.log(data);
    var x_mean = d3.sum(data,function (e) {return e.x_attribute}) / data.length;
    var y_mean = d3.sum(data,function (e) {return e.y_attribute}) / data.length;
    var slope_numerator = d3.sum(data,function (e) {
    return (e.x_attribute - x_mean) * (e.y_attribute - y_mean);
    });
    console.log(slope_numerator);
    var slope_denominator = d3.sum(data,function (e) {
    return Math.pow((e.x_attribute - x_mean),2)
    });
    var slope = slope_numerator/slope_denominator;
    var intercept = y_mean - slope*x_mean;
    return [slope,intercept];
}


/**
 * Generates the axis of the canvas.
 * @param canvas chart container
 * @param x_ticks
 * @param y_ticks
 */
function generate_axis(canvas,x_ticks,y_ticks)
{
    canvas
        .append("g")
        .attr("id","x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale).ticks(x_ticks));


    canvas
        .append("g")
        .attr("id","y-axis")
        .call(d3.axisLeft(yScale).ticks(y_ticks))
        .attr("transform", "translate(0,0)");
}

/**
 * Creates the axis scales.
 * @param height height of the svg container
 * @param width width of the svg container
 * @return {Object[]}
 */
function axisScales(height, width)
{


    let xScale = d3.scaleLinear()
        .range([0,width]);

    let yScale = d3.scaleLinear()
        .range([height, 0]);

    return [xScale,yScale]
}

/**
 * Plots the scatterplot chart according to the given team.
 * @param a the dropdown item. On click a given team is inputted.
 */
function plot_scatterplot_chart(a)
{
    var enteredValue = $(a).text();
    var xG_scored_data = extract_data_scatterplot_chart(csv_data,enteredValue,"scored","xG");
    var xG_npxG_data = extract_data_scatterplot_chart(csv_data,enteredValue,"npxG","xG");
    update_scatterplot_chart(svg_fh,canvas_fh,xG_scored_data,"scored","xG");
    update_scatterplot_chart(svg_sh,canvas_sh,xG_npxG_data,"npxG","xG");
}


