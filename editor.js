'use strict';

var actionSender = new UserActionSender();
var modalWindow = {};
var selectedRow = -1;
var filterInFocus = false;

window.addEventListener('load', (event) => {
    modalWindow = new ModalWindow();
    registerEnterOnConfig('parametersTable', 'modalWindowApply');
    populateOverviewTable();
});

function modalCancel() {
    modalWindow.hide();
}

function addContestant() {

    clearConfigTable('parametersTable');
    fetchData('/add', function (data) {
        populateConfigTable('parametersTable', data);
    });
    modalWindow.show("Nový závodník", modalApplyEdit);
    document.getElementById("paramName").focus();
}

function editContestant(id) {
    clearConfigTable('parametersTable');
    fetchData('/edit?id=' + id, function (data) {
        populateConfigTable('parametersTable', data);
        for (var i = 0; i < data.contestant.speed.length; i++) {
            var el = document.getElementById('paramspeed' + i);
            if (el) {
                el.value = data.contestant.speed[i];
            }
        }
        document.getElementById("paramName").focus();
        document.getElementById("paramName").select();
    });
    modalWindow.show("Úprava závodníka", modalApplyEdit);
}
function editSpeed(id) {
    clearConfigTable('parametersTable');
    fetchData('/edit?id=' + id, function (data) {
        populateConfigTable('parametersTable', data);
        for (var i = 0; i < data.contestant.speed.length; i++) {
            var el = document.getElementById('paramspeed' + i);
            if (el) {
                el.value = data.contestant.speed[i];
            }
        }
        var el = document.getElementById('paramspeed' + data.contestant.speed.length);
        if (el) {
            el.focus();
        }
    });
    modalWindow.show("Úprava závodníka", modalApplyEdit);
}
function modalApplyEdit() {
    var params = getParamsFromConfigTable('parametersTable');
    if (!params) {
        return;
    }
    actionSender.sendAction('/edit', params, function (data) {
        if (data.reply.status !== 'error') {
            populateOverviewTable();
            modalWindow.hide();
        }
    });
}

function populateOverviewTable() {
    fetchData('/contestants', function (data) {
        var t = document.getElementById('overviewTable');
        while (t.rows.length > 1) {
            t.deleteRow(1);
        }
        var listCont = '';
        var listSurname = new Set();
        var listClub = new Set();
        var maxSpeed = -1;
        data.contestants.forEach(e => {
            if (e.maxSpeed > maxSpeed) {
                maxSpeed = e.maxSpeed;
            }
        });
        data.contestants.forEach(e => {
            var html = '';
            //html += '<td><button onclick="editContestant(' + e.id + ')">Upravit</button></td>';
            html += '<td>' + e.id + '</td>';
            html += '<td>' + e.name + '</td>';
            html += '<td>' + e.surname + '</td>';
            html += '<td>' + e.category + '</td>';
            html += '<td';
            if (e.maxSpeed === maxSpeed) {
                html += ' class="max-speed-highlight"';
            }
            html += '>';
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
            html += '<td>' + e.club + '</td>';
            html += '<td>' + e.runcount + '</td>';
            for (var i = 0; i < 5; i++) {
                html += '<td data-speed-column="1">';
                if (i < e.speed.length) {
                    html += e.speed[i];
                }
                html += '</td>'
            }

            var row = t.insertRow(-1);
            row.id = e.id;
            row.innerHTML = html;
            row.onclick = function () { selectRow(e.id) };
            row.ondblclick = function (e) {
                var id = e.target.parentElement.id;
                if (e.target.dataset.speedColumn) {
                    editSpeed(id);
                } else {
                    editContestant(id);
                }
            };
            listCont += '<option value="' + (e.id + " " + e.name + " " + e.surname).normalize('NFD').replace(/[\u0300-\u036F]/g, '') + '"></option>';
            if (e.surname.length > 0) {
                listSurname.add(e.surname);
            }
            if (e.club.length > 0) {
                listClub.add(e.club);
            }
        });
        selectRow(selectedRow, true);
        document.getElementById('datalistCont').innerHTML = listCont;
        var html = '';
        listSurname.forEach(e => {
            html += '<option value="' + e + '"></option>';
        });
        document.getElementById('datalistSurname').innerHTML = html;
        html = ''
        listClub.forEach(e => {
            html += '<option value="' + e + '"></option>';
        });
        document.getElementById('datalistClub').innerHTML = html;
        disableDownload();
    });
}

