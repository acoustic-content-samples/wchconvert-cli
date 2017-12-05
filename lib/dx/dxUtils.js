/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 */

const logger = require('../utils/loggerWinston');
var TYPE = require('../utils/constants');


function cleanId (id) {
	// remove wcmrest: prefix from ids
	if (id.indexOf(':') > -1) {
		id = id.substring(id.indexOf(':')+1);
	}
	
	return id;
	
}

function getStringValue(fieldJson) {
	var result = '';
	if (fieldJson!== undefined) {
		if (typeof fieldJson === 'string') {
			result = fieldJson;
		} else if (fieldJson.value !== undefined && typeof fieldJson.value === 'string') {
			result = fieldJson.value.trim();
		}
	}
	
	return result;
}

function getResourceUriValue(fieldJson, type) {
	var result = '';
	
	if (fieldJson!== undefined) {
		if (type.toUpperCase() === 'libraryImageComponent'.toUpperCase()) {
			if (fieldJson.image.resourceUri !== undefined) {
				result = fieldJson.image.resourceUri.value;
			}
		} else {
			if (fieldJson.resourceUri !== undefined) {
				result = fieldJson.resourceUri.value;
			}
		}
	}

	return result;
}



function getLocaleValue(fieldJson) {
	var result = 'en';
	if (fieldJson!== undefined) {
		if (typeof fieldJson !== 'string' && fieldJson.lang !== undefined && typeof fieldJson.lang === 'string') {
			result = fieldJson.lang;
		} else {
			logger.warn('Could not determine locale - setting to \'en\'.');
			logger.debug(fieldJson);
		}
	}
	
	return result;
}


function getNameValue(fieldJson) {
	var result = '';
	if (fieldJson!== undefined) {
		if (typeof fieldJson === 'string') {
			result = fieldJson;
		} else if (fieldJson.distinguishedName !== undefined && typeof fieldJson.distinguishedName === 'string') {
			result = fieldJson.distinguishedName;
		}
	}
	
	return result;
}

function getTypeIdValue(fieldJson) {
	var result = '';

	for (var i = 0; i < fieldJson.length; i++) {
		if (fieldJson[i].rel === 'content-template') {
			var contentTemplateUrl = fieldJson[i].href; 
			var parts = contentTemplateUrl.split('/');
			result = parts[parts.length-1];
		}
	}
	
	return result;
}

function getLibraryIdValue(fieldJson) {
    var result = '';

    for (var i = 0; i < fieldJson.length; i++) {
        if (fieldJson[i].rel === 'library') {
            var contentTemplateUrl = fieldJson[i].href;
            var parts = contentTemplateUrl.split('/');
            result = parts[parts.length-1];
        }
    }

    return result;
}

function getDateValue(fieldJson) {
	var result = '';
	
	if (fieldJson !== undefined && typeof fieldJson === 'string' && fieldJson) {

		try {
            var date = new Date(fieldJson);
            result = date.toISOString();
        } catch (err) {
			logger.warn('Could not parse date value: ' + fieldJson);
		}
	}
	

	return result;
}

function getStatusValue(fieldJson) {
	var result = 'draft';
	
	if (fieldJson !== undefined && fieldJson[0] !== undefined && fieldJson[0].term !== undefined) {
		 if (fieldJson[0].term.toUpperCase() === 'PUBLISHED') {
             //result = 'ready';
             result = 'draft';
		}
	}

	return result;
}


function getDxAssetId(uri) {
	
	var assetId = '';
	
	if (typeof uri === 'object') {
		uri = JSON.stringify(uri);
	}
	
	logger.debug('URI: ' + uri);
	
	if (uri !== undefined) {
		
		var parts = uri.split('/');
		assetId = parts[parts.length-2];
		
	}
	
	return assetId;
}


function fixElementKey(key) {
	key = key.substring(0,50);  // max key length is 50 characters
    key = key.replace(/\ /g, '_');   // replace all spaces in key names as that is invalid for WCH
    key = key.replace(/\$/g, '_');   // replace all dollar signs in key names as that is invalid for WCH
    key = key.replace(/\!/g, '_');   // replace all exclamation points in key names as that is invalid for WCH
    key = key.replace(/\(/g, '_');   // replace all left paren in key names as that is invalid for WCH
    key = key.replace(/\)/g, '_');   // replace all right paren in key names as that is invalid for WCH
    key = key.replace(/\-/g, '_');   // replace all hyphen in key names as that is invalid for WCH
    key = key.replace(/\./g, '_');   // replace all periods in key names as that is invalid for WCH
	return key;
}

function genUniqueName(name, id, typeNames) {

	var result = name + ' ' + Math.floor(Math.random() * (9999 - 1000) + 1000);
	
	if (isUniqueName(result, typeNames)) {
		// add the new name to the name list
		typeNames[result] = id;
		 
	} else {
		// try to get another new unique name
		
		result = genUniqueName(name, id, typeNames);
	}
	
	// return the new name;
	return result ;
}
	

function isUniqueName(name, typeNames) {
	
	var isUnique = false;
	
	if (typeNames[name] === undefined) {
		isUnique = true;
	} 
	
	return isUnique;
	
}

function genFilterList(filterJson, libraryMap) {
    var filters = [];
    for (var i = 0; i < filterJson.length; i++) {
        var filterId = cleanId(filterJson[i].id);
		var type = filterJson[i].type;

        var filterName = '';

        if (filterJson[i].title !== undefined) {
            filterName = getStringValue(filterJson[i].title).toUpperCase();
        } else {
            filterName = filterId;
        }

        var entry = {};
        entry.id = filterId;
        entry.name = filterName;
        if (type.toUpperCase() !== TYPE.Library.toUpperCase()) {
            var libraryId = getLibraryIdValue(filterJson[i].link);

        	if (libraryMap !== undefined && libraryMap[libraryId] !== undefined) {
        		entry.libraryName = libraryMap[libraryId];
			}
            entry.libraryId = libraryId;
        }

        filters.push(entry);

    }
    return filters;
}

function genLibraryMap(libraryList) {
	var result = {};

	for (var i = 0; i < libraryList.length; i++) {
		result[libraryList[i].id] = libraryList[i].name;
	}

	return result;
}

module.exports = {
    cleanId: cleanId,
    getStringValue: getStringValue,
    getLocaleValue: getLocaleValue,
    getNameValue: getNameValue,
    getTypeIdValue: getTypeIdValue,
    getLibraryIdValue: getLibraryIdValue,
    getDateValue: getDateValue,
    getStatusValue: getStatusValue,
    getResourceUriValue: getResourceUriValue,
    getDxAssetId: getDxAssetId,
    genUniqueName: genUniqueName,
    isUniqueName: isUniqueName,
    fixElementKey: fixElementKey,
    genFilterList: genFilterList,
    genLibraryMap: genLibraryMap
};