// helper functions
'use strict';

var globalData = {};//for debuging

function registerEnterOnConfig(elementName, buttonBasic, buttonShift = '') {
    var el = document.getElementById(elementName);
    if (el) {
        el.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                //event.preventDefault();

                if (buttonShift.length > 0) {
                    if (event.shiftKey) {
                        var b = document.getElementById(buttonShift);
                        if (b && !b.disabled) {
                            b.onclick();
                        }
                    } else {
                        var b = document.getElementById(buttonBasic);
                        if (b && !b.disabled) {
                            b.onclick();
                        }
                    }
                } else {
                    var b = document.getElementById(buttonBasic);
                    if (b && !b.disabled) {
                        b.onclick();
                    }
                }
            }
        });
    }
}

function ModalMessage() {
    var span = document.getElementsByClassName("close")[0];
    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        //document.getElementById("idModalMessage").style.display = "none";
        modalMessage.hide();
    }
    // When the user clicks anywhere outside of the modal, close it
    /*window.onclick = function(event) {
        var modal = document.getElementById("idModalMessage");
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }*/
    this.modal = document.getElementById("idModalMessage");
    this.headerCont = document.getElementById("modalHeaderContainer");
    this.headerText = document.getElementById("modalHeaderText");
    this.bodyText = document.getElementById("modalBodyText");
    this.counterText = document.getElementById("modalTimerCounter");
    this.timer = false;
    this.timerCounter = 0;
}
ModalMessage.prototype.show = function (type, message, title = '') {
    var headerText = '';
    var startTimer = false;
    this.modal.classList.remove('color-ok', 'color-warning', 'color-error', 'color-info');
    if (type === 'ok') {
        this.modal.classList.add('color-ok');
        headerText = 'Success';
        startTimer = true;
    } else if (type === 'warning') {
        this.modal.classList.add('color-warning');
        headerText = 'Warning';
    } else if (type === 'error') {
        this.modal.classList.add('color-error');
        headerText = 'Error';
    } else if (type === 'info') {
        this.modal.classList.add('color-info');
        headerText = 'Information';
    } else {
        //this.headerCont.style.background = 'white';
        headerText = '';
    }
    if (title) {
        this.headerText.innerHTML = title;
    } else {
        this.headerText.innerHTML = headerText;
    }
    this.bodyText.innerHTML = message;
    this.modal.style.display = "block";
    if (this.timer) {
        clearInterval(this.timer);
        this.timer = false;
    }
    if (startTimer) {
        this.timer = setInterval(this.tickCallback.bind(null, this), 1000);
        this.timerCounter = 4;
        this.counterText.innerHTML = this.timerCounter;
    } else {
        this.counterText.innerHTML = '';
    }
}
ModalMessage.prototype.tickCallback = function (thisClass) {
    thisClass.timerCounter--;
    if (thisClass.timerCounter <= 0) {
        clearInterval(thisClass.timer);
        thisClass.timer = false;
        thisClass.hide();
    } else {
        thisClass.counterText.innerHTML = thisClass.timerCounter;
    }
}
ModalMessage.prototype.hide = function () {
    document.getElementById("idModalMessage").style.display = "none";
}
var modalMessage = {};
window.addEventListener('load', (event) => {
    modalMessage = new ModalMessage();
    if (document.getElementById('idModalWindow')) {
        document.getElementById('idModalWindow').onclick = function (event) {
            if (event.target.id === "idModalWindow") {
                modalWindow.hide();
            };
        }
    }
});

function ModalWindow() {
    this.modal = document.getElementById("idModalWindow");
    this.headerText = document.getElementById("modalWindowHeaderText");
    this.opened = false;
}
ModalWindow.prototype.show = function (title, callback) {
    modalMessage.hide();
    this.headerText.innerHTML = title;
    this.modal.style.display = "block";
    document.getElementsByTagName('body')[0].style.overflow = 'hidden';
    this.opened = true;
    document.getElementById('modalWindowApply').onclick = callback;
}
ModalWindow.prototype.hide = function () {
    document.getElementById("idModalWindow").style.display = 'none';
    document.getElementsByTagName('body')[0].style.overflow = '';
    this.opened = false;
}

document.addEventListener('keydown', (evt) => {
    evt = evt || window.event;
    var isEscape = false;
    if ("key" in evt) {
        isEscape = (evt.key === "Escape" || evt.key === "Esc");
    } else {
        isEscape = (evt.keyCode === 27);
    }
    if (isEscape) {
        modalMessage.hide();
        /*if (typeof modalDialog !== 'undefined') {
            modalDialog.hide();
        }*/
        if (typeof modalWindow !== 'undefined') {
            modalWindow.hide();
        }
    }
}, false);

function clearConfigTable(tableId) {
    var configTable = document.getElementById(tableId);
    var inputs = configTable.getElementsByTagName('input');
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].type === 'checkbox') {
            inputs[i].checked = false;
        } else if (inputs[i].type === 'text') {
            inputs[i].value = "";
        }
    }
}

