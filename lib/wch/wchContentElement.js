/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 */

const logger = require('../utils/loggerWinston');  // jshint ignore: line
const MAX_TEXT_LENGTH = 10000;


function genElement(key, type, val1, val2, val3) {  // jshint ignore: line
	var result = {};
	
	if (type === 'category') {
		result = genCategoryElement(key, val1);
	}
	
	if (type === 'date') {
		result = genDateElement(key, val1, val2);
	}
	
	if (type === 'file') {
		result = genFileElement(key, val1);
	}
	
	if (type === 'image') {
		result = genImageElement(key, val1);
	}
	
	if (type === 'link') {
		result = genLinkElement(key, val1, val2, val3);
	}
	
	if (type === 'number') {
		result = genNumberElement(key, val1);
	}
	
	if (type === 'text') {
		result = genTextElement(key, val1);
	}
	
	if (type === 'toggle') {
		result = genToggleElement(key, val1);
	}
	
	if (type === 'video') {
		result = genVideoElement(key, val1);
	}
	
	return result;
}



function genCategoryElement(key, value) {
	var result = {};
	
	var properties = {};
	properties.elementType = 'category';
	properties.value = value;
	
	result[key] = properties;
	
	return result;
}

function genDateElement(key, value, isDateOnly) {
	var result = {};
	
	var properties = {};
	properties.elementType = 'datetime';
	
	if (value !== undefined && value !== '') {

		var d= new Date(value);

		properties.value = d.toISOString();
	}
	
	if (isDateOnly !== undefined && isDateOnly) {
		properties.elementType = 'date';
	}
	
	result[key] = properties;
	return result;
}


function genFileElement(key, assetInfo) {
	var result = {};

	var properties = {};
	properties.elementType = 'file';

	var asset = {};
	if (assetInfo !== undefined) {
		asset.id = assetInfo.id;
		asset.fileName = assetInfo.fileName;
		asset.fileSize = assetInfo.fileSize;
		asset.mediaType = assetInfo.mediaType;

		properties.asset = asset;

	}

	result[key] = properties;
	
	return result;
}

function genImageElement(key, assetInfo) {
	var result = {};

	var properties = {};
	properties.elementType = 'image';

	
	var asset = {};
	if (assetInfo !== undefined) {
		asset.id = assetInfo.id;
		asset.fileName = assetInfo.fileName;
		asset.fileSize = assetInfo.fileSize;
		asset.mediaType = assetInfo.mediaType;
		asset.resourceUri = assetInfo.resourceUri;
		
		properties.asset = asset;

		properties.renditions = {};
		properties.renditions.default = {};
		properties.renditions.default.renditionId = assetInfo.renditions.default.id;
		properties.renditions.default.source = assetInfo.renditions.default.source;
		
	}
	
	result[key] = properties;
	
	return result;
}


function genLinkElement(key, linkURL, linkText, linkDescription) {
	var result = {};
	
	var properties = {};
	properties.elementType = 'link';
	
	if (linkURL !== undefined && linkURL) {
		properties.linkURL = linkURL;
	}
	
	if (linkText !== undefined && linkText) {
		properties.linkText = linkText;
	}

	if (linkDescription !== undefined && linkDescription) {
		properties.linkDescription = linkDescription;
	}


	
	result[key] = properties;
	
	return result;
}


function genNumberElement(key, value) {
	var result = {};
	
	var properties = {};
	properties.elementType = 'number';
	properties.value = value;
	
	result[key] = properties;
	
	return result;
}

function genTextElement(key, value) {
	var result = {};
	
	var properties = {};
	properties.elementType = 'text';

    if (value.length > MAX_TEXT_LENGTH) {
        logger.warn('Text Value is too long and will be truncated: ' + key + ', length: ' + value.length);
        value = value.substring(0, MAX_TEXT_LENGTH);
    }
    properties.value = value;

	result[key] = properties;
	
	return result;
}

function genToggleElement(key, value) {
	var result = {};
	
	var properties = {};
	properties.elementType = 'toggle';
	properties.value = value;
	
	result[key] = properties;
	
	return result;
}


function genVideoElement(key, assetId) {
	var result = {};
	
	var properties = {};
	properties.elementType = 'video';
	properties.assetId = assetId;
	
	result[key] = properties;
	
	return result;
}

module.exports.genElement = genElement;

