/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 */

var dxUtils = require('../dx/dxUtils'),
	 wchContentElement = require('./wchContentElement'),
	 wchAsset = require('./wchAsset'),
     validUrl = require('valid-url');


const logger = require('../utils/loggerWinston');

function genContent(id, name, typeId) {
	
	var result = {}; 
	result.id = id;
	result.name = name;
	result.classification = 'content';
	result.typeId = typeId;
	result.status = 'draft';
	result.creator = 'authorABC';
	result.created = new Date();
	result.lastModifier = 'authorABC';
	result.lastModified =  new Date();
	result.locale =  'en';
	result.rev = '';
	result.tags = [];
	result.elements = {};
	return result;
}

function setId(content, id) {
	content.id = id;
	
	return content;
}

function setName(content, name) {
	content.name = name;
	
	return content;
}

function setTypeId(content, typeId) {
	content.typeId = typeId;
	
	return content;
}

function setStatus(content, status) {
	content.status = status;
	
	return content;
}

function setCreator(content, creator) {
	content.creator = creator;
	
	return content;
}

function setCreated(content, created) {
	
	if (typeof created === 'string') {
		content.created = created;
	}
	
	if (created instanceof Date) {
		content.created = created.toISOString();
	}
	
	
	return content;
}

function setLastModifier(content, lastModifier) {
	content.lastModifier = lastModifier;
	
	return content;
}

function setDescription(content, description) {
	
	// MAX field length is 500 characters
	description = description.substring(0,500);
	
	content.description = description;
	
	return content;
}

function setLastModified(content, lastModified) {
	if (typeof lastModified === 'string') {
		content.lastModified = lastModified;
	}

	if (lastModified instanceof Date) {
		content.lastModified = lastModified.toISOString();
	}
	
	return content;
}

function setLocale(content, locale) {
	content.locale = locale;
	
	return content;
}

function setRev(content, rev) {
	content.rev = rev;
	
	return content;
}

function setElements(content, elements) {
	content.elements = elements;
	
	return content;
}

function setTags(content, tags) {
	content.tags  = tags;
}


