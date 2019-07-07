if (process.platform === "win32") {
	const rl = require("readline").createInterface({
	  input: process.stdin,
	  output: process.stdout
	});

	rl.on("SIGINT", function () {
	  process.emit("SIGINT");
	});
  }

  process.on("SIGINT", function () {
	//graceful shutdown
	console.log('Quitting')
	process.exit();
  });
