/* eslint-disable no-console */
const fs = require('fs');

const actions = require('@actions/core');
const { google } = require('googleapis');

const credentials = actions.getInput('credentials', { required: true });
const parentFolderId = actions.getInput('parent_folder_id', { required: true });
const target = actions.getInput('target', { required: true });
const owner = actions.getInput('owner', { required: false });
const childFolder = actions.getInput('child_folder', { required: false });
let filename = actions.getInput('name', { required: false });

const credentialsJSON = JSON.parse(Buffer.from(credentials, 'base64').toString());
const scopes = ['https://www.googleapis.com/auth/drive.file'];
const auth = new google.auth
    .JWT(credentialsJSON.client_email, null, credentialsJSON.private_key, scopes, owner);
const drive = google.drive({ version: 'v3', auth });

async function getUploadFolderId() {
    if (!childFolder) {
        return parentFolderId;
    }

    // Check if child folder already exists and is unique
    const { data: { files } } = await drive.files.list({
        q: `name='${childFolder}' and '${parentFolderId}' in parents and trashed=false`,
        fields: 'files(id)',
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
    });

    if (files.length > 1) {
        throw new Error('More than one entry match the child folder name');
    }
    if (files.length === 1) {
        return files[0].id;
    }

    const childFolderMetadata = {
        name: childFolder,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
    };
    const { data: { id: childFolderId } } = await drive.files.create({
        resource: childFolderMetadata,
        fields: 'id',
        supportsAllDrives: true,
    });

    return childFolderId;
}

async function main() {
    const uploadFolderId = await getUploadFolderId();

    if (!filename) {
        filename = target.split('/').pop();
    }

    const fileMetadata = {
        name: filename,
        parents: [uploadFolderId],
    };
    const fileData = {
        body: fs.createReadStream(target),
    };

    return drive.files.create({
        resource: fileMetadata,
        media: fileData,
        uploadType: 'multipart',
        fields: 'id',
        supportsAllDrives: true,
    });
}

main().catch((error) => actions.setFailed(error));
