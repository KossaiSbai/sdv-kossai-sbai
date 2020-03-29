const colors = d3.schemeSet3;
var svg = null;
const margin = { top: 60, bottom: 70, left: 100, right: 100 };
var canvas = null;
var width,height = null;
var max_victories,xScale,yScale,allTeams = null;
var displayed_data = [];
var csv_data = [];
var current_teams = [];


/**
 * Initialises svg containers as well as other components such as the navbar.
 */
function initialise()
{
    include_navbar();
    make_nav_item_active("line-chart-item");
    tooltip= generate_tooltip();
    svg = generate_svg("#line-chart",650,800);
    canvas = add_canvas(svg);
    [width,height] = svg_dimensions(svg);
}

d3.csv("dataset/understat.com.csv", function(d) {
return {
        season:+d.year,
        team:d.team,
        wins:+d.wins,
}


}).then(function (data) {
    initialise();
    csv_data = data;
    allTeams = extract_all_teams(csv_data);

    max_victories = Math.max(d3.max(data,function (d) {
        return d.wins;
    }));

    [xScale,yScale] = axisScales(height,width,max_victories);

    chart_title(svg,"Number of victories across seasons",(0.5*width+margin.left),margin.top/3);
    generate_axis();

    generateInput(allTeams,"team-dropdown",'add_team_line','(this)');

    axisLabel(svg,margin.left/2 , height/2, "Victories","rotate(-90)");
    axisLabel(svg,width/2 + margin.left, height + margin.top + 45, "Season");

    apply_axis_style();


});

/**
 * Generates the axis of the chart
 */
function generate_axis()
{
    canvas
        .append("g")
        .attr("id","x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale).ticks(5));


    canvas
        .append("g")
        .attr("id","y-axis")
        .attr("transform", "translate(0,0)")
        .call(d3.axisLeft(yScale));
}

/**
 * Computes the scales associated to the two axis.
 * @param height height of the svg main container
 * @param width  width of the svg main container
 * @param upperElement biggest number of victories in the data.
 * @returns {Array}
 */
function axisScales(height, width, upperElement)
{

    let yScale = d3
        .scaleLinear()
        .range([height, 0])
        .domain([0,upperElement + 1]);


    let xScale = d3
        .scaleOrdinal()
        .range([0, width/4, width/2, 3*width/4, width])
        .domain(['2014','2015','2016','2017','2018']);

    return [xScale,yScale]
}

/**
 * Plots the line chart according to the data.
 * This line represents the number of victories of a team across seasons.
 * @param data victories of the team.
 * @param color color of the line.
 * @param margin svg container margin.
 * @param xScale scale of the x-axis.
 * @param yScale scale of the y-axis.
 */
function plot_line_chart(data, color, margin, xScale, yScale)
{
    displayed_data =displayed_data.concat(data);
    var team = data[0].team;
    current_teams.push(team);

    const line = d3
        .line()
        .x(dataPoint => xScale(dataPoint.season))
        .y(dataPoint => yScale(dataPoint.wins))
        .curve(d3.curveMonotoneX);



    var grp = d3.select("#canvas")
    .append('g')
    .attr("id",team.split(" ").join("-") + "-line")
    .attr("transform", "translate(" + -margin.left +  "," + -margin.top + ")");

    var path = generate_line(grp,data,color,line);

    var totalLength = path.node().getTotalLength();
    animate_line(path,totalLength);

    var tooltip = generate_tooltip();
    generate_line_points(tooltip,color,team);

    var entries_per_row = 4;  // number of columns
    var row_interval = 200;
    var column_interval = 40;


    var group = d3.select("#legend svg").append("g").attr("id",team.split(" ").join("-")+ "-legend");
    generate_legend(group,row_interval,entries_per_row,column_interval,team);


}


/**
 * Appends the line to the chart itself.
 * @param lines_canvas chart container.
 * @param data data victories of the team.
 * @param color color of the line.
 * @param d3_line
 * @returns {*|jQuery} the path tag encoding the line.
 */
function generate_line(lines_canvas,data,color,d3_line)
{
   return lines_canvas.append("path")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color )
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 3)
        .attr("d", d3_line);
}

/**
 * Animates the plotting of the line.
 * @param path_element path tag associated to the line
 * @param node_length length of the line element.
 */
function animate_line(path_element, node_length)
{
    path_element.attr("stroke-dasharray", node_length + " " + node_length)
        .attr("stroke-dashoffset", node_length)
        .transition() // Call Transition Method
        .duration(4000) // Set Duration timing (ms)
        .ease(d3.easeLinear) // Set Easing option
        .attr("stroke-dashoffset", 0);

}

/**
 * Adds the circles of the legend representing each team plotted on the chart.
 * @param legend_svg svg container of the legend.
 * @param row_interval space interval coefficient between each element of a row
 * @param entries_per_row number of teams displayed in one row of the legend.
 * @param column_interval space interval coefficient between each element of a column.
 * @param team team represented by the line.
 */
