/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

var utils = require('../utils/common'),
	dxUtils = require('../dx/dxUtils');


const logger = require('../utils/loggerWinston');


function findTypeId(type, typeFileList, outputPath) {
	var findTypeId = '';
    for (var index = 0; index < typeFileList.length; index ++) {

        var sourceFile = typeFileList[index];
        var typeJson = utils.loadJsonFile(sourceFile);

        if (typeJson.name.toUpperCase() === type.toUpperCase()) {
            findTypeId = dxUtils.cleanId(typeJson.id);

            var targetFile = outputPath + '/types/' + utils.getFilename(sourceFile);

            logger.info('Found type ' + typeJson.name + ' [' + findTypeId + ']');

            logger.info('Copying to ' + targetFile);
            utils.copyFile(sourceFile, targetFile);
        }
    }

    return findTypeId;

}

function generateAssetList(contentId, elements, assetList) {
    for (var index = 0; index < elements.length; index++) {

        var element = elements[index];

        var assetType = element.type;

        if (assetType === 'FileComponent') {


            if (element.data.resourceUri !== undefined && element.data.resourceUri.value !== undefined) {
                // download the file
                logger.debug('File resourceUri:' + element.data.resourceUri.value);
                assetList.push(element.data.resourceUri.value);

            } else {
                logger.debug('Content contains file reference without a resourceUri: ' + contentId);
            }

        }


        if (assetType === 'ImageComponent') {

            if (element.data.image.resourceUri !== undefined && element.data.image.resourceUri.value !== undefined) {
                // download the image
                logger.debug('image resourceUri:' + element.data.image.resourceUri.value);

                assetList.push(element.data.image.resourceUri.value);

            } else {
                logger.debug('Content contains image reference without a resourceUri: ' + contentId);
            }
        }
    }
}

function copyAssets(assetList, outputPath) {
    for (var index = 0; index < assetList.length; index++) {
        var uri = assetList[index];
        var sourceFile = dxUtils.getAssetPath(uri, dir, connectionId);

        var dxAssetId = dxUtils.getDxAssetId(uri);

        var targetPath = outputPath + '/assets/dxdam/wcm/' + dxAssetId;
        var targetFile =  targetPath + '/' + utils.getFilename(sourceFile);

        logger.info('Copying to referenced asset to ' + targetFile);
        utils.createPath(targetPath);
        utils.copyFile(sourceFile, targetFile);
    }
}

function dxFilter(dir, connectionId, type) {
	
	var sourcePath = dir + '/' + connectionId;
	var outputPath = dir + '/' + connectionId + '-' + type;
	
	utils.createPath(outputPath);
	utils.createPath(outputPath + '/types');
	utils.createPath(outputPath + '/content');
	utils.createPath(outputPath + '/assets/dxdam/wcm');


	var typeFileList = utils.findFiles(sourcePath + '/types', '_tdx.json');
	var findId = findTypeId(type, typeFileList, outputPath);


	var contentFileList = utils.findFiles(sourcePath + '/content', '_cdx.json');
	var assetList = [];

	for (var index = 0; index < typeFileList.length; index ++) {

		var sourceFile = contentFileList[index];
		var contentJson = utils.loadJsonFile(sourceFile);
		
		var typeId = dxUtils.getTypeIdValue(contentJson.link);
		
		if (findId === typeId) {
			
			var contentId = dxUtils.cleanId(contentJson.id);
			
			logger.info('Found content ' + contentJson.name + ' [' + contentId + ']');

			var targetFile = outputPath + '/content/' + utils.getFilename(sourceFile);

			logger.info('Copying to ' + targetFile);
			utils.copyFile(sourceFile, targetFile);

			var elements = contentJson.content.content.elements.element;
            generateAssetList(contentId, elements, assetList);
		}
	}


    copyAssets(assetList, outputPath);
}

var args = [];

var usage = 'Usage: node dxFilterByType.js -connectionId <connectionId> -type <typeName> [-dir <dir>]';

var connectionId = '';
var dir = '.';
var type = '';

try {
	args = utils.processArgs(process.argv, 0,0, ['connectionId', 'type'],['dir']);
} catch (err) {
	logger.error(err);
	logger.info(usage);
	process.exit(1);
}

if (args.connectionId !== undefined) {
	connectionId = args.connectionId;
} 

if (args.type !== undefined) {
	type = args.type;
} 

if (args.dir !== undefined) {
	dir = args.dir;
} 

dxFilter(dir, connectionId, type);
