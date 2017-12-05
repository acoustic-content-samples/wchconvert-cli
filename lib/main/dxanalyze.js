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
    utils = require('../utils/common'),
    wchType = require('../wch/wchType'),
    wchContent = require('../wch/wchContent'),
    wchAsset = require('../wch/wchAsset'),
    Q = require('q');


const logger = require('../utils/loggerWinston');


//type variables
var typeContent = 'content',
    typeContentTemplate = 'contentTemplate';

function analyze(sourceJson, assets, typeNames, statMap, portalBaseUrl, contentHandlerPath) {

    var sourceId = dxUtils.cleanId(sourceJson.id);

    var sourceType = '';

    if (sourceJson.type !== undefined) {
        sourceType = sourceJson.type;
    }

    logger.debug('Source ID: ' + sourceId);

    if (sourceType.toUpperCase() === typeContentTemplate.toUpperCase()) {

        wchType.analyze(sourceJson, typeNames, statMap);

    }

    if (sourceType.toUpperCase() === typeContent.toUpperCase()) {

        wchContent.analyze(sourceJson, assets, typeNames, statMap, portalBaseUrl, contentHandlerPath);

    }
}



function analyzeFiles(filelist, assets, typeNames, statMap, portalBaseUrl, contentHandlerPath) {


    for (var index = 0; index < filelist.length; index++) {

        var filePath = filelist[index];

        if (filePath.endsWith('_tdx.json') || filePath.endsWith('_cdx.json')) {
            logger.info('ANALYZING [' + index + ']: ' + filePath);
            var json = utils.loadJsonFile(filePath);

            analyze(json, assets, typeNames, statMap, portalBaseUrl, contentHandlerPath);
        }
    }
}

function printStatArray(statArray, label, isWarn){
    var index, prefix;
    if (isWarn !== undefined && isWarn) {
        logger.warn('-------------------------------------------------------------------------------');
        logger.warn(label + ' [' + statArray.length + ']');
        for (index = 0; index < statArray.length; index++) {
            prefix = '[' + (parseInt(index) + 1) + '] ';
            logger.warn(prefix + statArray[index]);
        }

    } else {
        logger.info('-------------------------------------------------------------------------------');
        logger.info(label + ' [' + statArray.length + ']');
        for (index = 0; index < statArray.length; index++) {
            prefix = '[' + (parseInt(index) + 1) + '] ';
            logger.info(prefix + statArray[index]);
        }

    }

}