function generate_circles_of_legend(legend_svg,row_interval,entries_per_row,column_interval,team)
{
    legend_svg.append("circle")
        .attr("cx",  ((current_teams.length -1) * row_interval) % (entries_per_row*row_interval) + margin.left)
        .attr("cy",  Math.floor((current_teams.length-1) / entries_per_row) * column_interval + 10)
        .attr("r",4)// 100 is where the first dot appears. 25 is the distance between dots
        .style("fill",colors[current_teams.length-1])
        .on('click',function () {
            removeLine(team);
        });
}

/**
 * Generates the lines svg elements of the legend.
 * @param legend_svg legend_svg svg container of the legend.
 * @param row_interval space interval coefficient between each element of a row
 * @param entries_per_row number of teams displayed in one row of the legend.
 * @param column_interval space interval coefficient between each element of a column.
 * @param team team represented by the line.
 */
function generate_lines_of_legend(legend_svg,row_interval,entries_per_row,column_interval,team)
{
    legend_svg.append("svg")
        .append("line")
        .attr("x1",((current_teams.length -1) * row_interval) % (entries_per_row*row_interval) + margin.left - 10)
        .attr("y1",Math.floor((current_teams.length-1) / entries_per_row) * column_interval + 10)
        .attr("x2",((current_teams.length -1) * row_interval) % (entries_per_row*row_interval) + margin.left + 10)
        .attr("y2",Math.floor((current_teams.length-1) / entries_per_row) * column_interval + 10)
        .attr("stroke",colors[current_teams.length-1])
        .attr("stroke-width",2.5)
        .on('click',function () {
            removeLine(team);
        });
}

/**
 * Generates the text svg elements of the legend.
 * Each text displays a team for example: "Barcelona".
 * @param legend_svg legend_svg svg container of the legend.
 * @param row_interval space interval coefficient between each element of a row
 * @param entries_per_row number of teams displayed in one row of the legend.
 * @param column_interval space interval coefficient between each element of a column.
 * @param team team represented by the line.
 */
function generate_text_of_legend(legend_svg,row_interval,entries_per_row,column_interval,team)
{
    legend_svg.append("text")
        .attr("x", ((current_teams.length -1) * row_interval) % (entries_per_row*row_interval)+ margin.left + 20)
        .attr("y", Math.floor((current_teams.length-1) / entries_per_row) * column_interval + 12) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", colors[current_teams.length-1])
        .text(team)
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .on('click',function () {
            removeLine(team);
        });
}


/**
 * Generates the legend.
 * Appends all the legend elements to the legend container.
 * @param legend_svg legend_svg svg container of the legend.
 * @param row_interval space interval coefficient between each element of a row
 * @param entries_per_row number of teams displayed in one row of the legend.
 * @param column_interval space interval coefficient between each element of a column.
 * @param team team represented by the line.
 */
function generate_legend(legend_svg,row_interval,entries_per_row,column_interval,team)
{
    generate_circles_of_legend(legend_svg,row_interval,entries_per_row,column_interval,team);
    generate_lines_of_legend(legend_svg,row_interval,entries_per_row,column_interval,team);
    generate_text_of_legend(legend_svg,row_interval,entries_per_row,column_interval,team);
}

/**
 * Adds the data points to a given line.
 * @param tooltip rectangular container displaying data value when a circle is moused over.
 * @param color
 * @param team team represented by the line.
 */
function generate_line_points(tooltip,color,team)
{

    canvas
        .selectAll("circle")
        .data(displayed_data).enter()
        .append("circle")
        .attr("cx", function(d, i) {
            return xScale(d.season);
        })
        .attr("cy", function(d) {
            return yScale(d.wins)
        })
        .attr("r", 4)
        .attr('fill',color)
        .style("transition","0.5s")
        .attr("id",(team.split(" ")).join("-") + "-point")
        .on("mouseover",function (d) {
            d3.select(this).attr("fill","black").attr("r",6);
            tooltip.transition()
                .duration(200)
                .style("opacity",0.9);
            tooltip.html(d.wins)
                .style("left",d3.event.pageX + 10 + "px")
                .style("top",d3.event.pageY + "px");
        })
        .on("mouseout",function () {
            d3.select(this).attr("fill",color).attr("r",4);
            tooltip.transition().duration(200).style("opacity", 0.0);
        });

}

/**
 * Removes a given line from the chart.
 * @param team team represented by the line.
 */
function removeLine(team)
{
    displayed_data = displayed_data.filter(function (e) {
        return e.team !== team;
    });
    current_teams.splice(current_teams.indexOf(team),1);
    team = team.split(" ").join("-");
    d3.select("#" + team + "-legend").remove();
    d3.select("#" + team + "-line").remove();
    d3.selectAll("#" + team + "-point").remove();

    update_line_chart();
}

/**
 * Updates the lines of the chart after removal of another one.
 */
function update_lines() {
    $('*[id*=line]').each(function() {
        var line = d3.select(this).select('path');
        var fields = $(this).attr("id").split("-");
        var team = fields.slice(0,fields.indexOf("-point")).join(" ");
        line.attr("stroke",colors[current_teams.indexOf(team)])
    });
}

