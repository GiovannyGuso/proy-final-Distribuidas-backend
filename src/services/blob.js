// src/services/blob.js
const { BlobServiceClient } = require("@azure/storage-blob");

function getContainer() {
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!conn) throw new Error("Falta AZURE_STORAGE_CONNECTION_STRING");
  const containerName = process.env.AZURE_BLOB_CONTAINER || "listing-images";

  const service = BlobServiceClient.fromConnectionString(conn);
  return service.getContainerClient(containerName);
}

async function uploadBufferToBlob({ buffer, mimeType, filename }) {
  const container = getContainer();
  await container.createIfNotExists({ access: "blob" });

  const blobName = `${Date.now()}-${filename}`;
  const blockBlob = container.getBlockBlobClient(blobName);

  await blockBlob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mimeType }
  });

  return blockBlob.url;
}

// ✅ NUEVO: borrar blob por URL (la url que guardas en DB)
function getBlobNameFromUrl(url) {
  try {
    const u = new URL(url);
    // pathname = /container/blobName
    const parts = u.pathname.split("/").filter(Boolean);
    // último segmento es el blobName
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

async function deleteBlobByUrl(url) {
  const container = getContainer();
  const blobName = getBlobNameFromUrl(url);
  if (!blobName) return false;

  const blockBlob = container.getBlockBlobClient(blobName);
  await blockBlob.deleteIfExists();
  return true;
}

module.exports = { uploadBufferToBlob, deleteBlobByUrl };
