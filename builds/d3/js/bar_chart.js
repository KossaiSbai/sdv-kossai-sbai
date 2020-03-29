
var tooltip = null;
var csv_data = [];
var svg_fh, svg_sh = null;
var canvas_fh, canvas_sh = null;
const margin = { top: 50, bottom: 100, left: 50, right: 50 };
var width,height = null;
var xScale,yScale = null;
var seasons = null;
const colorScheme = d3.scaleOrdinal()
    .domain(["xG","npxG","scored"])
    .range(['#EE3A43','#FF5F00','#F79E1B']);
const colors = colorScheme.range();
var current_team,current_season = "";
const y_fields = ["xG","npxG","scored"];


/**
 * Initialises svg containers as well as other components such as the navbar.
 */
function initialise() {
    include_navbar();
    make_nav_item_active("bar-chart-item");
    tooltip= generate_tooltip();
    svg_fh = generate_svg("#bar-chart",600,550,"svg_fh");
    svg_sh = generate_svg("#bar-chart",600,550,"svg_sh");
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
        date:d.date.split(" ")[0].toString(),
        team:d.team,
    }

}).then(function (data) {
    initialise();
    csv_data = data;
    const allTeams = extract_all_teams(data);
    seasons = extract_all_seasons(data);
    generateInput(allTeams,"team-dropdown",'team_clicked','(this)');
    generateInput(seasons,"season-dropdown",'season_clicked','(this)');
    add_legend();
    current_season = "2016/2017";
    current_team = "Arsenal";
    var [fh,sh] = extract_bar_chart_data(csv_data,current_team,current_season);
    chart_title(svg_fh,current_team + " Season " + current_season+ " First half",(0.5*width+margin.left),margin.top/2);
    chart_title(svg_sh,current_team+ " Season " + current_season + " Second half",(0.5*width+margin.left),margin.top/2);
    stack_bar_chart(svg_fh,fh, canvas_fh, tooltip);
    stack_bar_chart(svg_sh,sh, canvas_sh, tooltip);
    window.onresize = resize;
});

/**
 * Generates the axis
 * @param canvas chart container
 * @param x_ticks number of ticks for x_axis.
 */
function generate_axis(canvas,x_ticks = 15)
{
    canvas
        .append("g")
        .attr("id","x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale).ticks(x_ticks));

    canvas
        .append("g")
        .attr("id","y-axis")
        .call(d3.axisLeft(yScale).ticks(15))
        .attr("transform", "translate(0,0)");
}

/**
 * Generates bar chart using the current team and the season inputted by the <a> element.
 * @param a the dropdown item. On click a given season is inputted.
 */
function season_clicked(a)
{
    current_season = $(a).text();
    generate_bar_charts();

}

/**
 * Generates bar chart using the current season and the team inputted by the <a> element.
 * @param a the dropdown item. On click a given season is inputted.
 */
function team_clicked(a)
{
    current_team = $(a).text();
    generate_bar_charts();
}


/**
 * Generates bar chart using the current season and the current team.
 */
function generate_bar_charts()
{
    var [fh,sh] = extract_bar_chart_data(csv_data,current_team,current_season);
    svg_fh.select(".chart-title").text(current_team + " Season " + current_season + " First half");
    svg_sh.select(".chart-title").text(current_team + " Season " + current_season + " Second half");
    update_stack_bar_chart(fh, canvas_fh, tooltip);
    update_stack_bar_chart(sh, canvas_sh, tooltip);
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

    var ultimate_max = d3.max(data,function (d) {
        return d.xG + d.npxG + d.scored;
    });

    var dates = Array.from({length: data.length}, (v, k) => k+1);

    let yScale = d3.scaleLinear()
        .domain([0, ultimate_max+1])
        .range([height, 0]);

    let xScale = d3.scaleBand()
        .domain(dates)
        .range([0, width])
        .padding([0.3]);

    return [xScale,yScale]
}

/**
 * Extracts data plotted in the bar chart: xG, npxG and number of goals for a given team across a season.
 * @param data
 * @param team
 * @param season e.g. "2014/2015"
 * @returns {*[]}
 */
function extract_bar_chart_data(data,team,season) {
    var years = season.split("/");
    var first_year = years[0];
    var second_year = years[1];
    var first_half_result = extract_season_part_data(first_year,first_year,data,team);
    var second_half_result = extract_season_part_data(first_year,second_year,data,team);

    return [first_half_result, second_half_result];
}

/**
 * Extracts bar chart data for a season part.
 * In a given season, for instance 2014/2015, there are two time parts: 2014 and 2015.
 * Hence the first half of the season is made of all the matches from the beginning of the season until end of 2014.
 * The second half of the season is made of all the matches from the beginning of 2015 until the end of the season.
 * @param season_year For 2014/2015, it is 2014.
 * @param current_year For 2014/2015, either 2014 or 2015.
 * @param data
 * @param team
 * @returns {Object[]}
 */
function extract_season_part_data(season_year, current_year,data,team)
{
    return data.filter(function (d) {
        return d.team.localeCompare(team) === 0 && d.date.split("-")[0].localeCompare(current_year) === 0 && d.year.localeCompare(season_year) === 0;
    });

}

/**
 * Generates the initial stack bar chart.
 * @param svg svg container
 * @param data
 * @param canvas chart container
 * @param tooltip rectangular container displaying data value when a circle is moused over.
 */
function stack_bar_chart(svg,data, canvas, tooltip)
{

    var stack = d3.stack()
        .keys(y_fields)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    var series = stack(data);

    [xScale,yScale] = axisScales(height,width,data);
    generate_axis(canvas);
    axisLabel(svg,width/2 + margin.left, height + 2*margin.top, "Matches");
    var rects = canvas.append("g")
        .attr("id","bars")
        .selectAll("g")
        .data(series)
        .enter().append("g")
        .attr("fill", function(d) {return colorScheme(d.index)})
        .selectAll("rect")
        .data(function(d) { return d; })
        .enter().append("rect");
       mouse_tooltip_transitions(rects,tooltip);

    rects
        .attr("x", function(d,i) { return xScale(i+1)})
        .attr("y", function(d) {return yScale(d[1]);})//yScale(d[1]
        .attr("height", function(d) {return yScale(d[0]) - yScale(d[1]);})
        .attr("width",xScale.bandwidth());


    apply_axis_style();
}

/**
 * Updates the existing stack bar chart according to the new season/team.
 * @param data
 * @param canvas chart container.
 * @param tooltip rectangular container displaying data value when a rectangle is moused over.
 */
function update_stack_bar_chart(data, canvas, tooltip)
{
    [xScale,yScale] = axisScales(height,width,data);

    var dates =  data.map(function (e) {
        return e.date;
    });

    var stack = generate_stack_data();

    update_axis(dates,canvas);

    var series = stack(data);
    var rects = canvas
        .select("#bars")
        .selectAll("g")
        .data(series)
        .attr("fill", function(d) {return colorScheme(d.index)})
        .selectAll("rect")
        .data(function(d) { return d; })
        .join("rect");

    mouse_tooltip_transitions(rects,tooltip);
    rects.attr("x", function(d,i) { return xScale(i+1)})
        .transition()
        .duration(2000)
        .delay(100)
        .attr("y", function(d) {return yScale(d[1]);})//yScale(d[1]
        .attr("height", function(d) {return yScale(d[0]) - yScale(d[1]);})
        .attr("width",xScale.bandwidth());

    apply_axis_style();

}

/**
 * Converts the rough data into stack format data.
 * @returns {*}
 */
function generate_stack_data() {
    return d3.stack()
        .keys(y_fields)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

}

/**
 * Updates the axis dynamically according to the data of the area chart.
 * @param dates number of matches displayed in the bar chart.
 * @param canvas chart container.
 */
function update_axis(dates,canvas)
{
    canvas
        .select("#y-axis")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(yScale).ticks(15));


    canvas
        .select("#x-axis")
        .transition()
        .duration(1000)
        .call(d3.axisBottom(xScale).ticks(dates.length));
}

