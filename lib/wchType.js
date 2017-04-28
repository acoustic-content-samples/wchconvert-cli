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
	, wchTypeElement = require("./wchTypeElement.js")
	;

const logger = require("./loggerWinston.js");



function genType(id, name, description) {
	
	var result = {}; 
	
	result["id"] = id;
	
	result["name"] = name;
	
	result["classification"] = "content-type";

	result["description"] = description;
	
	result["status"] = "draft";

	result["creator"] = "authorABC";
	
	result["created"] = new Date();

	result["lastModifier"] = "authorABC";
	
	result["lastModified"] =  new Date();

	result["rev"] = "";

	result["templateMapping"] = "";

	result["elements"] = [];

	result["tags"] = [];

	return result;
}

function setId(type, id) {
	type["id"] = id;
	
	return type;
}

function setName(type, name) {
	type["name"] = name;
	
	return type;
}

function setDescription(type, description) {
	type["description"] = description;
	
	return type;
}

function setStatus(type, status) {
	type["status"] = status;
	
	return type;
}

function setCreator(type, creator) {
	type["creator"] = creator;
	
	return type;
}

function setCreated(type, created) {
	
	if (typeof created == "string") {
		type["created"] = created;	
	}
	
	
	if (typeof created == "Date") {
		type["created"] = created.toISOString();
	}
	
	
	return type;
}

function setLastModifier(type, lastModifier) {
	type["lastModifier"] = lastModifier;
	
	return type;
}

function setLastModified(type, lastModified) {
	if (typeof lastModified == "string") {
		type["lastModified"] = lastModified;	
	}
	
	
	if (typeof lastModified == "Date") {
		type["lastModified"] = lastModified.toISOString();
	}
	
	return type;
}

function setRev(type, rev) {
	type["rev"] = rev;
	
	return type;
}

function setTemplateMapping(type, templateMapping) {
	type["templateMapping"] = templateMapping;
	
	return type;
}

function setElements(type, elements) {
	type["elements"] = elements;
	
	return type;
}

function setTags(type, tags) {
	type["tags"]  = tags;
}


