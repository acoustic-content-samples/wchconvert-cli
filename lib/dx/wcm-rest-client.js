/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

var wcmClient = require('./wcm-rest-client-helper');
var dxUtils = require('../dx/dxUtils');
var utils = require('../utils/common');
var TYPE = require('../utils/constants');
var workspace = require('../utils/workspace');
var PAGE_SIZE = require('../utils/constants').PAGE_SIZE;

var Q = require('q');

const logger = require('../utils/loggerWinston');

function getFilterList(filterType, page, filterList) {
    var deferred = Q.defer();

    var filterJson;

    if (page === undefined) {
        page = 1;
    }

    if (filterList === undefined) {
        filterList = [];
    }

    wcmClient.query(filterType, page)
        .then(function(result) {
            logger.debug('RESULT:\n' + result);
            filterJson = utils.safeJSONParse(result).feed.entry;


            logger.debug(filterJson);

            if (undefined !== filterJson ) {

                logger.debug('temp query length: ' + filterJson.length);
                filterList = filterList.concat(filterJson);
                if (filterJson.length < PAGE_SIZE) {
                    logger.info('NUM ' + filterType.toUpperCase() + ': ' + filterList.length);
                    deferred.resolve(filterList);

                } else {
                    deferred.resolve(getFilterList(filterType, page +1, filterList));
                }

            } else {
                logger.error('NUM ' + filterType.toUpperCase() + ': UNDEFINED');
                deferred.reject(new Error('Could not retrieve list of ' + filterType));
            }
        })
        .fail(function(error) {

            logger.error(error.message);
            deferred.reject(error);

        });

    return deferred.promise;
}


function getContentJson(id, title, dxPath, i) {
    var deferred = Q.defer();

    var contentJson = utils.loadJsonFile(dxPath);

    if (contentJson !== undefined) {

        logger.info('Content already downloaded [' + i + ']: ' + title + ' [' + id + ']: '+ dxPath);
        deferred.resolve(contentJson);

    } else {
        logger.info('Downloading content [' + i + ']: ' + title + ' [' + id + ']');
        wcmClient.getContent(id)
            .then(function(contentString) {

                contentJson = utils.safeJSONParse(contentString);

                deferred.resolve(contentJson.entry);
            })
            .fail(function(err) {
                logger.info('ERROR: ' + err);
                logger.info(err.stack);
                deferred.reject(err);
            });

    }

    return deferred.promise;
}

function getContentTemplateJson(id, dxPath, i) {
    var deferred = Q.defer();

    var contentTemplatJson = utils.loadJsonFile(dxPath);

    if (contentTemplatJson !== undefined) {

        logger.info('Type already downloaded [' + i + ']: ' + dxPath);
        deferred.resolve(contentTemplatJson);

    } else {
        logger.info('Downloading type [' + i + ']: ' + id);
        wcmClient.getContentTemplate(id)
            .then(function(contentTemplateString) {
                var contentTemplateJson = utils.safeJSONParse(contentTemplateString);
                wcmClient.getContentTemplateElements(id)
                    .then(function(elementsString) {
                        var elementsJson = utils.safeJSONParse(elementsString);
                        contentTemplateJson.entry.elements = elementsJson.feed.entry;
                    })
                    .then(function() {
                        deferred.resolve(contentTemplateJson.entry);
                    })
                    .fail(function(err) {
                        logger.info('ERROR: ' + err);
                        logger.info(err.stack);
                        deferred.reject(err);
                    });
            })
            .fail(function(err) {
                logger.info('ERROR: ' + err);
                logger.info(err.stack);
                deferred.reject(err);
            });
    }
    return deferred.promise;

}

function getFilterContent(filterList, connectionId, findFilterName, findFilterType, todoList) {
    return getFilterItems(filterList, connectionId, findFilterName, findFilterType, TYPE.Content, filterList.length - 1, 1, todoList);
}

function getFilterContentTemplates(filterList, connectionId, findFilterName, findFilterType, todoList) {
    return getFilterItems(filterList, connectionId, findFilterName, findFilterType, TYPE.ContentTemplate, filterList.length - 1, 1, todoList);
}

function getFilterImages(filterList, connectionId, findFilterName, findFilterType, todoList) {
    return getFilterItems(filterList, connectionId, findFilterName, findFilterType, TYPE.Image, filterList.length - 1, 1, todoList);
}

function getFilterFiles(filterList, connectionId, findFilterName, findFilterType, todoList) {
    return getFilterItems(filterList, connectionId, findFilterName, findFilterType, TYPE.File, filterList.length - 1, 1, todoList);
}

function getFilterPages(filterList, connectionId, findFilterName, findFilterType, todoList) {
    return getFilterItems(filterList, connectionId, findFilterName, findFilterType, TYPE.Page, filterList.length - 1, 1, todoList);
}


