var navbar_html=
    "<nav class=\"navbar navbar-expand-lg navbar-dark\">\n" +
    "<a class=\"navbar-brand\" href=\"#\">SDV Visualisation</a>\n" +
    "<button class=\"navbar-toggler\" type=\"button\" data-toggle=\"collapse\" data-target=\"#navbarNav\" aria-controls=\"navbarNav\" aria-expanded=\"false\" aria-label=\"Toggle navigation\">\n" +
    "<span class=\"navbar-toggler-icon\"></span>\n" +
    "</button>\n" +
    "<div class=\"collapse navbar-collapse\" id=\"navbarNav\">\n" +
    "<ul class=\"navbar-nav \">\n" +
    "<li class=\"nav-item active\" id='table'>\n"  +
    "<a class=\"nav-link\" href=\"index.html\">Table <span class=\"sr-only\">(current)</span></a>\n" +
    "</li>\n" +
    "<li class=\"nav-item\" id='line-chart'>\n" +
    "<a class=\"nav-link\" href=\"line_chart.html\">Line chart</a>\n" +
    "</li>\n" +
    "<li class=\"nav-item\" id='area-chart'>\n" +
    "<a class=\"nav-link\" href=\"area_chart.html\">Area chart</a>\n" +
    "</li>\n" +
    "<li class=\"nav-item\" id='bar-chart'>\n" +
    "<a class=\"nav-link\" href=\"bar_chart.html\">Bar chart</a>\n" +
    "</li>\n" +
    "<li class=\"nav-item\" id='scatterplot-chart'>\n" +
    "<a class=\"nav-link\" href=\"scatterplot.html\">Scatterplot chart</a>\n" +
    "</li>\n" +
    "</ul>\n" +
    "</div>\n" +
    "</nav>";




function include_navbar() {
    $("body").prepend(navbar_html);
}


function navbar(id)
{
    d3.select("li").classed("active",false);
    d3.select("#" + id).classed("active",true);
}


function extract_all_teams(data)
{
    var teams_set = new Set();
    for(let i=0; i<data.length; i++)
    {
        var team = data[i].team;
        teams_set.add(team)
    }
    return Array.from(teams_set);
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

function apply_axis_style() {
    d3.selectAll('g .tick')
        .select('line')
        .attr('class','axis-ticks');

    d3.selectAll('g .tick')
        .select('text')
        .attr('class','axis-ticks');
}


function chart_title(svg, text, x_transformation, y_transormation)
{
    svg.append("text")
        .attr("transform", "translate(" + x_transformation + "," + y_transormation+ ")")
        .style("text-anchor", "middle")
        .attr("class","chart-title")
        .text(text);
}

function generateInput(data,dropdown_id, on_click_function, parameter = "") {
    console.log(dropdown_id);
    console.log(data);
    d3.select("#" + dropdown_id)
        .selectAll("a")
        .data(data)
        .enter()
        .append("a")
        .html(function (d) {
            return d;
        })
        .attr("onclick",on_click_function +  parameter)
        .attr("class","dropdown-item");
}

// (width + margin.left)/2
// margin.top/2