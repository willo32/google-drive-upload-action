# google-drive-upload-action
Github action to upload a file to Google Drive using a service account.

## Usage
#### Simple example:
```
steps:
    - uses: actions/checkout@v2

    - name: Upload a file to Google Drive
      uses: willo32/google-drive-upload-action@v1
      with:
        target: <LOCAL_PATH_TO_YOUR_FILE>
        credentials: ${{ secrets.<YOUR_SERVICE_ACCOUNT_CREDENTIALS> }}
        parent_folder_id: <YOUR_DRIVE_FOLDER_ID>
```

### Inputs
#### `target` (Required):
Local path to the file to upload, can be relative from github runner current directory.

#### `credentials` (Required):
A service account public/private key pair encoded in base64.

[Generate and download your credentials in JSON format](https://cloud.google.com/iam/docs/creating-managing-service-account-keys#creating_service_account_keys)

Run `base64 my_service_account_key.json > encoded.txt` and paste the encoded string into a github secret.

#### `parent_folder_id` (Required):
The id of the drive folder where you want to upload your file. It is the string of characters after the last `/` when browsing to your folder URL. You must share the folder with the service account (using its email address) unless you specify a `owner`.

#### `name` (Optional):
The name of the file to be uploaded. Set to the `target` filename if not specified.

#### `child_folder` (Optional):
A sub-folder where to upload your file. It will be created if non-existent and must remain unique. Useful to organize your drive like so:

```
📂 Release // parent folder
 ┃
 ┣ 📂 v1.0 // child folder
 ┃ ┗ 📜 uploaded_file_v1.0
 ┃
 ┣ 📂 v2.0 // child folder
 ┃ ┗ 📜 uploaded_file_v2.0
```

#### `owner` (Optional):
The email address of a user account that has access to the drive folder and will get the ownership of the file after its creation. To use this feature you must grant your service account a [domain-wide delegation of authority](https://developers.google.com/admin-sdk/directory/v1/guides/delegation) beforehand.