function getFilterItems(filterList, connectionId, findFilterName, findFilterType, type, filterIndex, page, todoList) {  // jshint ignore: line
    var deferred = Q.defer();

    var currentFilterIndex = filterIndex;
    var currentPage = page;

    logger.debug('running getFilterItems ' + currentFilterIndex + ':' + currentPage + ' - ' + type + ', index: ' + filterIndex);

    if (filterIndex >= 0) {

        var findFilterNameArray;

        if (findFilterName.indexOf(',') > 0) {
            findFilterNameArray = findFilterName.split(',');
        }

        var filterName = filterList[filterIndex].name;
        var filterId = filterList[filterIndex].id;

        var systemLibraries = ['BLOG SOLO TEMPLATE V70',
            'BLOG TEMPLATE V70',
            'SITE BUILDER TEMPLATE LIBRARY',
            'SOCIAL LISTS 1.0',
            'TEMPLATE PAGE CONTENT 3.0',
            'WEB CONTENT TEMPLATES 3.0',
            'WEB RESOURCES V70',
            'BLOG RESOURCES',
            'BLOG SOLO TEMPLATE',
            'BLOG TEMPLATE',
            'SOCIAL LISTS 1.1',
            'WIKI RESOURCES',
            'WIKI TEMPLATE',
            'WIKI TEMPLATE V70',
            'SCRIPT APPLICATION LIBRARY'
        ];

        var isSystemLibrary;
        if (findFilterType === TYPE.Library) {
            isSystemLibrary = utils.listContainsObject(filterName,systemLibraries);
        } else {
            var libraryName = filterList[filterIndex].libraryName;
            isSystemLibrary = utils.listContainsObject(libraryName,systemLibraries);
        }

        var isFilterNotSpecified = (findFilterName === undefined || findFilterName === '');
        var isFilterNameMatch, isFilterIdMatch;

        if (findFilterNameArray === undefined) {
            isFilterNameMatch =  findFilterName.toUpperCase() === filterName.toUpperCase();
            isFilterIdMatch = findFilterName.toUpperCase() === filterId.toUpperCase();
        } else {
            isFilterNameMatch = false;
            isFilterIdMatch = false;


            for (var i = 0; i < findFilterNameArray.length; i++) {
                var findValue = findFilterNameArray[i].trim().toUpperCase();

                if (findValue === filterName.toUpperCase()) {
                    isFilterNameMatch = true;

                } else if (findValue === filterId.toUpperCase()) {
                    isFilterIdMatch = true;
                }
            }
        }

        if ((isFilterNotSpecified || isFilterNameMatch || isFilterIdMatch) && !isSystemLibrary) {

            todoList.foundFilterMatch = true;

            logger.info('Querying list of ' + type  + ' from ' + findFilterType + ' [' + filterIndex + '] ' + filterName + ' [' + filterId + '] - Page: ' + page);

            wcmClient.query(type, page, filterId, findFilterType)
                .then(function(result) {

                    logger.debug('RESULT LIBRARY[' + filterId + ']:\n' + result);

                    return utils.safeJSONParse(result).feed.entry;

                })
                .then(function(dxListJson){  // jshint ignore: line

                    if (dxListJson !== undefined && dxListJson.length > 0) {
                        //download all of the content and add their type references and image/file references to the todo list
                        logger.info('PAGE SIZE [' + page + ']: ' + dxListJson.length);

                        if (type === TYPE.Content) {
                            dxListJson =  getContentByPage(dxListJson, connectionId, dxListJson.length -1, todoList);

                        } else if (type === TYPE.ContentTemplate) {
                            // add all of the type ids in dxListJson to the todoList
                            for (var index =0; index < dxListJson.length; index++) {
                                var typeId = dxUtils.cleanId(dxListJson[index].id);

                                // check the type id and add it to the list of types
                                if (typeId !== '') {
                                    logger.debug('Found type: ' + typeId);

                                    var isFound = false;
                                    for (var c =0; c < todoList.types.length; c++) {  //jshint ignore: line
                                        if (typeId === todoList.types[c]) {
                                            isFound = true;
                                            logger.debug('already added: ' + typeId);
                                        }
                                    }

                                    if (!isFound) { //jshint ignore: line
                                        logger.info('Adding type to download list: ' + typeId);
                                        todoList.types.push(typeId);
                                    }
                                }
                            }

                        } else if (type === TYPE.Image) {

                            // add all of the resourceUri to the todoList['assets']
                            dxListJson =  getAssetJsonByPage(dxListJson, connectionId, filterId, dxListJson.length -1, todoList);

                        } else if (type === TYPE.File) {
                            // add all of the resourceUri to the todoList['assets']
                            dxListJson =  getAssetJsonByPage(dxListJson, connectionId, filterId, dxListJson.length -1, todoList);

                        }

                    } else {
                        logger.info('No result of type ' + type + ' in page ' + page);
                    }

                    return dxListJson;
                })
                .then(function(dxListJson) {

                    if (dxListJson !== undefined && dxListJson.length === PAGE_SIZE)  {
                        page++;
                    } else {
                        // all pages have been downloaded so move on to the next filter and start with content
                        type = TYPE.Content;
                        filterIndex = filterIndex -1;
                        page = 1;
                    }

                    deferred.resolve(getFilterItems(filterList,  connectionId, findFilterName, findFilterType, type, filterIndex, page, todoList));

                })
                .fail(function(err) {
//                logger.error(err.message);
//                logger.error(err.stack);
                    deferred.reject(err);
                });

        } else {

            logger.info('Skipping ' + findFilterType + ' ' + filterName + ' [' + filterId + ']');
            filterIndex = filterIndex -1;
            page = 1;
            deferred.resolve(getFilterItems(filterList,  connectionId, findFilterName, findFilterType, type, filterIndex, page, todoList));
        }

    } else {
        deferred.resolve(todoList);
    }

    logger.debug('completed getFilterItems ' + currentFilterIndex + ':' + currentPage + ' - ' + type);

    return deferred.promise;
}


