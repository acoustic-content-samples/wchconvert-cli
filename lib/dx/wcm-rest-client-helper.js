/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

var authRequest = require('../dx/wcm-authenticated-request');
var utils = require('../utils/common');
var PAGE_SIZE = require('../utils/constants').PAGE_SIZE;
var TYPE = require('../utils/constants');

var Q = require('q');
var dxUtils = require('../dx/dxUtils');

const logger = require('../utils/loggerWinston');

//URI VARIABLES
var uriQuery = '/wcmrest/query?';
var uriGetItem = '/wcmrest/item/'; // jshint ignore:line
var uriGetContent = '/wcmrest/content/';
var uriGetContentTemplate = '/wcmrest/contenttemplate/';
var uriContentTemplateElements = '/Prototype/elements';
var uriGetImage = '/wcmrest/libraryimagecomponent/'; // jshint ignore:line
var uriGetFile = '/wcmrest/libraryfilecomponent/'; // jshint ignore:line
var uriWcmrest = '/wcmrest/';
var getDescendants = '&depth=DESCENDANTS';



function connect(host, port, username, password, contentHandlerPath, secure) {
    return authRequest.init(host, port, username, password, contentHandlerPath, secure);
}

function query(type, page, filterId, filterType) {
    var uri = uriQuery + 'type=' + type + '&pagesize=' + PAGE_SIZE;

    if (filterId !== undefined) {

        if (filterType === TYPE.SiteArea) {
            uri += '&parentId=' + filterId + getDescendants;

        } else if (filterType === TYPE.Folder) {
            uri += '&parentId=' + filterId + getDescendants;

        } else {
            uri += '&libraryid=' + filterId;
        }
        uri += '&state=PUBLISHED';
    }

    if (page !== undefined) {
        uri += '&page=' + page;
    }


    return authRequest.getJson(uri);
}

function getFilterList(filterType) {
    var deferred = Q.defer();

    if (filterType === undefined) {
        filterType= TYPE.Library;
    }
    query(filterType)
        .then(function(filterJsonString) {

            logger.debug(filterJsonString);
            var filterJson = utils.safeJSONParse(filterJsonString);


            deferred.resolve(dxUtils.genFilterList(filterJson.feed.entry));
        })
        .fail(function(error) {

            deferred.reject(error);
        });


    return deferred.promise;
}

function getContent(id) {
    return authRequest.getJson(uriGetContent + id);
}

function getContentTemplate(id) {
    return authRequest.getJson(uriGetContentTemplate + id);
}

function getContentTemplateElements(id) {
    return authRequest.getJson(uriGetContentTemplate + id + uriContentTemplateElements);
}

function getAssetJson(type,id) {
    return authRequest.getJson(uriWcmrest + type + '/' + id);
}

function getAssetFile(assetUri,filename) {
    return authRequest.getFile(assetUri, filename);
}




module.exports = {
    connect: connect,
    query: query,
    getFilterList: getFilterList,
    getContent: getContent,
    getContentTemplate: getContentTemplate,
    getContentTemplateElements: getContentTemplateElements,
    getAssetJson: getAssetJson,
    getAssetFile: getAssetFile

};