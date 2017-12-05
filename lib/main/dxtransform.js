/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

var fs = require('fs'),
    dxUtils = require('../dx/dxUtils'),
    wchType = require('../wch/wchType'),
    wchContent = require('../wch/wchContent'),
    wchAsset = require('../wch/wchAsset'),
    utils = require('../utils/common'),
    Q = require('q');


const logger = require('../utils/loggerWinston');


// type variables
var typeContent = 'content',
    typeContentTemplate = 'contentTemplate';


// PATH VARIABLES:
//path structure is .//converted/types|content
var rootPath = '.',
    contentPath = rootPath + '/content',
    typesPath = rootPath + '/types';



function removeExtraElements(sourceJson, diffElements) {

    var contentId = dxUtils.cleanId(sourceJson.id);

    var contentElements =  [];

    if (sourceJson.content && sourceJson.content.content && sourceJson.content.content.elements && sourceJson.content.content.elements.element) {
        contentElements  = sourceJson.content.content.elements.element;
    }

    var extraElements = [];

    if (diffElements[contentId] && diffElements[contentId].extra) {
        extraElements = diffElements[contentId].extra;

        for (var index = contentElements.length-1; index >= 0; index--) {
            var elementName =  contentElements[index].name;
            if (extraElements.indexOf(elementName) >= 0) {
                logger.debug(diffElements[contentId].name + ' [' + contentId + '] Deleting extra field: ' + elementName);
                contentElements.splice(index,1);
            }
        }
    }
    return sourceJson;
}



function convert(sourceJson, assets, typeNames, diffElements, portalBaseUrl, contentHandlerPath) {

    var sourceId = dxUtils.cleanId(sourceJson.id);

    var sourceType = '';

    if (sourceJson.type !==  undefined) {
        sourceType = sourceJson.type;
    }

    var targetPath = '';

    logger.debug('Source ID: ' + sourceId);

    var targetJson = {};

    if (sourceType.toUpperCase() ===  typeContentTemplate.toUpperCase()) {

        targetJson = wchType.convert(sourceJson, typeNames);

        targetPath = typesPath + '/' + sourceId + '_tmd.json';

    }

    if (sourceType.toUpperCase() ===  typeContent.toUpperCase()) {

        sourceJson = removeExtraElements(sourceJson, diffElements);

        targetJson = wchContent.convert(sourceJson, assets, portalBaseUrl, contentHandlerPath);

        targetPath = contentPath + '/' + sourceId + '_cmd.json';

    }


    fs.writeFileSync(targetPath, JSON.stringify(targetJson, null, 4));
}



function convertFiles(filelist, assets, typeNames, diffElements, portalBaseUrl, contentHandlerPath) {

    for (var index = 0; index < filelist.length; index++) {

        var filePath = filelist[index];

        if (filePath.endsWith('_tdx.json') || filePath.endsWith('_cdx.json')) {
            logger.info('CONVERTING [' + index + ']: ' + filePath);
            var json = utils.loadJsonFile(filePath);
            convert(json, assets, typeNames, diffElements, portalBaseUrl, contentHandlerPath);
        }
    }
}

function dxTransform(args) { //jshint ignore: line
    var deferred = Q.defer();

    var settingsJSON = utils.loadSettings(args);

    if (settingsJSON === undefined) {
        deferred.reject(new Error('Could not find definition for connectionId ' + args.connectionId + ' in ' + args.settings));
        return deferred.promise;
    }
    var connectionId = settingsJSON.connectionId;
    var rootPath = settingsJSON.ROOT_WORKSPACE + '/' + connectionId;

    var host = settingsJSON.host;
    var port = settingsJSON.port;
    var secure = settingsJSON.secure;
    var contentHandlerPath = settingsJSON.contentHandlerPath;

    var portalBaseUrl;
    if (secure) {
        portalBaseUrl = 'https://' + host + ':' + port;
    } else {
        portalBaseUrl = 'http://' + host + ':' + port;
    }


    contentPath = rootPath + '/content';
    typesPath = rootPath + '/types';

    logger.info ('LOADING DUPLICATE ASSETS: Started');
    var duplicateAssets = {};
    if (fs.existsSync(rootPath + '/duplicateAssets.json')) {
        duplicateAssets = utils.loadJsonFile(rootPath + '/duplicateAssets.json');
    }
    logger.info ('LOADING DUPLICATE ASSETS: Complete');

    logger.info ('LOADING DIFF ELEMENTS: Started');
    var diffElements = {};
    if (fs.existsSync(rootPath + '/diffElements.json')) {
        diffElements = utils.loadJsonFile(rootPath + '/diffElements.json');
    }
    logger.info ('LOADING DIFF ELEMENTS: Complete');

    logger.info ('LOADING ASSETS: Started');
    var assetFileList = utils.findFiles(rootPath + '/assets', '_amd.json');
    var assets = {};

    if (assetFileList.length ===  0) {
        logger.warn('No assets _amd.json files found.  Assets must be pushed to WCH  using wchtools before running analyze.');
    }

    wchAsset.loadAssets(assetFileList, duplicateAssets)
        .then(function(result) {
            assets = result;

        })
        .then(function() {


            logger.info ('LOADING ASSETS: Complete');

            logger.info ('LOADING NAME MAPPINGS: Started');
            var typeNames = {};
            if (fs.existsSync(rootPath + '/typeNames.json')) {
                typeNames = utils.loadJsonFile(rootPath + '/typeNames.json');
            }
            logger.info ('LOADING NAME MAPPINGS: Complete');

            logger.info ('CONVERTING TYPES: Started');
            var typeFileList = utils.findFiles(rootPath + '/types', '_tdx.json');
            convertFiles(typeFileList, assets, typeNames);
            logger.info ('CONVERTING TYPES: Complete');

            logger.info ('CONVERTING CONTENT: Started');
            var contentFileList = utils.findFiles(rootPath + '/content', '_cdx.json');
            convertFiles(contentFileList, assets, typeNames, diffElements, portalBaseUrl, contentHandlerPath);
            logger.info ('CONVERTING CONTENT: Complete');

            logger.info('SAVING NAME MAPPINGS: Started');
            utils.saveJsonFile(typeNames, rootPath + '/typeNames.json');
            logger.info('SAVING NAME MAPPINGS: Complete');

            if (Object.keys(assets).length ===  0) {
                logger.warn('No assets were loaded.  Make sure to use wchtools to push assets before running dxtransform.');
                logger.info('If this was unintentional, you should run deleteWCHJson and then push the assets again before running dxtransform.');
            }

            deferred.resolve('WCHCONVERT CONVERT COMPELTED SUCCESSFULLY');

        })

        .fail(function(error){
            deferred.reject(error);
        });

    return deferred.promise;
}


module.exports.main = dxTransform;