function dxAnalyze(args) { // jshint ignore: line
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


    logger.info ('LOADING DUPLICATE ASSETS: Started');
    var duplicateAssets = {};
    if (fs.existsSync(rootPath + '/duplicateAssets.json')) {
        duplicateAssets = utils.loadJsonFile(rootPath + '/duplicateAssets.json');
    }
    logger.info ('LOADING DUPLICATE ASSETS: Complete');

    logger.info ('LOADING ASSETS: Started');
    var assetFileList = utils.findFiles(rootPath + '/assets', '_amd.json');
    var assets = {};

    if (assetFileList.length === 0) {
        logger.warn('No assets _amd.json files found.  Assets must be pushed to WCH  using wchtools before running analyze.');
    }

    wchAsset.loadAssets(assetFileList, duplicateAssets)
        .then(function(result) { // jshint ignore: line
            assets = result;
            logger.info ('LOADING ASSETS: Complete');

            logger.info ('LOADING TYPE NAMES: Started');
            var typeNames = {};
            if (fs.existsSync(rootPath + '/typeNames.json')) {
                typeNames = utils.loadJsonFile(rootPath + '/typeNames.json');
            }
            logger.info ('LOADING TYPE NAMES: Complete');

            var statMap = {};
            statMap.typeList = {};
            statMap.containsComponentReference = [];
            statMap.containsFile = [];
            statMap.containsHTML = [];
            statMap.containsImage = [];
            statMap.containsJSP = [];
            statMap.containsLink = [];
            statMap.containsRichText = [];
            statMap.containsOptionSelection = [];
            statMap.containsUserSelection = [];
            statMap.containsEmptyField = [];
            statMap.errors = [];

            logger.info ('ANALYZING TYPES: Started');
            var typeFileList = utils.findFiles(rootPath + '/types', '_tdx.json');
            analyzeFiles(typeFileList, assets, typeNames, statMap);
            logger.info ('ANALYZING TYPES: Complete');

            logger.info ('ANALYZING CONTENT: Started');
            var contentFileList = utils.findFiles(rootPath + '/content', '_cdx.json');
            analyzeFiles(contentFileList, assets, typeNames, statMap, portalBaseUrl, contentHandlerPath);
            logger.info ('ANALYZING CONTENT: Complete');

            logger.info('SAVING NAME MAPPINGS: Started');
            utils.saveJsonFile(typeNames, rootPath + '/typeNames.json');
            logger.info('SAVING NAME MAPPINGS: Complete');

            logger.info('-------------------------------------------------------------------------------');
            logger.info('List of Types and Content based on the type [' + Object.keys(statMap.typeList).length + ']');

            var typeElementList = {};
            for (var tfIndex = 0; tfIndex < typeFileList.length; tfIndex++) {
                var typeJson = utils.loadJsonFile(typeFileList[tfIndex]);
                var typeId = dxUtils.cleanId(typeJson.id);

                if (typeJson.elements !== undefined) {
                    typeElementList[typeId] = typeJson.elements;
                } else {
                    typeElementList[typeId] = [];
                }
            }

            var contentElementList = {};
            var contentNames = {};
            for (var cfIndex = 0; cfIndex < contentFileList.length; cfIndex++) {
                var contentJson = utils.loadJsonFile(contentFileList[cfIndex]);
                var contentId = dxUtils.cleanId(contentJson.id);

                var contentElements =  [];

                if (contentJson.content && contentJson.content.content && contentJson.content.content.elements && contentJson.content.content.elements.element) {
                    contentElements  = contentJson.content.content.elements.element;
                }

                contentElementList[contentId] = contentElements;
                contentNames[contentId] = contentJson.name;

            }

            var diffElementsMap = {};

            Object.keys(statMap.typeList).forEach(function(typeId) { // jshint ignore: line
                var contentList = statMap.typeList[typeId];
                var typeName = utils.findByVal(typeNames, typeId);
                logger.info('----------------------------------------------------------------------');
                logger.info('TYPE: ' + typeName + ' (' + typeId + ') [' + contentList.length + ']');

                for (var index = 0; index < contentList.length; index++) {

                    var contentId = contentList[index];
                    var contentName = contentNames[contentId];
                    var prefix = '[' + (parseInt(index) + 1) + '] ';
                    logger.info(prefix + contentName + ' (' + contentId + ')');

                    var typeElements = typeElementList[typeId];
                    var contentElements = contentElementList[contentId];

                    var diffElements = wchContent.diffElements(typeElements, contentElements);

                    var diffIndex;

                    if (diffElements.extra.length || diffElements.missing.length) {
                        diffElementsMap[contentId] = {};
                        diffElementsMap[contentId].name = contentName;
                        diffElementsMap[contentId].typeId = typeId;
                        if (diffElements.extra.length) {
                            diffElementsMap[contentId].extra = diffElements.extra;
                        }
                        if (diffElements.missing.length) {
                            diffElementsMap[contentId].missing = diffElements.missing;
                        }
                        for (diffIndex = 0; diffIndex < diffElements.extra.length; diffIndex++) {
                            logger.info(utils.indent(prefix.length) + '+ ' + diffElements.extra[diffIndex]);
                        }                    for (diffIndex = 0; diffIndex < diffElements.missing.length; diffIndex++) {
                            logger.info(utils.indent(prefix.length) + '- ' + diffElements.missing[diffIndex]);
                        }
                    }
                }

                utils.saveJsonFile(diffElementsMap, rootPath + '/diffElements.json');

            });

            printStatArray(statMap.containsComponentReference, 'Types with Component Reference');
            printStatArray(statMap.containsFile, 'Types with File');
            printStatArray(statMap.containsHTML, 'Types with HTML');
            printStatArray(statMap.containsImage, 'Types with Image');
            printStatArray(statMap.containsJSP, 'Types with JSP');
            printStatArray(statMap.containsLink, 'Types with Link');
            printStatArray(statMap.containsOptionSelection, 'Types with Option Selection');
            printStatArray(statMap.containsRichText, 'Types with Rich Text');
            printStatArray(statMap.containsUserSelection, 'Types with User Selection');
            printStatArray(statMap.errors, 'Warning messages', true);

            if (Object.keys(assets).length === 0) {
                logger.warn('No assets were loaded.  Make sure to use wchtools to push assets before running analyze.');
                logger.info('If this was unintentional, you should run deleteWCHJson and then push the assets again before running analyze.');
            }

            deferred.resolve('WCHCONVERT ANALYZE COMPLETED SUCCESSFULLY');
        }).fail(function(error){
        deferred.reject(error);
    });

    return deferred.promise;

}

module.exports.main = dxAnalyze;