/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */



/* 
 * 
 * 

Usage:

wchconvert pull -connectionId <connectionId> [-dir <dir> -password <portal password>]
wchconvert prepareAssets -connectionId <connectionId> [-dir <dir>]
wchconvert pushAssets -connectionId <connectionId> [-dir <dir> -password <wch password>]
wchconvert analyze -connectionId <connectionId> [-dir <dir>]
wchconvert convert -connectionId <connectionId> [-dir <dir>]
wchconvert pushTypes -connectionId <connectionId> [-dir <dir> -password <wch password>]
wchconvert pushContent -connectionId <connectionId> [-dir <dir> -password <wch password>]

 */

var dxUtils = require('./lib/dxUtils.js') 
  , wchtools = require('./lib/wchTools.js')
  , cp = require('child_process')
  , wchconvConst = require('./lib/wchconvConst.js');
  ;
 

const logger = require("./lib/loggerWinston.js");

var args = [];

var prereqWchtools = "Missing Prereq: The wchtools package must be installed before running wchconvertmain";

var wchconvertUsage = "Usage: wchconvert <command> -connectionId <connectionId> [-password <password> -dir <dir>]";
var commandsUsage = "Commands:";
var pullUsage = "pull\t\tConnects to Portal Server and downloads content, types, and assets.";
var prepareAssetsUsage = "prepareAssets\tVerifies all assets are downloaded, fixes asset names, and removes duplicate assets.";
var pushAssetsUsage = "pushAssets\t\tPushes assets to WCH with wchtools.";
var analyzeUsage = "analyze\t\tProvides information on type and content to assist conversion process.";
var convertUsage = "convert\t\tConverts WCM content and types to the WCH format.";
var pushTypesUsage = "pushTypes\t\tPushes types to WCH with wchtools.";
var pushContentUsage = "pushContent\t\tPushes content to WCH with wchtools.";

var optionsUsage = "Options:";
var connectionIdUsage = "-connectionId\tA user-defined name to describe the Portal Server connection in the settings.json.";
var passwordUsage = "-password\t\t[Optional] For pull, the password for Portal. For the push commands, the password for WCH. If not specified, wchconvert will look for the password in the settings.json for the pull command and wchtools will prompt for the password in the push commands."
var dirUsage = "-dir\t\t[Optional] Path where the settings.json is located and where wchconvert will download the portal artifacts and create the converted artifacts. If not specified, wchconvert will look for the settings.json in the current directory and output to the current directory."

function printUsage() {
	var usage = "\n";
	usage += "  " + wchconvertUsage + "\n\n";
	usage += "  " + commandsUsage + "\n\n";
	usage += "    " + pullUsage + "\n";
	usage += "    " + prepareAssetsUsage + "\n";
	usage += "    " + pushAssetsUsage + "\n";
	usage += "    " + analyzeUsage + "\n";
	usage += "    " + convertUsage + "\n";
	usage += "    " + pushTypesUsage + "\n";
	usage += "    " + pushContentUsage + "\n\n";
	usage += "  " + optionsUsage + "\n\n";
	usage += "    " + connectionIdUsage + "\n";
	usage += "    " + passwordUsage + "\n";
	usage += "    " + dirUsage + "\n";
	
	logger.info(usage);
}



var isError = false;


if (wchtools.isInstalled() != true) {
	logger.info(prereqWchtools);
	logger.transports.file.on('flush', function() {
		process.exit(-1);
	});
}

if (process.argv.length ==3 && ((process.argv[2] == "help") || (process.argv[2] == "-help"))) {
	printUsage();
	process.exit(0);
}

logger.info("Starting wchconvert version " + wchconvConst.VERSION);


try {
	args = dxUtils.processArgs(process.argv, 1,1, ["connectionId"],["password","dir", "skipEmptyCheck", "skipDelete"]);
} catch (err) {
	logger.error(err.message);
	printUsage();
	process.exit(-1);
}

var mode = args["unnamedParam0"];
var connectionId = args["connectionId"];

var dir = ".";
if (args["dir"] != undefined) {
	dir = args["dir"];
}

var password = "";
if (args["password"] != undefined) {
	password = args["password"];
}

var skipEmptyCheck = "";
if (args["skipEmptyCheck"] != undefined) {
	skipEmptyCheck = args["skipEmptyCheck"];
}

var skipDelete = "";
if (args["skipDelete"] != undefined) {
	skipDelete = args["skipDelete"];
}



logger.info("MODE: " + mode);

if (mode == "pull") {
	try {
	
	var task = dxUtils.genNodeCommand("dxextract.js", connectionId, dir, password);
	logger.info("Running task: " + task);
	cp.execSync(task, {stdio:[0,1,2]});
	logger.info("Completed task: " + task);
	
	} catch (error) {
		logger.error ("wchconvert " + mode + " failed")
		isError = true;
	}

} else if (mode == "prepareAssets") {
	try {
	
		if(skipEmptyCheck != "true")  {
			var task1 = dxUtils.genNodeCommand("findMissingAssets.js", connectionId, dir);
			logger.info("Running task: " + task1);
			cp.execSync(task1, {stdio:[0,1,2]});
			logger.info("Completed task: " + task1);

		}

	var task2 = dxUtils.genNodeCommand("fixAssetNames.js", connectionId, dir);
	logger.info("Running task: " + task2);
	cp.execSync(task2, {stdio:[0,1,2]});
	logger.info("Completed task: " + task2);

	var task3 = dxUtils.genNodeCommand("removeDuplicateAssets.js", connectionId, dir, "", skipDelete);
	logger.info("Running task: " + task3);
	cp.execSync(task3, {stdio:[0,1,2]});
	logger.info("Completed task: " + task3);

	} catch(error) {
		logger.error ("wchconvert " + mode + " failed")
		isError = true;
	}

	
} else if (mode == "pushAssets") {

	wchtools.pushAssets(dir + "/" + connectionId, password);

} else if (mode == "analyze") {
	
	try {
		var task = dxUtils.genNodeCommand("dxanalyze.js", connectionId, dir);
		logger.info("Running task: " + task);
		cp.execSync(task, {stdio:[0,1,2]});
		logger.info("Completed task: " + task);

	} catch (error) {
		logger.error ("wchconvert " + mode + " failed")
		isError = true;
	}


} else if (mode == "convert") {
	try {

		var task = dxUtils.genNodeCommand("dxtransform.js", connectionId, dir);
		logger.info("Running task: " + task);
		cp.execSync(task, {stdio:[0,1,2]});
		logger.info("Completed task: " + task);

	} catch (error) {
		logger.error ("wchconvert " + mode + " failed")
		isError = true;
	}
	
} else if (mode == "pushTypes") {
	wchtools.pushTypes(dir + "/" + connectionId, password);

} else if (mode == "pushContent") {
	wchtools.pushContent(dir + "/" + connectionId, password);

} else {
	logger.error("Invalid mode specified");
	printUsage();
	process.exit(-1);
}


if (isError) {
	logger.error("wchconvert " + mode + " failed with errors");

	if (mode == "pushTypes" || mode == "pushAssets" || mode == "pushContent") { 

		logger.info("If errors were reported by wchtools, rerun the wchconvert " + mode + " task.");
		logger.info("Additional information from wchtools can be found in the wchtools-cli.log and wchtools-api.log.");
	}

}  else {
	logger.info("wchconvert " + mode + " completed successfully");
}

