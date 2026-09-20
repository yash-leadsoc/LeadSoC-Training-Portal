const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const MaterialReview = require('../models/MaterialReview');
const { UPLOAD_DIR } = require('../middleware/upload');
const os = require('os');
const cloudinary = require('../config/cloudinary');
const { spawn } = require('child_process');

function convertToPdf(inputPath, outputDir) {
  return new Promise((resolve, reject) => {
    const child = spawn('soffice', [
      '--headless',
      '--convert-to',
      'pdf',
      '--outdir',
      outputDir,
      inputPath,
    ]);

    let stderr = '';

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(
          new Error(`LibreOffice failed: ${stderr}`)
        );
      }

      const pdfName =
        `${path.basename(inputPath, path.extname(inputPath))}.pdf`;

      const pdfPath = path.join(outputDir, pdfName);

      if (!fs.existsSync(pdfPath)) {
        return reject(
          new Error('PDF was not created')
        );
      }

      resolve(pdfPath);
    });
  });
}

async function downloadToTemp(url, extension) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Cloudinary download failed: ${response.status}`
    );
  }

  const buffer = Buffer.from(
    await response.arrayBuffer()
  );

  const tempPath = path.join(
    os.tmpdir(),
    `leadsoc_${Date.now()}${extension}`
  );

  fs.writeFileSync(tempPath, buffer);

  return tempPath;
}

// Manager or admin uploads a material for a domain.
exports.upload = async (req, res) => {
  let tempInputPath = null;
  let tempOutputDir = null;
  let cloudinaryResult = null;

  try {
    const {
      title,
      description,
      domainId,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: 'File is required',
      });
    }

    if (!domainId) {
      return res.status(400).json({
        message: 'Domain is required',
      });
    }

    tempInputPath = req.file.path;

    const extension = path
      .extname(req.file.originalname)
      .toLowerCase();

    const officeExtensions = [
      '.ppt',
      '.pptx',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.odt',
      '.ods',
      '.odp',
    ];

    let pdfPath;

    // ==============================
    // OFFICE FILE → PDF
    // ==============================

    if (officeExtensions.includes(extension)) {
      console.log('[upload] Converting to PDF...');

      tempOutputDir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'leadsoc_pdf_')
      );

      pdfPath = await convertToPdf(
        tempInputPath,
        tempOutputDir
      );

      console.log('[upload] PDF created:', pdfPath);
    }

    // ==============================
    // ALREADY PDF
    // ==============================

    else if (extension === '.pdf') {
      pdfPath = tempInputPath;
    }

    else {
      return res.status(400).json({
        message: 'Only PDF, PPT, PPTX, DOC, DOCX, XLS and XLSX files are supported',
      });
    }

    console.log(
      '[upload] PDF exists:',
      fs.existsSync(pdfPath)
    );

    // ==============================
    // UPLOAD PDF TO CLOUDINARY
    // ==============================

    console.log('[upload] PDF path:', pdfPath);
    console.log(
      '[upload] PDF exists:',
      fs.existsSync(pdfPath)
    );

    if (!fs.existsSync(pdfPath)) {
      throw new Error(
        `PDF does not exist: ${pdfPath}`
      );
    }

    console.log('[upload] Starting Cloudinary upload...');

    cloudinaryResult =
      await cloudinary.uploader.upload(
        pdfPath,
        {
          resource_type: 'image',
          folder: 'leadsoc-training/materials',
          use_filename: true,
          unique_filename: true,
          format: 'pdf',
        }
      );

    console.log(
      '[upload] Cloudinary SUCCESS:',
      {
        public_id: cloudinaryResult.public_id,
        url: cloudinaryResult.secure_url,
        resource_type: cloudinaryResult.resource_type,
        format: cloudinaryResult.format,
      }
    );
    console.log(
      '[cloudinary] PDF uploaded:',
      cloudinaryResult.secure_url
    );

    // ==============================
    // SAVE MONGODB
    // ==============================

    const document = await Document.create({
      title,
      description: description || '',

      domain: domainId,

      uploadedBy: req.user._id,

      uploaderRole: req.user.role,

      originalName: req.file.originalname,

      fileName:
        `${path.basename(
          req.file.originalname,
          extension
        )}.pdf`,

      cloudinaryPublicId:
        cloudinaryResult.public_id,

      cloudinaryUrl:
        cloudinaryResult.secure_url,

      cloudinaryResourceType: 'image',
    });

    // ==============================
    // DELETE TEMP FILES
    // ==============================

    if (
      tempInputPath &&
      fs.existsSync(tempInputPath)
    ) {
      fs.unlinkSync(tempInputPath);
    }

    if (
      tempOutputDir &&
      fs.existsSync(tempOutputDir)
    ) {
      fs.rmSync(
        tempOutputDir,
        {
          recursive: true,
          force: true,
        }
      );
    }

    return res.status(201).json(document);

  } catch (error) {

    console.error(
      '[upload] Error:',
      error
    );

    // Delete Cloudinary file if MongoDB failed
    if (cloudinaryResult?.public_id) {
      try {
        await cloudinary.uploader.destroy(
          cloudinaryResult.public_id,
          {
            resource_type: 'image',
            type: 'upload',
          }
        );
      } catch (e) {
        console.error(
          '[cloudinary cleanup]',
          e
        );
      }
    }

    if (
      tempInputPath &&
      fs.existsSync(tempInputPath)
    ) {
      fs.unlinkSync(tempInputPath);
    }

    if (
      tempOutputDir &&
      fs.existsSync(tempOutputDir)
    ) {
      fs.rmSync(
        tempOutputDir,
        {
          recursive: true,
          force: true,
        }
      );
    }

    return res.status(500).json({
      message:
        error.message || 'Upload failed',
    });
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
    const document = await Document.findById(
      req.params.id
    );

    if (!document) {
      return res.status(404).json({
        message: 'Document not found',
      });
    }

    if (!document.cloudinaryUrl) {
      return res.status(404).json({
        message: 'Cloudinary PDF not found',
      });
    }

    return res.redirect(
      document.cloudinaryUrl
    );

  } catch (error) {
    console.error(
      '[preview] Error:',
      error
    );

    return res.status(500).json({
      message: 'Preview failed',
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
    const document = await Document.findById(
      req.params.id
    );

    if (!document) {
      return res.status(404).json({
        message: 'Document not found',
      });
    }

    // Delete from Cloudinary
    if (document.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(
          document.cloudinaryPublicId,
          {
            resource_type:
              document.cloudinaryResourceType ||
              'image',
            type: 'upload',
          }
        );

        console.log(
          '[cloudinary] deleted:',
          document.cloudinaryPublicId
        );

      } catch (cloudinaryError) {
        console.error(
          '[cloudinary delete] Error:',
          cloudinaryError
        );
      }
    }

    // Delete local file if it exists
    if (document.fileName) {
      const localPath = path.join(
        process.env.UPLOAD_DIR ||
        path.join(process.cwd(), 'uploads'),
        document.fileName
      );

      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    // Delete MongoDB record
    await Document.findByIdAndDelete(
      document._id
    );

    return res.json({
      message:
        'Document deleted successfully',
    });

  } catch (error) {
    console.error(
      '[remove] Error:',
      error
    );

    return res.status(500).json({
      message: 'Failed to delete document',
    });
  }
};


exports.removeAll = async (req, res) => {
  try {
    // Delete all files inside uploads
    if (fs.existsSync(UPLOAD_DIR)) {
      const files = fs.readdirSync(UPLOAD_DIR);

      for (const file of files) {
        const filePath = path.join(UPLOAD_DIR, file);

        fs.rmSync(filePath, {
          recursive: true,
          force: true,
        });
      }
    }

    // Re-create uploads directory
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    // Delete all document records
    const result = await Document.deleteMany({});

    res.json({
      message: 'All documents deleted successfully',
      deletedDocuments: result.deletedCount,
    });
  } catch (err) {
    console.error('[removeAll] Error:', err);

    res.status(500).json({
      message: 'Failed to delete all documents',
    });
  }
};