function convert(sourceJson, assets, portalBaseUrl, contentHandlerPath) {  // jshint ignore: line
	var targetJson;
	var assetId;
	var dxAssetId;
	var value;
	var label;
	var i;
	
	
	var id = dxUtils.cleanId(sourceJson.id);
	
	var name = dxUtils.getStringValue(sourceJson.title);
	
	if (name === '') {
		name = dxUtils.getStringValue(sourceJson.name);
	}
	
	var locale = dxUtils.getLocaleValue(sourceJson.title);

	var typeId =  dxUtils.getTypeIdValue(sourceJson.link);
	
	var lastModifier = dxUtils.getNameValue(sourceJson.lastModifier);
	
	var creator = dxUtils.getNameValue(sourceJson.author);
	
	var status = dxUtils.getStatusValue(sourceJson.category);

	var lastModified = dxUtils.getDateValue('');
	
	var created = dxUtils.getDateValue(sourceJson.created);
	
	var description = dxUtils.getStringValue(sourceJson.summary);
	
//	var rev = '';
	
	var sourceElements = sourceJson.content.content.elements.element; 
	var targetElements = {};

	
	if (sourceElements !== undefined) {
		logger.debug('num elements: ' + sourceElements.length);
	} else {
		logger.debug('num elements: 0');
		logger.warn('Content ' + id + ' does not have any elements.');
		sourceElements = [];
	}
	
	
	for (var index = 0; index < sourceElements.length; index++) {
		
		
		var sourceElement = sourceElements[index];

		var key = sourceElement.name;
		key = dxUtils.fixElementKey(key);
		
		var elementType = sourceElement.type;
		label = dxUtils.getStringValue(sourceElement.title);
		logger.debug('Converting element: ' + key + ' (' + elementType + ')');

		var targetElement = {};
		
		if (elementType.toUpperCase() === 'REFERENCECOMPONENT') {
			value = sourceElement.data.reference;
			
			targetElement = wchContentElement.genElement(key, 'text', value);
		}
		
		if (elementType.toUpperCase() === 'DATECOMPONENT') {
			value = '';
			
			if (sourceElement.data.date !== undefined && sourceElement.data.date.value !== undefined) {
				value = sourceElement.data.date.value;

				if (isNaN(Date.parse(value))) {
				    value = '';
                }
			}

			targetElement = wchContentElement.genElement(key, 'date', value);
		}

		if (elementType.toUpperCase() === 'FILECOMPONENT') {
			dxAssetId = '';
			
	
			if (sourceElement.data.resourceUri !== undefined) {
				dxAssetId = dxUtils.getDxAssetId(sourceElement.data.resourceUri.value);	
			}

			
			assetId = '';
			
			
			if (dxAssetId !== undefined && dxAssetId) {
				logger.debug('Looking up dx asset id: ' + dxAssetId);

				assetId = wchAsset.findAssetId(assets, dxAssetId);
				
				logger.debug('found wch asset id: ' + assetId);

			} else {
				logger.debug('no dx asset id is specified');
			} 
			
			targetElement = wchContentElement.genElement(key, 'file', assets[assetId]);
		
		}


		if (elementType.toUpperCase() === 'HTMLCOMPONENT') {
			value = sourceElement.data.value;
			
			targetElement = wchContentElement.genElement(key, 'text', value);
		}

		if (elementType.toUpperCase() === 'IMAGECOMPONENT') {
			dxAssetId = '';
			
			if (sourceElement.data.image.resourceUri !== undefined) {
				dxAssetId = dxUtils.getDxAssetId(sourceElement.data.image.resourceUri.value);	
			}
			
			assetId = '';
			
			if (dxAssetId !== undefined && dxAssetId) {
				logger.debug('Looking up dx asset id: ' + dxAssetId);

				assetId = wchAsset.findAssetId(assets, dxAssetId);
				
				logger.debug('found wch asset id: ' + assetId);
				
			} 
			targetElement = wchContentElement.genElement(key, 'image', assets[assetId]);
		}
		

		if (elementType.toUpperCase() === 'JSPCOMPONENT') {
			value = sourceElement.data.jsp.path;
			
			targetElement = wchContentElement.genElement(key, 'text', value);
			
		}

		if (elementType.toUpperCase() === 'LINKCOMPONENT') {
			
			
			var linkURL = sourceElement.data.linkElement.destination.value;
			var linkText = sourceElement.data.linkElement.display.value;
			var linkDescription = sourceElement.data.linkElement.description.value;

            if (linkURL !== undefined && linkURL.length > 0 && !validUrl.isUri(linkURL)){
                if (linkURL.toUpperCase().startsWith(contentHandlerPath.toUpperCase())) {

                    logger.warn(name + ' [' + id + '] Link URL will be changed to ' + portalBaseUrl + linkURL);
                    linkURL = portalBaseUrl + linkURL;

                } else if (linkText === undefined || linkText.length === 0) {
                    logger.warn(name + ' [' + id + '] Invalid Link URL: ' + linkURL +', value will be set to Link Text.');
                    linkText = linkURL;
                    linkURL = '';
                } else if (linkDescription === undefined || linkDescription.length === 0){
                    logger.warn(name + ' [' + id + '] Invalid Link URL: ' + linkURL +', value will be set to Link Description.');
                    linkDescription = linkURL;
                    linkURL = '';
                } else {
                    logger.warn(name + ' [' + id + '] Invalid Link URL: ' + linkURL +', value will be removed.');
                    linkURL = '';
                }
            }

            if (linkText !== undefined && linkText.length > 250) {
                logger.warn('Truncating link text to 250 characters: ' + linkText);
                linkText = linkText.substring(0,250);
            }

            if (linkDescription !== undefined && linkDescription.length > 250) {
                logger.warn('Truncating link description to 250 characters: ' + linkDescription);
            	linkDescription = linkDescription.substring(0,250);
			}


			targetElement = wchContentElement.genElement(key, 'link', linkURL, linkText, linkDescription);
			
		}

		if (elementType.toUpperCase() === 'NUMERICCOMPONENT') {
			
			value = 0;
			if (sourceElement.data.double !== undefined) {
				if (typeof sourceElement.data.double === 'number') {
					value = sourceElement.data.double;
				} else if (typeof sourceElement.data.double === 'string') {
					value = parseFloat(sourceElement.data.double.replace(',',''));
				} else {
					logger.error('Invalid value for field: ' + key + ': \"' + sourceElement.data.double + '\"' );
				}
			}
			
			if (sourceElement.data.integer !== undefined) {
				if (typeof sourceElement.data.integer === 'number') {
					value = sourceElement.data.integer;
				} else if (typeof sourceElement.data.integer === 'string') {
					value= parseInt(sourceElement.data.integer.replace(',',''));
				} else {
					logger.error('Invalid value for field: ' + key + ' = \"' + sourceElement.data.integer + '\"' );
				}
			}
			
			targetElement = wchContentElement.genElement(key, 'number', value);
			
		}

		if (elementType.toUpperCase() === 'OPTIONSELECTIONCOMPONENT') {

			value = '';
			
			var options = sourceElement.data.optionselection.options.option;

			if (options !== undefined) {
				for (i = 0; i < options.length; i++) {

					var option = options[i];

					if (option.selected || option.selected === 'true') {  // jshint ignore: line
						if (value === '') {
							value = option.value;
						} else {
							value += ', ' + option.value;
						}
					}
				}
			}
			
			targetElement = wchContentElement.genElement(key, 'text', value);
		}

		if (elementType.toUpperCase() === 'RICHTEXTCOMPONENT') {
			value = sourceElement.data.value;
			
			targetElement = wchContentElement.genElement(key, 'text', value);
		}

		if (elementType.toUpperCase() === 'SHORTTEXTCOMPONENT') {
			value = sourceElement.data.value;
			
			targetElement = wchContentElement.genElement(key, 'text', value);
		}

		if (elementType.toUpperCase() === 'TEXTCOMPONENT') {
			value = sourceElement.data.value;
			
			targetElement = wchContentElement.genElement(key, 'text', value);
			
		}

		if (elementType.toUpperCase() === 'USERSELECTIONCOMPONENT') {
			value = '';
			
			var users = sourceElement.data.userSelection.user;
			if (users !== undefined) {
				
				for (i = 0; i < users.length; i++) {
					value += users[i].email;
					
					if (i + 1 < users.length) {  // jshint ignore: line
						value += ', ';
					}
				}
			}
			
			targetElement = wchContentElement.genElement(key, 'text', value);
		}

		targetElements[key] = targetElement[key];
	}
	
	targetJson = genContent(id, name, typeId);
	
	targetJson = setLocale(targetJson, locale);
	targetJson = setStatus(targetJson, status);
	targetJson = setCreator(targetJson, creator);
	targetJson = setCreated(targetJson, created);
	targetJson = setDescription(targetJson, description);
	targetJson = setLastModifier(targetJson, lastModifier);
	targetJson = setLastModified(targetJson, lastModified);
	targetJson = setElements(targetJson, targetElements);
	
	logger.debug('Num Elements: ' + Object.keys(targetElements).length);
	
	return targetJson;
}

