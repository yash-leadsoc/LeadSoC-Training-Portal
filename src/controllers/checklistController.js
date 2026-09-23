// const Checklist = require('../models/Checklist');
// const ChecklistResponse = require('../models/ChecklistResponse');
// const Document = require('../models/Document');

// // Manager creates a checklist for a document.
// exports.create = async (req, res) => {
//   try {
//     const { title, documentId, items } = req.body;
//     if (!title || !documentId || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ message: 'title, documentId and at least one item are required' });
//     }
//     const doc = await Document.findById(documentId);
//     if (!doc) return res.status(404).json({ message: 'Document not found' });

//     const checklist = await Checklist.create({
//       title,
//       document: doc._id,
//       domain: doc.domain,
//       createdBy: req.user._id,
//       items: items.map((it, i) => ({
//         text: it.text,
//         category: it.category || 'tool',
//         order: it.order != null ? it.order : i,
//       })),
//     });
//     res.status(201).json({ checklist });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Could not create checklist' });
//   }
// };

// // List checklists for a document (any authenticated user).
// exports.listByDocument = async (req, res) => {
//   const checklists = await Checklist.find({ document: req.params.documentId, active: true }).sort({
//     createdAt: 1,
//   });
//   res.json({ checklists });
// };

// exports.getOne = async (req, res) => {
//   const checklist = await Checklist.findById(req.params.id);
//   if (!checklist) return res.status(404).json({ message: 'Checklist not found' });
//   res.json({ checklist });
// };

// exports.update = async (req, res) => {
//   const checklist = await Checklist.findById(req.params.id);
//   if (!checklist) return res.status(404).json({ message: 'Checklist not found' });
//   if (req.user.role !== 'admin' && String(checklist.createdBy) !== String(req.user._id)) {
//     return res.status(403).json({ message: 'Forbidden' });
//   }
//   if (req.body.title) checklist.title = req.body.title;
//   if (Array.isArray(req.body.items)) {
//     checklist.items = req.body.items.map((it, i) => ({
//       text: it.text,
//       category: it.category || 'tool',
//       order: it.order != null ? it.order : i,
//     }));
//   }
//   await checklist.save();
//   res.json({ checklist });
// };

// exports.remove = async (req, res) => {
//   const checklist = await Checklist.findById(req.params.id);
//   if (!checklist) return res.status(404).json({ message: 'Checklist not found' });
//   if (req.user.role !== 'admin' && String(checklist.createdBy) !== String(req.user._id)) {
//     return res.status(403).json({ message: 'Forbidden' });
//   }
//   checklist.active = false;
//   await checklist.save();
//   res.json({ message: 'Checklist archived' });
// };

// // --- Employee responses ---

// // Get current employee's response (creates an empty one if none).
// exports.myResponse = async (req, res) => {
//   const checklist = await Checklist.findById(req.params.id);
//   if (!checklist) return res.status(404).json({ message: 'Checklist not found' });
//   let response = await ChecklistResponse.findOne({
//     checklist: checklist._id,
//     employee: req.user._id,
//   });
//   if (!response) {
//     response = { checklist: checklist._id, employee: req.user._id, responses: [] };
//   }
//   res.json({ checklist, response });
// };

// // Save/update the employee's response.
// exports.saveResponse = async (req, res) => {
//   const checklist = await Checklist.findById(req.params.id);
//   if (!checklist) return res.status(404).json({ message: 'Checklist not found' });
//   const { responses } = req.body; // [{item, tried, understood, proficiency}]
//   if (!Array.isArray(responses)) return res.status(400).json({ message: 'responses array required' });

//   const saved = await ChecklistResponse.findOneAndUpdate(
//     { checklist: checklist._id, employee: req.user._id },
//     { $set: { responses } },
//     { upsert: true, new: true }
//   );
//   res.json({ response: saved });
// };


const Checklist = require('../models/Checklist');
const ChecklistResponse = require('../models/ChecklistResponse');
const Document = require('../models/Document');
const { logAudit } = require('../utils/audit');

