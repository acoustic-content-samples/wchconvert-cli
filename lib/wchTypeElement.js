/*
 * Copyright 2017  IBM Corp.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an 
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 */

const logger = require("./loggerWinston.js");


function genCategoryElement(key, label, isRequired) {
	var result = {};
	
	result["key"] = key;
	result["label"] = label;
	result["elementType"] = "category";
	result["helpText"] = "";

	if (isRequired != undefined  && (typeof isRequired ===' boolean')) {
		result["required"] = isRequired;
	}
	
	return result;
}


function genDateElement(key, label, isRequired, fieldType) {
	var result = {};
	
	result["key"] = key;
	result["label"] = label;
	result["elementType"] = "datetime";
	result["fieldType"] = "date-time";
	
	if (fieldType != undefined && (fieldType === 'date' || fieldType === 'date-time')) {
		result["fieldType"] = fieldType;
	}

	result["helpText"] = "";

	if (isRequired != undefined  && (typeof isRequired ===' boolean')) {
		result["required"] = isRequired;
	}

	return result;
}

function genFileElement(key, label, isRequired, acceptType) {
	var result = {};
	
	result["key"] = key;
	result["label"] = label;
	result["elementType"] = "file";

	if (acceptType != undefined) {
		result["acceptType"] = acceptType;
	}
	
	result["helpText"] = "";

	if (isRequired != undefined  && (typeof isRequired ===' boolean')) {
		result["required"] = isRequired;
	}

	return result;
}

function genFileAcceptType(isPlainText, isPresentation, isRichDocument, isSpreadSheet, isPdfDocument) {
	var result = [];
	
	if (isPlainText != undefined && isPlainText) {
		result.push("plain-text");
	}

	if (isPresentation != undefined && isPresentation) {
		result.push("presentation");
	}
	

	if (isRichDocument != undefined && isRichDocument) {
		result.push("rich-document");
	}
	

	if (isSpreadSheet != undefined && isSpreadSheet) {
		result.push("spreadsheet");
	}
	

	if (isPdfDocument != undefined && isPdfDocument) {
		result.push("pdf-document");
	}
	
	return result;
}


function genImageElement(key, label, isRequired, acceptType, imageProfileId) {
	var result = {};
	
	result["key"] = key;
	result["label"] = label;
	result["elementType"] = "image";

	if (acceptType != undefined) {
		result["acceptType"] = acceptType;
	}
	
	if (imageProfileId != undefined) {
		result["imageProfileId"] = imageProfileId;
	}
	
	result["helpText"] = "";

	if (isRequired != undefined  && (typeof isRequired ===' boolean')) {
		result["required"] = isRequired;
	}

	return result;
}

function genImageAcceptType(isJpg, isPng, isGif, isTiff, isSvg, isWebp) {
	var result = [];
	
	if (isJpg != undefined && isJpg) {
		result.push("jpg");
	}

	if (isPng != undefined && isPng) {
		result.push("png");
	}
	

	if (isGif != undefined && isGif) {
		result.push("gif");
	}
	

	if (isTiff != undefined && isTiff) {
		result.push("tiff");
	}
	

	if (isSvg != undefined && isSvg) {
		result.push("svg");
	}
	
	if (isWebp != undefined && isWebp) {
		result.push("webp");
	}
	
	return result;
}


function genLinkElement(key, label, isRequired) {
	var result = {};
	
	result["key"] = key;
	result["label"] = label;
	result["elementType"] = "link";
	result["helpText"] = "";

	if (isRequired != undefined  && (typeof isRequired ===' boolean')) {
		result["required"] = isRequired;
	}

	return result;

}

function genNumberElement(key, label, isRequired, fieldType, min, max) {
	var result = {};
	
	result["key"] = key;
	result["label"] = label;
	result["elementType"] = "number";
	result["fieldType"] = "decimal";

	if (fieldType != undefined && (fieldType === 'decimal' || fieldType === 'integer')) {
		result["fieldType"] = fieldType;
	}

	if (min != undefined && (typeof min === "number")) {
		result["minimum"] = min;
	}
	
	if (max != undefined && (typeof max === "number")) {
		result["maximum"] = max;
	}
	
	result["helpText"] = "";

	if (isRequired != undefined  && (typeof isRequired ===' boolean')) {
		result["required"] = isRequired;
	}

	return result;
}

function genTextElement(key, label, isRequired, min, max, displayType, displayWidth, displayHeight) {
	var result = {};
	
	result["key"] = key;
	result["label"] = label;
	result["elementType"] = "text";

	result["displayType"] = "singleLine";
	if (displayType != undefined && (displayType === 'singleLine' || displayType === 'multiLine')) {
		result["displayType"] = displayType;
	}

	if (min != undefined && (typeof min === "number")) {
		result["minLength"] = min;
	}
	
	if (max != undefined && (typeof max === "number")) {
		result["maxLength"] = max;
	}
	
	if (displayWidth != undefined && (typeof displayWidth === "number")) {
		result["displayWidth"] = displayWidth;
	}
	
	if (displayHeight != undefined && (typeof displayHeight === "number")) {
		result["displayHeight"] = displayHeight;
	}
	
	result["helpText"] = "";

	if (isRequired != undefined  && (typeof isRequired ===' boolean')) {
		result["required"] = isRequired;
	}

	return result;
}

function genToggleElement(key, label, isRequired, statement) {
	var result = {};
	
	result["key"] = key;
	result["label"] = label;
	result["elementType"] = "toggle";

	if (statement != undefined && (typeof min === "string")) {
		result["statement"] = statement;
	}
	
	result["helpText"] = "";

	if (isRequired != undefined  && (typeof isRequired ===' boolean')) {
		result["required"] = isRequired;
	}

	return result;
}


function genVideoElement(key, label, isRequired, acceptType) {
	var result = {};
	
	result["key"] = key;
	result["label"] = label;
	result["elementType"] = "toggle";

	if (acceptTYpe != undefined) {
		result["acceptType"] = acceptType;
	}
	
	result["helpText"] = "";

	if (isRequired != undefined  && (typeof isRequired ===' boolean')) {
		result["required"] = isRequired;
	}

	return result;
}

function genVideoAcceptType(isWebm, isOgg, isMpg, isAvi, isMov, isWmv, isMp4) {
	var result = [];
	
	if (isWebm != undefined && isWebm) {
		result.push("webm");
	}

	if (isOgg != undefined && isOgg) {
		result.push("ogg");
	}
	

	if (isMpg != undefined && isMpg) {
		result.push("mpg");
	}
	

	if (isAvi != undefined && isAvi) {
		result.push("avi");
	}
	

	if (isMov != undefined && isMov) {
		result.push("mov");
	}
	
	if (isWmv != undefined && isWmv) {
		result.push("wmv");
	}
	
	if (isMp4 != undefined && isMp4) {
		result.push("mp4");
	}
	
	return result;
}


module.exports.genCategoryElement = genCategoryElement;
module.exports.genDateElement = genDateElement;
module.exports.genFileElement = genFileElement;
module.exports.genFileAcceptType = genFileAcceptType;
module.exports.genImageElement = genImageElement;
module.exports.genImageAcceptType = genImageAcceptType;
module.exports.genLinkElement = genLinkElement;
module.exports.genNumberElement = genNumberElement;
module.exports.genTextElement = genTextElement;
module.exports.genToggleElement = genToggleElement;
module.exports.genVideoElement = genVideoElement;
module.exports.genVideoAcceptType = genVideoAcceptType;

