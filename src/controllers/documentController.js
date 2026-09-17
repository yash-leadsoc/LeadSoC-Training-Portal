const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const MaterialReview = require('../models/MaterialReview');
const { UPLOAD_DIR } = require('../middleware/upload');

// Manager or admin uploads a material for a domain.
exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { title, description, domainId } = req.body;
    if (!title || !domainId) {
      // clean the orphan file
      fs.unlink(path.join(UPLOAD_DIR, req.file.filename), () => { });
      return res.status(400).json({ message: 'title and domainId are required' });
    }

    const doc = await Document.create({
      title,
      description: description || '',
      domain: domainId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploaderRole: req.user.role, // admin | manager
    });
    const populated = await doc.populate([
      { path: 'domain', select: 'key name' },
      { path: 'uploadedBy', select: 'name role' },
    ]);
    res.status(201).json({ document: populated });

    console.log('[upload] FILE SAVED:', {
      path: req.file?.path,
      filename: req.file?.filename,
      originalname: req.file?.originalname,
      exists: req.file?.path
        ? fs.existsSync(req.file.path)
        : false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
};

// List materials, optionally by domain. Everyone authenticated can list.
exports.list = async (req, res) => {
  const filter = { active: true };
  if (req.query.domainId) filter.domain = req.query.domainId;
  const docs = await Document.find(filter)
    .sort({ createdAt: -1 })
    .populate('domain', 'key name')
    .populate('uploadedBy', 'name role');
  res.json({ documents: docs });
};

exports.getOne = async (req, res) => {
  const doc = await Document.findById(req.params.id)
    .populate('domain', 'key name')
    .populate('uploadedBy', 'name role');
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  res.json({ document: doc });
};

// Download the actual file. Records a review/download for employees.
exports.download = async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  const filePath = path.join(UPLOAD_DIR, doc.fileName);
  if (!fs.existsSync(filePath)) return res.status(410).json({ message: 'File missing on server' });

  if (req.user.role === 'employee') {
    await MaterialReview.findOneAndUpdate(
      { document: doc._id, employee: req.user._id },
      { $set: { reviewed: true }, $inc: { downloadCount: 1 } },
      { upsert: true, new: true }
    );
  }

  res.download(filePath, doc.originalName);
};


// Preview the actual file in the browser.
exports.preview = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({
        message: 'Document not found',
      });
    }

    const filePath = path.join(UPLOAD_DIR, doc.fileName);

    console.log('[preview] Document:', {
      id: doc._id.toString(),
      originalName: doc.originalName,
      fileName: doc.fileName,
      filePath,
      exists: fs.existsSync(filePath),
    });

    if (!fs.existsSync(filePath)) {
      return res.status(410).json({
        message: 'File missing on server',
        fileName: doc.fileName,
        filePath,
      });
    }

    const extension = path
      .extname(doc.originalName || '')
      .toLowerCase();

    // --------------------------------------------------
    // PDF
    // --------------------------------------------------
    if (extension === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');

      return res.sendFile(filePath);
    }

    // --------------------------------------------------
    // Images
    // --------------------------------------------------
    const imageExtensions = [
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.webp',
    ];

    if (imageExtensions.includes(extension)) {
      res.setHeader(
        'Content-Type',
        doc.mimeType || 'application/octet-stream'
      );

      res.setHeader('Content-Disposition', 'inline');

      return res.sendFile(filePath);
    }

    // --------------------------------------------------
    // Office documents
    // --------------------------------------------------
    const officeExtensions = [
      '.ppt',
      '.pptx',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
    ];

    if (officeExtensions.includes(extension)) {
      const previewDir = path.join(
        UPLOAD_DIR,
        'previews'
      );

      if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir, {
          recursive: true,
        });
      }

      const baseName = path.basename(
        doc.fileName,
        path.extname(doc.fileName)
      );

      const pdfPath = path.join(
        previewDir,
        `${baseName}.pdf`
      );

      // Use existing converted PDF if available
      if (!fs.existsSync(pdfPath)) {
        console.log(
          '[preview] Converting:',
          filePath
        );

        const { execFile } = require('child_process');
        const { promisify } = require('util');

        const execFileAsync = promisify(execFile);

        await execFileAsync('soffice', [
          '--headless',
          '--convert-to',
          'pdf',
          '--outdir',
          previewDir,
          filePath,
        ]);

        if (!fs.existsSync(pdfPath)) {
          console.error(
            '[preview] PDF was not created:',
            pdfPath
          );

          return res.status(500).json({
            message: 'Failed to convert document to PDF',
          });
        }
      }

      console.log(
        '[preview] Sending PDF:',
        pdfPath
      );

      res.setHeader(
        'Content-Type',
        'application/pdf'
      );

      res.setHeader(
        'Content-Disposition',
        'inline'
      );

      return res.sendFile(pdfPath);
    }

    return res.status(415).json({
      message: 'This file type cannot be previewed',
    });
  } catch (err) {
    console.error(
      '[preview] Error:',
      err
    );

    return res.status(500).json({
      message: 'Preview failed',
      error: err.message,
    });
  }
};

// Employee marks a material reviewed (without downloading).
exports.markReviewed = async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  const review = await MaterialReview.findOneAndUpdate(
    { document: doc._id, employee: req.user._id },
    { $set: { reviewed: req.body.reviewed !== false } },
    { upsert: true, new: true }
  );
  res.json({ review });
};

exports.remove = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({
        message: 'Document not found',
      });
    }

    // Only uploader or admin can delete
    if (
      req.user.role !== 'admin' &&
      String(doc.uploadedBy) !== String(req.user._id)
    ) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    // Delete the actual uploaded file
    const filePath = path.join(
      UPLOAD_DIR,
      doc.fileName
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('[delete] File deleted:', filePath);
    }

    // Delete generated preview PDF if it exists
    const previewDir = path.join(
      UPLOAD_DIR,
      'previews'
    );

    const previewFile = path.join(
      previewDir,
      `${path.basename(
        doc.fileName,
        path.extname(doc.fileName)
      )}.pdf`
    );

    if (fs.existsSync(previewFile)) {
      fs.unlinkSync(previewFile);
      console.log(
        '[delete] Preview PDF deleted:',
        previewFile
      );
    }

    // Permanently delete database record
    await Document.findByIdAndDelete(doc._id);

    return res.json({
      message: 'Document deleted successfully',
    });
  } catch (err) {
    console.error('[delete] Error:', err);

    return res.status(500).json({
      message: 'Failed to delete document',
    });
  }
};