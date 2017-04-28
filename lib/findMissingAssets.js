/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 */


var dxUtils = require('./dxUtils.js');

const logger = require("./loggerWinston.js");


var usage = "Usage: node findMissingAssets.js -connectionId <connectionId> [-dir <dir>]";

var dir = "dir";
var connectionId = "";
var assetPath = "";

try {
	args = dxUtils.processArgs(process.argv, 0,0, ['connectionId'],['dir']);
} catch (err) {
	logger.error(err);
	logger.info(usage);
	process.exit(1);
}


if (args['dir'] != undefined) {
	dir = args['dir'];
} 

connectionId = args['connectionId'];

assetPath = dir + "/" + connectionId + "/assets/dxdam/wcm";

function findMissingAssets(path) {
	var isError = false;
	try {

		// if root path is empty, then there are no assets
		if (dxUtils.isEmpty(path)) {
			logger.warn("No asset folders found. If you do not have any assets in WCM then you can continue.");

		} else {
			var filelist = dxUtils.findEmptyFolders(path);

			var isGlobalError = false;

			logger.info("Searching for empty asset folders in " + path + ":");

			if (filelist.length == 0) {
				logger.info("No empty folders found.");
			} else {

				logger.error("Empty asset folders found:");

				for (var index in filelist) {
					var filePath = filelist[index];
					logger.error("- " + filePath);
				}


				logger.error("Verify that all assets have been correctly downloaded before continuing.");
				logger.error("If an asset failed to download, re-run wchconvert pull.");
				logger.error("If assets are missing on the server, delete the empty folders reported by the tool.");

				isError = true;

			}
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

findMissingAssets(assetPath);

module.exports.findMissingAssets = findMissingAssets;


