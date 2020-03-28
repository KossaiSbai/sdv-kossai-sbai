const colors = d3.schemeSet3;
const svg = d3
    .select("#area")
    .append("svg")
    .attr("height", 600)
    .attr("width", 800);
const margin = { top: 0, bottom: 40, left: 100, right: 100 };
const canvas = svg.append("g").attr("transform", `translate(${margin.left},0)`).attr("id","canvas");
const width = +svg.attr("width") - margin.left - margin.right;
const height = +svg.attr("height") - margin.top - margin.bottom;
var xScale,yScale = null;
var displayed_data = [];
var csv_data = [];
var allTeams = null;
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
    navbar("area-chart");
    csv_data = data;
    allTeams = extract_all_teams(data);
    generateInput(allTeams,"team-dropdown","s","(this)");
    [this.xScale, this.yScale] = axisScales(height,width,data);
    generate_axis();
    axisLabel(svg,margin.left/2 , height/2, "xG_diff","rotate(-90)");
    axisLabel(svg,width/2 + margin.left, height + margin.top + 40, "Season");
    apply_axis_style();


});


function generate_axis()
{


    canvas
        .append("g")
        .attr("id","x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale).ticks(5));

    canvas
        .append("g")
        .attr("transform", "translate(0," + yScale(0) + ")")
        .attr("id","zero-axis")
        .call(d3.axisBottom(xScale))
        .selectAll("text").remove();

    canvas
        .append("g")
        .attr("id","y-axis")
        .call(d3.axisLeft(yScale).ticks(15))
        .attr("transform", "translate(0,0)");
}


function axisScales(height, width, data)
{
    var min = d3.min(data,function (d) {
        return d.xG_diff;
    });

    var max = d3.max(data,function (d) {
        return d.xG_diff;
    });

    var seasons = data.map(function (d) {
        return "" + d.season;
    });

    var unique_seasons = Array.from(new Set(seasons));


    console.log(max);

    this.yScale = d3.scaleLinear()
        .domain([min, max+1])
        .range([height, 0]);
    var x_range = [0];
    for(let i=1; i<unique_seasons.length; i++)
    {
        x_range.push(i* width/(unique_seasons.length-1))
    }
    console.log(x_range);
    let xScale = d3
        .scaleOrdinal()
        .range(x_range)
        .domain(unique_seasons);

    return [xScale,yScale]
}

function extract_xg_diff(team,data) {
    var team_data = data.filter(function (e) {
        return e.team === team;
    });
    return team_data.map(function (e) {
        return {season:e.season, xG_diff:e.xG_diff };
    })
}


function generate_line_points(tooltip,color,team)
{
    d3.select("svg")
        .selectAll("circle")
        .data(displayed_data).enter()
        .append("circle")
        .attr("cx", function(d, i) {
            return xScale(d.season)  + margin.left;
        })
        .attr("cy", function(d) {
            console.log(d.xG_diff);
            console.log(yScale(d.xG_diff));
            return yScale(d.xG_diff)
        })
        .attr("r", 4)
        .attr('fill',color)
        .style("transition","0.5s")
        .attr("id",(team.split(" ")).join("-") + "-point")
        .on("mouseover",function (d) {
            console.log(d);
            console.log(d.xG_diff);
            d3.select(this).attr("fill","black").attr("r",6);
            tooltip.transition()
                .duration(200)
                .style("opacity",0.9);
            tooltip.html(d3.format(".5f")(d.xG_diff))
                .style("left",d3.event.pageX + 10 + "px")
                .style("top",d3.event.pageY + "px");
        })
        .on("mouseout",function () {
            d3.select(this).attr("fill",color).attr("r",4);
            tooltip.transition().duration(200).style("opacity", 0.0);
        });

}

function generate_area_chart(team, data)
{
    canvas.select(".area").remove();
    d3.select("#area svg").selectAll("circle").remove();
    var team_data = extract_xg_diff(team,data);
    displayed_data = team_data;
    [this.xScale, this.yScale] = axisScales(height,width,team_data);

    var min = d3.min(team_data,function (d) {
        return d.xG_diff;
    });

    var max = d3.max(team_data,function (d) {
        return d.xG_diff;
    });
    var middle = (min+ max) /2;


    canvas
        .select("#y-axis")
        .transition()
        .call(d3.axisLeft(yScale).ticks(15));

    canvas
        .select("#x-axis")
        .transition()
        .call(d3.axisBottom(xScale).ticks(team_data.length));

    canvas
        .select("#zero-axis")
        .transition()
        .attr("transform", "translate(0," + yScale(middle) + ")")
        .selectAll("text").remove()
        .call(d3.axisBottom(xScale).ticks(team_data.length));


    console.log(middle);
    var area = d3.area()
        .x(function(d) {return xScale(d.season) ; })
        .y0(yScale(middle))
        .y1(function(d) { return yScale(d.xG_diff); });
    canvas.append("path")
        .datum(team_data)
        .attr("class", "area")
        .attr("d", area)
        .transition() // Call Transition Method
        .duration(2000) // Set Duration timing (ms)
        .ease(d3.easeLinear) // Set Easing option
        .attr("stroke-dashoffset", 0)
        .attr("fill", "#5B9BBD")
        .attr("stroke-width", 1)
        .attr("opacity",0.7);

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    canvas.select("#y-axis").select("path").attr('stroke','#343636').attr("stroke-width", 2);
    d3.selectAll('g .tick')
        .select('line')
        .attr('class','axis-ticks');

    d3.selectAll('g .tick')
        .select('text')
        .attr('class','axis-ticks');

    generate_line_points(div,"#5B9BBD",team);

}



function s(a)
{
    var enteredValue = $(a).text();
    generate_area_chart(enteredValue,csv_data)
}