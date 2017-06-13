/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 */

var dxUtils = require("./dxUtils.js")
	, wchContentElement = require("./wchContentElement.js")
	, wchAsset = require("./wchAsset.js")
	;

const logger = require("./loggerWinston.js");

function genContent(id, name, typeId) {
	
	var result = {}; 
	
	result["id"] = id;
	
	result["name"] = name;
	
	result["classification"] = "content";

	result["typeId"] = typeId;
	
	result["status"] = "draft";

	result["creator"] = "authorABC";
	
	result["created"] = new Date();

	result["lastModifier"] = "authorABC";
	
	result["lastModified"] =  new Date();

	result["locale"] =  "en";

	result["rev"] = "";

	result["tags"] = [];

	result["elements"] = {};

	return result;
}

function setId(content, id) {
	content["id"] = id;
	
	return content;
}

function setName(content, name) {
	content["name"] = name;
	
	return content;
}

function setTypeId(content, typeId) {
	content["typeId"] = typeId;
	
	return content;
}

function setStatus(content, status) {
	content["status"] = status;
	
	return content;
}

function setCreator(content, creator) {
	content["creator"] = creator;
	
	return content;
}

function setCreated(content, created) {
	
	if (typeof created == "string") {
		content["created"] = created;	
	}
	
	if (typeof created == "Date") {
		content["created"] = created.toISOString();
	}
	
	
	return content;
}

function setLastModifier(content, lastModifier) {
	content["lastModifier"] = lastModifier;
	
	return content;
}

function setDescription(content, description) {
	
	// MAX field length is 500 characters
	description = description.substring(0,500);
	
	content["description"] = description;
	
	return content;
}

function setLastModified(content, lastModified) {
	if (typeof lastModified == "string") {
		content["lastModified"] = lastModified;	
	}
	
	
	if (typeof lastModified == "Date") {
		content["lastModified"] = lastModified.toISOString();
	}
	
	return content;
}

function setLocale(content, locale) {
	content["locale"] = locale;
	
	return content;
}

function setRev(content, rev) {
	content["rev"] = rev;
	
	return content;
}

function setElements(content, elements) {
	content["elements"] = elements;
	
	return content;
}

function setTags(content, tags) {
	content["tags"]  = tags;
}


