# wchconvert
## Acoustic Content Conversion Tools


### Summary
The Acoustic Content Conversion Tools provide a command line interface (CLI) based utility called wchconvert. Developers and other users can use this tool to convert IBM Web Content Manager Content into a format that can be used with Acoustic Content (formerly Watson Content Hub). The wchconvert tool downloads (pulls) content, authoring templates, file components, and image components from WCM to the local file system. The tool then analyzes the downloaded artifacts and converts them to the Acoustic Content format. After the artifacts are converted, they are uploaded (pushed) to Acoustic Content with the Acoustic Content Developer Tools (wchtools).


### License and Notices
Review the [LICENSE](https://github.com/ibm-wch/wchconvert-cli/blob/master/LICENSE) and [NOTICE](https://github.com/ibm-wch/wchconvert-cli/blob/master/NOTICE) files at the root of this project's Git repository before you download and get started with this toolkit.

### Prerequisites
 * Before you install the wchconvert CLI, you must install Node 4.3 or a later 4.x version. IBM Node 4.6 or a later 4.x version is suggested.
 * You must also install the most recent version of wchtools.  You can install the wchtools CLI as a node module directly from the npm registry at https://npmjs.com,  or download and install a release from the [wchtools-cli git repository](https://github.com/ibm-wch/wchtools-cli/releases).
 * It is recommended that you start with an empty WCH tenant. If you want to keep the samples on your tenant, you will need to perform an extra step during the prepare assets section to ensure the type names are unique during the conversion proccess.

**NOTE**:  If you migrated to Portal 8.5 from a previous version of Portal using the Profile-based migration to a version before Portal 8.5 CF15, you will need to update your environment to Portal 8.5 CF15 and perform the following steps:

1. Run the config engine task: action-update-wcm-remote-admin-ear
2. Run the config engine task: run-wcm-admin-task-update-sitearea

This will repair possible issues with site areas that may have occurred during migration documented in APAR PI88720.  You can skip this step however, if you will not be downloading content based on site areas.

If you will download 100,000s of items from your Portal Server, you will need increase the transaction timeout as documented in http://www-01.ibm.com/support/docview.wss?uid=swg21611073

#### Installing wchconvert

1. Download the wchconvert-cli-master.zip from the [wchconvert Git repository](https://github.com/ibm-wch/wchconvert-cli/archive/master.zip).
2. Extract the wchconvert-cli-master.zip.
3. At the command line, cd into the directory where the wchconvert package.json file is located.
4. Run "npm install" to install wchconvert and its dependencies.
5. Run "npm link" to set up the wchconvert wrapper script and the path.
6. Follow the Getting Started instructions in the next section to configure and use the wchconvert command line tool.

**Note:** For Mac OS devices, specify sudo before the npm commands. For example: `sudo npm install`.

### Getting Started

  Before you start to use wchconvert, you must initialize the wchtools cli. Follow the instructions documented in the [wchtools readme file](https://github.com/ibm-wch/wchtools-cli/blob/master/README.md).

  After you configure wchtools, use `wchconvert -help` command to get a list of all commands and options for wchconvert.

    Usage: wchconvert <command> -connectionId <connectionId> [-wcmPassword <Portal WCM password> -wchPassword <WCH password> -dir <dir>]

    Commands:

    pull                Connects to Portal Server and downloads content, types, and assets.
    prepareAssets       Verifies all assets are downloaded, fixes asset names, and removes duplicate assets.
    pushAssets          Pushes assets to WCH with wchtools.
    analyze             Provides information on type and content to assist conversion process.
    convert             Converts WCM content and types to the WCH format.
    pushTypes           Pushes types to WCH with wchtools.
    pushContent         Pushes content to WCH with wchtools.

    Options:

    -connectionId       Define a name to describe the Portal Server connection in the settings.json.
    -wcmPassword        [Optional] For pull, the password for Portal WCM. If not specified, wchconvert will look for the Portal WCM password in the settings.json.
    -wchPassword        [Optional] For push commands, the password for WCH. If not specified, wchconvert will prompt for the password during the push commands.
    -dir                [Optional]  Provide the path where the settings.json is located. wchconvert downloads the portal artifacts and creates the converted artifacts to this location. If not specified, wchconvert looks for the settings.json in the current directory and output to the current directory.

**NOTE**: whconvert v2 has a different command line options and settings.json configuration than v1. Make sure to update any scripts that are used to call the tool and the settings.json files prior to using this updated version.

#### Definitions

The following table is a list of the artifacts in WCM and what they are called in WCH:

  WCM   |  WCH
  -------|------
  Content | Content
  Authoring Templates (Content Templates) | Types
  Image Components | Assets
  File Components | Assets

 **Note:** The purpose of the tool is to convert the WCM artifacts to the WCH format, so the WCM and WCH names of the artifacts are used interchangeably throughout this document. Also, the fields that are contained with the types and content items are referred to as fields and elements.

#### Local file system layout and working directory

  The wchconvert utility operates against a working directory, and requires specific folders as direct children of that working directory. A connectionId is required for each command and a folder with the connectionId name is created under the working directory.  Each child folder of the `<working directory>/<connectionId>` separates artifacts based on the Watson Content Hub service that manages those artifacts.

  The working directory for the root of this file system layout is either the current directory where wchconvert is run, or the path that is specified by the -dir argument.

  The actual authoring or web resource artifacts are stored in the following subfolders under the `<working directory>/<connectionId>`.
```
  <working dir>/...
    settings.json           Contains connection information for Portal. The Portal WCM password can be omitted from the settings.json and specified at the command line.
    sampleTypeNames.json    Used to load the sample type names into wchconvert during the conversion if the WCH samples are loaded on the tenant.
    <connectionId>/...      Subfolder created under the working dir, which is the value that is specified for the connectionId.
      assets/dxdam/...      Contains managed Authoring Assets that are uploaded through the Authoring UI and tagged with additional metadata.
      content/...           Contains Authoring content items.
      types/...             Contains Authoring content types.
      dxAssetsJson/...      Contains WCM file component and image component JSON files used for conversion. These files are not uploaded to WCH.
      libraryNames.json     Contains the list of the WCM libraries and their IDs. Only created if filterType is set to Library.
      siteAreaNames.json    Contains the list of the WCM Site Areas and their IDs. Only created if filterType is set to SiteArea.
      folderNames.json      Contains the list of the WCM Folder and their IDs. Only created if filterType is set to Folder.
      typeNames.json        Contains the list of the type names and their IDs - Type names must be unique so if a unique type name is generated by wchconvert it is recorded here.
      duplicateAssets.json  Contains a list of WCM Asset IDs that are detected as duplicates and are deleted during the analyze command.
      md5Hashes.json        Contains a list of the md5 hashes that are generated for files while trying to find duplicates during the analyze command.
```
### Process Overview

The WCH Convert tool is used to download content, types, and assets from the Portal Server to the local file system and then convert the artifacts so they can be pushed to WCH.  The tool is intended to be used as a one-time batch process of the Portal content, types, and assets, but future versions may include functionality to perform updates.  The tool also is intended to be used against a new unpopulated WCH Tenant.  If the WCH tenant is already populated, you must make sure that the type names that exist in WCH and Portal are unique.

#### Commands
* Pull content, types, and assets from DX  
   `wchconvert pull -connectionId <connectionId> [-wcmPassword <Portal WCM password> -dir <dir>]`
* Prepare assets for WCH  
   `wchconvert prepareAssets -connectionId <connectionId> [-dir <dir>]`
* Push assets using wchtools  
   `wchconvert pushAssets -connectionId <connectionId> [-wchPassword <WCH password> -dir <dir>]`
* Analyze content and types
   `wchconvert analyze -connectionId <connectionId> [-dir <dir>]`
* Convert content and types to the WCH format  
   `wchconvert convert -connectionId <connectionId> [-dir <dir>]`
* Push types and content using wchtools  
   `wchconvert pushTypes -connectionId <connectionId> [-wchPassword <WCH password> -dir <dir>]`
   `wchconvert pushContent -connectionId <connectionId> [-wchPassword <WCH password> -dir <dir>]`

#### Options
* **connectionId** - A user-defined name to describe the Portal Server connection in the settings.json.  This parameter is case-sensitive.
* **dir** - Provide the Path where the settings.json is located and where wchconvert downloads the portal artifacts and creates the converted artifacts.  This parameter is optional and if not specified, the tool uses the current directory.
* **wcmPassword** - Provide the password that is used in the pull command to connect to the Portal WCMserver. You can also provide the password in the settings.json file.
* **wchPassword** - Provide the password that is used in the push command to connect to the WCH server. You must provide the password at the command line and not in the settings.json file.

To view **help** information, run the `wchconvert -help` command.


#### Editing the Settings.json
  A sample settings.json file is included in the wchconvert-cli-master.zip.  The settings.json file must exist in the working directory for wchconvert to operate successfully.

Here is an example entry from the settings.json that would pull live content, authoring templates, image components, and file components from the Site Areas named "Home" and "Forms" and the Site Area with the UUID "9cf53f27-2b7d-40d6-8746-37e84ad80f1e" on the Portal Server at test.domain.com:10039.
```
{
    "connectionId": "example3",
    "host": "test.domain.com",
    "port": 10039,
    "wcmUsername": "wpsadmin",
    "wcmPassword": "",
    "contentHandlerPath": "/wps/mycontenthandler",
    "secure": false,
    "filterName": "Home, Forms, 9cf53f27-2b7d-40d6-8746-37e84ad80f1e",
    "filterType": "SiteArea"
}
```
* **connectionId** is a user defined variable, which is also where the files are stored.
* **wcmPassword** is the Portal WCM Password and can be left blank and passed in at the command line.
* **contentHandlerPath** is the url that is required to access the Portal Content Handler Framework. The default is `/wps/mycontenthandler`. If you are connecting to a Virtual Portal named VP1, the contentHandlerPath would look like `/wps/mycontenthandler/VP1`.
* **filterName** is used to specify the Libraries, Site Areas, or Folders that you want to download. Either the name or ID of the artifact can be used. Leave the filterName blank if you want to download all of the specified filterType. To specify more than one Library, SiteArea, or Folder, pass in a comma-delimited list.
* **filterType** is used to indicate which filter should be used. The valid options are Library, SiteArea, or Folder. If filterType is blank, it will default to Library.
 
 For more example configurations, view the settings.json file that is included with the install package.
 
**Note:** wchconvert will skip the following system libraries: Blog Solo Template, Blog Solo Template v70, Blog Template, Blog Template v70, Blog Resources, Site Builder Template Library, Social Lists 1.0, Social Lists 1.1., Template Page Content 3.0, Wiki Resources, Wiki Template, Wiki Template v70, Script Application Library, Web Content Templates 3.0, and Web Resources v70.


### Pulling content to a local file system

  After you configure the settings.json file, you can pull content, authoring templates, image components, and file components from your Portal Server by running the following command:

    wchconvert pull -connectionId <connectionId> [-dir <dir> -wcmPassword <WCM password>]

  This command downloads all of the artifacts from the Portal server to the `./<working dir>/<connectionId>` folder.  If there is a failure, rerun the command, any files that are already been downloaded are skipped.

  **Note:** The tool downloads only live content. It does not download drafts or expired content.

  * The wchconvert tool first downloads all of the content in the specified libraries.
  * Then, it creates a list of authoring templates, file components, and image components that are referenced by those content items so they can be downloaded later. This step ensures that all of the artifacts that are required to push the content successfully to WCH are downloaded even if they are located in a different library.
  * After this process is complete, the tool gets a list of all authoring templates, file components, and image components that are in the specified libraries and adds them to the list of artifacts that need to be downloaded.
  * To get the path to download the file and image components, wchconvert generates _adx.json files for each component in the dxAssetJson folder.
  * After the lists of authoring templates, image components, and file components that need to be downloaded are compiled, whcconvert downloads those artifacts.
  * During the download process, the artifacts are parsed as JSON. Characters that can cause the JSON parse to fail such as \n or \r and ASCII control character will be removed so that the artifacts can be converted into JSON.

  Content is stored under the content folder with subdirectories based on the library ID that the content is retrieved from.  This method of organization makes it easier to find content from a specific library.  The file names, which are also the ID of the contents have a _cdx.json extension. For example: `./<working dir>/<connectionId>/content/<libraryId>/<contentId>_cdx.json`

  Types are stored under the types folder with no subdirectories based on the library. The tool is designed to operate in this fashion because the types that are referenced in the content JSON files do not include library information. To determine the library, the authoring template must be downloaded. Downloading the authoring template would break the ability of the tool to skip types that were already downloaded as it requires downloading the type to determine the full path.  Typically there are much fewer types than there are content items so having them all in one folder is not a problem.  The file names, which are also the ID of the types have a _tdx.json extension.  For example: `./<working dir>/<connectionId>/content//<typeId>_tdx.json`

  Assets are stored under `assets/dxdam/wcm` to match the wchtools convention for assets that can be managed. A subfolder is also created which is the WCM Asset ID that is used by Portal. For example: `./<working dir>/<connectionId>/assets/dxdam/wcm/<WCM Asset ID>/<filename>`. This WCM Asset ID is essential to map Portal content to the referenced assets.

  A **libraryNames.json**, **siteAreaNames.json**, or **folderNames.json** file is generated in `./<working dir>/<connectionId>/`, which records all the library names, site area names, or folders and their IDs. The file is only created if it is specified as the filterType.
  
  If you would like to download a mix of multiple filter type -for example 2 Site Areas and 1 Folder.  The `wchconvert pull` command can be run multiple times after changing the filterType and filterName values. Make sure not to modify the connectionId. This will allow the tool to download all of the desired content, assets, and types and still correctly skip items that are already downloaded. 
  
  The **wchconvert.log** will be created in the path where the tool is run.


  **NOTE:** If you would like to push only content of a specific type, see the section "Filtering by type" in the "Additional Tools" section.

### Preparing assets for Watson Content Hub

  After the WCM artifacts are downloaded from the Portal server to the local file system, you must prepare the assets for Watson Content Hub.

  Run the command:

    wchconvert prepareAssets -connectionId <connectionId> [-dir <dir>]

  This step checks that all the assets are downloaded correctly.  An empty asset folder indicates that the asset is missing and the process fails.  If the tool reports that an asset folder is empty, rerun the pull command to see whether wchconvert successfully downloads the missing assets and then try prepareAssets again.  If the prepareAssets still reports missing assets, then most likely a content item has a reference to a file that is missing.  To continue, fix the content item  reference to point to a valid file or manually delete the folders that are being reported as empty asset folders.

  Here is an example of the missing asset error message:

      Searching for empty asset folders in C:\Projects\WCH\workspace/testServer/assets:
      - C:\Projects\WCH\workspace/testServer/assets/dxdam/wcm/0a13737e-3f54-4b0f-b1ce-e53a57a59b0a
      Verify that all assets are downloaded correctly before you continue.

After wchconvert verifies that all assets are downloaded, wchconvert checks the file name of each asset. This step is necessary because WCH has stricter requirements for file names than WCM. WCH requires that all files have an extension, so if a file has no extension, prepareAssets adds a ".nox" extension to the file name.  prepareAssets also fixes file names that have an obvious extension - for example: "demoImage-jpg" is changed to "demoImage.jpg".

Next the prepareAssets task deletes duplicate asset files to reduce the amount of disk space that is required by the assets.  The tool generates an MD5 hash for every asset and compares them to find duplicate files. The md5hashes are stored in the `md5Hashes.json` file. It deletes any duplicate files and records information in the `duplicateAssets.json` that is used during the conversion process. Because the duplicate files are found using the MD5 hash, even files with different file names are accurately detected as duplicate files.

Another difference between WCM and WCH is that WCH does not support the same image file types.  WCH supports JPG, GIF, PNG, and SVG. The prepareAssets task will convert any BMP files to JPG so that they can be pushed to and referenced by content in WCH successfully. However images of type EXIF, TIFF, JFIF, PPM, PGM, PBM, or PNM will need to be converted manually to a supported type or the invalid image file and its parent folder must be deleted before continuing.

WCH has a file size limit of 50MB so the wchconvert tool will delete any asset larger than 50MB and print a message indicating which files were deleted because they were larger than the maximum file size.
  
**NOTE**: If you have decided to keep the sample content on your WCH Tenant, you need to manually copy over the sampleTypeNames.json to your connection workspace and rename the file to typeNames.json. For example, if your connection ID is myportal, you will need to copy and rename sampleTypeNames.json to ./myPortal/typeNames.json.


### Uploading file and image assets to Watson Content Hub

  The next step is to push the assets to WCH.

  Run the command:

    wchconvert pushAssets -connectionId <connectionId> -wchPassword <WCH password> [-dir <dir>]

  Since the assets downloaded from DX are just files, you must generate asset IDs, which are be used by WCH to reference the assets from within content. To generate asset IDs, the assets must be pushed before you convert content and types.  Later, when the conversion is run, wchconvert generates a map of the WCM Asset ID to the WCH Asset ID and uses this map in the conversion process.

  Since the push is done with wchtools, it must be installed and configured before you can run the pushAssets task.

  After the push is complete, a WCH JSON file is created for each asset, which is in the format `<filename>_amd.json`. To map the WCH Asset ID to the WCM Asset ID, you can use the information in the _amd.json.  The ID field in the _amd.json file  contains the WCH Asset ID and the path field contains the WCM Asset ID in the format `assets/dxdam/wcm/<WCM Asset ID>/<filename>`. The assets will be in the published state after they are pushed to WCH.


### Analyzing downloaded content and authoring templates

  The next task provides information on the downloaded content, types, and assets to help you prepare for the differences in WCM and WCH.

  Run the following command to obtain this information:

    wchconvert analyze -connectionId <connectionId> [-dir <dir>]

  The analyze step provides the following information:
  - each type and every content item that uses that type,
  - the differences in the fields that are contained in a type and element,
  - the types that have fields that do not convert easily to WCH- such as HTML or JSP fields,
  - content items that have empty fields, and
  - content items that have invalid references to assets.

 This information is written to the console and the wchconvert.log file.

  **Note:** Save the wchconvert.log that is generated during the analyze task for future reference. However, you can also rerun the analyze task in the future to generate this information again.

The difference between the fields in content and their types is important because when a content item goes live it is updated to match the type.
  * If the content had additional fields, they are removed from the content item.
  * If the the content is missing a field, the missing field will be added when the content goes live.
  * This information is displayed in the list of types and the content items that implement each type.  After the content item is listed, the fields that are different are listed.
  * Fields with a "+" are extra fields that exist only in the content item.
  * Fields with a "-" are fields that are missing from the content item.
  * If no fields are listed after the content item, then the content item matches the type.

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

  If you manually deleted the empty folder for this DX Asset ID which matches the folder name you deleted, you can ignore this warning. If you did not manually delete any empty asset folders, you must check that this content item has the correct images or files associated with it after you have converted and pushed the content item to WCH.


### Converting downloaded content and authoring templates

  The next command is the key function of the wchconvert tool, which converts the WCM based JSON files to the WCH format so that they can be pushed to WCH.To perform the conversion, run the command:

    wchconvert convert -connectionId <connectionId> [-dir <dir>]

  * This creates _tmd.json and _cmd.json files for the WCH types and content. The JSON files are created directly in the `./<working directory>/<connectionId>/types` and `./<working directory>/<connectionId>/content` folders.  The original dx JSON files are not modified or deleted during the conversion process.

  *  WCH requires type names to be unique so you might notice that some types have names with a 4-digit number appended.  The type names are stored in the typeNames.json file so that they can be reused if the types need to be converted again in the future.

  * Also, WCH does not allow spaces, hyphens, dollar sign, exclamation point, and parenthesis in element key values, and therefore are automatically converted to underscores.

  * The WCM Title Field is used to set the WCH Name field and the WCM Summary Field populates the WCH Description fields. The other content fields retain their names and values. The field types that exist in WCM and WCH however do not completely line up. There are several field types that exist WCM that do not exist in WCH.

  The following table lists the field type mappings from WCM to WCH:

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


  The WCM field types that are *italicized* do not map directly to WCH and are created in WCH as a Text field.  Also, the Category, Video, and Toggle field types that exist in WCH are not used in the conversion process.

#### Additional Conversion Rules

  * Type names in WCH must be unique - so the tool generates unique type names and stores them in typeNames.json file.
  * Element names cannot contain space or hyphen, so they are replaced with underscore.
  * Asset names must have an extension. If it does not, the tool adds a ".nox" extension.
  * BMP files are not allowed as images and will be converted to jgp files.
  * Text fields cannot have more than 10,000 characters. Text fields longer than maximum length will be truncated.
  * WCH will not allow content to have elements that do not exist in the type, so wchconvert will delete the extra fields. This extra fields will still exist in the _cdx.json files though, so the information is not lost.
  * Update Relative URL Links in Link fields to include an absolute URL with the WCM Server Hostname and Port

#### Other Conversion Consideration

  The wchconvert tool brings the value of the fields in content as-is from Portal to WCH.  If you have fields with references to the Portal environment - such as a URL to an image hosted on Portal - the text is preserved and brought over to the WCH server without any changes.

  If there are fields that are not require within WCH, you can remove them from the types and when the content is published, the unnecessary fields are removed.


### Uploading Converted Types and Content to Watson Content Hub

  The final commands push the converted types and content to WCH:

    wchconvert pushTypes -connectionId <connectionId> -wchPassword <WCH password> [-dir <dir>]
    wchconvert pushContent -connectionId <connectionId> -wchPassword <WCH password> [-dir <dir>]

  Although it is possible to push both the content and types at the same time with wchtools, wchconvert allows pushing only one at a time, either content or types. The content is not successful if the type does not exist. If an error occurs when a type is pushed, then there are subsequent errors for each content item of that type that is pushed.  To prevent this chain of errors from occurring, wchconvert requires that you first push the types, verify that there are no errors, and then push the content. The content and types will be in the draft state after they are pushed to WCH.

### Verifying Conversion

  After the conversion process is complete and the converted content, types, and assets are pushed to WCH, compare the WCH content and types with their WCM counterparts.  The IDs for the content and types must be the same between WCM and WCH.  The WCM and WCH JSON file names for the content and types must be based on their IDs.  Finding the matching assets between WCM and WCH is a bit tricker. Since the duplicate assets were deleted,  the IDs of the assets do not match between WCM and WCH. However, the path of the Asset files includes the WCM ID, so it is possible to determine the matching assets based on the ID and path of each asset. The duplicateAssets.json file, which contains the WCM Asset IDs provides information on the duplicate files which were deleted.

  If there are fields that were brought over during the conversion that are no longer needed in the WCH, you can remove the fields from the types. When the content is published, the fields are updated to match the fields in the type.

### Pushing Updates to WCH

The wchconvert tool calls wchtools using the Force Override option. This allows updates to be pushed to WCH even if the revision ID is not properly set.

If changes have been made to the WCH environment, it is possible to re-run the wchconvert tool and push to WCH to receive the updated content, types, and assets.  It is recommended to use a new connection Id so that the original items are preserved. Also - the tool will not determine the deltas and push only the deltas. It will be a full push of all content, types, and assets as determined by the filterType and filterName.


### Limitations

  The wchconvert tool has the following limitations:

  * Portal Server must be version 8.5 or later.
  * Content description, link description, and key length have a maximum of 500 characters and will be truncated.
  * Text fields max length is 10,000 characters and will be truncated.
  * Asset max file size is 50MB and must manually be reduced to below 50MB size.
  * Only JPG, PNG, GIF, and SVG image file types are supported. BMP files will be converted to JPG, but other image times must be converted manually.
  * Content cannot have additional fields that do not exist in their type. These fields will be automatically deleted.
  * Security information and user information are not preserved.
  * Tag library references in Rich Text are not resolved.
  * Library index images are not updated and continue to point to the Portal URI.
  * Created/Modified date information is lost.
  * Site structure is not maintained.
  * Only live items are downloaded by the tool - drafts and expired content are ignored.
  * Locale is preserved but MLS functionality is not configured.
  * WCH link elements can use only text as the description. The link description, for the WCM link elements that referenced images, is set to the path of the image that was originally specified.
  * If element keys in an Authoring Template are 50 or more characters long and have the same first 50 characters, they must manually be changed so that they will be unique after being truncated to 50 characters.
  * Does not determine if element field type in a Authoring Template does not match the element field type in content.

  Example error of when the type of a field does not match:
  > [2017-09-26 16:26:51.668] [ERROR] cli 2.0.3 - Pushing content with id 5c2e662e-fa22-4c28-9d20-e529a09c1989 resulted in the following error: Image element has an invalid element type. ; Image element has an extra invalid property 'renditions'. ; Image element has an extra invalid property 'asset'..
  

### Important Files
  * `<working directory>/settings.json`:  contains connection information for Portal.
  * `<working directory>/<connectionId>/duplicateAssets.json`: contains a list of WCM Asset IDs that were detected as duplicates and were deleted.
  * `<working directory>/<connectionId>/md5Hashes.json`: contains the md5 hashes of all the assets and shows the duplicate file names.
  * `<working directory>/<connectionId>/typeNames.json`: contains the unique type names. Type names must be unique. The tool generates unique type names when it finds duplicates.
  * `<working directory>/<connectionId>/libraryNames.json`: contains a list of Library names and Library IDs.
  * `<working directory>/<connectionId>/siteAreaNames.json`: contains a list of Site Area names and Site Area IDs.
  * `<working directory>/<connectionId>/folderNames.json`: contains a list of Folder names and Folder IDs.
  * `wchconvert.log`: the log file for wchconvert that is generated in the path from where the tool is run.
  * `wchtools-api.log`: the log file for wchtools created in path from where the tool is run.
  * `wchtools-cli.log`: the log file for wchtools created in the path from where the tool is run.


### Uninstall and Update

  To completely uninstall wchconvert:
  * cd to the directory where the wchconvert package.json file exists
  * run `npm unlink`
  * run `npm uninstall`

  To reinstall or update wchconvert:
  * cd to the directory where the wchconvert package.json file exists
  * run `npm uninstall`
  * unzip the new wchconvert-cli-master.zip package to different location (or delete the original files and unzip to the same location)
  * run `npm install`
  * run `npm link`

**Note:** For Max OS devices, you will need to specify sudo before the npm commands. For example: `sudo npm install`.

### Additional Tools

The wchconvert has some additional tools that are packaged in the lib folder that must be run as node scripts.  These tools are not core features of the product, but may be helpful.

#### Filtering Content by Type

If you need to convert only content of a specific type, a typeFilter.js is included in the lib folder to perform this function.

Immediately after you run `wchconvert pull` you must run the command:
`node tools/typeFilter.js -connectionId <connectionId> -type <typeName> [-dir <working directory>]`

This command scans through all of the content and filters out only the content items based on the specified type and copies them to a new folder named `<working directory>/<connectionId>-<typeName>`.  If the type name has spaces make sure to use quotation marks around the type name.  This command also copies over the specified type and all of the assets that are referenced by the content.

After the typeFilter.js is complete, you can rename the original folder `<working directory>/<connectionId>` to `<working directory>/<connectionId>-complete` and then rename `<working directory>/<connectionId>-<typeName>` to `<working directory>/<connectionId>`.

After you rename the folders, continue with the wchconvert conversion process and only the content based on the specified type is converted and pushed to WCH.

#### Generate List of Libraries, Site Areas, and Folders

If you would like to generate a list of the Libraries, Site Areas, and/or Folders - so that you can determine which values to specify in the filterName parameter, you can set the apprpriate filterType and run the `wchconvert pull` command with an non-existent filterName.

For example, to generate a list of the Library names, define a new connection in the settings.json that includes your Portal Server connection information and set the filterType to Library. For the filterName specify a value that does not exist - such as
> "filterName": "Does Not Exist",  


Then run `wchconvert pull` command.  This will generate a libraryNames.json file - without downloading any content, types, or assets.

If you need to generate a list of Site Areas or Folders, you can repeat the process after updating the filterType parameter to the desired value.

#### Deleting WCH JSON Files

To quickly delete all of the _amd.json, _cmd.json, and _tmd.json files that are generated, use the tools/deleteWCHJson.js script.

`node tools/deleteWCHJson.js -connectionId <connectionId> [-dir <working directory>]`


### Git Repository
  The IBM Watson Content Hub Developer Tools are provided as open source and made available in Github.
  While it is not necessary to obtain the source from the Github repository, you can clone the repository to access the source to install the release version of wchtools.
After you clone the Github repository, you can run npm install from the root folder of the local copy.



