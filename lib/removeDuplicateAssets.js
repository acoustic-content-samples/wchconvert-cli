/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 */


var dxUtils = require('./dxUtils.js')
    , Q = require('q')
    , fs = require("fs")
    ;

const logger = require("./loggerWinston.js");


var usage = "Usage: node removeDuplicateAssets.js -connectionId <connectionId> [-dir <dir>]";

var dir = "dir";
var connectionId = "";
var assetPath = "";
var isSkipDelete = false;

try {
	args = dxUtils.processArgs(process.argv, 0,0, ['connectionId'],['dir', 'skipDelete']);
} catch (err) {
	logger.error(err);
	logger.info(usage);
	process.exit(1);
}

if (args['dir'] != undefined) {
	dir = args['dir'];
} 


if (args['skipDelete'] != undefined) {
	if (args['skipDelete'].toUpperCase() == 'TRUE') {
		isSkipDelete = true;
	}
} 

connectionId = args['connectionId'];

assetPath = dir + "/" + connectionId + "/assets";

function removeDuplicateAssets(path, isSkipDelete) {
	var isError = false;
	try {

		if (isSkipDelete == undefined) {
			isSkipDelete = false;
		}

		var fileList = dxUtils.findFiles(path);

		generateHashes(fileList)
		.then(function(assetHashes){

			var md5Hashes = {};
			
			if (fs.existsSync(dir + "/" + connectionId + "/md5Hashes.json"))  {
				logger.info("Loadding File: " + dir + "/" + connectionId + "/md5Hashes.json");
				md5Hashes = dxUtils.loadJsonFile(dir + "/" + connectionId + "/md5Hashes.json");
			} 

			for (var dxId in assetHashes) {


				var isFound = false;
				for (var key in  md5Hashes) {
					if (key == assetHashes[dxId].md5Hash) {

						// don't readd a file to the list of assets if it already exists
						if (md5Hashes[key][0].id != dxId) {
							md5Hashes[key].push({"id": dxId, "file": assetHashes[dxId].file});
						}
						isFound = true;
					}
				}

				if (!isFound) {
					md5Hashes[assetHashes[dxId].md5Hash] = [{"id": dxId, "file":assetHashes[dxId].file}];
				}


			}

			var duplicateAssets = {};

			if (fs.existsSync(dir + "/" + connectionId + "/duplicateAssets.json"))  {
				logger.info("Loadding File: " + dir + "/" + connectionId + "/duplicateAssets.json");
				duplicateAssets = dxUtils.loadJsonFile(dir + "/" + connectionId + "/duplicateAssets.json");
			} 

			// iterate each md5Hashes
			// iterate each list of ids
			// if the index is 0, add to dxassets with its own id 
			// if the index is > 0, add to dxassets the 0 id and delete its file

			var isDuplicates = false;

			for (var md5Hash in md5Hashes) {
				var assetList = md5Hashes[md5Hash];
				var masterDxId = "";

				for (var index in assetList) {

					if (index == 0) {
						masterDxId = assetList[index].id;
						duplicateAssets[masterDxId] = [ assetList[index].id ];
					} else {
						isDuplicates = true;
						duplicateAssets[masterDxId].push(assetList[index].id);

						var file = assetList[index].file;
						
						if (isSkipDelete) {
							logger.info("Skipping duplicate file: " + file);
						} else {
							logger.info("Deleting duplicate file: " + file);
							dxUtils.deleteFile(file);
							dxUtils.deleteFile(file.substring(0,file.lastIndexOf('/')));
						}
					}
				}
			}

			// write dxassets to dxassets.json
			dxUtils.saveJsonFile(duplicateAssets, dir + "/" + connectionId + "/duplicateAssets.json");
			dxUtils.saveJsonFile(md5Hashes, dir + "/" + connectionId + "/md5Hashes.json");

			if (!isDuplicates) {
				logger.info("No duplicate assets were found.");
			}

		})
		.fail(function(error){
			logger.error(error);
			logger.error(error.stack);
			isError = true;
		});

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

function generateHashes(fileList, assetHashes, index) {
	var deferred = Q.defer();
	
	if (assetHashes == undefined) {
		assetHashes = {};
	}
	
	if (index == undefined) {
		index = 0;
	}
	
	var file = fileList[index];
	
	dxUtils.createHash(file)
	.then(function(md5Hash){
	
		var parts = file.split('/');
		var dxId = parts[parts.length-2];
		
		assetHashes[dxId] = {"file": file, "md5Hash": md5Hash};
		
		if (index < fileList.length -1) {
			deferred.resolve(generateHashes(fileList, assetHashes, index +1));
			
		} else {
			deferred.resolve(assetHashes);
		}
	})
	.fail(function(error){
		deferred.reject(error);
	})
	
	return deferred.promise;
}

removeDuplicateAssets(assetPath, isSkipDelete);

module.exports.removeDuplicateAssets = removeDuplicateAssets;


