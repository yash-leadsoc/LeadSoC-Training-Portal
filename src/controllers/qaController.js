const Question = require('../models/Question');
const Answer = require('../models/Answer');

// GET /api/qa/questions  — list all questions (newest first) with answer counts
exports.listQuestions = async (req, res) => {
  try {
    const questions = await Question.find()
      .populate('author', 'name role')
      .sort({ createdAt: -1 });

    const counts = await Answer.aggregate([
      { $group: { _id: '$question', n: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((c) => (countMap[String(c._id)] = c.n));

    res.json({
      questions: questions.map((q) => ({
        id: q._id,
        title: q.title,
        body: q.body,
        author: q.author ? { id: q.author._id, name: q.author.name, role: q.author.role } : null,
        answerCount: countMap[String(q._id)] || 0,
        createdAt: q.createdAt,
      })),
    });
  } catch (e) {
    console.error('[qa] listQuestions', e);
    res.status(500).json({ message: 'Failed to load questions' });
  }
};

// GET /api/qa/questions/:id  — one question with its answers
exports.getQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate('author', 'name role');
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const answers = await Answer.find({ question: question._id })
      .populate('author', 'name role')
      .sort({ createdAt: 1 });

    res.json({
      question: {
        id: question._id,
        title: question.title,
        body: question.body,
        author: question.author
          ? { id: question.author._id, name: question.author.name, role: question.author.role }
          : null,
        createdAt: question.createdAt,
      },
      answers: answers.map((a) => ({
        id: a._id,
        body: a.body,
        author: a.author ? { id: a.author._id, name: a.author.name, role: a.author.role } : null,
        createdAt: a.createdAt,
      })),
    });
  } catch (e) {
    console.error('[qa] getQuestion', e);
    res.status(500).json({ message: 'Failed to load question' });
  }
};

// POST /api/qa/questions  — any authenticated user asks a question
exports.createQuestion = async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: 'A question title is required' });

    const q = await Question.create({
      title: title.trim(),
      body: (body || '').trim(),
      author: req.user._id,
    });

    res.status(201).json({
      question: {
        id: q._id,
        title: q.title,
        body: q.body,
        author: { id: req.user._id, name: req.user.name, role: req.user.role },
        answerCount: 0,
        createdAt: q.createdAt,
      },
    });
  } catch (e) {
    console.error('[qa] createQuestion', e);
    res.status(500).json({ message: 'Failed to post question' });
  }
};

// POST /api/qa/questions/:id/answers  — any authenticated user answers
exports.createAnswer = async (req, res) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) return res.status(400).json({ message: 'Answer text is required' });

    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const a = await Answer.create({
      question: question._id,
      body: body.trim(),
      author: req.user._id,
    });

    res.status(201).json({
      answer: {
        id: a._id,
        body: a.body,
        author: { id: req.user._id, name: req.user.name, role: req.user.role },
        createdAt: a.createdAt,
      },
    });
  } catch (e) {
    console.error('[qa] createAnswer', e);
    res.status(500).json({ message: 'Failed to post answer' });
  }
};

// DELETE /api/qa/questions/:id  — admin only (removes the question + its answers)
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    await Answer.deleteMany({ question: question._id });
    await question.deleteOne();

    res.json({ message: 'Question deleted' });
  } catch (e) {
    console.error('[qa] deleteQuestion', e);
    res.status(500).json({ message: 'Failed to delete question' });
  }
};

// DELETE /api/qa/answers/:id  — admin only
exports.deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    await answer.deleteOne();

    res.json({ message: 'Answer deleted' });
  } catch (e) {
    console.error('[qa] deleteAnswer', e);
    res.status(500).json({ message: 'Failed to delete answer' });
  }
};