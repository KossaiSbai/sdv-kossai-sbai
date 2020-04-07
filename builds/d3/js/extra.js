

var navbar_html=
    "<nav class=\"navbar navbar-expand-lg navbar-dark\">\n" +
    "<a class=\"navbar-brand\" href=\"index.html\">SDV Visualisation</a>\n" +
    "<button class=\"navbar-toggler\" type=\"button\" data-toggle=\"collapse\" data-target=\"#navbarNav\" aria-controls=\"navbarNav\" aria-expanded=\"false\" aria-label=\"Toggle navigation\">\n" +
    "<span class=\"navbar-toggler-icon\"></span>\n" +
    "</button>\n" +
    "<div class=\"collapse navbar-collapse\" id=\"navbarNav\">\n" +
    "<ul class=\"navbar-nav \">\n" +
    "<li class=\"nav-item active\" id='table-item'>\n"  +
    "<a class=\"nav-link\" href=\"table.html\">Table <span class=\"sr-only\">(current)</span></a>\n" +
    "</li>\n" +
    "<li class=\"nav-item\" id='line-chart-item'>\n" +
    "<a class=\"nav-link\" href=\"line_chart.html\">Line chart</a>\n" +
    "</li>\n" +
    "<li class=\"nav-item\" id='area-chart-item'>\n" +
    "<a class=\"nav-link\" href=\"area_chart.html\">Area chart</a>\n" +
    "</li>\n" +
    "<li class=\"nav-item\" id='bar-chart-item'>\n" +
    "<a class=\"nav-link\" href=\"bar_chart.html\">Stacked bar chart</a>\n" +
    "</li>\n" +
    "<li class=\"nav-item\" id='scatterplot-chart-item'>\n" +
    "<a class=\"nav-link\" href=\"scatterplot.html\">Scatter plot</a>\n" +
    "</li>\n" +
    "</ul>\n" +
    "</div>\n" +
    "</nav>";

/**
 * Includes the navbar to a page.
 */
function include_navbar() {
    $("body").prepend(navbar_html);
}


/**
 * Highlights the given navbar item.
 * @param id  Identifies the navbar item
 */
function make_nav_item_active(id)
{
    d3.select("li").classed("active",false);
    d3.select("#" + id).classed("active",true);
}


/**
 * Extracts property values in given data.
 * @param data
 * @param property
 * @return{Object[]}
 */
function extract_property_values(data,property)
{
    var set = new Set();
    for(let i=0; i<data.length; i++)
    {
        var value = data[i][property];
        set.add(value)
    }
    return Array.from(set);
}

/**
 * Extracts all teams in given data.
 * @param data
 * @return {Object[]}
 */
function extract_all_teams(data)
{
    return extract_property_values(data,"team");
}

/**
 * Extracts all leagues in given data.
 * @param data
 * @return {Object[]}
 */
function extract_all_leagues(data) {
   return extract_property_values(data, "league");
}

/**
 * Extracts all years in given data.
 * @param data
 * @return {Object[]}
 */
function extract_all_years(data) {
    return extract_property_values(data,"year");
}

/**
 * Extracts all seasons (i.e. 2014/2015) in given data.
 * @param data
 * @return {Object[]}
 */
function extract_all_seasons(data)
{
    var seasons = extract_all_years(data);
    for(let i=0; i<seasons.length; i++)
    {
        seasons[i] = "" + seasons[i] + "/" + "" + (+seasons[i] + 1);
    }
    return seasons;
}

/**
 * Creates and adds label to an axis.
 * @param svg svg container
 * @param x_translate_transformation x_coordinate of label
 * @param y_translate_transformation y_coordinate of label
 * @param text text of the label
 * @param rotate_transformation rotation in degrees
 */
function axisLabel(svg,x_translate_transformation, y_translate_transformation,text, rotate_transformation="")
{
    svg.append("text")
        .attr("transform", "translate(" +
            x_translate_transformation + "," + y_translate_transformation  + ")" + rotate_transformation)
        .attr("class","axis-label")
        .style("text-anchor", "middle")
        .text(text);
}

/**
 * Apply css style (colors,thickness) to axis ticks.
 */
function apply_axis_style() {
    d3.selectAll('g .tick')
        .select('line')
        .attr('class','axis-ticks');

    d3.selectAll('g .tick')
        .select('text')
        .attr('class','axis-ticks');
}

/**
 * Creates and adds title to a given chart
 * @param svg svg container of the chart
 * @param text text of the title.
 * @param x_transformation x_coordinate of label
 * @param y_transormation y_coordinate of label
 */
function chart_title(svg, text, x_transformation, y_transormation)
{
    svg.append("text")
        .attr("transform", "translate(" + x_transformation + "," + y_transormation+ ")")
        .style("text-anchor", "middle")
        .attr("class","chart-title")
        .text(text);
}

/**
 * Generate input anchor tags in dropdown buttons.
 * @param data
 * @param dropdown_id id of the dropdown button
 * @param on_click_function function executed when an anchor tag is clicked.
 * @param parameter parameter to the on_click_function.
 */
function generateInput(data,dropdown_id, on_click_function, parameter = "") {
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

/**
 * Generates a tooltip: rectangular container displaying data value when a data point is moused over.
 * @return {*|jQuery|never}
 */
function generate_tooltip()
{
    return d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
}

/**
 * Sets the dimensions of the svg container.
 * @param svg svg container.
 * @return {number[]}
 */
function svg_dimensions(svg)
{
    const width = +svg.attr("width") - margin.left - margin.right;
    const height = +svg.attr("height") - margin.top - margin.bottom;
    return [width,height]
}

/**
 * Generate svg container.
 * @param parent_id id of the parent element of the svg container.
 * @param height height of the svg container
 * @param width width of the svg container
 * @param id id assigned to the svg container
 * @return {*|jQuery}
 */
function generate_svg(parent_id, height, width,id="")
{
    console.log(d3.select(parent_id));
    return d3
        .select(parent_id)
        .append("svg")
        .attr("height", height)
        .attr("width", width)
        .attr("id",id);
}

/**
 * Adds a canvas (<g> tag) to the svg container.
 * @param svg_container
 * @return {*|jQuery}
 */
function add_canvas(svg_container)
{
    var svg_id = $(svg_container)[0].attr("id");
    return svg_container
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`).
        attr("id",svg_id +"canvas");
}