function convert(sourceJson, assets) {
	var targetJson = {};
	
	
	var id = dxUtils.cleanId(sourceJson.id);
	
	var name = dxUtils.getStringValue(sourceJson.title);
	
	if (name == "") {
		name = dxUtils.getStringValue(sourceJson.name);
	}
	
	var locale = dxUtils.getLocaleValue(sourceJson.title);

	var typeId =  dxUtils.getTypeIdValue(sourceJson.link);
	
	var creationDate = dxUtils.getDateValue("");

	var lastModifier = dxUtils.getNameValue(sourceJson.lastModifier);
	
	var creator = lastModifier;
	
	var status = dxUtils.getStatusValue(sourceJson.category);

	var lastModified = dxUtils.getDateValue("");
	
	var created = dxUtils.getDateValue("");
	
	var description = dxUtils.getStringValue(sourceJson.summary);
	
	var rev = "";
	
	var sourceElements = sourceJson.content.content.elements.element; 
	var targetElements = {};

	
	if (sourceElements != undefined) {
		logger.debug("num elements: " + sourceElements.length);
	} else {
		logger.debug("num elements: 0");
		logger.warn("Content " + id + " does not have any elements.");
	}
	
	
	for (var index in sourceElements) {
		
		
		var sourceElement = sourceElements[index];

		var key = sourceElement.name;
		key = dxUtils.fixElementKey(key);
		
		var elementType = sourceElement.type;
		var label = dxUtils.getStringValue(sourceElement.title);
		logger.debug("Converting element: " + key + " (" + elementType + ")");

		var targetElement = {};
		
		if (elementType.toUpperCase() == "REFERENCECOMPONENT") {
			var value = sourceElement.data.reference;
			
			targetElement = wchContentElement.genElement(key, "text", value);
		}
		
		if (elementType.toUpperCase() == "DATECOMPONENT") {
			var value = "";
			
			if (sourceElement.data.date != undefined) {
				if (sourceElement.data.date.value != undefined) {
					value = sourceElement.data.date.value;
				}
			}
			
			targetElement = wchContentElement.genElement(key, "date", value);
		}

		if (elementType.toUpperCase() == "FILECOMPONENT") {
			var dxAssetId = "";
			
	
			if (sourceElement.data.resourceUri != undefined) {
				dxAssetId = dxUtils.getDxAssetId(sourceElement.data.resourceUri.value);	
			}

			
			var assetId = "";
			
			
			if (dxAssetId != undefined && dxAssetId) {
				logger.debug("Looking up dx asset id: " + dxAssetId);

				assetId = wchAsset.findAssetId(assets, dxAssetId);
				
				logger.debug("found wch asset id: " + assetId);

			} else {
				logger.debug("no dx asset id is specified");
			} 
			
			targetElement = wchContentElement.genElement(key, "file", assets[assetId]);
		
		}


		if (elementType.toUpperCase() == "HTMLCOMPONENT") {
			var value = sourceElement.data.value;
			
			targetElement = wchContentElement.genElement(key, "text", value);
		}

		if (elementType.toUpperCase() == "IMAGECOMPONENT") {
			var dxAssetId = "";
			
			if (sourceElement.data.image.resourceUri != undefined) {
				dxAssetId = dxUtils.getDxAssetId(sourceElement.data.image.resourceUri.value);	
			}
			
			var assetId = "";
			
			if (dxAssetId != undefined && dxAssetId) {
				logger.debug("Looking up dx asset id: " + dxAssetId);

				assetId = wchAsset.findAssetId(assets, dxAssetId);
				
				logger.debug("found wch asset id: " + assetId);
				
			} 
			targetElement = wchContentElement.genElement(key, "image", assets[assetId]);
		}
		

		if (elementType.toUpperCase() == "JSPCOMPONENT") {
			var value = sourceElement.data.jsp.path;
			
			targetElement = wchContentElement.genElement(key, "text", value);
			
		}

		if (elementType.toUpperCase() == "LINKCOMPONENT") {
			
			
			var linkURL = sourceElement.data.linkElement.destination.value;
			var linkText = sourceElement.data.linkElement.display.value;
			var linkDescription = sourceElement.data.linkElement.description.value;
			
			targetElement = wchContentElement.genElement(key, "link", linkURL, linkText, linkDescription);
			
		}

		if (elementType.toUpperCase() == "NUMERICCOMPONENT") {
			
			var value = 0;
			if (sourceElement.data.double != undefined) {
				if (typeof sourceElement.data.double == "number") {
					value = sourceElement.data.double;
				} else if (typeof sourceElement.data.double == "string") {
					value = parseFloat(sourceElement.data.double.replace(',',''));
				} else {
					logger.error("Invalid value for field: " + key + ": \"" + sourceElement.data.double + "\"" );
				}
			}
			
			if (sourceElement.data.integer != undefined) {
				if (typeof sourceElement.data.integer == "number") {
					value = sourceElement.data.integer;
				} else if (typeof sourceElement.data.integer == "string") {
					value= parseInt(sourceElement.data.integer.replace(',',''));
				} else {
					logger.error("Invalid value for field: " + key + " = \"" + sourceElement.data.integer + "\"" );
				}
			}
			
			targetElement = wchContentElement.genElement(key, "number", value);
			
		}

		if (elementType.toUpperCase() == "OPTIONSELECTIONCOMPONENT") {

			var value = "";
			
			var options = sourceElement.data.optionselection.options.option;

			if (options != undefined) {
				for (var i in options) {
					var option = options[i];

					if (option.selected || option.selected == "true") {
						if (value == "") {
							value = option.value;
						} else {
							value += ", " + option.value;
						}
					}
				}
			}
			
			targetElement = wchContentElement.genElement(key, "text", value);
		}

		if (elementType.toUpperCase() == "RICHTEXTCOMPONENT") {
			var value = sourceElement.data.value;
			
			targetElement = wchContentElement.genElement(key, "text", value);
		}

		if (elementType.toUpperCase() == "SHORTTEXTCOMPONENT") {
			var value = sourceElement.data.value;
			
			targetElement = wchContentElement.genElement(key, "text", value);
		}

		if (elementType.toUpperCase() == "TEXTCOMPONENT") {
			var value = sourceElement.data.value;
			
			targetElement = wchContentElement.genElement(key, "text", value);
			
		}

		if (elementType.toUpperCase() == "USERSELECTIONCOMPONENT") {
			var value = "";
			
			var users = sourceElement.data.userSelection.user;
			if (users != undefined) {
				
				for (var i = 0; i < users.length; i++) {
					value += users[i].email;
					
					if (i + 1 < users.length) {
						value += ", ";
					}
				}
			}
			
			targetElement = wchContentElement.genElement(key, "text", value);
		}

		targetElements[key] = targetElement[key];
	}
	
	var targetJson = genContent(id, name, typeId);
	
	targetJson = setLocale(targetJson, locale);
	targetJson = setStatus(targetJson, status);
	targetJson = setCreator(targetJson, creator);
	targetJson = setCreated(targetJson, created);
	targetJson = setDescription(targetJson, description);
	targetJson = setLastModifier(targetJson, lastModifier);
	targetJson = setLastModified(targetJson, lastModified);
	targetJson = setElements(targetJson, targetElements);
	
	logger.debug("Num Elements: " + Object.keys(targetElements).length);
	
	return targetJson;
}