function getContentByPage(dxListJson, connectionId, i, todoList) {
    var deferred = Q.defer();

    if (i >= 0) {

        var id = dxUtils.cleanId(dxListJson[i].id);
        var title = dxUtils.getStringValue(dxListJson[i].title);
        var libraryId = dxUtils.getLibraryIdValue(dxListJson[i].link);

        logger.debug('Processing content [' + i + ']: ' + title + ' ['+ id + ']');

        workspace.createContentLibraryPath(connectionId, libraryId);
        var dxPath = workspace.genContentPath(connectionId, libraryId, id);

        logger.debug('PATH[' + i + ']: ' + dxPath);

        getContentJson(id, title, dxPath, i)

            .then(function(contentJson) { //jshint ignore: line

                utils.saveJsonFile(contentJson, dxPath, false);

                logger.debug('Title: ' + contentJson.title.value);

                var typeId = dxUtils.getTypeIdValue(contentJson.link);

                // check the type id and add it to the list of types
                if (typeId !== '') {
                    logger.debug('Type ID: ' + typeId);

                    var isFound = false;
                    for (var i =0; i < todoList.types.length; i++) {
                        if (typeId === todoList.types[i]) {
                            isFound = true;
                        }
                    }

                    if (!isFound) {
                        todoList.types.push(typeId);
                    }

                } else {
                    logger.error('typeid not found for ' + id);
                }
                // check the elements and make list of images and files that will need to be downloaded

                var elements = contentJson.content.content.elements.element;

                if (elements === undefined) {
                    elements = [];
                }

                for (var index = 0; index < elements.length; index++) {

                    var element = elements[index];

                    var type = element.type;

                    if (type === TYPE.FileElement) {


                        if (element.data.resourceUri !== undefined && element.data.resourceUri.value !== undefined) {
                            // download the file
                            logger.debug('File resourceUri:' + element.data.resourceUri.value);
                            todoList.assets.push(element.data.resourceUri.value);

                        } else {
                            logger.debug('Content contains file reference without a resourceUri: ' + id);
                        }

                    }


                    if (type === TYPE.ImageElement) {

                        if (element.data.image.resourceUri !== undefined && element.data.image.resourceUri.value !== undefined) {
                            // download the image
                            logger.debug('image resourceUri:' + element.data.image.resourceUri.value);

                            todoList.assets.push(element.data.image.resourceUri.value);

                        } else {
                            logger.debug('Content contains image reference without a resourceUri: ' + id);
                        }
                    }

                }
            })
            .then(function() {

                deferred.resolve(getContentByPage(dxListJson, connectionId, i-1, todoList));

            })
            .fail(function(err) {
                logger.debug('ERROR: ' + err.message);
                logger.debug('ERROR: ' + err.stack);
                deferred.reject(err);
            });

    } else {

        logger.debug('completed getContentByPage recursion - length: ' + dxListJson.length);
        deferred.resolve(dxListJson);
    }

    return deferred.promise;
}


