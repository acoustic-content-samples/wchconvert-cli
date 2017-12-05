/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

var utils = require('./common');
var TYPE = require('./constants');
var dxUtils = require('../dx/dxUtils');


const logger = require('./loggerWinston');  // jshint ignore: line


// PATH VARIABLES:
//path structure is ./<connection-id>/content/<library-id>/<content-id>_cdx.json
//                  ./<connection-id>/types/<type-id>_tdx.json

var ROOT_WORKSPACE = '.';
var contentPath = 'content';
var contentTemplatePath = 'types';
var assetPath = 'assets/dxdam/wcm';
var dxAssetJsonPath = 'dxAssetJson';


function setRootWorkspace(path) {
    ROOT_WORKSPACE = path;
}

function create(connectionId) {
    utils.createPath(ROOT_WORKSPACE + '/' + connectionId + '/' + contentPath);
    utils.createPath(ROOT_WORKSPACE + '/' + connectionId + '/' + contentTemplatePath);
    utils.createPath(ROOT_WORKSPACE + '/' + connectionId + '/' + assetPath);
    utils.createPath(ROOT_WORKSPACE + '/' + connectionId + '/' + dxAssetJsonPath);
}

function saveFilterList(connectionId, filterList, filterType) {

    var fileName = 'libraryNames.json';

    if (filterType === TYPE.SiteArea) {
        fileName = 'siteAreaNames.json';
    } else if (filterType === TYPE.Folder) {
        fileName = 'folderNames.json';
    }

    logger.info('Saving ' + ROOT_WORKSPACE + '/' + connectionId + '/' + fileName);


    utils.saveJsonFile(filterList, ROOT_WORKSPACE + '/' + connectionId + '/' + fileName);
}

function createContentLibraryPath(connectionId, libraryId) {
    utils.createPath(ROOT_WORKSPACE + '/' + connectionId + '/' + contentPath + '/' + libraryId);
}

function genContentPath(connectionId, libraryId, id) {
    // ./ROOT_WORKSPACE/<connection-id>/content/<library-id>/<content-id>_cdx.json
    return ROOT_WORKSPACE + '/' + connectionId + '/' + contentPath + '/' + libraryId + '/' + id + '_cdx.json';
}


function genContentTemplatePath(connectionId, id) {
    //                  ./ROOT_WORKSPACE/<connection-id>/types/<type-id>_tdx.json
    return ROOT_WORKSPACE + '/' + connectionId + '/' + contentTemplatePath + '/' + id + '_tdx.json';
}


function genAssetJsonPath(connectionId, id) {
    //                  ./ROOT_WORKSPACE/<connection-id>/dxAssetJson/<dxasset-id>_adx.json
    return ROOT_WORKSPACE + '/' + connectionId + '/' + dxAssetJsonPath + '/' + id + '_adx.json';
}

function findMissingAssets(connectionId) {
   return utils.findEmptyFolders(ROOT_WORKSPACE + '/' + connectionId + '/' + assetPath);
}

function getAssetPath(uri, connectionId) {

    var start = uri.lastIndexOf('/') + 1;
    var end = uri.length;

    if (uri.indexOf('?') > start) {
        end = uri.indexOf('?');
    }

    var filename = uri.substring(start,end);

    var dxAssetId = dxUtils.getDxAssetId(uri);

    utils.createPath(ROOT_WORKSPACE + '/' + connectionId + '/assets/dxdam/wcm/' + dxAssetId);

    return ROOT_WORKSPACE + '/' + connectionId + '/assets/dxdam/wcm/' + dxAssetId + '/' + filename;
}


module.exports = {
    setRootWorkspace: setRootWorkspace,
    create: create,
    saveFilterList: saveFilterList,
    genContentPath: genContentPath,
    genContentTemplatePath: genContentTemplatePath,
    genAssetJsonPath: genAssetJsonPath,
    findMissingAssets: findMissingAssets,
    createContentLibraryPath: createContentLibraryPath,
    getAssetPath: getAssetPath

};


