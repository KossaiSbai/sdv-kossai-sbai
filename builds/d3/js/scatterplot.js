var csv_data = [];
const margin = { top: 60, bottom: 150, left: 100, right: 100 };
const svg_fh = generate_svg("svg_fh");
const svg_sh = generate_svg("svg_sh");
console.log(svg_fh);
const width = +svg_fh.attr("width") - margin.left - margin.right;
const height = +svg_fh.attr("height") - margin.top - margin.bottom;
const canvas_fh = add_canvas(svg_fh);
const canvas_sh = add_canvas(svg_sh);
var xScale,yScale = null;
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

d3.csv("dataset/understat_per_game.csv", function(d) {

    return {
        league:d.league,
        year:d.year,
        h_a:d.h_a,
        xG:parseFloat(d.xG),
        xGA:parseFloat(d.xGA),
        npxG:parseFloat(d.npxG),
        npxGA:parseFloat(d.npxGA),
        deep:+d.deep,
        deep_allowed:+d.deep_allowed,
        scored:+d.scored,
        missed:+d.missed,
        xpts:parseFloat(d.xG),
        result:d.result,
        date:d.date.split(" ")[0].toString(),
        wins:+d.wins,
        draws:+d.draws,
        loses:+d.loses,
        pts:+d.pts,
        npxGD:parseFloat(d.xG),
        ppda_coef:parseFloat(d.xG),
        ppda_att:parseFloat(d.xG),
        ppda_def:parseFloat(d.xG),
        oppda_coef:parseFloat(d.xG),
        oppda_att:parseFloat(d.xG),
        oppda_def:parseFloat(d.xG),
        team:d.team,
        xG_diff:parseFloat(d.xG),
        xGA_diff:parseFloat(d.xG),
        xpts_diff:parseFloat(d.xG)

    }
}).then(function (data) {
    include_navbar();
    navbar("scatterplot-chart");
    csv_data = data;
    allTeams = extract_all_teams(data);
    generateInput(allTeams,"team-dropdown","plot_scatterplot_chart","(this)");
    var initial_data_scored = extract_data(data,"Barcelona","scored","xG");
    var initial_data_npxG = extract_data(data,"Barcelona","npxG","xG");
    axisLabel(svg_fh,width/2 + margin.left, height + 2*margin.top, "Number of goals");
    axisLabel(svg_sh, width/2 + margin.left, height + 2*margin.top, "npxG");
    axisLabel(svg_fh,margin.left/2 , height/2, "xG","rotate(-90)");
    axisLabel(svg_sh,margin.left/2 , height/2, "xG","rotate(-90)");

    scatterplot_chart(svg_fh,canvas_fh, initial_data_scored);
    scatterplot_chart(svg_sh, canvas_sh, initial_data_npxG);

});


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



function generate_svg(id)
{
    return d3
        .select("#scatterplot-chart")
        .append("svg")
        .attr("height", 650)
        .attr("width", 550)
        .attr("id",id);
}

function add_canvas(svg_container)
{
    var svg_id = $(svg_container)[0].attr("id");
    return svg_container
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`).
        attr("id",svg_id +" canvas");
}


function extract_data(data, team, x_attribute, y_attribute)
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

function axisScales(height, width)
{


    let xScale = d3.scaleLinear()
        .range([0,width]);

    let yScale = d3.scaleLinear()
        .range([height, 0]);


    return [xScale,yScale]
}


function plot_scatterplot_chart(a)
{
    var enteredValue = $(a).text();
    var xG_scored_data = extract_data(csv_data,enteredValue,"scored","xG");
    var xG_npxG_data = extract_data(csv_data,enteredValue,"npxG","xG");
    update_scatterplot_chart(svg_fh,canvas_fh,xG_scored_data,"scored","xG");
    update_scatterplot_chart(svg_sh,canvas_sh,xG_npxG_data,"npxG","xG");
}


