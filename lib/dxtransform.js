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
	, Q = require('q')
	, dxUtils = require("./dxUtils.js")
	, wchType = require("./wchType.js")
	, wchContent = require("./wchContent.js")
	, wchAsset = require("./wchAsset.js")
;

const logger = require("./loggerWinston.js");


// type variables
var typeContent = "content"
	, typeContentTemplate = "contentTemplate"
;


// PATH VARIABLES:
//path structure is ./dir/converted/types|content
var rootPath = "dir"
	, contentPath = rootPath + "/content"
	, typesPath = rootPath + "/types"
;


function convert(sourceJson, assets, typeNames) {

		var sourceId = dxUtils.cleanId(sourceJson.id);
		
		var sourceType = "";
		
		if (sourceJson.type != undefined) {
			sourceType = sourceJson.type;
		}
		
		var targetPath = "";
		
		logger.debug("Source ID: " + sourceId); 
		
		var targetJson = {};
		
		if (sourceType.toUpperCase() == typeContentTemplate.toUpperCase()) {

			targetJson = wchType.convert(sourceJson, typeNames);
			
			targetPath = typesPath + "/" + sourceId + "_tmd.json";
			
		}
			
		if (sourceType.toUpperCase() == typeContent.toUpperCase()) {
			
			targetJson = wchContent.convert(sourceJson, assets);
			
			targetPath = contentPath + "/" + sourceId + "_cmd.json";

		}
		
		
		fs.writeFileSync(targetPath, JSON.stringify(targetJson, null, 4));
}
		


function convertFiles(filelist, assets, typeNames) {
	
	
	for (var index in filelist) {
		
		var filePath = filelist[index];
		
		if (filePath.endsWith("_tdx.json") || filePath.endsWith("_cdx.json")) {
			logger.info("CONVERTING [" + index + "]: " + filePath);
			var json = dxUtils.loadJsonFile(filePath);
			convert(json, assets, typeNames);
		}
	}
}

function dxTransform(rootPath ) {

	contentPath = rootPath + "/content";
	typesPath = rootPath + "/types";

	logger.info ("LOADING DUPLICATE ASSETS: Started");
	var duplicateAssets = {};
	if (fs.existsSync(rootPath + "/duplicateAssets.json")) {
		duplicateAssets = dxUtils.loadJsonFile(rootPath + "/duplicateAssets.json");
	} 
	logger.info ("LOADING DUPLICATE ASSETS: Complete");


	logger.info ("LOADING ASSETS: Started");
	var assetFileList = dxUtils.findFiles(rootPath + "/assets", "_amd.json");
	var assets = {};

	if (assetFileList.length == 0) {
		logger.warn("No assets _amd.json files found.  Assets must be pushed to WCH  using wchtools before running dxanalyze.")
	}

	wchAsset.loadAssets(assetFileList, duplicateAssets)
	.then(function(result) {
		assets = result;

	})
	.then(function() {


		logger.info ("LOADING ASSETS: Complete");

		logger.info ("LOADING NAME MAPPINGS: Started");
		var typeNames = {};
		if (fs.existsSync(rootPath + "/typeNames.json")) {
			typeNames = dxUtils.loadJsonFile(rootPath + "/typeNames.json");
		} 
		logger.info ("LOADING NAME MAPPINGS: Complete");

		logger.info ("CONVERTING TYPES: Started");
		var typeFileList = dxUtils.findFiles(rootPath + "/types", "_tdx.json");
		convertFiles(typeFileList, assets, typeNames);
		logger.info ("CONVERTING TYPES: Complete");

		logger.info ("CONVERTING CONTENT: Started");
		var contentFileList = dxUtils.findFiles(rootPath + "/content", "_cdx.json");
		convertFiles(contentFileList, assets, typeNames);
		logger.info ("CONVERTING CONTENT: Complete");

		logger.info("SAVING NAME MAPPINGS: Started");
		dxUtils.saveJsonFile(typeNames, rootPath + "/typeNames.json");
		logger.info("SAVING NAME MAPPINGS: Complete");

		if (Object.keys(assets).length == 0) {
			logger.warn("No assets were loaded.  Make sure to use wchtools to push assets before running dxtransform.");
			logger.info("If this was unintentional, you should run deleteWCHJson and then push the assets again before running dxtransform.");
		}

	})
		
	.fail(function(error){
		logger.error(error.message);
		logger.error(error.stack);
		logger.transports.file.on('flush', function() {
			process.exit(-1);
		});
	});



}



var args = [];

var usage = "Usage: node dxtransform.js -connectionId <connectionId> [-dir <dir>]";

var connectionId = "";
var dir = "dir";

try {
	args = dxUtils.processArgs(process.argv, 0,0, ["connectionId"],["dir"]);
} catch (err) {
	logger.error(err);
	logger.info(usage);
	process.exit(1);
}

if (args["connectionId"] != undefined) {
	connectionId = args["connectionId"];
} 

if (args["dir"] != undefined) {
	dir = args["dir"];
} 

try {


	dxTransform(dir + "/" + connectionId);


} catch (err) {
	logger.error(err.message);
	logger.error(err.stack);
	process.exit(-1);
}


