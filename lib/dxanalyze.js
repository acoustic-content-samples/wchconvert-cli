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


//type variables
var typeContent = "content"
	, typeContentTemplate = "contentTemplate"
		;


function analyze(sourceJson, assets, typeNames, statMap) {

	var sourceId = dxUtils.cleanId(sourceJson.id);

	var sourceType = "";

	if (sourceJson.type != undefined) {
		sourceType = sourceJson.type;
	}

	logger.debug("Source ID: " + sourceId);

	if (sourceType.toUpperCase() == typeContentTemplate.toUpperCase()) {

		wchType.analyze(sourceJson, typeNames, statMap);

	}

	if (sourceType.toUpperCase() == typeContent.toUpperCase()) {

		wchContent.analyze(sourceJson, assets, typeNames, statMap);

	}
}



function analyzeFiles(filelist, assets, typeNames, statMap) {


	for (var index in filelist) {

		var filePath = filelist[index];

		if (filePath.endsWith("_tdx.json") || filePath.endsWith("_cdx.json")) {
			logger.info("ANALYZING [" + index + "]: " + filePath);
			var json = dxUtils.loadJsonFile(filePath);
			analyze(json, assets, typeNames, statMap);
		}
	}
}

function dxAnalyze(rootPath) {


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


		logger.info ("LOADING TYPE NAMES: Started");
		var typeNames = {};
		if (fs.existsSync(rootPath + "/typeNames.json")) {
			typeNames = dxUtils.loadJsonFile(rootPath + "/typeNames.json");
		} 
		logger.info ("LOADING TYPE NAMES: Complete");


		var statMap = {};
		statMap["typeList"] = {};
		statMap["containsComponentReference"] = [];
		statMap["containsFile"] = [];
		statMap["containsHTML"] = [];
		statMap["containsImage"] = [];
		statMap["containsJSP"] = [];
		statMap["containsLink"] = [];
		statMap["containsRichText"] = [];
		statMap["containsOptionSelection"] = [];
		statMap["containsUserSelection"] = [];
		statMap["containsEmptyField"] = [];
		statMap["errors"] = [];

		logger.info ("ANALYZING TYPES: Started");
		var typeFileList = dxUtils.findFiles(rootPath + "/types", "_tdx.json");
		analyzeFiles(typeFileList, assets, typeNames, statMap);
		logger.info ("ANALYZING TYPES: Complete");

		logger.info ("ANALYZING CONTENT: Started");
		var contentFileList = dxUtils.findFiles(rootPath + "/content", "_cdx.json");
		analyzeFiles(contentFileList, assets, typeNames, statMap);
		logger.info ("ANALYZING CONTENT: Complete");

		logger.info("SAVING NAME MAPPINGS: Started");
		dxUtils.saveJsonFile(typeNames, rootPath + "/typeNames.json");
		logger.info("SAVING NAME MAPPINGS: Complete");

		logger.info("-------------------------------------------------------------------------------");
		logger.info("List of Types and Content based on the type [" + Object.keys(statMap["typeList"]).length + "]");

		var typeElementList = {};
		for (var i = 0; i < typeFileList.length; i++) {
			var typeJson = dxUtils.loadJsonFile(typeFileList[i]);
			var typeId = dxUtils.cleanId(typeJson.id);

			if (typeJson.elements != undefined) {
				typeElementList[typeId] = typeJson.elements;	
			} else {
				typeElementList[typeId] = [];
			}
		}

		var contentElementList = {};
		var contentNames = {};
		for (var i = 0; i < contentFileList.length; i++) {
			var contentJson = dxUtils.loadJsonFile(contentFileList[i]);
			var contentId = dxUtils.cleanId(contentJson.id);

			var contentElements =  [];

			if (contentJson.content.content.elements != undefined) {
				contentElements  = contentJson.content.content.elements.element;
			}

			contentElementList[contentId] = contentElements;
			contentNames[contentId] = contentJson.name;

		}


		Object.keys(statMap["typeList"]).forEach(function(typeId) {
			var contentList = statMap["typeList"][typeId];
			var typeName = dxUtils.findByVal(typeNames, typeId);
			logger.info('----------------------------------------------------------------------');
			logger.info("TYPE: " + typeName + " (" + typeId + ") [" + contentList.length + "]");

			for (var index in contentList) {

				var contentId = contentList[index];
				var contentName = contentNames[contentId];
				var prefix = "[" + eval(parseInt(index) + 1) + "] ";
				logger.info(prefix + contentName + " (" + contentId + ")");

				var typeElements = typeElementList[typeId];
				var contentElements = contentElementList[contentId];

				var diffElements = wchContent.diffElements(typeElements, contentElements);

				if (diffElements.length) {
					for (var i in diffElements) {
						logger.info(dxUtils.indent(prefix.length) + diffElements[i]);
					} 
				}
			}
		});

		logger.info("-------------------------------------------------------------------------------");
		logger.info("Types with Component Reference [" + statMap["containsComponentReference"].length + "]");
		for (var index in statMap["containsComponentReference"]) {
			var prefix = "[" + eval(parseInt(index) + 1) + "] ";
			logger.info(prefix + statMap["containsComponentReference"][index]);
		}

		logger.info("-------------------------------------------------------------------------------");
		logger.info("Types with File [" + statMap["containsFile"].length + "]");
		for (var index in statMap["containsFile"]) {
			var prefix = "[" + eval(parseInt(index) + 1) + "] ";
			logger.info(prefix + statMap["containsFile"][index]);
		}

		logger.info("-------------------------------------------------------------------------------");
		logger.info("Types with HTML [" + statMap["containsHTML"].length + "]");
		for (var index in statMap["containsHTML"]) {
			var prefix = "[" + eval(parseInt(index) + 1) + "] ";
			logger.info(prefix + statMap["containsHTML"][index]);
		}


		logger.info("-------------------------------------------------------------------------------");
		logger.info("Types with Image [" + statMap["containsImage"].length + "]");
		for (var index in statMap["containsImage"]) {
			var prefix = "[" + eval(parseInt(index) + 1) + "] ";
			logger.info(prefix + statMap["containsImage"][index]);
		}


		logger.info("-------------------------------------------------------------------------------");
		logger.info("Types with JSP [" + statMap["containsJSP"].length + "]");
		for (var index in statMap["containsJSP"]) {
			var prefix = "[" + eval(parseInt(index) + 1) + "] ";
			logger.info(prefix + statMap["containsJSP"][index]);
		}

		logger.info("-------------------------------------------------------------------------------");
		logger.info("Types with Link [" + statMap["containsLink"].length + "]");
		for (var index in statMap["containsLink"]) {
			var prefix = "[" + eval(parseInt(index) + 1) + "] ";
			logger.info(prefix + statMap["containsLink"][index]);
		}


		logger.info("-------------------------------------------------------------------------------");
		logger.info("Types with Option Selection [" + statMap["containsOptionSelection"].length + "]");
		for (var index in statMap["containsOptionSelection"]) {
			var prefix = "[" + eval(parseInt(index) + 1) + "] ";
			logger.info(prefix + statMap["containsOptionSelection"][index]);
		}


		logger.info("-------------------------------------------------------------------------------");
		logger.info("Types with Rich Text [" + statMap["containsRichText"].length + "]");
		for (var index in statMap["containsRichText"]) {
			var prefix = "[" + eval(parseInt(index) + 1) + "] ";
			logger.info(prefix + statMap["containsRichText"][index]);
		}


		logger.info("-------------------------------------------------------------------------------");
		logger.info("Types with User Selection [" + statMap["containsUserSelection"].length + "]");
		for (var index in statMap["containsUserSelection"]) {
			var prefix = "[" + eval(parseInt(index) + 1) + "] ";
			logger.info(prefix + statMap["containsUserSelection"][index]);
		}

		logger.info("-------------------------------------------------------------------------------");
		logger.info("Content items with empty fields [" + statMap["containsEmptyField"].length + "]");
		for (var index in statMap["containsEmptyField"]) {
			var prefix = "[" + eval(parseInt(index) + 1) + "] ";
			logger.info(prefix + statMap["containsEmptyField"][index]);
		}

		logger.info("-------------------------------------------------------------------------------");
		logger.warn("Warning messages [" + statMap["errors"].length + "]");
		for (var index in statMap["errors"]) {
			var prefix = "[" + eval(parseInt(index) + 1) + "] ";
			logger.warn(prefix + statMap["errors"][index]);
		}


		if (Object.keys(assets).length == 0) {
			logger.warn("No assets were loaded.  Make sure to use wchtools to push assets before running dxanalyze.");
			logger.info("If this was unintentional, you should run deleteWCHJson and then push the assets again before running dxanalyze.");
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

var usage = "Usage: node dxanalyze.js -connectionId <connectionId> [-dir <dir>]";

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
	dxAnalyze(dir + "/" + connectionId);


} catch (err) {
	logger.error(err.message);
	logger.error(err.stack);
	logger.transports.file.on('flush', function() {
		process.exit(-1);
	});
}