function analyze(sourceJson, assets, typeNames, statMap) {
	var id = dxUtils.cleanId(sourceJson.id);
	
	var name = dxUtils.getStringValue(sourceJson.title);
	
	if (name == "") {
		name = dxUtils.getStringValue(sourceJson.name);
	}

	var typeId =  dxUtils.getTypeIdValue(sourceJson.link);
	
	statMap["typeList"][typeId].push(id);

	var creationDate = dxUtils.getDateValue("");

	var lastModifier = dxUtils.getNameValue(sourceJson.lastModifier);
	
	var creator = lastModifier;
	
	var status = dxUtils.getStatusValue(sourceJson.category);

	var lastModified = dxUtils.getDateValue("");
	
	var created = dxUtils.getDateValue("");
	
	var rev = "";
	
	var sourceElements = sourceJson.content.content.elements.element; 
	var targetElements = {};

	
	var numElements = 0;
	
	if (sourceElements != undefined) {
		numElements = sourceElements.length;
	} else {
		statMap["errors"].push("Content does not have any elements. ContentID:" + id);
	}
	

	logger.debug("Analyzing content item: " + id + " [" + numElements + "]");

	
	for (var index in sourceElements) {
		
		
		var sourceElement = sourceElements[index];

		var key = sourceElement.name;
        key = dxUtils.fixElementKey(key);

		var elementType = sourceElement.type;
		var label = dxUtils.getStringValue(sourceElement.title);
		logger.debug("element: " + key + " (" + elementType + ")");

		if (elementType.toUpperCase() == "REFERENCECOMPONENT") {
			var value = sourceElement.data.reference;
			
			if (value == undefined || value.length == 0) {
				statMap["containsEmptyField"].push(name + " (" + id + "), Field: " +  key);
			}
		}
		
		if (elementType.toUpperCase() == "DATECOMPONENT") {
			var value = "";
			
			if (sourceElement.data.date != undefined) {
				if (sourceElement.data.date.value != undefined) {
					value = sourceElement.data.date.value;
				}
			}
			
			if (value == undefined || value.length == 0) {
				statMap["containsEmptyField"].push(name + " (" + id + "), Field: " +  key);
			}
		}

		if (elementType.toUpperCase() == "FILECOMPONENT") {
			var dxAssetId = "";
			
			if (sourceElement.data.resourceUri != undefined) {
				dxAssetId = dxUtils.getDxAssetId(sourceElement.data.resourceUri.value);	
			}

			
			var assetId = "";
			
			if (dxAssetId != undefined && dxAssetId) {
				assetId = wchAsset.findAssetId(assets, dxAssetId);
			}
			
			if (dxAssetId == "") {
				statMap["containsEmptyField"].push(name + " (" + id + "), Field: " +  key);
				
			} else if (assetId == undefined || assetId.length == 0) {
				statMap["errors"].push("Content has invalid asset reference. ContentID:" + id + ", DX Asset ID:" + dxAssetId);
			}
		
		}


		if (elementType.toUpperCase() == "HTMLCOMPONENT") {
			var value = sourceElement.data.value;
			
			if (value == undefined || value.length == 0) {
				statMap["containsEmptyField"].push(name + " (" + id + "), Field: " +  key);
			}
		}

		if (elementType.toUpperCase() == "IMAGECOMPONENT") {
			var dxAssetId = "";
			
			if (sourceElement.data.image.resourceUri != undefined) {
				dxAssetId = dxUtils.getDxAssetId(sourceElement.data.image.resourceUri.value);	
			}
			
			var assetId = "";
			
			if (dxAssetId != undefined && dxAssetId) {
				assetId = wchAsset.findAssetId(assets, dxAssetId);
			}
			
			if (dxAssetId == "") {
				statMap["containsEmptyField"].push(name + " (" + id + "), Field: " +  key);
				
			} else if (assetId == undefined || assetId.length == 0) {
				statMap["errors"].push("Content has invalid asset reference. ContentID:" + id + ", DX Asset ID:" + dxAssetId);
			}
			
		}
		

		if (elementType.toUpperCase() == "JSPCOMPONENT") {
			var value = sourceElement.data.jsp.path;
			
			if (value == undefined || value.length == 0) {
				statMap["containsEmptyField"].push(name + " (" + id + "), Field: " +  key);
			}
			
		}

		if (elementType.toUpperCase() == "LINKCOMPONENT") {
			
			
			var linkURL = sourceElement.data.linkElement.destination.value;
			var linkText = sourceElement.data.linkElement.display.value;
			var linkDescription = sourceElement.data.linkElement.description.value;
			
			if (linkURL == undefined || linkURL.length == 0) {
				statMap["containsEmptyField"].push(name + " (" + id + "), Field: " +  key + ", linkURL");
			}

			if (linkText == undefined || linkText.length == 0) {
				statMap["containsEmptyField"].push(name + " (" + id + "), Field: " +  key + ", linkText");
			}

			if (linkDescription == undefined || linkDescription.length == 0) {
				statMap["containsEmptyField"].push(name + " (" + id + "), Field: " +  key + ", linkDescription");
			}

			
		}

		if (elementType.toUpperCase() == "NUMERICCOMPONENT") {
			
			var value = 0;
			if (sourceElement.data.double != undefined) {
				if (typeof sourceElement.data.double == "number") {
					value = sourceElement.data.double;
				} else if (typeof sourceElement.data.double == "string") {
					value = parseFloat(sourceElement.data.double.replace(',',''));
				} else {
					logger.error("Invalid value for field: " + key + ": \"" + sourceElement.data.double + "\"" );
				}
				
			}
			
			if (sourceElement.data.integer != undefined) {
				if (typeof sourceElement.data.integer == "number") {
					value = sourceElement.data.integer;
				} else if (typeof sourceElement.data.integer == "string") {
					value= parseInt(sourceElement.data.integer.replace(',',''));
				} else {
					logger.error("Invalid value for field: " + key + " = \"" + sourceElement.data.integer + "\"" );
				}
			}
			
			if (value == undefined || value.length == 0) {
				statMap["containsEmptyField"].push(name + " (" + id + "), Field: " +  key);
			}
			
		}

		if (elementType.toUpperCase() == "OPTIONSELECTIONCOMPONENT") {
			var value = sourceElement.data.optionselection.selection;
			
			if (value == undefined || value.length == 0) {
				statMap["containsEmptyField"].push(name + " (" + id + "), Field: " +  key);
			}
		}

		if (elementType.toUpperCase() == "RICHTEXTCOMPONENT") {
			var value = sourceElement.data.value;
			
			if (value == undefined || value.length == 0) {
				statMap["containsEmptyField"].push(name + " (" + id + "), Field: " +  key);
			}
		}

		if (elementType.toUpperCase() == "SHORTTEXTCOMPONENT") {
			var value = sourceElement.data.value;
			
			if (value == undefined || value.length == 0) {
				statMap["containsEmptyField"].push(name + " (" + id + "), Field: " +  key);
			}
		}

		if (elementType.toUpperCase() == "TEXTCOMPONENT") {
			var value = sourceElement.data.value;
			
			if (value == undefined || value.length == 0) {
				statMap["containsEmptyField"].push(name + " (" + id + "), Field: " +  key);
			}
			
		}

		if (elementType.toUpperCase() == "USERSELECTIONCOMPONENT") {
			var value = "";
			
			var users = sourceElement.data.userSelection.user;
			if (users != undefined) {
				
				for (var i = 0; i < users.length; i++) {
					value += users[i].email;
					
					if (i + 1 < users.length) {
						value += ", ";
					}
				}
			}
			
			if (value == undefined || value.length == 0) {
				statMap["containsEmptyField"].push(name + " (" + id + "), Field: " +  key);
			}
		}

	}
}


function diffElements(typeElements, contentElements) {
	var result = [];
	
	var onlyInType = [];
	var onlyInContent = [];
	
	if (typeElements == undefined) {
		typeElements = [];
	}

	if (contentElements == undefined) {
		contentElements = [];
	}

	
	for (var i = 0; i < typeElements.length; i++) {
		var name = typeElements[i].name;
		onlyInType[name] = true;
	}
	
	
	for (var i = 0; i < contentElements.length; i++) {
		var name = contentElements[i].name;
		
		if (onlyInType[name]) {
			delete onlyInType[name];
		} else {
			onlyInContent[name] = true;
		}
	}
	
	for (var i in onlyInType) {
		result.push("- " + i);
	}

	for (var i in onlyInContent) {
		result.push("+ " + i);
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