function analyze(sourceJson, assets, typeNames, statMap, portalBaseUrl, contentHandlerPath) { // jshint ignore: line
    var assetId;
    var dxAssetId;
    var value;
    var i;

    var id = dxUtils.cleanId(sourceJson.id);
	
	var name = dxUtils.getStringValue(sourceJson.title);
	
	if (name === '') {
		name = dxUtils.getStringValue(sourceJson.name);
	}

	var typeId =  dxUtils.getTypeIdValue(sourceJson.link);
	
	statMap.typeList[typeId].push(id);

	var sourceElements = sourceJson.content.content.elements.element;

	var numElements = 0;
	
	if (sourceElements !== undefined) {
		numElements = sourceElements.length;
	} else {
		statMap.errors.push('Content does not have any elements. ContentID: ' + id);
		sourceElements = [];
	}
	

	logger.debug('Analyzing content item: ' + id + ' [' + numElements + ']');

	
	for (var index = 0; index < sourceElements.length; index++) {
		
		
		var sourceElement = sourceElements[index];

		var key = sourceElement.name;
        key = dxUtils.fixElementKey(key);

		var elementType = sourceElement.type;

		logger.debug('element: ' + key + ' (' + elementType + ')');

		if (elementType.toUpperCase() === 'REFERENCECOMPONENT') {
			value = sourceElement.data.reference;
			
			if (value === undefined || value.length === 0) {
				statMap.containsEmptyField.push(name + ' (' + id + '), Field: ' +  key);
			}
		}
		
		if (elementType.toUpperCase() === 'DATECOMPONENT') {
			value = '';
			
			if (sourceElement.data.date !== undefined) {
				if (sourceElement.data.date.value !== undefined) {
					value = sourceElement.data.date.value;
				}
			}
			
			if (value === undefined || value.length === 0) {
				statMap.containsEmptyField.push(name + ' (' + id + '), Field: ' +  key);
			} else if (isNaN(Date.parse(value))) {
                statMap.errors.push('Content has invalid date value. ContentID:' + id + ', DX Asset ID:' + dxAssetId + ', value: ' + value);
            }

		}

		if (elementType.toUpperCase() === 'FILECOMPONENT') {
			dxAssetId = '';

			if (sourceElement.data.resourceUri !== undefined) {
				dxAssetId = dxUtils.getDxAssetId(sourceElement.data.resourceUri.value);
			}


			assetId = '';

			if (dxAssetId !== undefined && dxAssetId) {
				assetId = wchAsset.findAssetId(assets, dxAssetId);
			}

			if (dxAssetId === '') {
				statMap.containsEmptyField.push(name + ' (' + id + '), Field: ' +  key);

			} else if (assetId === undefined || assetId.length === 0) {
				statMap.errors.push('Content has invalid asset reference. ContentID:' + id + ', DX Asset ID:' + dxAssetId);
			}

		}


		if (elementType.toUpperCase() === 'HTMLCOMPONENT') {
			value = sourceElement.data.value;
			
			if (value === undefined || value.length === 0) {
				statMap.containsEmptyField.push(name + ' (' + id + '), Field: ' +  key);
			}
		}

		if (elementType.toUpperCase() === 'IMAGECOMPONENT') {
			dxAssetId = '';
			
			if (sourceElement.data.image.resourceUri !== undefined) {
				dxAssetId = dxUtils.getDxAssetId(sourceElement.data.image.resourceUri.value);	
			}
			
			assetId = '';
			
			if (dxAssetId !== undefined && dxAssetId) {
				assetId = wchAsset.findAssetId(assets, dxAssetId);
			}
			
			if (dxAssetId === '') {
				statMap.containsEmptyField.push(name + ' (' + id + '), Field: ' +  key);
				
			} else if (assetId === undefined || assetId.length === 0) {
				statMap.errors.push('Content has invalid asset reference. ContentID:' + id + ', DX Asset ID:' + dxAssetId);
			}
			
		}
		

		if (elementType.toUpperCase() === 'JSPCOMPONENT') {
			value = sourceElement.data.jsp.path;
			
			if (value === undefined || value.length === 0) {
				statMap.containsEmptyField.push(name + ' (' + id + '), Field: ' +  key);
			}
			
		}

		if (elementType.toUpperCase() === 'LINKCOMPONENT') {
			
			
			var linkURL = sourceElement.data.linkElement.destination.value;
			var linkText = sourceElement.data.linkElement.display.value;
			var linkDescription = sourceElement.data.linkElement.description.value;
			
			if (linkURL === undefined || linkURL.length === 0) {
				statMap.containsEmptyField.push(name + ' (' + id + '), Field: ' +  key + ', linkURL');
			} else if (!validUrl.isUri(linkURL)){

			    if (linkURL.toUpperCase().startsWith(contentHandlerPath.toUpperCase())) {
                    statMap.errors.push(name + ' (' + id + '), Field: ' +  key + ', linkURL will be changed to: ' + portalBaseUrl + linkURL);
                } else {
                    statMap.errors.push(name + ' (' + id + '), Field: ' +  key + ', linkURL is invalid: ' + linkURL);
                }
            }


            if (linkText === undefined || linkText.length === 0) {
				statMap.containsEmptyField.push(name + ' (' + id + '), Field: ' +  key + ', linkText');
			} else if (linkText.length > 250) {
                statMap.errors.push(name + ' (' + id + '), Field: ' +  key + ', linkText is longer than 250 characters: ' + linkText);
            }

			if (linkDescription === undefined || linkDescription.length === 0) {
				statMap.containsEmptyField.push(name + ' (' + id + '), Field: ' +  key + ', linkDescription');
			} else if (linkDescription.length > 250) {
                statMap.errors.push(name + ' (' + id + '), Field: ' +  key + ', linkDescription is longer than 250 characters: ' + linkDescription);
			}
        }

		if (elementType.toUpperCase() === 'NUMERICCOMPONENT') {
			
			value = 0;
			if (sourceElement.data.double !== undefined) {
				if (typeof sourceElement.data.double === 'number') {
					value = sourceElement.data.double;
				} else if (typeof sourceElement.data.double === 'string') {
					value = parseFloat(sourceElement.data.double.replace(',',''));
				} else {
					logger.error('Invalid value for field: ' + key + ': \"' + sourceElement.data.double + '\"' );
				}
				
			}
			
			if (sourceElement.data.integer !== undefined) {
				if (typeof sourceElement.data.integer === 'number') {
					value = sourceElement.data.integer;
				} else if (typeof sourceElement.data.integer === 'string') {
					value= parseInt(sourceElement.data.integer.replace(',',''));
				} else {
					logger.error('Invalid value for field: ' + key + ' = \"' + sourceElement.data.integer + '\"' );
				}
			}
			
			if (value === undefined || value.length === 0) {
				statMap.containsEmptyField.push(name + ' (' + id + '), Field: ' +  key);
			}
			
		}

		if (elementType.toUpperCase() === 'OPTIONSELECTIONCOMPONENT') {
			value = sourceElement.data.optionselection.selection;
			
			if (value === undefined || value.length === 0) {
				statMap.containsEmptyField.push(name + ' (' + id + '), Field: ' +  key);
			}
		}

		if (elementType.toUpperCase() === 'RICHTEXTCOMPONENT') {
			value = sourceElement.data.value;
			
			if (value === undefined || value.length === 0) {
				statMap.containsEmptyField.push(name + ' (' + id + '), Field: ' +  key);
			}
		}

		if (elementType.toUpperCase() === 'SHORTTEXTCOMPONENT') {
			value = sourceElement.data.value;
			
			if (value === undefined || value.length === 0) {
				statMap.containsEmptyField.push(name + ' (' + id + '), Field: ' +  key);
			}
		}

		if (elementType.toUpperCase() === 'TEXTCOMPONENT') {
			value = sourceElement.data.value;
			
			if (value === undefined || value.length === 0) {
				statMap.containsEmptyField.push(name + ' (' + id + '), Field: ' +  key);
			}
			
		}

		if (elementType.toUpperCase() === 'USERSELECTIONCOMPONENT') {
			value = '';
			
			var users = sourceElement.data.userSelection.user;
			if (users !== undefined) {
				
				for (i = 0; i < users.length; i++) {
					value += users[i].email;
					
					if (i + 1 < users.length) { // jshint ignore: line
						value += ', ';
					}
				}
			}
			
			if (value === undefined || value.length === 0) {
				statMap.containsEmptyField.push(name + ' (' + id + '), Field: ' +  key);
			}
		}

	}
}


