/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

var dxUtils = require("./dxUtils.js")
	, Q = require('q')
	;

const logger = require("./loggerWinston.js");

function genAssetInfo(amdFile, duplicateAssets) {
	var deferred = Q.defer();
	
	var asset = {};
	var assetJson = dxUtils.loadJsonFile(amdFile);
	
	var id = assetJson.id;
	var assetType = assetJson.assetType;
	var mediaType = assetJson.mediaType;
	var fileName= assetJson.fileName;
	var fileSize = assetJson.fileSize;

	var resourceUri = "";

	if (assetType === "image") {
		resourceUri = assetJson.renditions.default.source;
		asset['renditions'] = assetJson.renditions;
	}
	
	asset['id'] = id;
	asset['assetType'] = assetType;
	asset['mediaType'] = mediaType;
	asset['fileName'] = fileName;
	asset['fileSize'] = fileSize;
	asset['dxids'] = [];
	
	if (resourceUri) {
		asset['resourceUri'] = resourceUri;
	}

	if (assetJson.path != undefined && assetJson.name != undefined) {
		var parts = assetJson.path.split('/');
		var dxId = parts[parts.length-2];
		asset['dxids'] = duplicateAssets[dxId];
	}

	dxUtils.createHash(amdFile.substring(0,amdFile.length-9))
	.then(function(result) {
		asset['md5'] = result;
		deferred.resolve(asset);
	});
	
	return deferred.promise;
}

function loadAssets(filelist, duplicateAssets, index, assets) {

	var deferred = Q.defer();

	if (index == undefined) {
		index = 0;
	}

	if (assets == undefined) {
		assets = {};
	}

	if (filelist.length == 0) {
		
		// no asset _amd.json files were found.  this means there are no assets, or forgot to push them first
		deferred.resolve(assets);

	} else {
		var filePath = filelist[index];

		logger.info("loading asset [" + index + "]: " + filePath);

		genAssetInfo(filePath, duplicateAssets)
		.then(function(assetInfo){
			logger.debug("DX Asset " + assetInfo.dxids[0] + ": " + assetInfo.id);

			assets[assetInfo.id] = assetInfo;

			if (index < filelist.length -1) {
				deferred.resolve(loadAssets(filelist, duplicateAssets, index+1, assets));	

			} else {
				deferred.resolve(assets);
			} 

		})
		.fail(function(error) {
			deferred.reject(error);
			logger.error(error);
		});

	}

	return deferred.promise;
}


function findAssetId(assets, dxid) {
	var result = "";
	
	for (var assetId in assets) {

		var asset = assets[assetId];
		var dxids = asset.dxids;
		
		for (var index in dxids) {
			if (dxids[index] == dxid) {
				result= assetId;
			}
		}
	}
	
	return result;
}


module.exports.loadAssets = loadAssets;
module.exports.findAssetId = findAssetId;