function convert(sourceJson, typeNames) {
	var targetJson = {};
	
	
	var id = dxUtils.cleanId(sourceJson.id);
	
	var name = dxUtils.getStringValue(sourceJson.title);
	
	if (name == "") {
		name = dxUtils.getStringValue(sourceJson.name);
	}

	logger.debug("CHECKING NAME: " + name);

	
	var savedName = dxUtils.findByVal(typeNames, id);
	
	if (savedName != undefined) {
		name = savedName;
		logger.debug("FOUND SAVED NAME: " + savedName);
		
	} else {
		logger.debug("NO SAVED NAME: " + savedName);
		
		// check if the type name is unique
		if (dxUtils.isUniqueName(name, typeNames)) {
			// if it is add to the typeNames
			typeNames[name] = id;
			
			logger.debug("NAME IS UNIQUE: " + name)
			
		} else {
			//if not generate a new unique name
			
			logger.debug("NAME IS NOT UNIQUE: " + name)
			logger.debug(typeNames[name]);
			
			logger.warn("Type name is not unique: " + name + " [" + id + "]");
			name = dxUtils.genUniqueName(name, id, typeNames);
			logger.warn("Generated unique type name: " + name + " [" + id + "]");

		}
	}
	
	
	var description = dxUtils.getStringValue(sourceJson.description);
	
	var creationDate = dxUtils.getDateValue("");

	var lastModifier = dxUtils.getNameValue(sourceJson.lastModifier);
	
	var creator = lastModifier;
	
	var status = dxUtils.getStatusValue(sourceJson.category);

	var lastModified = dxUtils.getDateValue("");
	
	var created = dxUtils.getDateValue("");
	
	var rev = "";

	var templateMapping = "";
	
	var elements = [];
	
	var sourceElements = sourceJson.elements;


	// generate schema properties and form element lists
	for (var index in sourceElements) {
		
		var sourceElement = sourceElements[index];

		var key = sourceElement.name;
		key = dxUtils.fixElementKey(key);
		
		var label = dxUtils.getStringValue(sourceElement.title);

		if (label.replace(/\ /g,'') == '') {
			logger.error("Title not specified for element " + key + " in type " + id);
			label = "Not Specified";
		}
		
		var targetElement = {};
		
		if (sourceElement.type.toUpperCase() == "REFERENCECOMPONENT") {
			targetElement = wchTypeElement.genTextElement(key, label);
		}
		
		if (sourceElement.type.toUpperCase() == "DATECOMPONENT") {
			targetElement = wchTypeElement.genDateElement(key, label);
		}

		if (sourceElement.type.toUpperCase() == "FILECOMPONENT") {
			targetElement = wchTypeElement.genFileElement(key, label);
		}

		if (sourceElement.type.toUpperCase() == "HTMLCOMPONENT") {
			targetElement = wchTypeElement.genTextElement(key, label);
		}

		if (sourceElement.type.toUpperCase() == "IMAGECOMPONENT") {
			targetElement = wchTypeElement.genImageElement(key, label);
		}

		if (sourceElement.type.toUpperCase() == "JSPCOMPONENT") {
			targetElement = wchTypeElement.genTextElement(key, label);
		}

		if (sourceElement.type.toUpperCase() == "LINKCOMPONENT") {
			targetElement = wchTypeElement.genLinkElement(key, label);
		}

		if (sourceElement.type.toUpperCase() == "NUMERICCOMPONENT") {
			targetElement = wchTypeElement.genNumberElement(key, label);
		}

		if (sourceElement.type.toUpperCase() == "OPTIONSELECTIONCOMPONENT") {
			targetElement = wchTypeElement.genTextElement(key, label);
		}

		if (sourceElement.type.toUpperCase() == "RICHTEXTCOMPONENT") {
			targetElement = wchTypeElement.genTextElement(key, label);
		}

		if (sourceElement.type.toUpperCase() == "SHORTTEXTCOMPONENT") {
			targetElement = wchTypeElement.genTextElement(key, label);
		}

		if (sourceElement.type.toUpperCase() == "TEXTCOMPONENT") {
			targetElement = wchTypeElement.genTextElement(key, label);
		}

		if (sourceElement.type.toUpperCase() == "USERSELECTIONCOMPONENT") {
			targetElement = wchTypeElement.genTextElement(key, label);
		}

		if (Object.keys(targetElement).length) {
			// add the form entry to the form
			elements.push(targetElement);
		} else {
			logger.info("SKIPPING ELEMENT '" + label + "' of type "+ sourceElement.type);
		} 
		
	}
	
	var targetJson = genType(id, name, description);
		
	targetJson = setStatus(targetJson, status);
	targetJson = setCreator(targetJson, creator);
	targetJson = setCreated(targetJson, created);
	targetJson = setLastModifier(targetJson, lastModifier);
	targetJson = setLastModified(targetJson, lastModified);
	targetJson = setElements(targetJson, elements);
	
	return targetJson;
}