/**
 * Updates the points of the existing lines of the chart after removal of another one.
 */
function update_points_of_lines() {
    $('*[id*=point]').each(function () {
        var circle = d3.select(this);
        var fields = $(this).attr("id").split("-");
        var team = fields.slice(0,fields.indexOf("-point")).join(" ");
        circle.attr('fill',colors[current_teams.indexOf(team)]);
    });
}


/**
 * Updates the existing points of the legend after removal of another one.
 * @param legend legend_svg svg container of the legend.
 * @param row_interval space interval coefficient between each element of a row
 * @param entries_per_row number of teams displayed in one row of the legend.
 * @param column_interval space interval coefficient between each element of a column.
 */
function update_points_of_legend(legend,row_interval,entries_per_row,column_interval)
{

    legend.selectAll("circle").each(function () {
        var circle = d3.select(this);
        var fields = $(this).parent().attr("id").split("-");
        var team = fields.slice(0,fields.indexOf("-point")).join(" ");
        circle
            .attr("cx", (current_teams.indexOf(team) * row_interval) % (entries_per_row * row_interval) + 100)
            .attr("cy", Math.floor(current_teams.indexOf(team) / entries_per_row) * column_interval + 10)
            .attr("r", 4)// 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", colors[current_teams.indexOf(team)]);
    });
}

/**
 * Updates the existing texts of the legend after removal of another one.
 * @param legend legend_svg svg container of the legend.
 * @param row_interval space interval coefficient between each element of a row
 * @param entries_per_row number of teams displayed in one row of the legend.
 * @param column_interval space interval coefficient between each element of a column.
 */
function update_text_of_legend(legend,row_interval,entries_per_row,column_interval)
{
    legend.selectAll("text").each(function () {
        var text = d3.select(this);
        var team = text.property('textContent');
        text
            .attr("x", (current_teams.indexOf(team) * row_interval) % (entries_per_row * row_interval) + 120)
            .attr("y", Math.floor(current_teams.indexOf(team) / entries_per_row) * column_interval + 12) // 100 is where the first dot appears. 25 is the distance between dots
            .style("fill", colors[current_teams.indexOf(team)])
            .text(team)
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")

    });
}

/**
 * Updates the existing lines of the legend after removal of another one.
 * @param legend legend_svg svg container of the legend.
 * @param row_interval space interval coefficient between each element of a row
 * @param entries_per_row number of teams displayed in one row of the legend.
 * @param column_interval space interval coefficient between each element of a column.
 */
function update_lines_of_legend(legend,row_interval,entries_per_row,column_interval)
{
    legend.selectAll("line").each(function () {
        var line = d3.select(this);
        var fields = $(this).parent().parent().attr("id").split("-");
        var team = fields.slice(0,fields.indexOf("-line")).join(" ");
        line.attr("x1", ((current_teams.indexOf(team)) * row_interval) % (entries_per_row * row_interval) + 90)
            .attr("y1", Math.floor(current_teams.indexOf(team) / entries_per_row) * column_interval + 10)
            .attr("x2", (current_teams.indexOf(team) * row_interval) % (entries_per_row * row_interval) + 110)
            .attr("y2", Math.floor((current_teams.indexOf(team)) / entries_per_row) * column_interval + 10)
            .attr("stroke", colors[current_teams.indexOf(team)])
            .attr("stroke-width", 2.5);
    });
}

/**
 *  * Updates the legend after removal of a line.
 * @param legend legend_svg svg container of the legend.
 * @param row_interval space interval coefficient between each element of a row
 * @param entries_per_row number of teams displayed in one row of the legend.
 * @param column_interval space interval coefficient between each element of a column.
 */
function update_legend(legend,row_interval,entries_per_row,column_interval) {
    update_points_of_legend(legend,row_interval,entries_per_row,column_interval);
    update_lines_of_legend(legend,row_interval,entries_per_row,column_interval);
    update_text_of_legend(legend,row_interval,entries_per_row,column_interval);

}

/**
 * Updates the whole chart (both lines and legend) after removal of a line.
 */
function update_line_chart() {
    var entries_per_row = 4;  // number of columns
    var row_interval = 200;
    var column_interval = 40;
    var legend = d3.select("#legend svg").selectAll("g");

    update_lines();
    update_points_of_lines();
    update_legend(legend,row_interval,entries_per_row,column_interval)

}


/**
 * Plots a line associated to an inputted team. Updates accordingly the chart and the legend.
 * @param a dropdown item. On click a given team is inputted.
 */
function add_team_line(a) {
    var enteredValue = $(a).text();
    if (!allTeams.includes(enteredValue)) alert("This team is not valid");
    else if(current_teams.includes(enteredValue)) alert("This team is already on the plot");
    else {
        var team_data = csv_data.filter(d => d.team.localeCompare(enteredValue) === 0);
        plot_line_chart(team_data, colors[current_teams.length], margin, xScale, yScale);
    }
}

