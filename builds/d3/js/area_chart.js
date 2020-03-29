var svg = null;
const margin = { top: 60, bottom: 40, left: 100, right: 100 };
var canvas = null;
var width,height = null;
var xScale,yScale = null;
var displayed_data = [];
var csv_data = [];
var allTeams = null;


d3.csv("dataset/understat.com.csv", function(d) {
return {
        year:+d.year,
        team:d.team,
        xG_diff:parseFloat(d.xG_diff),
}


}).then(function (data) {
    initialise();
    csv_data = data;
    allTeams = extract_all_teams(data);
    generateInput(allTeams,"team-dropdown","plot_area_chart","(this)");
    [xScale, yScale] = axisScales(height,width,data);
    chart_title(svg,"xG_diff",(0.5*width+margin.left),margin.top/3);
    generate_axis();
    axisLabel(svg,margin.left/2 , height/2, "xG_diff","rotate(-90)");
    axisLabel(svg,width/2 + margin.left, height + margin.top + 40, "Season");
    apply_axis_style();
});



/**
 * Initialises svg containers as well as other components such as the navbar.
 */
function initialise()
{
    include_navbar();
    make_nav_item_active("area-chart-item");
    tooltip= generate_tooltip();
    svg = generate_svg("#area",600,700);
    canvas = add_canvas(svg);
    [width,height] = svg_dimensions(svg);
}



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
        .call(d3.axisLeft(yScale).ticks(15))
        .attr("transform", "translate(0,0)");
}

/**
 * Computes the scales associated to the two axis.
 * @param height height of the svg main container
 * @param width  width of the svg main container
 * @param data
 * @returns {Array}
 */
function axisScales(height, width, data)
{
    var min = d3.min(data,function (d) {
        return d.xG_diff;
    });

    var max = d3.max(data,function (d) {
        return d.xG_diff;
    });

    var years = extract_all_years(data);
    var x_range = compute_x_range(years);
    let yScale = d3.scaleLinear()
        .domain([min, max+1])
        .range([height, 0]);

    let xScale = d3
        .scaleOrdinal()
        .range(x_range)
        .domain(years);

    return [xScale,yScale]
}

/**
 * Computes the range associated to the x-axis, according to the number of seasons to be plotted.
 * @param seasons seasons to be plotted
 * @returns {number[]}
 */
function compute_x_range(seasons)
{
    var x_range = [0];
    for(let i=1; i<seasons.length; i++)
    {
        x_range.push(i* width/(seasons.length-1))
    }
    return x_range;
}

/**
 * Extracts the xg_diff for all matches across seasons, of the given team.
 * @param team
 * @param data
 * @returns {Object[]}
 */
function extract_xg_diff(team,data) {
    var team_data = data.filter(function (e) {
        return e.team === team;
    });
    return team_data.map(function (e) {
        return {year:e.year, xG_diff:e.xG_diff };
    })
}

/**
 * Generates the points of the area chart.
 * @param tooltip rectangular container displaying data value when a circle is moused over.
 * @param color color of the area chart.
 * @param team
 */
function generate_area_points(tooltip, color, team)
{
    d3.select("svg")
        .selectAll("circle")
        .data(displayed_data).enter()
        .append("circle")
        .attr("cx", function(d) {
            return xScale(d.year)  + margin.left;
        })
        .attr("cy", function(d) {
            return yScale(d.xG_diff) + margin.top
        })
        .attr("r", 4)
        .attr('fill',color)
        .style("transition","0.5s")
        .attr("id",(team.split(" ")).join("-") + "-point")
        .on("mouseover",function (d) {
                style_tooltip(this,tooltip,d);
        })
        .on("mouseout",function () {
            d3.select(this).attr("fill",color).attr("r",4);
            tooltip.transition().duration(200).style("opacity", 0.0);
        });

}

/**
 * Styles the tooltip.
 * @param circle circle which associated data point value will be displayed in the tooltip.
 * @param tooltip
 * @param data_element data element associated to the circle.
 */
function style_tooltip(circle, tooltip, data_element) {
    d3.select(circle).attr("fill","black").attr("r",6);
    tooltip.transition()
        .duration(200)
        .style("opacity",0.9);
    tooltip.html(d3.format(".5f")(data_element.xG_diff))
        .style("left",d3.event.pageX + 10 + "px")
        .style("top",d3.event.pageY + "px");
}

/**
 * Updates the axis dynamically according to the data of the area chart.
 * @param team_data data displayed by the area chart.
 */
function update_axis(team_data)
{
    canvas
        .select("#y-axis")
        .transition()
        .call(d3.axisLeft(yScale).ticks(15));

    canvas
        .select("#x-axis")
        .transition()
        .call(d3.axisBottom(xScale).ticks(team_data.length));

}

/**
 * Add area line to the chart
 * @param data
 * @param area area object
 */
function add_area_chart(data,area)
{
    canvas.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", area)
        .attr("fill", "#5999DA")
        .attr("stroke", "#1867B5")
        .attr("stroke-width", 1.5)
        .transition() // Call Transition Method
        .duration(2000) // Set Duration timing (ms)
        .ease(d3.easeLinear) // Set Easing option
        .attr("stroke-dashoffset", 0)
        .attr("opacity",0.7);
}

/**
 * Generates the area chart.
 * @param team
 * @param data
 */
function generate_area_chart(team, data)
{
    canvas.select(".area").remove();
    d3.select("#area svg").selectAll("circle").remove();
    var team_data = extract_xg_diff(team,data);
    displayed_data = team_data;
    [xScale, yScale] = axisScales(height,width,team_data);

    var min = d3.min(team_data,function (d) {
        return d.xG_diff;
    });

    var max = d3.max(team_data,function (d) {
        return d.xG_diff;
    });
    var middle = (min+ max) /2;



    update_axis(team_data);

    var area = d3.area()
        .x(function(d) {return xScale(d.year) ; })
        .y0(yScale(middle))
        .y1(function(d) { return yScale(d.xG_diff); });


    add_area_chart(team_data,area);

    var tooltip = generate_tooltip();
   apply_axis_style();

    generate_area_points(tooltip,"#1867B5",team);
    d3.select(".chart-title").text("xG_diff "+team);
}


/**
 * Plots the area chart for a given team.
 * @param a a dropdown item. On click a given team is inputted.
 */
function plot_area_chart(a)
{
    var enteredValue = $(a).text();
    generate_area_chart(enteredValue,csv_data)
}