function getAssetJsonByPage(dxListJson, connectionId, filterId, i, todoList) { //jshint ignore: line
    var deferred = Q.defer();

    if (i >= 0) {

        var id = dxUtils.cleanId(dxListJson[i].id);
        var title = dxUtils.getStringValue(dxListJson[i].title);
        var type = dxListJson[i].type;

        var assetJsonPath = workspace.genAssetJsonPath(connectionId, id);

        if (utils.exists(assetJsonPath)) {

            logger.info('Asset json already downloaded: ' + assetJsonPath);

            var dxJson = utils.loadJsonFile(assetJsonPath);
            var assetUri = dxUtils.getResourceUriValue(dxJson.content, type);

            logger.debug('Found asset: ' + assetUri);

            var isFound = false;
            for (var c =0; c < todoList.assets.length; c++) {
                if (assetUri === todoList.assets[c]) {
                    isFound = true;
                    logger.debug('already added: ' + assetUri);
                }
            }

            if (assetUri === '') {
                logger.warn('Asset has no file associated: ' + id);

            } else if (!isFound) {
                logger.info('Adding asset to download list: ' + assetUri);
                todoList.assets.push(assetUri);
            }

            deferred.resolve(getAssetJsonByPage(dxListJson, connectionId, filterId, i-1, todoList));

        } else {


            logger.info('Downloading asset json [' + i + ']: ' + title + '(' + id + ')');

            wcmClient.getAssetJson(dxListJson[i].type, id)
                .then(function(assetString) {
                    var dxJson = utils.safeJSONParse(assetString).entry;

                    var assetUri = dxUtils.getResourceUriValue(dxJson.content, type);

                    logger.debug('Found asset: ' + assetUri);
                    utils.saveJsonFile(dxJson, assetJsonPath);

                    var isFound = false;
                    for (var c =0; c < todoList.assets.length; c++) {
                        if (assetUri === todoList.assets[c]) {
                            isFound = true;
                            logger.debug('already added: ' + assetUri);
                        }
                    }

                    if (assetUri === '') {
                        logger.warn('Asset has no file associated: ' + id);

                    } else if (!isFound) {
                        logger.info('Adding asset: ' + assetUri);
                        todoList.assets.push(assetUri);
                    }

                })
                .then(function() {
                    deferred.resolve(getAssetJsonByPage(dxListJson, connectionId, filterId, i-1, todoList));
                })
                .fail(function(err) {
                    logger.debug('ERROR: ' + err.message);
                    logger.debug('ERROR: ' + err.stack);
                    deferred.reject(err);
                });
        }



    } else {

        logger.debug('completed getAssetJsonByPage recursion - length: ' + dxListJson.length);
        deferred.resolve(dxListJson);
    }

    return deferred.promise;
}



function getContentTemplateList(connectionId, todoList, i) {
    var deferred = Q.defer();

    if (i >= 0) {

        var id = todoList.types[i];

        var path = workspace.genContentTemplatePath(connectionId, id);

        logger.debug('Processing type [' + i + ']: ' + id);

        getContentTemplateJson(id, path, i)
            .then(function(contentTemplateJson) {

                if (!utils.exists(path)) {
                    utils.saveJsonFile(contentTemplateJson, path);
                }

                deferred.resolve(getContentTemplateList(connectionId, todoList, i -1));

            })
            .fail(function(err) {
                logger.info('ERROR: ' + err);
                logger.info(err.stack);
                deferred.reject(err);
            });

    } else {
        deferred.resolve(todoList);
    }


    return deferred.promise;
}


function getAssetList(connectionId, todoList, i) {
    var deferred = Q.defer();

    if (i >= 0) {

        var asset = todoList.assets[i];

        var filename = workspace.getAssetPath(asset, connectionId);

        if (utils.exists(filename)) {

            logger.info('Asset already downloaded [' + i + ']: ' + filename);
            Q.fcall(function(){}).then(function(){
                deferred.resolve(getAssetList(connectionId, todoList, i-1));
            });

        } else {
            logger.info('Downloading asset [' + i + ']: ' + filename);
            wcmClient.getAssetFile(asset, filename)
                .then(function() {
                    logger.info('Downloaded asset [' + i + ']: ' + filename);
                })
                .then(function() {
                    deferred.resolve(getAssetList(connectionId, todoList, i-1));
                })
                .fail(function(err) {
                    logger.info('ERROR: ' + err);
                    logger.info(err.stack);
                    deferred.reject(err);

                });

        }


    } else {
        deferred.resolve(todoList);
    }
    return deferred.promise;
}

function connect(host, port, username, password, contentHandlerPath, secure) {
    return wcmClient.connect(host, port, username, password, contentHandlerPath, secure);
}

module.exports = {
    connect: connect,
    getFilterList: getFilterList,
    getFilterContent: getFilterContent,
    getFilterContentTemplates: getFilterContentTemplates,
    getFilterImages: getFilterImages,
    getFilterFiles: getFilterFiles,
    getFilterPages: getFilterPages,
    getContentJson: getContentJson,
    getContentTemplateList: getContentTemplateList,
    getAssetList: getAssetList

};