// Manager creates a checklist for a document.
exports.create = async (req, res) => {
  try {
    const { title, domainId, items } = req.body;
    if (!domainId) return res.status(400).json({ message: 'Domain is required' });

    const existing = await Checklist.findOne({ domain: domainId, active: true });
    if (existing) return res.status(409).json({ message: 'This domain already has a checklist' });



    const checklist = await Checklist.create({
      title,
      domain: domainId,
      document: null,
      items: items.map((it, i) => ({
        text: it.text,
        category: it.category || 'tool',
        section: it.section || '',
        code: it.code || '',
        topic: it.topic || '',
        order: it.order != null ? it.order : i,
      })),
      createdBy: req.user._id,
    });

    await logAudit(req, {                             // ← add here, after create, before res.json
      action: 'create', entity: 'checklist',
      entityId: checklist._id, entityLabel: checklist.title,
    });

    res.status(201).json({ checklist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create checklist' });
  }
};


// checklistController.js

exports.checklistForDomain = async (req, res) => {
  const checklist = await Checklist.findOne({ domain: req.params.domainId, active: true });
  res.json({ checklist: checklist || null });
};


// PUT update a checklist (title + items)
exports.updateChecklist = async (req, res) => {
  const checklist = await Checklist.findById(req.params.id);
  if (!checklist) return res.status(404).json({ message: 'Checklist not found' });
  if (req.body.title != null) checklist.title = req.body.title;
  if (Array.isArray(req.body.items)) {
    checklist.items = req.body.items.map((it, i) => ({
      text: it.text,
      category: it.category || 'tool',
      section: it.section || '',
      code: it.code || '',
      topic: it.topic || '',
      order: it.order != null ? it.order : i,
    }));
  }
  await checklist.save();
  res.json({ checklist });
};

// DELETE a checklist
exports.deleteChecklist = async (req, res) => {
  const checklist = await Checklist.findById(req.params.id);
  if (!checklist) return res.status(404).json({ message: 'Checklist not found' });
  await checklist.deleteOne();           // or: checklist.active = false; await checklist.save();

   await logAudit(req, {                             // ← after delete, before res.json
    action: 'delete', entity: 'checklist',
    entityId: checklist._id, entityLabel: checklist.title,
  });

  res.json({ message: 'Checklist deleted' });
};


// List checklists for a document (any authenticated user).
exports.listByDocument = async (req, res) => {
  const checklists = await Checklist.find({ document: req.params.documentId, active: true }).sort({
    createdAt: 1,
  });
  res.json({ checklists });
};

exports.getOne = async (req, res) => {
  const checklist = await Checklist.findById(req.params.id);
  if (!checklist) return res.status(404).json({ message: 'Checklist not found' });
  res.json({ checklist });
};

exports.update = async (req, res) => {
  const checklist = await Checklist.findById(req.params.id);
  if (!checklist) return res.status(404).json({ message: 'Checklist not found' });
  if (req.user.role !== 'admin' && String(checklist.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (req.body.title) checklist.title = req.body.title;
  if (Array.isArray(req.body.items)) {
    checklist.items = req.body.items.map((it, i) => ({
      text: it.text,
      category: it.category || 'tool',
      section: it.section || '',
      code: it.code || '',
      topic: it.topic || '',
      order: it.order != null ? it.order : i,
    }));
  }
  await checklist.save();
  res.json({ checklist });
};

exports.remove = async (req, res) => {
  const checklist = await Checklist.findById(req.params.id);
  if (!checklist) return res.status(404).json({ message: 'Checklist not found' });
  if (req.user.role !== 'admin' && String(checklist.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  checklist.active = false;
  await checklist.save();
  res.json({ message: 'Checklist archived' });
};

// --- Employee responses ---

// Get current employee's response (creates an empty one if none).
exports.myResponse = async (req, res) => {
  const checklist = await Checklist.findById(req.params.id);
  if (!checklist) return res.status(404).json({ message: 'Checklist not found' });
  let response = await ChecklistResponse.findOne({
    checklist: checklist._id,
    employee: req.user._id,
  });
  if (!response) {
    response = { checklist: checklist._id, employee: req.user._id, responses: [] };
  }
  res.json({ checklist, response });
};

// Save/update the employee's response.
exports.saveResponse = async (req, res) => {
  const checklist = await Checklist.findById(req.params.id);
  if (!checklist) return res.status(404).json({ message: 'Checklist not found' });
  const { responses } = req.body; // [{item, tried, understood, proficiency}]
  if (!Array.isArray(responses)) return res.status(400).json({ message: 'responses array required' });

  const saved = await ChecklistResponse.findOneAndUpdate(
    { checklist: checklist._id, employee: req.user._id },
    { $set: { responses } },
    { upsert: true, new: true }
  );
  res.json({ response: saved });
};