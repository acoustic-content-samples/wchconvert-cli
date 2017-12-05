/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

var Q = require('q');
var wcmClient = require('../dx/wcm-rest-client');
var utils = require('../utils/common');
var dxUtils = require('../dx/dxUtils');
var TYPE = require('../utils/constants');
var workspace = require('../utils/workspace');

const logger = require('../utils/loggerWinston');

function dxextract(args) {  // jshint ignore:line
    var deferred = Q.defer();

    var settingsJSON = utils.loadSettings(args);

    if (settingsJSON === undefined) {
        deferred.reject(new Error('Could not find definition for connectionId ' + args.connectionId + ' in ' + args.settings));
        return deferred.promise;
    }

    if (settingsJSON.ROOT_WORKSPACE !== undefined) {
        workspace.setRootWorkspace(settingsJSON.ROOT_WORKSPACE);
    }

    var connectionId = settingsJSON.connectionId;
    var host = settingsJSON.host;
    var port = settingsJSON.port;
    var username = settingsJSON.wcmUsername;
    var password = settingsJSON.wcmPassword;
    var contentHandlerPath = settingsJSON.contentHandlerPath;
    var secure = settingsJSON.secure;
    var findFilterName = settingsJSON.filterName;
    var findFilterType = settingsJSON.filterType;
    var lastModified = settingsJSON.lastModified;
    var filterList;


    // standardize findFilterType to match the constants or set default value if not valid
    if (findFilterType === undefined || findFilterType === '') {
        logger.warn('FilterType not specified - will use default value: ' + TYPE.Library);
        findFilterType = TYPE.Library;
    } else if (findFilterType.toUpperCase().trim() === TYPE.Library.toUpperCase()){
        findFilterType = TYPE.Library;
    } else if (findFilterType.toUpperCase().trim() === TYPE.SiteArea.toUpperCase()){
        findFilterType = TYPE.SiteArea;
    } else if (findFilterType.toUpperCase().trim() === TYPE.Folder.toUpperCase()){
        findFilterType = TYPE.Folder;
    } else {
        logger.warn('FilterType is invalid - will use default value: ' + TYPE.Library);
        findFilterType = TYPE.Library;
    }

    logger.info('Connection settings: ' );
    logger.info('- connectionId: ' +  connectionId);
    logger.info('- host: ' +  host);
    logger.info('- port: ' +  port);
    logger.info('- username: ' +  username);
    logger.info('- password: ' +  '**********');
    logger.info('- contentHandlerPath: ' +  contentHandlerPath);
    logger.info('- secure: ' +  secure);
    logger.info('- filterName: ' +  findFilterName);
    logger.info('- filterType: ' +  findFilterType);
    logger.debug('- lastModified: ' +  lastModified);

    var libraryList;

    wcmClient.connect(host, port, username, password, contentHandlerPath, secure)
        .then(function() {
            workspace.create(connectionId);

            logger.info('RETRIEVING ' + TYPE.Library.toUpperCase() + ' LIST');
            return wcmClient.getFilterList(TYPE.Library);
        }).then(function(libraryListJson) {

            libraryList = dxUtils.genFilterList(libraryListJson);
        workspace.saveFilterList(connectionId, libraryList, TYPE.Library);

            if (findFilterType.toUpperCase() !== TYPE.Library.toUpperCase()) {
                logger.info('RETRIEVING ' + findFilterType.toUpperCase() + ' LIST');
                return wcmClient.getFilterList(findFilterType);
            } else {
                return libraryListJson;
            }
        }).then(function(filterListJson) {

            if (findFilterType.toUpperCase() === TYPE.Library.toUpperCase()) {
                filterList = libraryList;
            } else {

                var libraryMap = dxUtils.genLibraryMap(libraryList);

                filterList = dxUtils.genFilterList(filterListJson, libraryMap);
                workspace.saveFilterList(connectionId, filterList, findFilterType);
            }

            logger.info('DOWNLOADING CONTENT');
            return wcmClient.getFilterContent(filterList, connectionId, findFilterName, findFilterType, {types:[], assets:[], todos:{}});

        }).then(function(todoList) {
            logger.info('CONTENT DOWNLOAD COMPLETED');
            logger.info('CREATING CONTENT TEMPLATES LIST');
            return wcmClient.getFilterContentTemplates(filterList, connectionId, findFilterName, findFilterType, todoList);

        }).then(function(todoList) {
            logger.info('CONTENT TEMPLATES LIST CREATED');
            logger.info('CREATING ASSET IMAGES LIST');
            return wcmClient.getFilterImages(filterList, connectionId, findFilterName, findFilterType, todoList);

        }).then(function(todoList) {
            logger.info('ASSET IMAGES LIST CREATED');
            logger.info('CREATING ASSET FILES LIST');
            return wcmClient.getFilterFiles(filterList, connectionId, findFilterName, findFilterType, todoList);

        }).then(function(todoList) {

            logger.info('ASSET FILES LIST CREATED');

            logger.debug(typeof todoList.types);
            logger.debug('TypeList:' + todoList.types);
            logger.debug('TypeList length:' + todoList.types.length);

            logger.info('DOWNLOADING CONTENT TEMPLATES');
            return wcmClient.getContentTemplateList(connectionId, todoList, todoList.types.length - 1);
        }).then(function(todoList) {

            logger.info('CONTENT TEMPLATE DOWNLOAD COMPLETED');
            logger.info('DOWNLOADING ASSETS');

            return wcmClient.getAssetList(connectionId, todoList, todoList.assets.length - 1);
        }).then(function(todoList) {
            logger.info('ASSET DOWNLOAD COMPLETED');

            if (todoList.foundFilterMatch === undefined) {
                logger.warn('The specified filter name did not match any items of filter type. Please check the filterName and filterType settings if this was not intentional.');
                logger.warn('filterType: ' + findFilterType);
                logger.warn('filterName: ' + findFilterName);
            }
            deferred.resolve('WCHCONVERT PULL COMPLETED SUCCESSFULLY');
        }).fail(function(err) {
            deferred.reject(err);
        });


    return deferred.promise;
}


module.exports.main = dxextract;