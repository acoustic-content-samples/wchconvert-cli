# wchconvert
## IBM Watson Content Hub Conversion Tools


### Summary
The IBM Watson Content Hub Conversion Tools provide a command line interface (CLI) based utility called wchconvert for converting IBM WCM Content to be used with Watson Content Hub. This utility allows developer or other users to download (pull) content, authoring templates, file components, and image components from WCM to the local file system.  The tool can then provide analysis on the downloaded artifacts and convert them to the Watson Content Hub format.  Once the artifacts have been converted, they can be uploaded (pushed) to Watson Content Hub. The tool uses IBM Watson Content Hub Developer Tools (wchtools) to push the content to Watson Content Hub.


### License and Notices
Please review the [LICENSE](https://github.com/ibm-wch/wchconvert-cli/blob/master/LICENSE) and [NOTICE](https://github.com/ibm-wch/wchconvert-cli/blob/master/NOTICE) files at the root of this project's git repository before you download and get started with this toolkit.

### Prerequisites
 Before you install the wchconvert CLI, you must install Node 4.3 or a later 4.x version. IBM Node 4.6 or a later 4.x version is suggested.  

 You will also need to install the latest version of wchtools.  You may install the wchtools CLI as a node module directly from the npm registry at https://npmjs.com,  or by downloading and installing a release from the [wchtools-cli git repository](https://github.com/ibm-wch/wchtools-cli/releases).

#### Installing wchconvert

1. Download the wchconvert.zip from the [wchconvert git repository](https://github.com/ibm-wch/wchconvert-cli/archive/master.zip).
2. Unzip the wchconvert.zip.
3. At the command line, cd into the directory where the wchconvert package.json resides.
4. Run "npm install" to install wchconvert and its dependencies
5. Run "npm link" to setup the wchconvert wrapper script and path
6. Then follow the Getting Started instructions below, to configure and start using the wchconvert command line.

Note: For Max OS devices, you will need to specify sudo before the npm commands. For example: `sudo npm install`.

### Getting Started

  Before using wchconvert, you will need to initialize the wchtools cli. This is documented in the [wchtools readme file](https://github.com/ibm-wch/wchtools-cli/blob/master/README.md).

  Once wchtools is configured, try the following command to get a list of all commands and options for wchconvert: `wchconvert -help`

    Usage: wchconvert <command> -connectionId <connectionId> [-password <password> -dir <dir>]

    Commands:

    pull                Connects to Portal Server and downloads content, types, and assets.
    prepareAssets       Verifies all assets are downloaded, fixes asset names, and removes duplicate assets.
    pushAssets          Pushes assets to WCH using wchtools.
    analyze             Provides information on type and content to assist conversion process.
    convert             Converts WCM content and types to the WCH format.
    pushTypes           Pushes types to WCH using wchtools.
    pushContent         Pushes content to WCH using wchtools.

    Options:

    -connectionId       A user-defined name to describe the Portal Server connection in the settings.json.
    -password           [Optional] For pull, the password for Portal. For the push commands, the password 
                        for WCH. If not specified, wchconvert will look for the password in the settings.json 
                        for the pull command and wchtools will prompt for the password in the push commands.
    -dir                [Optional] Path where the settings.json is located and where wchconvert will download
                        the portal artifacts and create the converted artifacts. If not specified, wchconvert 
                        will look for the settings.json in the current directory and output to the current 
                        directory.		
		


#### Definitions

The following table is a list of the artifacts in WCM and what they are called in WCH:

  WCM   |  WCH
  -------|------
  Content | Content
  Authoring Templates (Content Templates) | Types
  Image Components | Assets
  File Components | Assets

  The nature of the tool is converting the WCM artifacts to the WCH format, so the WCM and WCH names of the artifacts will be used interchangeably throughout this document. Also the fields contained with the types and content items will be referred to as fields and elements.

#### Local file system layout and working directory

  The wchconvert utility operates against a working directory, and requires specific folders as direct children of that working directory. A connectionId is required for each command and a folder with the connectionId name will be created under the working directory.  Each child folder of the `<working directory>/<connectionId>` separates artifacts based on the Watson Content Hub service that manages those artifacts.

  The working directory for the root of this file system layout is either the current directory where wchconvert is run, or the path that is specified by the -dir argument.

  The actual authoring or web resource artifacts are stored in the following sub-folders under the `<working directory>/<connectionId>`.

    <working dir>/...
      settings.json           Contains connection information for Portal. The password can be ommitted from the
                              settings.json and specified at the command line
      <connectionId>/...      Sub-folder created under the working dir which is the value specified for the connectionId
      	 assets/dxdam/...     Managed Authoring Assets, uploaded via Authoring UI and tagged with additional metadata
      	 content/...          Authoring content items
         types/...            Authoring content types
         dxAssetsJson/...     WCM file component and image component json files used for conversion but are not uploaded
                              to WCH
         libraryNames.json    List of the WCM libraries and their IDs
         typeNames.json       List of the type names and their IDs - Type names must be unique so if a unique type name 
                              is generated by wchconvert it will be recorded here
         duplicateAssets.json Contains a list of WCM Asset IDs that were detected as duplicates and were deleted during 
                              the analyze command
         md5Hashes.json       Contains a list of the md5 hashes that were generated for files while trying to find 
                              duplicates during the analyze command
		  
### Process Overview

The WCH Convert tool is used to download content, types, and assets from the Portal Server to the local file system and then convert the artifacts so they can be pushed to WCH.  The tool is currently intended to be used as a one-time batch process of the Portal content, types, and assets, but future versions may include functionally to perform updates.  The tool also is intended to be used against a new unpopulated WCH Tenant.  If the WCH tenant is already populated, you will need to make sure that the type names that exist in WCH and Portal are unique.

#### Commands
* Pull content, types, and assets from DX  
   `wchconvert pull -connectionId <connectionId> [-password <portal password> -dir <dir>]`
* Prepare assets for WCH  
   `wchconvert prepareAssets -connectionId <connectionId> [-dir <dir>]`
* Push assets using wchtools  
   `wchconvert pushAssets -connectionId <connectionId> [-password <wch password> -dir <dir>]`
* Analyze content and types (optional)  
   `wchconvert analyze -connectionId <connectionId> [-dir <dir>]`
* Convert content and types to the WCH format  
   `wchconvert convert -connectionId <connectionId> [-dir <dir>]` 
* Push types and content using wchtools  
   `wchconvert pushTypes -connectionId <connectionId> [-password <wch password> -dir <dir>]`  
   `wchconvert pushContent -connectionId <connectionId> [-password <wch password> -dir <dir>]`

#### Options
* **connectionId** - A user-defined name to describe the Portal Server connection in the settings.json.  This parameter is case sensitive.
* **dir** - Path where the settings.json is located and where wchconvert will download the portal artifacts and create the converted artifacts.  This parameter is optional and if not specified, the tool will use the current directory.
* **portal password** - Password for connecting to the Portal server which is used in the pull command.  This can also be specified in the settings.json.
* **wch password** - Password for connecting to the WCH server which is used in the push commands.  This must be specified at the command line and cannot be specified in the settings.json.

To view **help** information you can run `wchconvert -help` at the command line.


#### Editing the Settings.json
  A sample settings.json is included in the wchconvert.zip.  The settings.json must exist in the working directory for wchconvert to operate successfully.

Here is an example entry from the settings.json:  

    { "connectionId": "dxtest"  
    , "host": "dxtest.ibmcollabcloud.com"  
    , "port": 80  
    , "username" : "admin"  
    , "password" : ""  
    , "contentHandlerPath" : "/wps/mycontenthandler"  
    , "secure" : false  
    , "libraryName" : "dx content, dx design, dx resources"  
    }

* **connectionId** is a user defined variable which is also where the files will be stored.
* **libraryName** is used to specify the libraries that you want to download.  libraryName can be left blank if you want to pull down all libraries. To specify more than one library, pass in a comma-delimited list.  Keep in mind wchconvert will always skip the following system libraries: Blog Solo Template v70, Blog Template v70, Site Builder Template Library, Social Lists 1.0, Template Page Content 3.0, Web Content Templates 3.0, and Web Resources v70.
* **password** is the Portal Password and can be left blank and passed in at the command line.
* **contentHandlerPath** is the url required to access the Portal Content Handler Framework.  The default is `/wps/mycontenthandler`. If you are connecting to a Virtual Portal named VP1, the contentHandlerPath would look like `/wps/mycontenthandler/VP1`.


### Pulling content to a local file system

  After configuring the settings.json, you can pull content, authoring templates, image components, and file components from your Portal Server by running the command:

    wchconvert pull -connectionId <connectionId> [-dir <dir> -password <portal password>]

  This will download all of the artifacts from the Portal server to the `./<working dir>/<connectionId>` folder.  If there is a failure, the process can be re-run and it will skip any files that have already been downloaded.  The tool only downloads live content. It does not download drafts or expired content. 
  
  The process will first download all of the content in the specified libraries and make a list of authoring templates, file components, and image components referenced by those content items so they can be downloaded later. This ensures that all of the required artifacts to push the content successfully to WCH are downloaded even if they are located in a different library. Once this is complete, the tool will get a list of all authoring templates, file components, and image components that are in the specified libraries and add them to the list of artifacts that need to be downloaded.  In order to get the path to download the file and image components, wchconvert will generate _adx.json files for each component in the dxAssetJson folder. After the lists of authoring templates, image componenets, and file componenets that need to be downloaded have been compiled, whcconvert will download those artifacts.
  
  Content is stored under the content folder and has subdirectories based on the library id that the content is retrieved from.  This makes it easier to find content from a specific library.  The filenames are the ID of the content will have a _cdx.json extension. For example: `./<working dir>/<connectionId>/content/<libraryId>/<contentId>_cdx.json`
  
  Types are stored under the types folder and do not have subdirectories based on the library. The tool is designed to operate in this fashion because the types referenced in the content json files do not include library information and would require the authoring template to be downloaded in order to determine the library that the authoring template belongs in. This would then break the ability to skip already downloaded types since we would be required to download the type to determine the full path.  Typically there are much fewer types than there are content items so having them all in one folder is not typically an problem.  The filenames of the types are also the ID and will have a _tdx.json extension.  For example: `./<working dir>/<connectionId>/content//<typeId>_tdx.json`
  
  Assets are stored under `assets/dxdam/wcm` to match the wchtools convention for assets that can be managed.  There will also be in a subfolder created which is the WCM Asset ID that is used by Portal.  For example: `./<working dir>/<connectionId>/assets/dxdam/wcm/<WCM Asset ID>/<filename>`. This WCM Asset id is essential later when mapping Portal content to the referenced assets.  
  
  A **libraryNames.json** file is generated in `./<working dir>/<connectionId>/libraryNames.json` which records all the library names and their ids. The **wchconvert.log** will also be created in the path where the tool is run.

  NOTE: If you would like to only push content of a specific type, see the section "Filtering by type" in the "Additional Tools" below.  

### Preparing assets for Watson Content Hub
  
  After the WCM artifacts have been pulled down from the Portal server to the local file system, you will need to prepare the assets to be pushed by running the command:
      
    wchconvert prepareAssets -connectionId <connectionId> [-dir <dir>]
    
  This step will check that all of the assets have downloaded correctly.  If an asset folder is empty, this indicates that the asset is missing and the process will fail.  If the tool reports that an asset folder is empty, you can re-run the pull command to see if wchconvert is able to successfully download the missing assets and then try prepareAssets again.  If the prepareAssets still reports missing assets, then most likely a content item has a reference to a file that is missing.  To continue you will need fix the content item to reference to point to a valid file or manually delete the folders that are being reported as empty asset folders.

  Here is an example of the missing asset error message:  
  
      Searching for empty asset folders in C:\Projects\WCH\workspace/testServer/assets:  
      - C:\Projects\WCH\workspace/testServer/assets/dxdam/wcm/0a13737e-3f54-4b0f-b1ce-e53a57a59b0a  
      Verify that all assets have been correctly downloaded before continuing.
      
  Once wchconvert verifies that all assets have been downloaded, wchconvert will check the file name of each asset. This is necessary because WCH has stricter requirements for file names than WCM. Any files with '+' in its name will have it replaced with '_'.  Also WCH requires that all files have an extension, so if a file has no extension, prepareAssets will add a ".nox" extension to the filename.  prepareAssets is also able to fix file names that have an obvious extension - for example: "demo+image-jpg" which will be changed to "demo_image.jpg".
  
  Another difference between WCM and WCH is that WCH does not allow BMP files.  The prepareAssets task will convert any bmp files to jpg so that they can be pushed to and referenced by content in WCH successfully.

  After the file names have been corrected, the prepareAssets task will delete duplicate asset files to reduce the amount of disk space required by the assets.  The tool will generate an MD5 hash for every asset and compare them to find duplicate files. The md5hashes are stored in the `md5Hashes.json` file. It will then delete any duplicate files and record information in the `duplicateAssets.json` that will be used during the conversion process. Because the duplciate files are found using the MD5 hash, even files with different file names will be accurately detected as duplicate files.


### Uploading file and image assets to Watson Content Hub

  The next step will be push the assets to WCH using the command:
  
    wchconvert pushAssets -connectionId <connectionId> -password <wch password> [-dir <dir>]
    
  Since the assets pulled down from DX are just files, we need generate asset ids which will be used by WCH to reference the assets from within content. This requires us to push the assets prior to performing the conversion of content and types.  Later when the conversion is run, wchconvert will generate a map of the WCM Asset ID to the WCH Asset ID and use this map in the conversion process.
  
  The push is performed using wchtools, so wchtools must be installed and configured prior to running the pushAssets task.
  
  After the push is complete a WCH json file should be created for each asset which will be in the format `<filename>_amd.json`. In order to map the WCH Asset ID to the WCM Asset ID, you can use the information in the _amd.json.  The ID field in the _amd.json file will contain the WCH Asset ID and the path field will contain the WCM Asset ID in the format `assets/dxdam/wcm/<WCM Asset ID>/<filename>`.


### Analyzing downloaded content and authoring templates

  The next task provides information on the downloaded content, types, and assets to help you prepare for the differences in WCM and WCH. To obtain this information run:
  
    wchconvert analyze -connectionId <connectionId> [-dir <dir>]

  This is an optional step, but is highly recommended. It provides the following information:  
  - each type and every content item that uses that type
  - the differences in the fields contained in a type and element
  - the types which have fields that do not convert easily to WCH- such as HTML or JSP fields
  - content items that have empty fields
  - content items that have invalid references to assets

  This information will be written to the console and the wchconvert.log file.  It is recommended that you save the wchconvert.log that is generated during the analyze task so that you can refer to in the future. However, it is possible to re-run the analyze task in the future to generate this information again.

  The difference between the fields in content and their types is important because when a content item goes live it will be updated to match the type.  If the content had additional fields, they will be removed from the content item.  If the the content is missing a field, the missing field will be added when the content goes live. This information is displayed in the list of types and the content items that implement each type.  After the content item is listed, the fields that are different will be listed.  Fields with a "+" are extra fields that exist only in the content item.  Fields with a "-" are fields that are missing from the content item.  If no fields are listed after the content item, then the content item matches the type.

  For example the following output shows that the type "Page" has [6] content items based on the type: 

    TYPE: Page (9d5b298046fcb23a99b6fd9cba17afa7) [6]  
    [1] About (43e9b2004e959a888a6f8e0114b7432b)  
    [2] Contact (68cb8b804e677f1288ef98b1ee599595)  
         + Summary2  
         - Summary  
    [3] Welcome (db30e5004e554deab143b75f344d3f73)  
         - Parent  
    [4] Mission (e3591d004e556bffb186b75f344d3f73)  
    [5] Default (ea3602004e30693bac6efd19c9f9d779)  
    [6] Help (c741e780466d606f92a4f7fce7b52dbc)  

  For the content items that implement the Page type, the "Contact" content item is missing the "Summary" field and has an extra "Summary2" field that doesn't exist in the type.  The "Welcome" content item is missing the "Parent" field. The other content items match the type exactly.
  
  If during the prepareAssets step, you had to delete empty asset folders because the asset does not exist on the server, you will see a message that looks like:
  
  `[1] Content has invalid asset reference. ContentID:8d9eb4004724cadd9eaadeccce11aaf1, DX Asset ID:105869804724cbd99eaddeccce11aaf1` 

  If you manually deleted the empty folder for this DX Asset ID which will match the folder name you deleted, you can ignore this warning. If you did not have to manually delete any empty asset folders, you will want to check that this content item has the correct images or files associated with it after you have converted and pushed the content item to WCH.
  

### Converting downloaded content and authoring templates
  
  The next command is the key function of the wchconvert tool which converts the WCM based json files to the WCH format so that they can be pushed to WCH.To perform the conversion, run the command:
  
    wchconvert convert -connectionId <connectionId> [-dir <dir>] 

  This will create _tmd.json and _cmd.json files for the WCH types and content. The json files will be created directly in the `./<working directory>/<connectionId>/types` and `./<working directory>/<connectionId>/content` folders.  The original dx json files are not modified or deleted during the conversion process.
  
  WCH requires type names to be unique so you will notice that some types may have names with a 4-digit number appended.  The type names are stored in the typeNames.json file so that they can be re-used if the types need to be converted again in the future. 

  Also, WCH does not allow spaces, hyphens, dollar sign, exclamation point, and parenthesis in element key values, so those are automatically converted to underscores.

  The WCM Title Field will be used to set the WCH Name field and the WCM Summary Field will populate the WCH Description fields. The other content fields will retain their names and values. The field types that exist in WCM and WCH however do not completely line up. There are several field types that exist WCM that do not exist in WCH. The following table lists the field type mappings from WCM to WCH:
  

  **WCM** | **WCH**
  ----------|-----------
  *ReferenceComponent* | **_Text_**
  DateComponent | Date
  FileComponent | File
  *HTMLComponent* | **_Text_**
  ImageComponent | Image
  *JSPComponent* | **_Text_**
  LinkComponent | Link
  NumericComponent | Number
  *OptionSelectionComponent* | **_Text_**
  *RichTextComponent* | **_Text_**
  ShortTextComponent | Text
  TextComponent | Text
  *UserSelectionComponent* | **_Text_**

  
  The WCM field types that are *italicized* do not map directly WCH and are created in WCH as a Text field.  Also the Category, Video, and Toggle field types that exist in WCH are not used in the conversion process.

#### Additional Conversion Rules

  * Type names in WCH must be unique - so the tool will generate unique type names and store them in typeNames.json
  * Element names cannot contain space or hyphen, so they are replaced with underscore
  * Asset names must have an extension. If it does not, the tool will add a ".nox" extension.
  * BMP files are not allowed as images and will be converted to jgp files.
  * If a filename contains '%2F' or '+', it will be replaced with '_'.

#### Other Conversion Consideration

  The wchconvert tool will bring the value of the fields in content as-is from Portal to WCH.  If you have fields with references to the Portal environment - such as a URL to an image hosted on Portal - the text will be preserved and brought over to the WCH server without any changes.
  
  If there are fields that you will not require within WCH, you can remove them from the types and when the content is published, the unnecessary fields will be removed. 
	

### Uploading converted types and content to Watson Content Hub

  The final commands will push the converted types and content to WCH:
  
    wchconvert pushTypes -connectionId <connectionId> -password <wch password> [-dir <dir>]
    wchconvert pushContent -connectionId <connectionId> -password <wch password> [-dir <dir>]
    
  Although it is possible to push both the content and types at the same time using wchtools, wchconvert will only allow pushing either content or types. The content will not be successful if the type does not exist - so if there is an error pushing a type, then there will be a subsequent error for each content item of that type that is pushed.  To prevent this chain of errors from occurring, wchconvert requires that you first push the types, make sure that worked, and then push the content.
 
### Verifying conversion

  After the conversion process is complete and the converted content, types, and assets have been pushed to WCH, it is recommended that you compare the WCH content and types with their WCM counterparts.  The IDs for the content and types should be the same between WCM and WCH.  Also the WCM and WCH json files for the content and types will have file names based on their IDs.  Finding the matching Assets between WCM and WCH is a bit tricker because the deletion of duplicate assets and the IDs of the assets do not match between WCM and WCH.  However, the path of the Asset files includes the WCM ID so it is possible to determine the matching assets based on the ID and path of each asset.  Also the duplicateAssets.json file which contains WCM Asset IDs will provide information on the duplicate files which were deleted.
  
  As mentioned previously, if there are fields that were brought over during the conversion that are no longer needed in the WCH, you can remove the fields from the types and when the content is published, the fields in the content will be updated to match the fields in the type is is based on.


### Limitations

  Please keep in mind the following limitations when using the wchconvert tool.

  * Portal Server must be version 8.5 or later
  * Content description length is 500 characters
  * Text fields max length is 10,000 characters
  * Security Information and user info is not preserved
  * Tag library references in Rich Text are not resolved
  * Library index images are not updated and will continue pointing to the Portal URI
  * Created/Modified date information is lost
  * Site structure is not maintained
  * Only live items are pulled down by the tool - drafts and expired content are ignored
  * Locale is preserved but MLS functionality is not configured
  * WCH link elements can only use text as the description, so WCM link elements that referenced images will have the link description set to the path of the image that was originally specified
 
### Important Files
  * `<working directory>/settings.json`:  contains connection information for Portal
  * `<working directory>/<connectionId>/duplicateAssets.json`: contains a list of WCM Asset IDs that were detected as duplicates and were deleted
  * `<working directory>/<connectionId>/md5Hashes.json`: contains the md5 hashes of all the assets and shows the duplicate file names
  * `<working directory>/<connectionId>/typeNames.json`: type names must be unique, so the tool may generate unique type names when it finds duplicates
  * `<working directory>/<connectionId>/libraryNames.json`: a list of library names and library IDs
  * `wchconvert.log`: log file for wchconvert that is generated in the path the tool is run from
  * `wchtools-api.log`: log file for wchtools created in path where the tool is run form
  * `wchtools-cli.log`: log file for wchtools created in the path where the tool is run from


### Uninstall and Update
  
  To completely uninstall wchconvert:  
  * cd to the directory where the wchconvert package.json file exists
  * run `npm unlink`
  * run `npm uninstall`

  To reinstall or update wchconvert:  
  * cd to the directory where the wchconvert package.json file exists
  * run `npm uninstall`
  * unzip the new wchconvert.zip package to different location (or delete the original files and unzip to the same location)
  * run `npm install`
  * run `npm link`

Note: For Max OS devices, you will need to specify sudo before the npm commands. For example: `sudo npm install`.

### Additional Tools

The wchconvert has some additonal tools that are packaged in the lib folder that must be run as node scripts.  These are not core features of the product, but may be helpful.

#### Filtering content by type

If you need to only convert content of a specific type, a typeFilter.js is included in the lib folder to perform this functionality.

Immediately after running `wchconvert pull` you will want to run:  
`node lib/typeFilter.js -connectionId <connectionId> -type <typeName> [-dir <working directory>]`

This will scan through all of the content and filter out only the content items based on the specified type and copy them to a new folder named `<working directory>/<connectionId>-<typeName>`.  If the type name has spaces make sure to use quotes around the type name.  This will also copy over the specified type and all of the assets referenced by the content.

After the typeFilter.js is complete, you can rename the original folder `<working directory>/<connectionId>` to `<working directory>/<connectionId>-complete` and then rename `<working directory>/<connectionId>-<typeName>` to `<working directory>/<connectionId>`.

Once you have renamed the folders, you can continue with the wchconvert conversion process and only the content based on the specified type will be converted and pushed to WCH.


#### Deleting WCH Json Files

If you need a quick way to delete all of the _amd.json, _cmd.json, and _tmd.json files that are generated, you can just use the lib/deleteWCHJson.js script.

`node lib/typeFilter.js -connectionId <connectionId> [-dir <working directory>]`



### Git Repository
  The IBM Watson Content Hub Developer Tools are provided as open source and made available in github.
  While it is not necessary to obtain the source from the github repository in order to install the release version of wchtools, you may choose to clone the github repository to access the source for the developer tools.  After cloning the github repository you can run npm install from the root folder of the local copy.


