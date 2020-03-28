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
const seasons = ["2014","2015","2016","2017","2018","2019","2020"];
const colorScheme = d3.scaleOrdinal()
    .domain(["xG","npxG","scored"])
    .range(['#EB001B','#FF5F00','#F79E1B']);
const colors = colorScheme.range();

function generate_svg(id)
{
    return d3
        .select("#bar-chart")
        .append("svg")
        .attr("height", 620)
        .attr("width", 620)
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
    allTeams = extract_all_teams(data);
    generateInput(allTeams,"team-dropdown",undefined);
    generateInput(seasons,"season-dropdown",generate_bar_charts);
    legend();
    var [fh,sh] = extract_data(csv_data,"Arsenal","2016/2017");
    chart_title(svg_fh,"Arsenal" + " Season " + "2016/2017" + " First half",(0.5*width+margin.left),margin.top/2);
    chart_title(svg_sh,"Arsenal" + " Season " + "2016/2017" + " Second half",(0.5*width+margin.left),margin.top/2);
    stack_bar_chart(fh, canvas_fh, div);
    stack_bar_chart(sh, canvas_sh, div);
    window.onresize = resize;
});


function generate_axis(canvas,x_ticks = 15)
{
    console.log(x_ticks);
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

function remove_existing_chart(canvas,svg)
{
    canvas.selectAll("g").remove();
    svg.selectAll("text").remove();
}

function generate_bar_charts()
{
    var entered_team = d3.select('#team-placeholder').property('value');
    var entered_season = d3.select('#season-placeholder').property('value');
    var years = entered_season.split("/");
    var first_year = years[0];
    var second_year = years[1];
    $("#team-placeholder")[0].value = "";
    $("#season-placeholder")[0].value = "";
    if(years.length !== 2) alert("Please enter the season in the following format: year/year+1 so for example 2014/2015");
    else if(!seasons.includes(first_year) || !seasons.includes(second_year)) alert("The season has to be between 2014 and 2019 inclusive");
    else if(first_year.localeCompare(second_year) === 0) alert("The two entered years must be different");
    else {
        var [fh,sh] = extract_data(csv_data,entered_team,entered_season);
        chart_title(svg_fh,entered_team + " Season " + entered_season + " First half");
        chart_title(svg_sh,entered_team + " Season " + entered_season + " Second half");
        update_stack_bar_chart(fh, canvas_fh, div);
        update_stack_bar_chart(sh, canvas_sh, div);
    }
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
    var first_half_result = data.filter(function (d) {
        return d.team.localeCompare(team) === 0 && d.date.split("-")[0].localeCompare(first_year) === 0 && d.year.localeCompare(first_year) === 0;
    });

    var second_half_result = data.filter(function (d) {
        return d.team.localeCompare(team) === 0 && d.date.split("-")[0].localeCompare(second_year) === 0 && d.year.localeCompare(first_year) === 0;
    });
    return [first_half_result, second_half_result];
}

function stack_bar_chart(data, canvas, tooltip)
{

    var y_fields = ["xG","npxG","scored"];
    var stack = d3.stack()
        .keys(y_fields)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    var series = stack(data);

    var dates =  data.map(function (e) {
        return e.date;
    });
    [xScale,yScale] = axisScales(height,width,data);
    generate_axis(canvas);
    axisLabel(svg_fh,width/2 + margin.left, height + 2*margin.top, "Matches");
    axisLabel(svg_sh, width/2 + margin.left, height + 2*margin.top, "Matches");
    canvas.append("g")
        .selectAll("g")
        .data(series)
        .enter().append("g")
        .attr("fill", function(d) {return colorScheme(d.index)})
        .selectAll("rect")
        .data(function(d) { return d; })
        .enter().append("rect")
        .on("mouseover",function (d) {
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
        .attr("x", function(d,i) { return xScale(i+1)})
        .attr("y", function(d) {return yScale(d[1]);})//yScale(d[1]
        .attr("height", function(d) {return yScale(d[0]) - yScale(d[1]);})
        .attr("width",xScale.bandwidth());


    apply_axis_style();
}

function update_stack_bar_chart(data, canvas, tooltip)
{
    console.log("Done");
    console.log(data);
    [xScale,yScale] = axisScales(height,width,data);
    var y_fields = ["xG","npxG","scored"];
    var stack = d3.stack()
        .keys(y_fields)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    var dates =  data.map(function (e) {
        return e.date;
    });

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


    var series = stack(data);
    console.log(series);
    canvas
        .select("g")
        .selectAll("g")
        .data(series)
        .attr("fill", function(d) {return colorScheme(d.index)})
        .selectAll("rect")
        .data(function(d) { return d; })
        .join("rect")
        .on("mouseover",function (d) {
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
        .attr("x", function(d,i) { return xScale(i+1)})
         .transition()
         .duration(2000)
         .delay(100)
        .attr("y", function(d) {return yScale(d[1]);})//yScale(d[1]
        .attr("height", function(d) {return yScale(d[0]) - yScale(d[1]);})
        .attr("width",xScale.bandwidth());

   apply_axis_style();

}



function axisLabel(svg,x_translate_transformation, y_translate_transformation,text, rotate_transformation="")
{
    svg.append("text")
        .attr("transform", "translate(" +
            x_translate_transformation + "," + y_translate_transformation  + ")" + rotate_transformation)
        .attr("class","axis-label")
        .style("text-anchor", "middle")
        .text(text);
}

function legend()
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
            return 0.35*window.innerWidth + 100*i;
        })
        .attr("y",0.1 * window.innerHeight)
        .attr("fill",function (d,i) {
            return colors[i];
        });

    d3.select("#svg-legend")
        .select("g")
        .selectAll("text")
        .data(["xG","npxG","scored"])
        .enter()
        .append("text")
        .attr("x",function (d,i) {
            return 0.35*window.innerWidth + 100*i + 40;
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

function resize() {

    d3.select("#svg-legend")
        .selectAll("rect")
        .attr("x",function (d,i) {
            return 0.35*window.innerWidth + 100*i;
        })
        .attr("y",0.1 * window.innerHeight)
        .text(function (d) {
            return d;
        });


    d3.select("#svg-legend")
        .selectAll("text")
        .attr("x",function (d,i) {
            return 0.35*window.innerWidth + 100*i + 40;
        })
        .attr("y",0.1 * window.innerHeight + 7.5)
        .text(function (d) {
            return d;
        })

}

function chart_title(svg, text)
{
    svg.select(".chart-title")
        .attr("transform", "translate(" + (width + margin.left)/2 + "," + margin.top/2 + ")")
        .style("text-anchor", "middle")
        .attr("class","chart-title")
        .text(text);
}

