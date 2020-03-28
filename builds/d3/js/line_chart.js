const colors = d3.schemeSet3;
const svg = d3
    .select("#chart")
    .append("svg")
    .attr("height", 500)
    .attr("width", 800);
const margin = { top: 60, bottom: 70, left: 100, right: 100 };
const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`).attr("id","canvas");
const width = +svg.attr("width") - margin.left - margin.right;
const height = +svg.attr("height") - margin.top - margin.bottom;
var max_victories,xScale,yScale,allTeams = null;
var displayed_data = [];
var csv_data = [];
var current_teams = [];




d3.csv("dataset/understat.com.csv", function(d) {
    return {
        league:d.league,
        season:+d.year,
        position:+d.position,
        team:d.team,
        matches:+d.matches,
        wins:+d.wins,
        draws:+d.draws,
        loses:+d.loses,
        missed:+d.loses,
        pts:+d.pts,
        xG: parseFloat(d.xG),
        xG_diff:parseFloat(d.xG_diff),
        npxG:parseFloat(d.npxG),
        xGA:parseFloat(d.xGA),
        xGA_diff:parseFloat(d.xGA_diff),
        npxGA:parseFloat(d.npxGA),
        npxGD:parseFloat(d.npxGD),
        ppda_coef:parseFloat(d.ppda_coef),
        oppda_coef:parseFloat(d.oppda_coef),
        deep:+d.deep,
        deep_allowed:+d.deep_allowed,
        xpts:parseFloat(d.xpts),
        xpts_diff: parseFloat(d.xpts_diff),

    }


}).then(function (data) {
    include_navbar();
    navbar("line-chart");
    csv_data = data;
    allTeams = extract_all_teams(csv_data);

    max_victories = Math.max(d3.max(data,function (d) {
        return d.wins;
    }));

    [xScale,yScale] = axisScales(height,width,max_victories);
    console.log(yScale(0));

    chart_title(svg,"Number of victories across seasons",(0.5*width+margin.left),margin.top/3);
    generate_axis();

    generateInput(allTeams,"team-dropdown",'addTeam','(this)');

    axisLabel(svg,margin.left/2 , height/2, "Victories","rotate(-90)");
    axisLabel(svg,width/2 + margin.left, height + margin.top + 45, "Season");

    apply_axis_style();


});

function generate_axis()
{
    chart
        .append("g")
        .attr("id","x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale).ticks(5));


    chart
        .append("g")
        .attr("id","y-axis")
        .attr("transform", "translate(0,0)")
        .call(d3.axisLeft(yScale));
}

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


function addLine(data, color, margin, xScale, yScale)
{
    console.log(data);
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

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    generate_line_points(div,color,team);

    var entries_per_row = 4;  // number of columns
    var row_interval = 200;
    var column_interval = 40;


    var group = d3.select("#legend svg").append("g").attr("id",team.split(" ").join("-")+ "-legend");
    generate_legend(group,row_interval,entries_per_row,column_interval,team);


}

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

function animate_line(path_element, node_length)
{
    path_element.attr("stroke-dasharray", node_length + " " + node_length)
        .attr("stroke-dashoffset", node_length)
        .transition() // Call Transition Method
        .duration(4000) // Set Duration timing (ms)
        .ease(d3.easeLinear) // Set Easing option
        .attr("stroke-dashoffset", 0);

}

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


function generate_legend(legend_svg,row_interval,entries_per_row,column_interval,team)
{
    generate_circles_of_legend(legend_svg,row_interval,entries_per_row,column_interval,team);
    generate_lines_of_legend(legend_svg,row_interval,entries_per_row,column_interval,team);
    generate_text_of_legend(legend_svg,row_interval,entries_per_row,column_interval,team);
}

function generate_line_points(tooltip,color,team)
{

    chart
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

    repositionLegendItems();
}


function update_lines() {
    $('*[id*=line]').each(function() {
        var line = d3.select(this).select('path');
        var fields = $(this).attr("id").split("-");
        var team = fields.slice(0,fields.indexOf("-point")).join(" ");
        line.attr("stroke",colors[current_teams.indexOf(team)])
    });
}

function update_points_of_lines() {
    $('*[id*=point]').each(function () {
        var circle = d3.select(this);
        var fields = $(this).attr("id").split("-");
        var team = fields.slice(0,fields.indexOf("-point")).join(" ");
        circle.attr('fill',colors[current_teams.indexOf(team)]);
    });
}

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

function update_legend(legend,row_interval,entries_per_row,column_interval) {
    update_points_of_legend(legend,row_interval,entries_per_row,column_interval);
    update_lines_of_legend(legend,row_interval,entries_per_row,column_interval);
    update_text_of_legend(legend,row_interval,entries_per_row,column_interval);

}
function repositionLegendItems() {
    var entries_per_row = 4;  // number of columns
    var row_interval = 200;
    var column_interval = 40;
    var legend = d3.select("#legend svg").selectAll("g");

    update_lines();
    update_points_of_lines();
    update_legend(legend,row_interval,entries_per_row,column_interval)

}



function addTeam(a) {
    var enteredValue = $(a).text();
    if (!allTeams.includes(enteredValue)) alert("This team is not valid");
    else if(current_teams.includes(enteredValue)) alert("This team is already on the plot");
    else {
        team_data = csv_data.filter(d => d.team.localeCompare(enteredValue) === 0);
        addLine(team_data, colors[current_teams.length], margin, xScale, yScale);
    }
}

