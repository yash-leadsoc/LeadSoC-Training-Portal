const Writeup = require('../models/Writeup');
const WriteupAnswer = require('../models/WriteupAnswer');
const Document = require('../models/Document');

// Manager creates write-up questions for a document.
exports.create = async (req, res) => {
  try {
    const { title, documentId, questions } = req.body;
    if (!title || !documentId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'title, documentId and at least one question are required' });
    }
    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const writeup = await Writeup.create({
      title,
      document: doc._id,
      domain: doc.domain,
      createdBy: req.user._id,
      questions: questions.map((q, i) => ({
        text: q.text,
        section: q.section || 'General',
        order: q.order != null ? q.order : i,
      })),
    });
    res.status(201).json({ writeup });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create write-up' });
  }
};

exports.listByDocument = async (req, res) => {
  const writeups = await Writeup.find({ document: req.params.documentId, active: true }).sort({
    createdAt: 1,
  });
  res.json({ writeups });
};

exports.getOne = async (req, res) => {
  const writeup = await Writeup.findById(req.params.id);
  if (!writeup) return res.status(404).json({ message: 'Write-up not found' });
  res.json({ writeup });
};

exports.update = async (req, res) => {
  const writeup = await Writeup.findById(req.params.id);
  if (!writeup) return res.status(404).json({ message: 'Write-up not found' });
  if (req.user.role !== 'admin' && String(writeup.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (req.body.title) writeup.title = req.body.title;
  if (Array.isArray(req.body.questions)) {
    writeup.questions = req.body.questions.map((q, i) => ({
      text: q.text,
      section: q.section || 'General',
      order: q.order != null ? q.order : i,
    }));
  }
  await writeup.save();
  res.json({ writeup });
};

exports.remove = async (req, res) => {
  const writeup = await Writeup.findById(req.params.id);
  if (!writeup) return res.status(404).json({ message: 'Write-up not found' });
  if (req.user.role !== 'admin' && String(writeup.createdBy) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  writeup.active = false;
  await writeup.save();
  res.json({ message: 'Write-up archived' });
};

// --- Employee answers ---

exports.myAnswer = async (req, res) => {
  const writeup = await Writeup.findById(req.params.id);
  if (!writeup) return res.status(404).json({ message: 'Write-up not found' });
  let answer = await WriteupAnswer.findOne({ writeup: writeup._id, employee: req.user._id });
  if (!answer) answer = { writeup: writeup._id, employee: req.user._id, answers: [] };
  res.json({ writeup, answer });
};

exports.saveAnswer = async (req, res) => {
  const writeup = await Writeup.findById(req.params.id);
  if (!writeup) return res.status(404).json({ message: 'Write-up not found' });
  const { answers } = req.body; // [{question, answer}]
  if (!Array.isArray(answers)) return res.status(400).json({ message: 'answers array required' });
  const saved = await WriteupAnswer.findOneAndUpdate(
    { writeup: writeup._id, employee: req.user._id },
    { $set: { answers } },
    { upsert: true, new: true }
  );
  res.json({ answer: saved });
};
