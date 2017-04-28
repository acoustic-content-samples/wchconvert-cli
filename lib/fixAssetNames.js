/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */
var fs = require("fs")
    , p = require('path')
	, dxUtils = require("./dxUtils.js");


const logger = require("./loggerWinston.js");


var usage = "Usage: node fixAssetNames.js -connectionId <connectionId> [-dir <dir>]";

var dir = "dir";
var connectionId = "";
var assetPath = "";

try {
	args = dxUtils.processArgs(process.argv,0,0, ['connectionId'],['dir']);
} catch (err) {
	logger.error(err);
	logger.info(usage);
	process.exit(1);
}


if (args['dir'] != undefined) {
	dir = args['dir'];
} 

connectionId = args['connectionId'];

assetPath = dir + "/" + connectionId + "/assets";


function fixAssetNames(path) { 

	var isError = false;
	try {

		var filelist = dxUtils.findFiles(path);

		var isGlobalError = false;

		for (var index in filelist) {

			var filePath = filelist[index];
			logger.debug("Checking file: " + filePath);

			var parts = filePath.split('/');
			var fileName= parts[parts.length -1];

			var isLocalError = false;
			if (fileName[fileName.length-4] == "-") {
				isGlobalError = true;
				isLocalError = true;

				fileName = fileName.substring(0,fileName.length-4) + '.' + fileName.substring(fileName.length-3, fileName.length);
			} 

			if (fileName.indexOf('+') != -1) {
				isGlobalError = true;
				isLocalError = true;

				fileName = fileName.replace(/\+/g, '_');
			} 

			if (fileName.indexOf('%2F') != -1) {
				isGlobalError = true;
				isLocalError = true;

				fileName = fileName.replace(/%2F/g, '_');
			}

			if (fileName.indexOf('.') == -1) {
				isGlobalError = true;
				isLocalError = true;

				fileName = fileName + ".nox";
			}

			if (isLocalError) {
				var newPath = "";

				for (var i = 0; i < parts.length-1; i++) {
					newPath += parts[i] + '/';
				}

				newPath += fileName;

				logger.info("UPDATING FILE: " + filePath);
				logger.info("CHANGING TO: " + newPath);


				fs.renameSync(filePath,newPath);
				filePath = newPath;
				
			}
			
			// if this is a bmp file convert to jpg
			if (filePath.substring(filePath.length-4, filePath.length).toUpperCase() == ".BMP") {
				dxUtils.convertBmp(filePath);
				isGlobalError = true;
			}
		}

		if (!isGlobalError) {
			logger.info("No invalid filenames were found.");
		}

	} catch (error) {
		logger.error(error.message);
		logger.error(error.stack);
		isError= true;
	}

	if (isError) {
		logger.transports.file.on('flush', function() {
			process.exit(-1);
		});
	}	
}


logger.info("Fixing asset names from path: " + assetPath);

fixAssetNames(assetPath);


module.exports.fixAssetNames = fixAssetNames;


