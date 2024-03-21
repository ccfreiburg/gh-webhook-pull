const http = require("http");
const exec = require("child_process").exec;
const path = require("path");
const async = require("async");

const index = (process.argv[2].startsWith("-") ? 3 : 2)
const projectPath = process.argv[index];
const repos = process.argv.filter((arg, i) => { return i > index; })

const absolutePath = path.join(__dirname, projectPath);

const cmds = ["git fetch", "git reset --hard HEAD", "git merge '@{u}', yarn generate"].concat(repos);

const execCmds = cmds.map((cmd) => {
	return function (callback) {
		exec(`cd ${absolutePath} && ${cmd}`, { maxBuffer: 1024 * 600 }, (err, stdout, stderr) => {
			if (err) return callback(err);
			callback(null, `--- ${cmd} ---:\n stdout: ${stdout} \n stderr: ${stderr}\n`);
		});
	};
});

const updateProject = function (callback) {
	async.series(
		execCmds
		, function (err, results) {
			if (err) return callback(err);
			return callback(null, results.join(""));
		});
};

const doRun = (func) => {
	console.log("An event has been detected on the listened port: starting execution...")
	updateProject((e, result) => {
		let response = "";
		if (e) {
			console.error(`exec error: ${e}`);
			response += `exec error: ${e}`;
		}
		if (result) {
			console.log(result);
			response += `\n ${result}`;
		}
		func(response)
	});
}

if (process.argv.includes("-t"))
	doRun((r) => { })
else
	http.createServer(function (req, res) {
		res.writeHead(200, { "Content-Type": "text/plain" });
		doRun((r) => res.end(r))
	}).listen(1338);
console.log("Git-auto-pull is running");