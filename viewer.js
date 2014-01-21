// View VCD files


var file_uri = "test_data/cla_tb.vcd";

function get_file(uri,callback) {
	var request = new XMLHttpRequest();
	request.onload = callback;
	request.open("get",uri,true);
	request.send();
	}

function parse_vcd(text) {
	var waveform;
	var tokens = text.match("/\S+/g");
	var lines = text.split("\n");
	// Get the date
	var index;
	for (index=0;tokens[index] != "$date";index++) {}
	waveform.date = tokens[index+1];
	
	// Compiler
	for (index=0;tokens[index] != "$version";index++) {}
	index++;
	var end_index;
	for (end_index = index; tokens[index] != "$end"; index++) {}
	waveform.compiler_version = tokens.slice(index,end_index);

	// Timescale
	for (index=0; tokens[index] != "$timescale"; index++) []
	waveform.timescale = tokens[index+1];
	
	waveform.variables = {}
	for (; !lines[index].match("$enddefinitions"); index++) {
		var line_tokens = lines[index].match("/\S+/g");
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
	// lines[index] is the last line before the value change section
	// The next line should be the beginning of variables
	var current_time = 0;
	lines.slice(index).map( function (line) {
		if (line[0] = "#") {
			current_time = parseInt(line.slice(1))
			}
		if (line[0] = "$") {
			// This is a directive
			// Ignore it for now
			}
		// The line is a value change
		if (line[0] != "b") {
			waveform.variables[line.slice(1)].values.push({"time":current_time, "value":(parseInt(line[0])?parseInt(line[0]):line[0])})
			}
		else { // This is a multibit value
			value = line.match("/\S+/g")[0].slice(1)
			name = line.match("/\S+/g")[1]
			value = parseInt(value)?parseInt(value):value
			waveform.variables[name].values.push({"time":current_time,"value":value})
			}
		});
	return waveform;
	}

function display_as_text(waveform) {
	var root_element = document.getElementById("root");
	var compiler_div = document.createElement("div")
	compiler_div.appendChild(document.createTextNode(waveform.compiler_version));
	root_element.appendChild(compiler_div);
	}

function main() {
	get_file(file_uri,function render() {display_as_text(parse_vcd(this.responseText))});
	}