function analyze(sourceJson, typeNames, statMap) {

	var id = dxUtils.cleanId(sourceJson.id);
	
	logger.debug("sourcejson.title: " + sourceJson.title);
	logger.debug("sourcejson.name: " + sourceJson.name);
	
	var name = dxUtils.getStringValue(sourceJson.title);
	
	if (name == "") {
		name = dxUtils.getStringValue(sourceJson.name);
	}

	
	logger.debug("CHECKING NAME: " + name);
	
	if (dxUtils.findByVal(typeNames, id) != undefined) {
		name = dxUtils.findByVal(typeNames, id);
		
			logger.debug("Type id found in type names: " + id);

		
	} else {
		// check if the type name is unique
		if (dxUtils.isUniqueName(name, typeNames)) {
			
			logger.debug("Type name is unique: " + name);

			// if it is add to the typeNames
			typeNames[name] = id;
			
		} else {
			//if not generate a new unique name

			logger.debug("Type name is already used by id: " + typeNames[name]);

			
			logger.warn("Type name is not unique: " + name + " [" + id + "]");
			name = dxUtils.genUniqueName(name, id, typeNames);
			logger.warn("Generated unique type name: " + name + " [" + id + "]");

		}
	}
	
	var test = [];
	statMap["typeList"][id] = [];
	
	var description = dxUtils.getStringValue(sourceJson.description);
	var creationDate = dxUtils.getDateValue("");
	var lastModifier = dxUtils.getNameValue(sourceJson.lastModifier);
	var creator = lastModifier;
	var status = dxUtils.getStatusValue(sourceJson.category);
	var lastModified = dxUtils.getDateValue("");
	var created = dxUtils.getDateValue("");
	var sourceElements = sourceJson.elements;

	// generate schema properties and form element lists
	for (var index in sourceElements) {
		
		var sourceElement = sourceElements[index];

		var key = sourceElement.name;
		key = key.replace(/\ /g, '_');   // replace all spaces in key names as that is invalid for WCH
		key = key.replace(/\-/g,'_');  // replace all hyphens in key names
		
		var label = dxUtils.getStringValue(sourceElement.title);

		if (label.replace(/\ /g,'') == '') {
			logger.error("Title not specified for element " + key + " in type " + id);
			label = "Not Specified";
		}
		
		if (sourceElement.type.toUpperCase() == "REFERENCECOMPONENT") {
			if (statMap["containsComponentReference"].indexOf(name) == -1) {
				statMap["containsComponentReference"].push(name);
			}
		}
		
		if (sourceElement.type.toUpperCase() == "DATECOMPONENT") {
		}

		if (sourceElement.type.toUpperCase() == "FILECOMPONENT") {
			if (statMap["containsFile"].indexOf(name) == -1) {
				statMap["containsFile"].push(name);
			}
		}

		if (sourceElement.type.toUpperCase() == "HTMLCOMPONENT") {
			if (statMap["containsHTML"].indexOf(name) == -1) {
				statMap["containsHTML"].push(name);
			}
		}

		if (sourceElement.type.toUpperCase() == "IMAGECOMPONENT") {
			if (statMap["containsImage"].indexOf(name) == -1) {
				statMap["containsImage"].push(name);
			}
		}

		if (sourceElement.type.toUpperCase() == "JSPCOMPONENT") {
			if (statMap["containsJSP"].indexOf(name) == -1) {
				statMap["containsJSP"].push(name);
			}
		}

		if (sourceElement.type.toUpperCase() == "LINKCOMPONENT") {
			if (statMap["containsLink"].indexOf(name) == -1) {
				statMap["containsLink"].push(name);
			}
		}

		if (sourceElement.type.toUpperCase() == "NUMERICCOMPONENT") {
		}

		if (sourceElement.type.toUpperCase() == "OPTIONSELECTIONCOMPONENT") {
			if (statMap["containsOptionSelection"].indexOf(name) == -1) {
				statMap["containsOptionSelection"].push(name);
			}
		}

		if (sourceElement.type.toUpperCase() == "RICHTEXTCOMPONENT") {
			if (statMap["containsRichText"].indexOf(name) == -1) {
				statMap["containsRichText"].push(name);
			}
		}

		if (sourceElement.type.toUpperCase() == "SHORTTEXTCOMPONENT") {
		}

		if (sourceElement.type.toUpperCase() == "TEXTCOMPONENT") {
		}

		if (sourceElement.type.toUpperCase() == "USERSELECTIONCOMPONENT") {
			if (statMap["containsUserSelection"].indexOf(name) == -1) {
				statMap["containsUserSelection"].push(name);
			}
		}
	}
	
	return statMap;
}

module.exports.genType = genType;
module.exports.setCreated = setCreated;
module.exports.setCreator = setCreator;
module.exports.setDescription = setDescription;
module.exports.setElements = setElements;
module.exports.setId = setId;
module.exports.setLastModified = setLastModified;
module.exports.setLastModifier = setLastModifier;
module.exports.setName = setName;
module.exports.setRev = setRev;
module.exports.setStatus = setStatus;
module.exports.setTemplateMapping = setTemplateMapping;
module.exports.setTags = setTags;
module.exports.convert = convert;
module.exports.analyze = analyze;



