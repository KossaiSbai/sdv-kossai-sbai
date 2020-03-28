
csv_data = [];
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
        missed:+d.loses,
        pts:+d.pts,
        xG: Math.round(parseFloat(d.xG)),
        xG_diff:parseFloat(d.xG_diff),
        npxG:parseFloat(d.npxG),
        xGA:Math.round(parseFloat(d.xGA)),
        xGA_diff:parseFloat(d.xGA_diff),
        npxGA:parseFloat(d.npxGA),
        npxGD:parseFloat(d.npxGD),
        ppda_coef:parseFloat(d.ppda_coef),
        oppda_coef:parseFloat(d.oppda_coef),
        deep:+d.deep,
        deep_allowed:+d.deep_allowed,
        xpts:Math.round(parseFloat(d.xpts)),
        xpts_diff: parseFloat(d.xpts_diff),


    }


}).then(function (data) {
    include_navbar();
    navbar("table");
    csv_data = data;
    reset_button();
    all_leagues = extract_all_leagues(data);
    generateInput(all_leagues,"league-dropdown","load_table","(this)");
    table_data = extract_table_data(select_league_data("La_liga",data));
    current_displayed_data = table_data;
    generate_table(table_data,columns,properties);
});

function extract_all_leagues(data)
{
    var leagues_set = new Set();
    for(let i=0; i<data.length; i++)
    {
        var league = data[i].league;
        leagues_set.add(league)
    }
    return Array.from(leagues_set);
}


function select_league_data(league,data)
{
    return data.filter(function (e) {
        return e.league === league;
    })
}


function filter_out(e, property, value) {
    if(!isNaN(value)) {
        return e[property] >= value;
    }
    else return e[property].localeCompare(value) === 0;
}



function extract_table_data(data,n=data.length)
{
    var table_data = [];
    for(let i=0; i<n; i++)
    {
        table_data.push(data[i]);
    }
    return table_data;
}


function generate_table(data,columns,properties) {
    var table = d3.select('table');
    var thead = table.append('thead');
    thead.style('background-color', '#272729');
    var s = thead.append('tr')
        .selectAll('th')
        .data(columns)
        .enter()
        .append('th')
        .text(function (column) {
            return column + " ";
        })
        .attr('class','text-center')
        .append('row');
        s
        .append('span')
        .append('i')
        .attr('class','fas fa-sort-up')
        .attr('id',function (p,i) {
            return "th- " + properties[i]
        })
        .on('click',function f1() {
            var property = event.target.id.split(" ")[1];
            sorted_data = sort_data(current_displayed_data,property,true);
            console.log(sorted_data);
            update(sorted_data,properties);
        });
    s
        .append('span')
        .append('i')
        .attr('class','fas fa-sort-down')
        .attr('id',function (p,i) {
            return "th- " + properties[i]
        })
        .on('click',function f1() {
            var property = event.target.id.split(" ")[1];
            sorted_data = sort_data(current_displayed_data,property,false);
            console.log(sorted_data);
            update(sorted_data,properties);
        });

    table.append('tbody');
    generate_table_entries(data,properties);

}

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

function update(data,properties)
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
        })
        .exit()
        .remove();
console.log(current_displayed_data);
}



function sort_data(data, property, asc) {
    data.sort(function(a, b) {
        if(asc) return d3.ascending(a[property], b[property]);
        else return d3.descending(a[property], b[property]);
    });
return data;
}


function filter_out_data_by_property(property, value, data, filter_out)
{
    return data.filter(e => filter_out(e,property,value))
}


function load_table(a)
{
    var enteredValue = $(a).text();
    table_data = extract_table_data(select_league_data(enteredValue,csv_data));
    console.log(this.unsorted_data);
    update(table_data,properties);
}

function reset_button()
{
    d3.select("#reset").attr("onclick","display_initial_data()")
}

function display_initial_data()
{
    current_league = current_displayed_data[0].league;
    table_data = extract_table_data(select_league_data(current_league,csv_data));
    update(table_data,properties);
}

