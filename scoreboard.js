'use strict';

var dataFetcher = new DataFetcher();
var refreshInterval = 1;

window.addEventListener('load', (event) => {
    dataFetcher.start(refreshInterval, function () {
        return "/scoreboard";
    }, populateDataTable);
});


function populateDataTable(data) {
    var html = '<tr><th>&#35;</th><th>Jméno</th><th>Příjmení</th><th>Kat.</th><th>Max</th><th>Poř.</th><th>Poř. kat.</th></tr>';
    data.contestants.forEach(e => {
        html += '<tr>';
        html += '<td>' + e.id + '</td>';
        html += '<td>' + e.name + '</td>';
        html += '<td>' + e.surname + '</td>';
        if (e.color.length > 0) {
            html += '<td style="color:' + e.color + '">' + e.category + '</td>';
        } else {
            html += '<td>' + e.category + '</td>';
        }
        html += '<td>';
        if (e.maxSpeed >= 0) {
            html += e.maxSpeed;
        }
        html += '</td>';
        if (e.order >= 0) {
            html += '<td>' + e.order + '</td>';
        } else {
            html += '<td></td>';
        }
        if (e.orderCat >= 0) {
            html += '<td>' + e.orderCat + '</td>';
        } else {
            html += '<td></td>';
        }
        html += '</tr>';
    });
    var height = window.innerHeight - 50;
    var fontSize = Math.round((height/(data.contestants.length+1) - 5.4) / 1.16*10)/10;
    if (fontSize > 35) {
        fontSize = 35;
    }
    document.getElementById("tableScoreboard").style.fontSize = fontSize + 'px';
    document.getElementById("tableScoreboard").innerHTML = html;
    
    /*html = '';
    var maxLength = 0;
    for (var g in data.groups) {
        if (data.groups.hasOwnProperty(g)) {
            if (data.groups[g].length > maxLength) {
                maxLength = data.groups[g].length;
            }
        }
    }
    for (var g in data.groups) {
        if (data.groups.hasOwnProperty(g)) {
            var tdCount = 0;
            html += '<tr>';
            data.groups[g].forEach(e => {
                html += '<td>' + e.name + ': ' + e.from + ' - ' + e.to + '</td>';
                tdCount += 1;
            });
            if (tdCount < maxLength) {
                html += '<td colspan="' + (maxLength - tdCount) + '"></td>';
            }
            html += '</tr>';
        }
    }
    document.getElementById("tableGroups").innerHTML = html;*/
}

