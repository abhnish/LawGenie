import express from 'express';
import * as storageService from '../services/storageService.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Store a file from temporary uploads to permanent storage
router.post('/store', async (req, res) => {
  try {
    const { file_id, originalFilename } = req.body;

    if (!file_id) {
      return res.status(400).json({ error: 'Missing file_id' });
    }

    if (!originalFilename) {
      return res.status(400).json({ error: 'Missing originalFilename' });
    }

    const filePath = path.join(process.cwd(), 'uploads', file_id);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found in temporary storage' });
    }

    const fileInfo = await storageService.storeUploadedFile(file_id, originalFilename);

    res.json({
      message: 'File stored successfully ✅',
      file: fileInfo
    });
  } catch (err) {
    console.error('❌ Error storing file:', err);
    res.status(500).json({ error: 'Failed to store file' });
  }
});

// List all stored files
router.get('/files', async (req, res) => {
  try {
    const files = await storageService.listFiles();
    
    res.json({
      message: 'Files retrieved successfully ✅',
      files
    });
  } catch (err) {
    console.error('❌ Error listing files:', err);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Get file info
router.get('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const fileInfo = await storageService.getFileInfo(fileId);
    
    res.json({
      message: 'File info retrieved successfully ✅',
      file: fileInfo
    });
  } catch (err) {
    console.error('❌ Error getting file info:', err);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

// Download a file
router.get('/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Get file info to determine original filename
    const fileInfo = await storageService.getFileInfo(fileId);
    
    // Create a temporary download location
    const downloadDir = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    const downloadPath = path.join(downloadDir, fileId);
    
    // Download the file
    await storageService.downloadFile(fileId, downloadPath);
    
    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.name}"`);
    res.setHeader('Content-Type', fileInfo.contentType);
    
    // Send the file
    res.sendFile(downloadPath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      } else {
        // Clean up the temporary file after sending
        fs.unlink(downloadPath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
        });
      }
    });
  } catch (err) {
    console.error('❌ Error downloading file:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Delete a file
router.delete('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    await storageService.deleteFile(fileId);
    
    res.json({
      message: 'File deleted successfully ✅'
    });
  } catch (err) {
    console.error('❌ Error deleting file:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