/**
 * Add mouse transitions to tooltip.
 * @param rects rectangles of the bar chart.
 * @param tooltip rectangular container displaying data value when a rectangle is moused over.
 */
function mouse_tooltip_transitions(rects,tooltip) {
    rects .on("mouseover",function (d) {
        tooltip.transition()
            .duration(200)
            .style("opacity",0.9);
    })
        .on("mousemove",function (d) {
            var index = colors.indexOf($(this).parent().attr("fill"));
            var value_to_display = d[1] - d[0];
            value_to_display = index === 2 ? Math.round(value_to_display)  : value_to_display.toFixed(4);
            tooltip.html(value_to_display)
                .style("left",d3.event.pageX + 10 + "px")
                .style("top",d3.event.pageY + "px");
        })
        .on("mouseout",function () {
            tooltip.transition().duration(200).style("opacity", 0.0);
        })
}

/**
 * Adds the rectangles of the legend.
 * @param width svg legend container width.
 */
function add_legend_rectangles(width)
{
    d3.select("#svg-legend")
        .append("g")
        .selectAll("rect")
        .data(["xG","npxG","scored"])
        .enter()
        .append("rect")
        .attr("width",35)
        .attr("height",15)
        .attr("x",function (d,i) {
            return 0.35*width + 100*i;
        })
        .attr("y",0.1 * window.innerHeight)
        .attr("fill",function (d,i) {
            return colors[i];
        });

}


/**
 * Adds the texts of the legend. Each text displays a property plotted on the bar chart.
 * @param width svg legend container width.
 */
function add_legend_text(width)
{
    d3.select("#svg-legend")
        .select("g")
        .selectAll("text")
        .data(["xG","npxG","scored"])
        .enter()
        .append("text")
        .attr("x",function (d,i) {
            return 0.35*width + 100*i + 40;
        })
        .attr("y",0.1 * window.innerHeight + 7.5)
        .text(function (d) {
            return d;
        })
        .attr("text-anchor", "left")
        .attr("fill",function (d,i) {
            return colors[i];
        })
        .style("alignment-baseline", "middle")
}

/**
 * Adds the legend.
 */
function add_legend()
{
    var width = $("#svg-legend")[0].getBoundingClientRect().width;
    add_legend_rectangles(width);
    add_legend_text(width);
}

/**
 * Resizes the rectangles of the legend when the window resizes.
 * @param width width of the svg container.
 */
function resize_legend_rectangles(width)
{
    d3.select("#svg-legend")
        .selectAll("rect")
        .attr("x",function (d,i) {
            return 0.35*width + 100*i;
        })
        .attr("y",0.1 * window.innerHeight)
        .text(function (d) {
            return d;
        });

}

/**
 * Resizes the texts of the legend when the window resizes.
 * @param width width of the svg container.
 */
function resize_legend_text(width)
{
    d3.select("#svg-legend")
        .selectAll("text")
        .attr("x",function (d,i) {
            return 0.35*width + 100*i + 40;
        })
        .attr("y",0.1 * window.innerHeight + 7.5)
        .text(function (d) {
            return d;
        })

}

/**
 * Resizes the legend container when the window resizes.
*/
function resize() {
    var width = $("#svg-legend")[0].getBoundingClientRect().width;
    resize_legend_rectangles(width);
    resize_legend_text(width);
}
