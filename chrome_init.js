chrome.app.runtime.onLaunched.addListener(function () {
//	alert("Running chrome_init.js");
	chrome.app.window.create("background.html", {
		"id":"VcdViewer",
		"bounds": {
			"width":screen.availWidth,
			"height":screen.availHeight,
			}
		});
	});
