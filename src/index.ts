import fs from "fs";

import actions from "@actions/core";
import { google } from "googleapis";

const credentials = actions.getInput("credentials", { required: true });
const parentFolderId = actions.getInput("parent_folder_id", { required: true });
const target = actions.getMultilineInput("target", { required: true });
const owner = actions.getInput("owner", { required: false });
const childFolder = actions.getInput("child_folder", { required: false });

const credentialsJSON = JSON.parse(
  Buffer.from(credentials, "base64").toString()
);
const scopes = ["https://www.googleapis.com/auth/drive.file"];
const auth = new google.auth.JWT({
  email: credentialsJSON.client_email,
  key: credentialsJSON.private_key,
  scopes,
  subject: owner,
});
const drive = google.drive({ version: "v3", auth });

async function getUploadFolderId() {
  if (!childFolder) {
    return parentFolderId;
  }

  // Check if child folder already exists and is unique
  const {
    data: { files },
  } = await drive.files.list({
    q: `name='${childFolder}' and '${parentFolderId}' in parents and trashed=false`,
    fields: "files(id)",
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  if (files && files.length > 1) {
    throw new Error("More than one entry match the child folder name");
  }

  if (files && files.length === 1) {
    return files[0].id;
  }

  const {
    data: { id: childFolderId },
  } = await drive.files.create({
    requestBody: {
      name: childFolder,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id",
    supportsAllDrives: true,
  });

  return childFolderId;
}

async function main() {
  const uploadFolderId = await getUploadFolderId();

  for (let path of target) {
    const filename = path.split("/").pop();

    const option = {
      requestBody: {
        name: filename,
        parents: uploadFolderId ? [uploadFolderId] : null,
      },
      media: {
        body: fs.createReadStream(path),
      },
      uploadType: "multipart",
      fields: "id",
      supportsAllDrives: true,
    };

    await drive.files.create(option).finally();
  }
}

main().catch((error) => actions.setFailed(error));
