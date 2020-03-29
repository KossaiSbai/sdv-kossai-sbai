
var csv_data = [];
var current_displayed_data = [];
var all_leagues = null;
var properties = ['season','team',"position","matches","wins","draws","loses","pts","xG","xGA"];
var columns = ['Season','Team',"Position","Matches","Wins","Draws","Loses","Points","xG","xGA"];


d3.csv("dataset/understat.com.csv", function(d) {
    return {
        league:d.league,
        season:d.year + "/" + (+d.year+1),
        position:+d.position,
        team:d.team,
        matches:+d.matches,
        wins:+d.wins,
        draws:+d.draws,
        loses:+d.loses,
        pts:+d.pts,
        xG: Math.round(parseFloat(d.xG)),
        xGA:Math.round(parseFloat(d.xGA)),
    }


}).then(function (data) {
    include_navbar();
    navbar("table-item");
    csv_data = data;
    reset_button();
    all_leagues = extract_all_leagues(data);
    generateInput(all_leagues,"league-dropdown","load_table","(this)");
    var table_data = select_league_data("La_liga",data);
    current_displayed_data = table_data;
    generate_table(table_data,columns,properties);
});


/**
 * Returns the table data for the selected league.
 * @param league
 * @param data
 * @returns {Array}
 */
function select_league_data(league,data)
{
    return data.filter(function (e) {
        return e.league === league;
    })
}


/**
 * Builds the sorting buttons.
 * @param headers table headers
 * @param button_class increasing or decreasing symbol
 * @param asc ascending or decreasing sorting order
 */
function sorting_buttons(headers,button_class,asc)
{
headers.append('span')
    .append('i')
    .attr('class',button_class)
    .attr('id',function (p,i) {
        return "th- " + properties[i]
    })
    .on('click',function () {
        var property = event.target.id.split(" ")[1];
        var sorted_data = sort_data(current_displayed_data,property,asc);
        update(sorted_data,properties);
    });
}

/**
 * Generates the table.
 * @param data
 * @param columns columns headers
 * @param properties properties of the dataset
 */
function generate_table(data,columns,properties) {
    var table = d3.select('table');
    var thead = table.append('thead');
    thead.style('background-color', '#272729');
    var t_headers = thead.append('tr')
        .selectAll('th')
        .data(columns)
        .enter()
        .append('th')
        .text(function (column) {
            return column + " ";
        })
        .attr('class','text-center')
        .append('row');
        sorting_buttons(t_headers,'fas fa-sort-up',true);
        sorting_buttons(t_headers,'fas fa-sort-down',false);

    table.append('tbody');
    generate_table_entries(data,properties);

}

/**
 * Generates the entries of the table (data rows).
 * @param data
 * @param properties
 */
function generate_table_entries(data, properties) {
    var rows = d3.select('tbody').selectAll('tr')
        .data(data)
        .enter()
        .append('tr');

    rows.selectAll("td")
        .data(function(data_line) {
            return properties.map(function(property) {
                return data_line[property];
            });
        })
        .enter()
        .append("td")
        .text(function(d) {
            return d;
        })
        .attr('class','text-center');

}

/**
 * Updates the table with new data.
 * @param data
 * @param properties
 */
function update_table(data,properties)
{
    current_displayed_data = data;
    d3.select("tbody").selectAll('tr')
        .data(data)
        .join('tr')
        .selectAll('td')
        .data(function (d) {
            return properties.map(function (property) {
                return d[property];
            });
        })
        .text(function (d) {
            return d;
        });
}


/**
 * Sorts the data according to a given property and sorting order.
 * @param data
 * @param property
 * @param asc true if ascending order false otherwise.
 * @returns {Array}
 */
function sort_data(data, property, asc) {
    data.sort(function(a, b) {
        if(asc) return d3.ascending(a[property], b[property]);
        else return d3.descending(a[property], b[property]);
    });
return data;
}

/**
 * Loads the updated table to the page.
 * @param a the dropdown item. On click a given league is inputted.
 */
function load_table(a)
{
    var enteredValue = $(a).text();
    var table_data = select_league_data(enteredValue,csv_data);
    update(table_data,properties);
}

/**
 * Builds the reset button: on click, it displays the original league data as it was in the dataset.
 */
function reset_button()
{
    d3.select("#reset").attr("onclick","display_initial_data()")
}

/**
 * Displays the original league data as it was in the dataset.
 */
function display_initial_data()
{
    var current_league = current_displayed_data[0].league;
    var table_data = select_league_data(current_league,csv_data);
    update_table(table_data,properties);
}

