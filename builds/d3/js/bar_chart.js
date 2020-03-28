var csv_data = [];
const svg_fh = generate_svg("svg_fh");
const svg_sh = generate_svg("svg_sh");
const margin = { top: 50, bottom: 100, left: 50, right: 50 };
const width = +svg_fh.attr("width") - margin.left - margin.right;
const height = +svg_fh.attr("height") - margin.top - margin.bottom;
// add_canvas(svg_sh);
const canvas_fh = add_canvas(svg_fh);
const canvas_sh = add_canvas(svg_sh);
var xScale,yScale = null;
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
const seasons = ["2014/2015","2015/2016","2016/2017","2017/2018","2018/2019","2019/2020"];
const colorScheme = d3.scaleOrdinal()
    .domain(["xG","npxG","scored"])
    .range(['#EE3A43','#FF5F00','#F79E1B']);
const colors = colorScheme.range();
var current_team,current_season = "";
const y_fields = ["xG","npxG","scored"];


function generate_svg(id)
{
    return d3
        .select("#bar-chart")
        .append("svg")
        .attr("height", 620)
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
    navbar("bar-chart");
    csv_data = data;
    const allTeams = extract_all_teams(data);
    generateInput(allTeams,"team-dropdown",'team_clicked','(this)');
    generateInput(seasons,"season-dropdown",'season_clicked','(this)');
    legend();
    current_season = "2016/2017";
    current_team = "Arsenal";
    var [fh,sh] = extract_data(csv_data,current_team,current_season);
    chart_title(svg_fh,current_team + " Season " + current_season+ " First half",(0.5*width+margin.left),margin.top/2);
    chart_title(svg_sh,current_team+ " Season " + current_season + " Second half",(0.5*width+margin.left),margin.top/2);
    stack_bar_chart(svg_fh,fh, canvas_fh, div);
    stack_bar_chart(svg_sh,sh, canvas_sh, div);
    window.onresize = resize;
});


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

function season_clicked(a)
{
    current_season = $(a).text();
    generate_bar_charts();

}

function team_clicked(a)
{
    current_team = $(a).text();
    generate_bar_charts();
}


function generate_bar_charts()
{

    var [fh,sh] = extract_data(csv_data,current_team,current_season);
    svg_fh.select(".chart-title").text(current_team + " Season " + current_season + " First half");
    svg_sh.select(".chart-title").text(current_team + " Season " + current_season + " Second half");
    update_stack_bar_chart(fh, canvas_fh, div);
    update_stack_bar_chart(sh, canvas_sh, div);
}



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


function extract_data(data,team,season) {
    var years = season.split("/");
    var first_year = years[0];
    var second_year = years[1];
    var first_half_result = extract_season_part_data(first_year,first_year,data,team);
    var second_half_result = extract_season_part_data(first_year,second_year,data,team);
    return [first_half_result, second_half_result];
}

function extract_season_part_data(season_year, current_year,data,team)
{
    return data.filter(function (d) {
        return d.team.localeCompare(team) === 0 && d.date.split("-")[0].localeCompare(current_year) === 0 && d.year.localeCompare(season_year) === 0;
    });

}

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

function generate_stack_data() {
    return d3.stack()
        .keys(y_fields)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

}

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


function legend()
{
    var width = $("#svg-legend")[0].getBoundingClientRect().width;
    add_legend_rectangles(width);
    add_legend_text(width);
}


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
function resize() {
    var width = $("#svg-legend")[0].getBoundingClientRect().width;
    resize_legend_rectangles(width);
    resize_legend_text(width);
}



function chart_title(svg, text)
{
    svg.select(".chart-title")
        .attr("transform", "translate(" + (width + margin.left)/2 + "," + margin.top/2 + ")")
        .style("text-anchor", "middle")
        .attr("class","chart-title")
        .text(text);
}