function diffElements(typeElements, contentElements) { // jshint ignore: line
	var result = {'missing':[], 'extra':[]};
	
	var onlyInType = {};
	var onlyInContent = {};
	var i;
	var name;
	
	if (typeElements === undefined) {
		typeElements = [];
	}

	if (contentElements === undefined) {
		contentElements = [];
	}

	
	for (i = 0; i < typeElements.length; i++) {
		name = typeElements[i].name;
		onlyInType[name] = true;
	}
	
	
	for (i = 0; i < contentElements.length; i++) {
		name = contentElements[i].name;
		
		if (onlyInType[name]) {
			delete onlyInType[name];
		} else {
			onlyInContent[name] = true;
		}
	}
	
	for (name in onlyInType) {
		if (onlyInType.hasOwnProperty(name)) {
            result.missing.push(name);
		}
	}

	for (name in  onlyInContent) {
        if (onlyInContent.hasOwnProperty(name)) {
            result.extra.push(name);
        }
	}
	return result;
}

module.exports.genContent = genContent;
module.exports.setCreated = setCreated;
module.exports.setCreator = setCreator;
module.exports.setElements = setElements;
module.exports.setTypeId = setTypeId;
module.exports.setId = setId;
module.exports.setLastModified = setLastModified;
module.exports.setLastModifier = setLastModifier;
module.exports.setName = setName;
module.exports.setRev = setRev;
module.exports.setLocale = setLocale;
module.exports.setStatus = setStatus;
module.exports.setTags = setTags;
module.exports.convert = convert;
module.exports.analyze = analyze;
module.exports.diffElements = diffElements;
