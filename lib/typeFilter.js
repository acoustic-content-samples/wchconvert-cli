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


function dxFilter(dir, connectionId, type) {
	
	var sourcePath = dir + '/' + connectionId;
	var outputPath = dir + '/' + connectionId + '-' + type;
	
	dxUtils.createPath(outputPath);
	dxUtils.createPath(outputPath + '/types');
	dxUtils.createPath(outputPath + '/content');
	dxUtils.createPath(outputPath + '/assets/dxdam/wcm');
	
	
	var typeFileList = dxUtils.findFiles(sourcePath + "/types", "_tdx.json");

	var findTypeId = "";
	
	for (var index in typeFileList) {
		
		var sourceFile = typeFileList[index];
		var typeJson = dxUtils.loadJsonFile(sourceFile);
		
		if (typeJson.name.toUpperCase() == type.toUpperCase()) {
			findTypeId = dxUtils.cleanId(typeJson.id);
			
			var targetFile = outputPath + '/types/' + dxUtils.getFilename(sourceFile);
			
			logger.info("Found type " + typeJson.name + " [" + findTypeId + "]");

			logger.info("Copying to " + targetFile);
			dxUtils.copyFile(sourceFile, targetFile);
		}
	}
	
	
	
	var contentFileList = dxUtils.findFiles(sourcePath + "/content", "_cdx.json");
	var assetList = [];

	for (var index in contentFileList) {

		var sourceFile = contentFileList[index];
		var contentJson = dxUtils.loadJsonFile(sourceFile);
		
		var typeId = dxUtils.getTypeIdValue(contentJson.link);
		
		if (findTypeId == typeId) {
			
			var contentId = dxUtils.cleanId(contentJson.id);
			
			logger.info("Found content " + contentJson.name + " [" + contentId + "]");

			var targetFile = outputPath + '/content/' + dxUtils.getFilename(sourceFile);

			logger.info("Copying to " + targetFile);
			dxUtils.copyFile(sourceFile, targetFile);
			
			
			   			var elements = contentJson.content.content.elements.element;
   			
   			for (var index in elements) {
   				
   				var element = elements[index];
   				
   				var type = element["type"];
   				
   				if (type == "FileComponent") {
   					
   					
   					if (element["data"]["resourceUri"] != undefined && element["data"]["resourceUri"]["value"] != undefined) {
   	   					// download the file
   	   					logger.debug("File resourceUri:" + element["data"]["resourceUri"]["value"]);
   	   					assetList.push(element["data"]["resourceUri"]["value"]);
   						
   					} else {
   						logger.debug("Content contains file reference without a resourceUri: " + contentId);
   					}
   		
   				}
   				
  				
   				if (type == "ImageComponent") {
   					
   					if (element["data"]["image"]["resourceUri"] != undefined && element["data"]["image"]["resourceUri"]["value"] != undefined) {
   	   					// download the image
   	   					logger.debug("image resourceUri:" + element["data"]["image"]["resourceUri"]["value"]);
   	   					
   	   					assetList.push(element["data"]["image"]["resourceUri"]["value"]);
   						
   					} else {
   						logger.debug("Content contains image reference without a resourceUri: " + contentId);
   					}
   				}
   				
   			}
			
			
		}
	}

	
	for (var index in assetList) {
		var uri = assetList[index];
		var sourceFile = dxUtils.getAssetPath(uri, dir, connectionId);
		
		var dxAssetId = dxUtils.getDxAssetId(uri);
		
		var targetPath = outputPath + '/assets/dxdam/wcm/' + dxAssetId;
		var targetFile =  targetPath + '/' + dxUtils.getFilename(sourceFile);
		
		logger.info("Copying to referenced asset to " + targetFile);
		dxUtils.createPath(targetPath);
		dxUtils.copyFile(sourceFile, targetFile);
	}
}



var args = [];

var usage = "Usage: node dxFilterByType.js -connectionId <connectionId> -type <typeName> [-dir <dir>]";

var connectionId = "";
var dir = "dir";
var type = "";

try {
	args = dxUtils.processArgs(process.argv, 0,0, ["connectionId", "type"],["dir"]);
} catch (err) {
	logger.error(err);
	logger.info(usage);
	process.exit(1);
}

if (args["connectionId"] != undefined) {
	connectionId = args["connectionId"];
} 

if (args["type"] != undefined) {
	type = args["type"];
} 

if (args["dir"] != undefined) {
	dir = args["dir"];
} 

dxFilter(dir, connectionId, type);