// Fetch data from server and load the config table with new parameters.
function fetchData(url, callback) {
    var http = new XMLHttpRequest();
    http.open("GET", url, true);
    http.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
    http.onreadystatechange = function () {
        if (http.readyState == 4) {
            if (http.status == 200) {
                //console.log(http.responseText)
                var data = JSON.parse(http.responseText);
                if (data.reply.status === 'ok') {
                    callback(data);
                } else {
                    modalMessage.show(data.reply.status, data.reply.message);
                }
            } else if (http.status !== 0) {
                modalMessage.show('error', http.responseText);
            }
        }
    };
    http.send();
}
// Load the config table with new parameters.
function populateConfigTable(tableId, params) {
    var configTable = document.getElementById(tableId);
    var inputs = configTable.getElementsByTagName('input');
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].type === 'radio') {
            inputs[i].checked = false;
        }
    }
    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].type === 'text') {
            if (params.contestant.hasOwnProperty(inputs[i].name)) {
                inputs[i].value = params.contestant[inputs[i].name];
            }
        } else if (inputs[i].type === 'radio') {
            if (params.contestant.hasOwnProperty(inputs[i].name)) {
                if (inputs[i].value === params.contestant[inputs[i].name]) {
                    inputs[i].checked = true;
                }
            }
        }
    }
}

// Get values of parameters in the config table.
function getParamsFromConfigTable(tableId) {
    var data = '';
    var configTable = document.getElementById(tableId);

    // get inputs
    var inputs = configTable.getElementsByTagName('input');
    for (var i = 0; i < inputs.length; i++) {
        var value = '';
        var valueValid = false;
        if (inputs[i].type === 'radio') {
            if (inputs[i].checked) {
                value = inputs[i].value;
                valueValid = true;
            }
        } else if (inputs[i].type === 'checkbox') {
            if (inputs[i].checked) {
                value = '1';
            } else {
                value = '0';
            }
            valueValid = true;
        } else {
            value = inputs[i].value;
            valueValid = true;
        }
        if (valueValid) {
            if (data) {
                data += '&';
            }
            data += inputs[i].name + '=' + encodeURIComponent(value);
        }
    }

    return data;
}

// Sends action from the user and process the reply from the server.
function UserActionSender() {
    this.pendingRequest = false;
}
UserActionSender.prototype.sendAction = function (url, parameters, callback) {

    // if the previous request has not yet been processed
    if (this.pendingRequest) {
        modalMessage.show('warning', 'Previous action is still in progress.');
        return false;
    } else {
        modalMessage.show('info', 'Processing...');
    }
    this.pendingRequest = true;

    var thisClass = this;

    var http = new XMLHttpRequest();
    http.open("POST", url, true);
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    http.onreadystatechange = function () {
        if (http.readyState == 4) {
            if (http.status == 200) {
                //console.log(http.responseText)
                var data = JSON.parse(http.responseText);
                modalMessage.show(data.reply.status, data.reply.message);
                callback(data);
                thisClass.pendingRequest = false;
            } else if (http.status !== 0) {
                //messageDisplay.showHttpError(http.status, http.responseText);
                modalMessage.show('error', http.responseText);
                thisClass.pendingRequest = false;
            }
        }
    };
    http.send(parameters);
    return true;
}

// Periodically fetches data from the server.
function DataFetcher() {
	this.pendingRequest = false;
	this.failedCounter = 0;
	this.serverOk = true;
	this.notRespondingSuppressed = false;
}
DataFetcher.prototype.start = function(refreshInterval, getUrl, handleData, notRespondingSuppressed = false) {
	if (typeof refreshInterval === 'undefined') {
		console.log("refreshInterval is undefined");
		this.timeoutInterval = 1000;
	} else {
		this.timeoutInterval = refreshInterval * 1000;
	}
	if (this.timeoutInterval < 250) {this.timeoutInterval = 250;}
	
	this.getUrl = getUrl;
	this.handleData = handleData;
	this.notRespondingSuppressed = notRespondingSuppressed;
	this.tickCallback(this);
	this.timer = setInterval(this.tickCallback.bind(null, this), this.timeoutInterval);
}
DataFetcher.prototype.updateInterval = function(newInterval) {
	this.timeoutInterval = newInterval;
	if (this.timeoutInterval < 250) {this.timeoutInterval = 250;}
	clearTimeout(this.timer);
	this.timer = setInterval(this.tickCallback.bind(null, this), this.timeoutInterval);
}
DataFetcher.prototype.tickCallback = function(thisClass) {

	// if the previous request has not yet been processed
	if (thisClass.pendingRequest) {
		thisClass.failedCounter++;
		
		if (!thisClass.notRespondingSuppressed) {
			// show warning message if there are multiple consecutive errors
			if (thisClass.failedCounter * thisClass.timeoutInterval > 10000) {
				clearTimeout(thisClass.timer);
				thisClass.serverOk = false;
                modalMessage.show('error', 'Server is not responding!');
			}
		}
		return;
	}
	thisClass.pendingRequest = true;
	thisClass.failedCounter = 0;
	
	var http = new XMLHttpRequest();
	var url = thisClass.getUrl();
	/*if (configName.length !== 0) {
		if (url.indexOf('?') > -1) {
			url += '&';
		} else {
			url += '?';
		}
		url += 'config=' + configName;
	}*/
	http.open("GET", url, true);
	http.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
	http.onreadystatechange = function() {
		if (http.readyState == 4) {
			if (http.status == 200) {
				//console.log(http.responseText)
				var data = JSON.parse(http.responseText);
				if (typeof thisClass.handleData === 'function') {
					thisClass.handleData(data);
				}				
				thisClass.pendingRequest = false;
			} else if (http.status !== 0) {
				//messageDisplay.showHttpError(http.status, http.responseText);
                modalMessage.show('error', http.responseText);
				clearTimeout(thisClass.timer);
				thisClass.pendingRequest = false;
			}
		}
	};
	http.send();
}