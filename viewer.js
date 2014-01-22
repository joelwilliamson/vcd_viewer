// View VCD files


var file_uri = "test_data/cla_tb.vcd";

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

function draw_waveform(waveform) {
	var canvas = document.getElementById("waveform_canvas");	
	var ctx = canvas.getContext("2d");

	var width = 1000;
	var height = 600;
	var waveform_height = 50;
	var waveform_bottom = 10;
	var waveform_top = waveform_bottom + waveform_height;
	for (v in waveform.variables) {
		variable = waveform.variables[v];
		ctx.beginPath();
		var x = 0;
		var y = waveform_bottom;
		ctx.moveTo(x,y);
		for (i = 0; i < variable.values.length; i++) {
			x = variable.values[i].time*12;
			ctx.lineTo(x,y);
			y = waveform_top - waveform_height*variable.values[i].value/Math.pow(2, variable.size);
			ctx.lineTo(x,y);
			}
		x = width-100;
		ctx.lineTo(x,y);
		ctx.stroke();
		ctx.font = "16pt Helvetica";
		ctx.fillText(variable.reference,x,waveform_bottom + waveform_height/2);
		waveform_bottom += waveform_height+10;
		waveform_top += waveform_height+10;
		}
	}

function main() {
	get_file(file_uri,function render() {draw_waveform(parse_vcd(this.responseText))});
	}
