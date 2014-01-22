// View VCD files


function get_file(uri,callback) {
	var request = new XMLHttpRequest();
	request.onload = callback;
	request.open("get",uri,true);
	request.send();
	}

function parse_vcd(text) {
	var waveform = {};
	var tokens = text.match(/\S+/g);
	var lines = text.split("\n");
	// Get the date
	var index;
	for (index=0;lines[index] != "$date";index++) {}
	waveform.date = lines[index+1];
	
	// Compiler
	for (index=0;tokens[index] != "$version";index++) {}
	index++;
	var end_index;
	for (end_index = index; tokens[end_index] != "$end"; end_index++) {}
	waveform.compiler_version = tokens.slice(index,end_index).join(" ");

	// Timescale
	for (index=0; tokens[index] != "$timescale"; index++) []
	waveform.timescale = tokens[index+1];
	
	waveform.variables = {}
	for (index=0; !lines[index].match(/enddefinitions/); index++) {
		var line_tokens = lines[index].match(/\S+/g);
		if (line_tokens[0] == "$var") {
			// $var is token 0
			var type = line_tokens[1];
			var size = line_tokens[2];
			var identifier = line_tokens[3];
			var reference = line_tokens[4];
		//	var indices = line_tokens[5] != "$end" ? line_tokens[5] : null;
			waveform.variables[identifier] = {"type":type,
				"size":size,
				"identifier":identifier,
				"reference":reference,
				"values": []
				}
			}
		}
	// lines[index] is the last line before the value change section
	// The next line should be the beginning of variables
	index++;
	var current_time = 0;
	lines.slice(index).filter( function (line) { return !!line }).map( function (line) {
		if (line[0] == "#") {
			current_time = parseInt(line.slice(1))
			}
		else if (line[0] == "$") {
			// This is a directive
			// Ignore it for now
			}
		// The line is a value change
		else if (line[0] != "b") {
			waveform.variables[line.slice(1)].values.push({"time":current_time, "value":(isFinite(line[0])?parseInt(line[0],2):line[0])})
			}
		else { // This is a multibit value
			value = line.match(/\S+/g)[0].slice(1)
			name = line.match(/\S+/g)[1]
			value = isFinite(value)?parseInt(value,2):value
			waveform.variables[name].values.push({"time":current_time,"value":value})
			}
		});
	waveform.maxTime = current_time;
	return waveform;
	}

function display_as_text(waveform) {
	var root_element = document.getElementById("root");
	var compiler_div = document.createElement("div");
	compiler_div.appendChild(document.createTextNode("Wavedump created by :" + waveform.compiler_version));
	root_element.appendChild(compiler_div);
	var date_div = document.createElement("div");
	date_div.appendChild(document.createTextNode("Created on: " + waveform.date))
	root_element.appendChild(date_div);
	}

function getCanvasCoordinates (id, clientX, clientY) {
	var canvasOffset = document.getElementById(id).getBoundingClientRect();
	var offsetX = canvasOffset.left;
	var offsetY = canvasOffset.top;
	return {"x":clientX-offsetX, "y":clientY-offsetY};
	}

function draw_waveform(waveform) {
	var canvas = document.getElementById("waveform_canvas");	
	var ctx = canvas.getContext("2d");
	var variableList = [];

	var height = 600;
	var width = 1000;
	canvas.width.value = width;
	var waveform_height = 50;
	var waveform_bottom = 10;
	var waveform_top = waveform_bottom + waveform_height;

	var numberWaves = 0;
	for (v in waveform.variables) { numberWaves++; }
	height = numberWaves*(10+waveform_height);
	canvas.setAttribute("height",height);
	canvas.setAttribute("width",width);


	function timeToX (time) {
		return (width-100) * (time/waveform.maxTime);
		}
	function xToTime (x) {
		return (x * waveform.maxTime) / (width - 100);
		}
	
	function yToIdentifier(y) {
		return variableList[Math.floor(y/60)];
		}
	
	function timeToValue(variable,time) {
		var value = variable.values[0].value;
		for (i in variable.values) {
			if (variable.values[i].time > time) {
				return value;
				}
			value = variable.values[i].value;
			}
		return value;
		}

	for (v in waveform.variables) {
		variable = waveform.variables[v];
		variableList.push(v)
		ctx.beginPath();
		var x = timeToX(0);
		var y = waveform_bottom;
		ctx.fillStyle = variableList.length%2?"rgb(240,240,240)":"rgb(255,255,255)";
		ctx.fillRect(0,waveform_bottom-5,width,waveform_top-5);
		ctx.fillStyle = "rgb(0,0,0)";
		ctx.moveTo(x,y);
		for (i = 0; i < variable.values.length; i++) {
			x = timeToX(variable.values[i].time);
			ctx.lineTo(x,y);
			y = waveform_top - waveform_height*variable.values[i].value/(Math.pow(2, variable.size)-1);
			ctx.lineTo(x,y);
			}
		x = timeToX(waveform.maxTime);
		ctx.lineTo(x,y);
		ctx.stroke();
		ctx.font = "16pt Helvetica";
		ctx.fillText(variable.reference,x,waveform_bottom + waveform_height/2);
		waveform_bottom += waveform_height+10;
		waveform_top += waveform_height+10;
		}
	canvas.addEventListener('mousemove',function mouseHandler (e) {
		coord = getCanvasCoordinates("waveform_canvas",e.clientX,e.clientY);
		var tooltipDiv = document.getElementById("tooltip_div");
		var newText = "Time: " + Math.floor(xToTime(coord.x));
		newText += " Wave: " + waveform.variables[yToIdentifier(coord.y)].reference;
		newText += " Value: " + timeToValue(waveform.variables[yToIdentifier(coord.y)],xToTime(coord.x));
		tooltipDiv.childNodes[0].replaceData(0,100,newText);
//		alert("Time: " + xToTime(coord.x));
		});
	}

function main(file_uri) {
	if (typeof file_uri === 'undefined') { file_uri = default_file_uri; }
	get_file(file_uri,function render() {draw_waveform(parse_vcd(this.responseText))});
	}

function submit_url() {
	var file_uri = document.getElementById("url_input").value;
	main(file_uri);
	var inputDiv = document.getElementById("input_div")
	inputDiv.parentElement.removeChild(inputDiv);
	}

function urlKeyPress(e) {
	if (e.keyCode == 13) { submit_url (); }
	}