function selectRow(id, forced = false) {
    var rows = document.getElementById('overviewTable').getElementsByTagName('tr');
    if (rows.length > 0) {

        // check limits
        var row_id = parseInt(rows[1].id);// the first row is header
        if (id < row_id) {
            id = row_id;
        }
        row_id = parseInt(rows[rows.length - 1].id);
        if (id > row_id) {
            id = row_id;
        }

        if (forced || id !== selectRow) {
            for (var i = 0; i < rows.length; i++) {
                row_id = parseInt(rows[i].id);
                if (id === row_id) {
                    rows[i].classList.add('focused');
                } else {
                    rows[i].classList.remove('focused');
                }
            };
            if (!isInViewport(document.getElementById(id))) {
                document.getElementById(id).scrollIntoView();
            }
            selectedRow = id;
        }
    }
}

function exportCsv() {
    actionSender.sendAction('/exportcsv', "", function (data) {
        if (data.reply.status !== 'error') {
            enableDownload(data.filePath);
        }
    });
}

function enableDownload(url) {
    var el = document.getElementById('buttonDownloadCsv');
    el.classList.remove('button-disabled');
    el.href = url;
    el.download = url;
}
function disableDownload() {
    var el = document.getElementById('buttonDownloadCsv');
    el.classList.add('button-disabled');
    el.href = 'javascript: void(0);';
}

function filterFocused() {
    filterInFocus = true;
    document.getElementById('filter').focus();
}

function filterCanceled() {
    filterInFocus = false;
    document.getElementById('filter').blur();
    document.getElementById('filter').value = '';
}

function filterApplied(speed = false) {
    var value = parseInt(document.getElementById('filter').value);
    if (!isNaN(value)) {
        filterCanceled();
        if (speed) {
            editSpeed(value);
        } else {
            editContestant(value);
        }
    }
}

function filterChanged() {
    var value = parseInt(document.getElementById('filter').value);
    if (!isNaN(value) && value !== selectRow) {
        selectRow(value);
    }
}

function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

function specialCharToNumber(el) {
    var val = el.value.split('').join('');
    for (var i = 0; i < val.length; i++) {
        switch (val[i]) {
            case ("+"):
                val = val.substring(0, i) + '1' + val.substring(i + 1);
                break;
            case ("ě"):
                val = val.substring(0, i) + '2' + val.substring(i + 1);
                break;
            case ("š"):
                val = val.substring(0, i) + '3' + val.substring(i + 1);
                break;
            case ("č"):
                val = val.substring(0, i) + '4' + val.substring(i + 1);
                break;
            case ("ř"):
                val = val.substring(0, i) + '5' + val.substring(i + 1);
                break;
            case ("ž"):
                val = val.substring(0, i) + '6' + val.substring(i + 1);
                break;
            case ("ý"):
                val = val.substring(0, i) + '7' + val.substring(i + 1);
                break;
            case ("á"):
                val = val.substring(0, i) + '8' + val.substring(i + 1);
                break;
            case ("í"):
                val = val.substring(0, i) + '9' + val.substring(i + 1);
                break;
            case ("é"):
                val = val.substring(0, i) + '0' + val.substring(i + 1);
                break;
        }
    }
    el.value = val;
}

document.addEventListener("keydown", (event) => {
    if (filterInFocus) {
        if (event.key === "Escape" || event.key === "Esc") {
            event.preventDefault();
            filterCanceled();
        }
        if (event.key === 'Enter') {
            if (event.shiftKey) {
                event.preventDefault();
                filterApplied(true);
            } else {
                event.preventDefault();
                filterApplied();
            }
        }
    } else {
        if (!modalWindow.opened) {
            if (event.key === 'ArrowUp') { // move up
                event.preventDefault();
                selectRow(selectedRow - 1);
            }
            if (event.key === 'ArrowDown') { // move down
                event.preventDefault();
                selectRow(selectedRow + 1);
            }
            if (event.key === 'e' || event.key === 'Enter') { // edit
                event.preventDefault();
                editContestant(selectedRow);
            }
            if (event.key === 'a') { // add
                event.preventDefault();
                addContestant();
            }
            if (event.key === 's' || (event.shiftKey && event.key === 'Enter')) { // edit speed
                event.preventDefault();
                editSpeed(selectedRow);
            }
            if (event.key === 'f') { // filter
                event.preventDefault();
                filterFocused();
            }
        }
    }
});

function testFunction() {
}

