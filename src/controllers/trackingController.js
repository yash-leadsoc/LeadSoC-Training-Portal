// // const User = require('../models/User');
// // const Domain = require('../models/Domain');
// // const Document = require('../models/Document');
// // const Checklist = require('../models/Checklist');
// // const ChecklistResponse = require('../models/ChecklistResponse');
// // const Writeup = require('../models/Writeup');
// // const WriteupAnswer = require('../models/WriteupAnswer');
// // const MaterialReview = require('../models/MaterialReview');

// // const CATEGORIES = ['tool', 'concepts', 'practical', 'advanced'];

// // function pct(part, total) {
// //   if (!total) return null; // null => "not applicable / not started"
// //   return Math.round((part / total) * 100);
// // }

// // function daysEnrolled(user) {
// //   const start = user.enrolledAt || user.createdAt || new Date();
// //   return Math.max(0, Math.floor((Date.now() - new Date(start).getTime()) / 86400000));
// // }

// // function paceLabel(bestPct, days) {
// //   if (!days || !bestPct) return 'Just started';
// //   const perDay = bestPct / days;
// //   if (perDay >= 1.5) return 'Good pace';
// //   if (perDay >= 0.6) return 'Steady pace';
// //   return 'Slow pace';
// // }

// // // Compute one employee's full breakdown across all domains.
// // async function computeEmployeeProgress(employeeId) {
// //   const [domains, docs, checklists, writeups] = await Promise.all([
// //     Domain.find({ active: true }),
// //     Document.find({ active: true }),
// //     Checklist.find({ active: true }),
// //     Writeup.find({ active: true }),
// //   ]);

// //   const checklistIds = checklists.map((c) => c._id);
// //   const writeupIds = writeups.map((w) => w._id);

// //   const [responses, answers, reviews] = await Promise.all([
// //     ChecklistResponse.find({ employee: employeeId, checklist: { $in: checklistIds } }),
// //     WriteupAnswer.find({ employee: employeeId, writeup: { $in: writeupIds } }),
// //     MaterialReview.find({ employee: employeeId }),
// //   ]);

// //   const responseByChecklist = {};
// //   responses.forEach((r) => (responseByChecklist[String(r.checklist)] = r));
// //   const answerByWriteup = {};
// //   answers.forEach((a) => (answerByWriteup[String(a.writeup)] = a));
// //   const reviewedDocs = new Set(reviews.filter((r) => r.reviewed).map((r) => String(r.document)));

// //   const domainResult = {};

// //   for (const domain of domains) {
// //     const dId = String(domain._id);
// //     const domainDocs = docs.filter((d) => String(d.domain) === dId);
// //     const domainDocIds = new Set(domainDocs.map((d) => String(d._id)));

// //     // counters
// //     const catCounts = { tool: [0, 0], concepts: [0, 0], advanced: [0, 0] }; // [understood, total]
// //     let writeupAnswered = 0;
// //     let writeupTotal = 0;
// //     let materialsReviewed = 0;
// //     const materialsTotal = domainDocs.length;

// //     // materials
// //     domainDocs.forEach((d) => {
// //       if (reviewedDocs.has(String(d._id))) materialsReviewed += 1;
// //     });

// //     // checklists in this domain
// //     checklists
// //       .filter((c) => domainDocIds.has(String(c.document)) || String(c.domain) === dId)
// //       .forEach((c) => {
// //         const resp = responseByChecklist[String(c._id)];
// //         const respMap = {};
// //         if (resp) resp.responses.forEach((r) => (respMap[String(r.item)] = r));
// //         c.items.forEach((item) => {
// //           const cat = ['tool', 'concepts', 'advanced'].includes(item.category)
// //             ? item.category
// //             : 'tool';
// //           catCounts[cat][1] += 1;
// //           const r = respMap[String(item._id)];
// //           if (r && r.understood) catCounts[cat][0] += 1;
// //         });
// //       });

// //     // writeups in this domain
// //     writeups
// //       .filter((w) => domainDocIds.has(String(w.document)) || String(w.domain) === dId)
// //       .forEach((w) => {
// //         const ans = answerByWriteup[String(w._id)];
// //         const ansMap = {};
// //         if (ans) ans.answers.forEach((a) => (ansMap[String(a.question)] = a.answer));
// //         w.questions.forEach((q) => {
// //           writeupTotal += 1;
// //           const a = ansMap[String(q._id)];
// //           if (a && a.trim().length > 0) writeupAnswered += 1;
// //         });
// //       });

// //     const tool = pct(catCounts.tool[0], catCounts.tool[1]);
// //     const concepts = pct(catCounts.concepts[0], catCounts.concepts[1]);
// //     const practical = pct(writeupAnswered, writeupTotal);
// //     const advanced = pct(catCounts.advanced[0], catCounts.advanced[1]);

// //     const nums = [tool, concepts, practical, advanced].filter((v) => v != null);
// //     const overall = nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;

// //     domainResult[domain.key] = {
// //       domainId: dId,
// //       name: domain.name,
// //       tool,
// //       concepts,
// //       practical,
// //       advanced,
// //       overall,
// //       materials: { reviewed: materialsReviewed, total: materialsTotal },
// //       started: overall != null && overall > 0,
// //     };
// //   }

// //   return domainResult;
// // }

// // // GET /api/tracking/me  (employee's own progress)
// // exports.myProgress = async (req, res) => {
// //   const progress = await computeEmployeeProgress(req.user._id);
// //   const active = Object.values(progress).filter((d) => d.started);
// //   const overalls = active.map((d) => d.overall).filter((v) => v != null);
// //   const avg = overalls.length ? Math.round(overalls.reduce((a, b) => a + b, 0) / overalls.length) : 0;
// //   const best = Object.values(progress).reduce(
// //     (acc, d) => (d.overall != null && d.overall > acc.val ? { key: d.name, val: d.overall } : acc),
// //     { key: '-', val: -1 }
// //   );
// //   const days = daysEnrolled(req.user);
// //   res.json({
// //     user: req.user.toSafeJSON(),
// //     progress,
// //     summary: {
// //       daysEnrolled: days,
// //       avgCompletion: avg,
// //       domainsStarted: active.length,
// //       totalDomains: Object.keys(progress).length,
// //       strongestDomain: best.key,
// //       pace: paceLabel(best.val > 0 ? best.val : 0, days),
// //     },
// //   });
// // };

// // // GET /api/tracking/employee/:id  (manager/admin view of one employee)
// // // exports.employeeProgress = async (req, res) => {
// // //   const employee = await User.findById(req.params.id);

// // //   if (!employee || employee.role !== 'employee') {
// // //     return res.status(404).json({ message: 'Employee not found' });
// // //   }
// // //   if (req.user.role === 'manager' && String(employee.manager) !== String(req.user._id)) {
// // //     return res.status(403).json({ message: 'Forbidden' });
// // //   }

// // //   const progress = await computeEmployeeProgress(employee._id);
// // //   const active = Object.values(progress).filter((d) => d.started);
// // //   const overalls = active.map((d) => d.overall).filter((v) => v != null);
// // //   const avg = overalls.length ? Math.round(overalls.reduce((a, b) => a + b, 0) / overalls.length) : 0;
// // //   const best = Object.values(progress).reduce(
// // //     (acc, d) => (d.overall != null && d.overall > acc.val ? { key: d.name, val: d.overall } : acc),
// // //     { key: '-', val: -1 }
// // //   );
// // //   const days = daysEnrolled(employee);

// // //   res.json({
// // //     user: employee.toSafeJSON(),
// // //     progress,
// // //     summary: {
// // //       daysEnrolled: days,
// // //       avgCompletion: avg,
// // //       domainsStarted: active.length,
// // //       totalDomains: Object.keys(progress).length,
// // //       strongestDomain: best.key,
// // //       pace: paceLabel(best.val > 0 ? best.val : 0, days),
// // //     },
// // //   });
// // // };

// // /////////////////////////////////////////////////////////
// // exports.employeeProgress = async (req, res) => {
// //   try {
// //     const employee = await User.findById(req.params.id).populate(
// //       'assignedDomains',
// //       'name icon description'
// //     );

// //     if (!employee || employee.role !== 'employee') {
// //       return res.status(404).json({
// //         message: 'Employee not found',
// //       });
// //     }

// //     if (
// //       req.user.role === 'manager' &&
// //       String(employee.manager) !== String(req.user._id)
// //     ) {
// //       return res.status(403).json({
// //         message: 'Forbidden',
// //       });
// //     }

// //     const progress = await computeEmployeeProgress(
// //       employee._id
// //     );

// //     const active = Object.values(progress).filter(
// //       (d) => d.started
// //     );

// //     const overalls = active
// //       .map((d) => d.overall)
// //       .filter((v) => v != null);

// //     const avg = overalls.length
// //       ? Math.round(
// //           overalls.reduce((a, b) => a + b, 0) /
// //             overalls.length
// //         )
// //       : 0;

// //     const best = Object.values(progress).reduce(
// //       (acc, d) =>
// //         d.overall != null &&
// //         d.overall > acc.val
// //           ? {
// //               key: d.name,
// //               val: d.overall,
// //             }
// //           : acc,
// //       {
// //         key: '-',
// //         val: -1,
// //       }
// //     );

// //     const days = daysEnrolled(employee);

// //     res.json({
// //       user: employee.toSafeJSON(),
// //       progress,
// //       summary: {
// //         daysEnrolled: days,
// //         avgCompletion: avg,
// //         domainsStarted: active.length,
// //         totalDomains: Object.keys(progress).length,
// //         strongestDomain: best.key,
// //         pace: paceLabel(
// //           best.val > 0 ? best.val : 0,
// //           days
// //         ),
// //       },
// //     });
// //   } catch (error) {
// //     console.error(
// //       '[employeeProgress] Error:',
// //       error
// //     );

// //     res.status(500).json({
// //       message: 'Failed to load employee progress',
// //     });
// //   }
// // };

// // // GET /api/tracking/cohort  (executive dashboard: all employees x domains x categories)
// // exports.cohort = async (req, res) => {
// //   let employeeFilter = { role: 'employee', active: true };
// //   if (req.user.role === 'manager') employeeFilter.manager = req.user._id;

// //   const employees = await User.find(employeeFilter).sort({ name: 1 });
// //   const rows = [];

// //   for (const emp of employees) {
// //     const progress = await computeEmployeeProgress(emp._id);
// //     rows.push({
// //       id: emp._id,
// //       name: emp.name,
// //       employeeCode: emp.employeeCode,
// //       daysEnrolled: daysEnrolled(emp),
// //       domains: progress,
// //     });
// //   }

// //   // cohort KPIs
// //   const allOveralls = [];
// //   let below20 = 0;
// //   const domainAgg = {}; // key -> [sum, count]
// //   const catAgg = { tool: [0, 0], concepts: [0, 0], practical: [0, 0], advanced: [0, 0] };

// //   rows.forEach((row) => {
// //     const active = Object.values(row.domains).filter((d) => d.started);
// //     const ovs = active.map((d) => d.overall).filter((v) => v != null);
// //     const empAvg = ovs.length ? Math.round(ovs.reduce((a, b) => a + b, 0) / ovs.length) : 0;
// //     allOveralls.push(empAvg);
// //     if (active.length > 0 && empAvg < 20) below20 += 1;

// //     Object.entries(row.domains).forEach(([key, d]) => {
// //       if (d.overall != null && d.started) {
// //         if (!domainAgg[key]) domainAgg[key] = [0, 0];
// //         domainAgg[key][0] += d.overall;
// //         domainAgg[key][1] += 1;
// //       }
// //       CATEGORIES.forEach((c) => {
// //         if (d[c] != null) {
// //           catAgg[c][0] += d[c];
// //           catAgg[c][1] += 1;
// //         }
// //       });
// //     });
// //   });

// //   const domainAverages = {};
// //   Object.entries(domainAgg).forEach(([k, [s, c]]) => (domainAverages[k] = c ? Math.round(s / c) : 0));
// //   const categoryAverages = {};
// //   CATEGORIES.forEach((c) => (categoryAverages[c] = catAgg[c][1] ? Math.round(catAgg[c][0] / catAgg[c][1]) : 0));

// //   const domainsWithTrainees = Object.values(domainAgg).filter(([, c]) => c > 0).length;
// //   const totalDomains = await Domain.countDocuments({ active: true });

// //   // flagged: active but below 20% overall
// //   const flagged = rows
// //     .map((row) => {
// //       const active = Object.values(row.domains).filter((d) => d.started);
// //       const best = Object.values(row.domains).reduce(
// //         (acc, d) => (d.overall != null && d.overall > acc.val ? { name: d.name, val: d.overall } : acc),
// //         { name: '-', val: -1 }
// //       );
// //       const ovs = active.map((d) => d.overall).filter((v) => v != null);
// //       const empAvg = ovs.length ? Math.round(ovs.reduce((a, b) => a + b, 0) / ovs.length) : 0;
// //       return { id: row.id, name: row.name, best, empAvg, days: row.daysEnrolled, active: active.length };
// //     })
// //     .filter((r) => r.active === 0 || r.empAvg < 20);

// //   res.json({
// //     rows,
// //     kpis: {
// //       cohortSize: rows.length,
// //       avgCompletion: allOveralls.length
// //         ? Math.round(allOveralls.reduce((a, b) => a + b, 0) / allOveralls.length)
// //         : 0,
// //       domainsWithTrainees,
// //       totalDomains,
// //       below20,
// //     },
// //     domainAverages,
// //     categoryAverages,
// //     flagged,
// //   });
// // };



// // ========================================================= v2


// // const User = require('../models/User');
// // const Domain = require('../models/Domain');
// // const Document = require('../models/Document');
// // const Checklist = require('../models/Checklist');
// // const ChecklistResponse = require('../models/ChecklistResponse');
// // const Writeup = require('../models/Writeup');
// // const WriteupAnswer = require('../models/WriteupAnswer');
// // const MaterialReview = require('../models/MaterialReview');

// // const CATEGORIES = ['tool', 'concepts', 'practical', 'advanced'];

// // function pct(part, total) {
// //   if (!total) return null; // null => "not applicable / not started"
// //   return Math.round((part / total) * 100);
// // }

// // function daysEnrolled(user) {
// //   const start = user.enrolledAt || user.createdAt || new Date();
// //   return Math.max(0, Math.floor((Date.now() - new Date(start).getTime()) / 86400000));
// // }

// // function paceLabel(bestPct, days) {
// //   if (!days || !bestPct) return 'Just started';
// //   const perDay = bestPct / days;
// //   if (perDay >= 1.5) return 'Good pace';
// //   if (perDay >= 0.6) return 'Steady pace';
// //   return 'Slow pace';
// // }

// // // Compute one employee's full breakdown across all domains.
// // async function computeEmployeeProgress(employeeId) {
// //   const [domains, docs, checklists, writeups] = await Promise.all([
// //     Domain.find({ active: true }),
// //     Document.find({ active: true }),
// //     Checklist.find({ active: true }),
// //     Writeup.find({ active: true }),
// //   ]);

// //   const checklistIds = checklists.map((c) => c._id);
// //   const writeupIds = writeups.map((w) => w._id);

// //   const [responses, answers, reviews] = await Promise.all([
// //     ChecklistResponse.find({ employee: employeeId, checklist: { $in: checklistIds } }),
// //     WriteupAnswer.find({ employee: employeeId, writeup: { $in: writeupIds } }),
// //     MaterialReview.find({ employee: employeeId }),
// //   ]);

// //   const responseByChecklist = {};
// //   responses.forEach((r) => (responseByChecklist[String(r.checklist)] = r));
// //   const answerByWriteup = {};
// //   answers.forEach((a) => (answerByWriteup[String(a.writeup)] = a));
// //   const reviewedDocs = new Set(reviews.filter((r) => r.reviewed).map((r) => String(r.document)));

// //   const domainResult = {};

// //   for (const domain of domains) {
// //     const dId = String(domain._id);
// //     const domainDocs = docs.filter((d) => String(d.domain) === dId);
// //     const domainDocIds = new Set(domainDocs.map((d) => String(d._id)));

// //     // counters
// //     const catCounts = { tool: [0, 0], concepts: [0, 0], advanced: [0, 0] }; // [understood, total]
// //     let writeupAnswered = 0;
// //     let writeupTotal = 0;
// //     let materialsReviewed = 0;
// //     const materialsTotal = domainDocs.length;

// //     // ---- NEW: detailed, per-employee lists straight from the DB ----
// //     const materialsList = [];
// //     const checklistDetail = [];
// //     const writeupDetail = [];
// //     let checklistCompleted = 0;
// //     let checklistTotal = 0;

// //     // materials
// //     domainDocs.forEach((d) => {
// //       const reviewed = reviewedDocs.has(String(d._id));
// //       if (reviewed) materialsReviewed += 1;

// //       materialsList.push({
// //         id: String(d._id),
// //         title: d.title,
// //         originalName: d.originalName,
// //         description: d.description || '',
// //         mimeType: d.mimeType || '',
// //         cloudinaryUrl: d.cloudinaryUrl || null,
// //         previewUrl: d.previewUrl || null,
// //         reviewed,
// //       });
// //     });

// //     // checklists in this domain
// //     checklists
// //       .filter((c) => domainDocIds.has(String(c.document)) || String(c.domain) === dId)
// //       .forEach((c) => {
// //         const resp = responseByChecklist[String(c._id)];
// //         const respMap = {};
// //         if (resp) resp.responses.forEach((r) => (respMap[String(r.item)] = r));

// //         const items = [];

// //         c.items.forEach((item) => {
// //           const cat = ['tool', 'concepts', 'advanced'].includes(item.category)
// //             ? item.category
// //             : 'tool';
// //           catCounts[cat][1] += 1;
// //           const r = respMap[String(item._id)];
// //           const understood = !!(r && r.understood);
// //           if (understood) catCounts[cat][0] += 1;

// //           checklistTotal += 1;
// //           if (understood) checklistCompleted += 1;

// //           items.push({
// //             id: String(item._id),
// //             text: item.text,
// //             category: item.category || 'tool',
// //             understood,
// //             tried: !!(r && r.tried),
// //             proficiency: r ? r.proficiency || 0 : 0,
// //           });
// //         });

// //         checklistDetail.push({
// //           id: String(c._id),
// //           title: c.title,
// //           document: String(c.document),
// //           items,
// //         });
// //       });

// //     // writeups in this domain
// //     writeups
// //       .filter((w) => domainDocIds.has(String(w.document)) || String(w.domain) === dId)
// //       .forEach((w) => {
// //         const ans = answerByWriteup[String(w._id)];
// //         const ansMap = {};
// //         if (ans) ans.answers.forEach((a) => (ansMap[String(a.question)] = a.answer));

// //         const questions = [];

// //         w.questions.forEach((q) => {
// //           writeupTotal += 1;
// //           const a = ansMap[String(q._id)];
// //           const answered = !!(a && String(a).trim().length > 0);
// //           if (answered) writeupAnswered += 1;

// //           questions.push({
// //             id: String(q._id),
// //             text: q.text,
// //             section: q.section || 'General',
// //             answer: a || '',
// //             answered,
// //           });
// //         });

// //         writeupDetail.push({
// //           id: String(w._id),
// //           title: w.title,
// //           document: String(w.document),
// //           questions,
// //         });
// //       });

// //     const tool = pct(catCounts.tool[0], catCounts.tool[1]);
// //     const concepts = pct(catCounts.concepts[0], catCounts.concepts[1]);
// //     const practical = pct(writeupAnswered, writeupTotal);
// //     const advanced = pct(catCounts.advanced[0], catCounts.advanced[1]);

// //     const nums = [tool, concepts, practical, advanced].filter((v) => v != null);
// //     const overall = nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;

// //     domainResult[domain.key] = {
// //       domainId: dId,
// //       key: domain.key,
// //       name: domain.name,
// //       icon: domain.icon,
// //       description: domain.description,
// //       tool,
// //       concepts,
// //       practical,
// //       advanced,
// //       overall,
// //       materials: { reviewed: materialsReviewed, total: materialsTotal },
// //       started: overall != null && overall > 0,

// //       // ---- NEW: everything the detail pages need, calculated from the DB ----
// //       score: overall || 0,

// //       materialsList,
// //       materialsReviewed,
// //       materialsTotal,

// //       checklists: checklistDetail,
// //       checklistCompleted,
// //       checklistTotal,
// //       toolCompleted: catCounts.tool[0],
// //       toolTotal: catCounts.tool[1],
// //       conceptCompleted: catCounts.concepts[0],
// //       conceptTotal: catCounts.concepts[1],
// //       advancedCompleted: catCounts.advanced[0],
// //       advancedTotal: catCounts.advanced[1],

// //       writeups: writeupDetail,
// //       writeupAnswered,
// //       writeupTotal,
// //     };
// //   }

// //   return domainResult;
// // }

// // // GET /api/tracking/me  (employee's own progress)
// // exports.myProgress = async (req, res) => {
// //   const progress = await computeEmployeeProgress(req.user._id);
// //   const active = Object.values(progress).filter((d) => d.started);
// //   const overalls = active.map((d) => d.overall).filter((v) => v != null);
// //   const avg = overalls.length ? Math.round(overalls.reduce((a, b) => a + b, 0) / overalls.length) : 0;
// //   const best = Object.values(progress).reduce(
// //     (acc, d) => (d.overall != null && d.overall > acc.val ? { key: d.name, val: d.overall } : acc),
// //     { key: '-', val: -1 }
// //   );
// //   const days = daysEnrolled(req.user);
// //   res.json({
// //     user: req.user.toSafeJSON(),
// //     progress,
// //     summary: {
// //       daysEnrolled: days,
// //       avgCompletion: avg,
// //       domainsStarted: active.length,
// //       totalDomains: Object.keys(progress).length,
// //       strongestDomain: best.key,
// //       pace: paceLabel(best.val > 0 ? best.val : 0, days),
// //     },
// //   });
// // };

// // // GET /api/tracking/employee/:id  (manager/admin view of one employee)
// // exports.employeeProgress = async (req, res) => {
// //   try {
// //     const employee = await User.findById(req.params.id).populate(
// //       'assignedDomains',
// //       'name icon description'
// //     );

// //     if (!employee || employee.role !== 'employee') {
// //       return res.status(404).json({
// //         message: 'Employee not found',
// //       });
// //     }

// //     if (
// //       req.user.role === 'manager' &&
// //       String(employee.manager) !== String(req.user._id)
// //     ) {
// //       return res.status(403).json({
// //         message: 'Forbidden',
// //       });
// //     }

// //     const progress = await computeEmployeeProgress(
// //       employee._id
// //     );

// //     const active = Object.values(progress).filter(
// //       (d) => d.started
// //     );

// //     const overalls = active
// //       .map((d) => d.overall)
// //       .filter((v) => v != null);

// //     const avg = overalls.length
// //       ? Math.round(
// //           overalls.reduce((a, b) => a + b, 0) /
// //             overalls.length
// //         )
// //       : 0;

// //     const best = Object.values(progress).reduce(
// //       (acc, d) =>
// //         d.overall != null &&
// //         d.overall > acc.val
// //           ? {
// //               key: d.name,
// //               val: d.overall,
// //             }
// //           : acc,
// //       {
// //         key: '-',
// //         val: -1,
// //       }
// //     );

// //     const days = daysEnrolled(employee);

// //     res.json({
// //       user: employee.toSafeJSON(),
// //       progress,
// //       summary: {
// //         daysEnrolled: days,
// //         avgCompletion: avg,
// //         domainsStarted: active.length,
// //         totalDomains: Object.keys(progress).length,
// //         strongestDomain: best.key,
// //         pace: paceLabel(
// //           best.val > 0 ? best.val : 0,
// //           days
// //         ),
// //       },
// //     });
// //   } catch (error) {
// //     console.error(
// //       '[employeeProgress] Error:',
// //       error
// //     );

// //     res.status(500).json({
// //       message: 'Failed to load employee progress',
// //     });
// //   }
// // };

// // // GET /api/tracking/cohort  (executive dashboard: all employees x domains x categories)
// // exports.cohort = async (req, res) => {
// //   let employeeFilter = { role: 'employee', active: true };
// //   if (req.user.role === 'manager') employeeFilter.manager = req.user._id;

// //   const employees = await User.find(employeeFilter).sort({ name: 1 });
// //   const rows = [];

// //   for (const emp of employees) {
// //     const progress = await computeEmployeeProgress(emp._id);
// //     rows.push({
// //       id: emp._id,
// //       name: emp.name,
// //       employeeCode: emp.employeeCode,
// //       daysEnrolled: daysEnrolled(emp),
// //       domains: progress,
// //     });
// //   }

// //   // cohort KPIs
// //   const allOveralls = [];
// //   let below20 = 0;
// //   const domainAgg = {}; // key -> [sum, count]
// //   const catAgg = { tool: [0, 0], concepts: [0, 0], practical: [0, 0], advanced: [0, 0] };

// //   rows.forEach((row) => {
// //     const active = Object.values(row.domains).filter((d) => d.started);
// //     const ovs = active.map((d) => d.overall).filter((v) => v != null);
// //     const empAvg = ovs.length ? Math.round(ovs.reduce((a, b) => a + b, 0) / ovs.length) : 0;
// //     allOveralls.push(empAvg);
// //     if (active.length > 0 && empAvg < 20) below20 += 1;

// //     Object.entries(row.domains).forEach(([key, d]) => {
// //       if (d.overall != null && d.started) {
// //         if (!domainAgg[key]) domainAgg[key] = [0, 0];
// //         domainAgg[key][0] += d.overall;
// //         domainAgg[key][1] += 1;
// //       }
// //       CATEGORIES.forEach((c) => {
// //         if (d[c] != null) {
// //           catAgg[c][0] += d[c];
// //           catAgg[c][1] += 1;
// //         }
// //       });
// //     });
// //   });

// //   const domainAverages = {};
// //   Object.entries(domainAgg).forEach(([k, [s, c]]) => (domainAverages[k] = c ? Math.round(s / c) : 0));
// //   const categoryAverages = {};
// //   CATEGORIES.forEach((c) => (categoryAverages[c] = catAgg[c][1] ? Math.round(catAgg[c][0] / catAgg[c][1]) : 0));

// //   const domainsWithTrainees = Object.values(domainAgg).filter(([, c]) => c > 0).length;
// //   const totalDomains = await Domain.countDocuments({ active: true });

// //   // flagged: active but below 20% overall
// //   const flagged = rows
// //     .map((row) => {
// //       const active = Object.values(row.domains).filter((d) => d.started);
// //       const best = Object.values(row.domains).reduce(
// //         (acc, d) => (d.overall != null && d.overall > acc.val ? { name: d.name, val: d.overall } : acc),
// //         { name: '-', val: -1 }
// //       );
// //       const ovs = active.map((d) => d.overall).filter((v) => v != null);
// //       const empAvg = ovs.length ? Math.round(ovs.reduce((a, b) => a + b, 0) / ovs.length) : 0;
// //       return { id: row.id, name: row.name, best, empAvg, days: row.daysEnrolled, active: active.length };
// //     })
// //     .filter((r) => r.active === 0 || r.empAvg < 20);

// //   res.json({
// //     rows,
// //     kpis: {
// //       cohortSize: rows.length,
// //       avgCompletion: allOveralls.length
// //         ? Math.round(allOveralls.reduce((a, b) => a + b, 0) / allOveralls.length)
// //         : 0,
// //       domainsWithTrainees,
// //       totalDomains,
// //       below20,
// //     },
// //     domainAverages,
// //     categoryAverages,
// //     flagged,
// //   });
// // };




// //========================================================== v3

// const User = require('../models/User');
// const Domain = require('../models/Domain');
// const Document = require('../models/Document');
// const Checklist = require('../models/Checklist');
// const ChecklistResponse = require('../models/ChecklistResponse');
// const Writeup = require('../models/Writeup');
// const WriteupAnswer = require('../models/WriteupAnswer');
// const MaterialReview = require('../models/MaterialReview');

// const CATEGORIES = ['tool', 'concepts', 'practical', 'advanced'];

// function pct(part, total) {
//   if (!total) return null; // null => "not applicable / not started"
//   return Math.round((part / total) * 100);
// }

// function daysEnrolled(user) {
//   const start = user.enrolledAt || user.createdAt || new Date();
//   return Math.max(0, Math.floor((Date.now() - new Date(start).getTime()) / 86400000));
// }

// function paceLabel(bestPct, days) {
//   if (!days || !bestPct) return 'Just started';
//   const perDay = bestPct / days;
//   if (perDay >= 1.5) return 'Good pace';
//   if (perDay >= 0.6) return 'Steady pace';
//   return 'Slow pace';
// }

// // Compute one employee's full breakdown across all domains.
// async function computeEmployeeProgress(employeeId) {
//   const [domains, docs, checklists, writeups] = await Promise.all([
//     Domain.find({ active: true }),
//     Document.find({ active: true }),
//     Checklist.find({ active: true }),
//     Writeup.find({ active: true }),
//   ]);

//   const checklistIds = checklists.map((c) => c._id);
//   const writeupIds = writeups.map((w) => w._id);

//   const [responses, answers, reviews] = await Promise.all([
//     ChecklistResponse.find({ employee: employeeId, checklist: { $in: checklistIds } }),
//     WriteupAnswer.find({ employee: employeeId, writeup: { $in: writeupIds } }),
//     MaterialReview.find({ employee: employeeId }),
//   ]);

//   const responseByChecklist = {};
//   responses.forEach((r) => (responseByChecklist[String(r.checklist)] = r));
//   const answerByWriteup = {};
//   answers.forEach((a) => (answerByWriteup[String(a.writeup)] = a));
//   const reviewedDocs = new Set(reviews.filter((r) => r.reviewed).map((r) => String(r.document)));

//   const domainResult = {};

//   for (const domain of domains) {
//     const dId = String(domain._id);
//     const domainDocs = docs.filter((d) => String(d.domain) === dId);
//     const domainDocIds = new Set(domainDocs.map((d) => String(d._id)));

//     // counters
//     const catCounts = { tool: [0, 0], concepts: [0, 0], advanced: [0, 0] }; // [understood, total]
//     let writeupAnswered = 0;
//     let writeupTotal = 0;
//     let materialsReviewed = 0;
//     const materialsTotal = domainDocs.length;

//     // ---- NEW: detailed, per-employee lists straight from the DB ----
//     const materialsList = [];
//     const checklistDetail = [];
//     const writeupDetail = [];
//     let checklistCompleted = 0;
//     let checklistTotal = 0;

//     // materials
//     domainDocs.forEach((d) => {
//       const reviewed = reviewedDocs.has(String(d._id));
//       if (reviewed) materialsReviewed += 1;

//       materialsList.push({
//         id: String(d._id),
//         title: d.title,
//         originalName: d.originalName,
//         description: d.description || '',
//         mimeType: d.mimeType || '',
//         cloudinaryUrl: d.cloudinaryUrl || null,
//         previewUrl: d.previewUrl || null,
//         reviewed,
//       });
//     });

//     // checklists in this domain
//     checklists
//       .filter((c) => domainDocIds.has(String(c.document)) || String(c.domain) === dId)
//       .forEach((c) => {
//         const resp = responseByChecklist[String(c._id)];
//         const respMap = {};
//         if (resp) resp.responses.forEach((r) => (respMap[String(r.item)] = r));

//         const items = [];

//         c.items.forEach((item) => {
//           const cat = ['tool', 'concepts', 'advanced'].includes(item.category)
//             ? item.category
//             : 'tool';
//           catCounts[cat][1] += 1;
//           const r = respMap[String(item._id)];
//           const understood = !!(r && r.understood);
//           if (understood) catCounts[cat][0] += 1;

//           checklistTotal += 1;
//           if (understood) checklistCompleted += 1;

//           items.push({
//             id: String(item._id),
//             text: item.text,
//             category: item.category || 'tool',
//             section: item.section || '',
//             code: item.code || '',
//             topic: item.topic || '',
//             understood,
//             tried: !!(r && r.tried),
//             proficiency: r ? r.proficiency || 0 : 0,
//           });
//         });

//         checklistDetail.push({
//           id: String(c._id),
//           title: c.title,
//           document: String(c.document),
//           items,
//         });
//       });

//     // writeups in this domain
//     writeups
//       .filter((w) => domainDocIds.has(String(w.document)) || String(w.domain) === dId)
//       .forEach((w) => {
//         const ans = answerByWriteup[String(w._id)];
//         const ansMap = {};
//         if (ans) ans.answers.forEach((a) => (ansMap[String(a.question)] = a.answer));

//         const questions = [];

//         w.questions.forEach((q) => {
//           writeupTotal += 1;
//           const a = ansMap[String(q._id)];
//           const answered = !!(a && String(a).trim().length > 0);
//           if (answered) writeupAnswered += 1;

//           questions.push({
//             id: String(q._id),
//             text: q.text,
//             section: q.section || 'General',
//             answer: a || '',
//             answered,
//           });
//         });

//         writeupDetail.push({
//           id: String(w._id),
//           title: w.title,
//           document: String(w.document),
//           questions,
//         });
//       });

//     const tool = pct(catCounts.tool[0], catCounts.tool[1]);
//     const concepts = pct(catCounts.concepts[0], catCounts.concepts[1]);
//     const practical = pct(writeupAnswered, writeupTotal);
//     const advanced = pct(catCounts.advanced[0], catCounts.advanced[1]);

//     const nums = [tool, concepts, practical, advanced].filter((v) => v != null);
//     const overall = nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;

//     domainResult[domain.key] = {
//       domainId: dId,
//       key: domain.key,
//       name: domain.name,
//       icon: domain.icon,
//       description: domain.description,
//       tool,
//       concepts,
//       practical,
//       advanced,
//       overall,
//       materials: { reviewed: materialsReviewed, total: materialsTotal },
//       started: overall != null && overall > 0,

//       // ---- NEW: everything the detail pages need, calculated from the DB ----
//       score: overall || 0,

//       materialsList,
//       materialsReviewed,
//       materialsTotal,

//       checklists: checklistDetail,
//       checklistCompleted,
//       checklistTotal,
//       toolCompleted: catCounts.tool[0],
//       toolTotal: catCounts.tool[1],
//       conceptCompleted: catCounts.concepts[0],
//       conceptTotal: catCounts.concepts[1],
//       advancedCompleted: catCounts.advanced[0],
//       advancedTotal: catCounts.advanced[1],

//       writeups: writeupDetail,
//       writeupAnswered,
//       writeupTotal,
//     };
//   }

//   return domainResult;
// }

// // GET /api/tracking/me  (employee's own progress)
// exports.myProgress = async (req, res) => {
//   const progress = await computeEmployeeProgress(req.user._id);
//   const active = Object.values(progress).filter((d) => d.started);
//   const overalls = active.map((d) => d.overall).filter((v) => v != null);
//   const avg = overalls.length ? Math.round(overalls.reduce((a, b) => a + b, 0) / overalls.length) : 0;
//   const best = Object.values(progress).reduce(
//     (acc, d) => (d.overall != null && d.overall > acc.val ? { key: d.name, val: d.overall } : acc),
//     { key: '-', val: -1 }
//   );
//   const days = daysEnrolled(req.user);
//   res.json({
//     user: req.user.toSafeJSON(),
//     progress,
//     summary: {
//       daysEnrolled: days,
//       avgCompletion: avg,
//       domainsStarted: active.length,
//       totalDomains: Object.keys(progress).length,
//       strongestDomain: best.key,
//       pace: paceLabel(best.val > 0 ? best.val : 0, days),
//     },
//   });
// };

// // GET /api/tracking/employee/:id  (manager/admin view of one employee)
// exports.employeeProgress = async (req, res) => {
//   try {
//     const employee = await User.findById(req.params.id).populate(
//       'assignedDomains',
//       'name icon description'
//     );

//     if (!employee || employee.role !== 'employee') {
//       return res.status(404).json({
//         message: 'Employee not found',
//       });
//     }

//     if (
//       req.user.role === 'manager' &&
//       String(employee.manager) !== String(req.user._id)
//     ) {
//       return res.status(403).json({
//         message: 'Forbidden',
//       });
//     }

//     const progress = await computeEmployeeProgress(
//       employee._id
//     );

//     const active = Object.values(progress).filter(
//       (d) => d.started
//     );

//     const overalls = active
//       .map((d) => d.overall)
//       .filter((v) => v != null);

//     const avg = overalls.length
//       ? Math.round(
//           overalls.reduce((a, b) => a + b, 0) /
//             overalls.length
//         )
//       : 0;

//     const best = Object.values(progress).reduce(
//       (acc, d) =>
//         d.overall != null &&
//         d.overall > acc.val
//           ? {
//               key: d.name,
//               val: d.overall,
//             }
//           : acc,
//       {
//         key: '-',
//         val: -1,
//       }
//     );

//     const days = daysEnrolled(employee);

//     res.json({
//       user: employee.toSafeJSON(),
//       progress,
//       summary: {
//         daysEnrolled: days,
//         avgCompletion: avg,
//         domainsStarted: active.length,
//         totalDomains: Object.keys(progress).length,
//         strongestDomain: best.key,
//         pace: paceLabel(
//           best.val > 0 ? best.val : 0,
//           days
//         ),
//       },
//     });
//   } catch (error) {
//     console.error(
//       '[employeeProgress] Error:',
//       error
//     );

//     res.status(500).json({
//       message: 'Failed to load employee progress',
//     });
//   }
// };

// // GET /api/tracking/cohort  (executive dashboard: all employees x domains x categories)
// exports.cohort = async (req, res) => {
//   let employeeFilter = { role: 'employee', active: true };
//   if (req.user.role === 'manager') employeeFilter.manager = req.user._id;

//   const employees = await User.find(employeeFilter).sort({ name: 1 });
//   const rows = [];

//   for (const emp of employees) {
//     const progress = await computeEmployeeProgress(emp._id);
//     rows.push({
//       id: emp._id,
//       name: emp.name,
//       employeeCode: emp.employeeCode,
//       daysEnrolled: daysEnrolled(emp),
//       domains: progress,
//     });
//   }

//   // cohort KPIs
//   const allOveralls = [];
//   let below20 = 0;
//   const domainAgg = {}; // key -> [sum, count]
//   const catAgg = { tool: [0, 0], concepts: [0, 0], practical: [0, 0], advanced: [0, 0] };

//   rows.forEach((row) => {
//     const active = Object.values(row.domains).filter((d) => d.started);
//     const ovs = active.map((d) => d.overall).filter((v) => v != null);
//     const empAvg = ovs.length ? Math.round(ovs.reduce((a, b) => a + b, 0) / ovs.length) : 0;
//     allOveralls.push(empAvg);
//     if (active.length > 0 && empAvg < 20) below20 += 1;

//     Object.entries(row.domains).forEach(([key, d]) => {
//       if (d.overall != null && d.started) {
//         if (!domainAgg[key]) domainAgg[key] = [0, 0];
//         domainAgg[key][0] += d.overall;
//         domainAgg[key][1] += 1;
//       }
//       CATEGORIES.forEach((c) => {
//         if (d[c] != null) {
//           catAgg[c][0] += d[c];
//           catAgg[c][1] += 1;
//         }
//       });
//     });
//   });

//   const domainAverages = {};
//   Object.entries(domainAgg).forEach(([k, [s, c]]) => (domainAverages[k] = c ? Math.round(s / c) : 0));
//   const categoryAverages = {};
//   CATEGORIES.forEach((c) => (categoryAverages[c] = catAgg[c][1] ? Math.round(catAgg[c][0] / catAgg[c][1]) : 0));

//   const domainsWithTrainees = Object.values(domainAgg).filter(([, c]) => c > 0).length;
//   const totalDomains = await Domain.countDocuments({ active: true });

//   // flagged: active but below 20% overall
//   const flagged = rows
//     .map((row) => {
//       const active = Object.values(row.domains).filter((d) => d.started);
//       const best = Object.values(row.domains).reduce(
//         (acc, d) => (d.overall != null && d.overall > acc.val ? { name: d.name, val: d.overall } : acc),
//         { name: '-', val: -1 }
//       );
//       const ovs = active.map((d) => d.overall).filter((v) => v != null);
//       const empAvg = ovs.length ? Math.round(ovs.reduce((a, b) => a + b, 0) / ovs.length) : 0;
//       return { id: row.id, name: row.name, best, empAvg, days: row.daysEnrolled, active: active.length };
//     })
//     .filter((r) => r.active === 0 || r.empAvg < 20);

//   res.json({
//     rows,
//     kpis: {
//       cohortSize: rows.length,
//       avgCompletion: allOveralls.length
//         ? Math.round(allOveralls.reduce((a, b) => a + b, 0) / allOveralls.length)
//         : 0,
//       domainsWithTrainees,
//       totalDomains,
//       below20,
//     },
//     domainAverages,
//     categoryAverages,
//     flagged,
//   });
// };


const User = require('../models/User');
const Domain = require('../models/Domain');
const Document = require('../models/Document');
const Checklist = require('../models/Checklist');
const ChecklistResponse = require('../models/ChecklistResponse');
const Writeup = require('../models/Writeup');
const WriteupAnswer = require('../models/WriteupAnswer');
const MaterialReview = require('../models/MaterialReview');
const PptSubmission = require('../models/PptSubmission');
const CATEGORIES = ['tool', 'concepts', 'practical', 'advanced'];

function pct(part, total) {
  if (!total) return null; // null => "not applicable / not started"
  return Math.round((part / total) * 100);
}

function daysEnrolled(user) {
  const start = user.enrolledAt || user.createdAt || new Date();
  return Math.max(0, Math.floor((Date.now() - new Date(start).getTime()) / 86400000));
}

function paceLabel(bestPct, days) {
  if (!days || !bestPct) return 'Just started';
  const perDay = bestPct / days;
  if (perDay >= 1.5) return 'Good pace';
  if (perDay >= 0.6) return 'Steady pace';
  return 'Slow pace';
}

// Compute one employee's full breakdown across all domains.
async function computeEmployeeProgress(employeeId) {
  const [domains, docs, checklists, writeups] = await Promise.all([
    Domain.find({ active: true }),
    Document.find({ active: true }),
    Checklist.find({ active: true }),
    Writeup.find({ active: true }),
  ]);

  const checklistIds = checklists.map((c) => c._id);
  const writeupIds = writeups.map((w) => w._id);

  const [responses, answers, reviews, pptSubs] = await Promise.all([
    ChecklistResponse.find({ employee: employeeId, checklist: { $in: checklistIds } }),
    WriteupAnswer.find({ employee: employeeId, writeup: { $in: writeupIds } }),
    MaterialReview.find({ employee: employeeId }),
    PptSubmission.find({ uploadedBy: employeeId }),
  ]);

  const pptByDomain = new Set(pptSubs.map((p) => String(p.domain)));

  const responseByChecklist = {};
  responses.forEach((r) => (responseByChecklist[String(r.checklist)] = r));
  const answerByWriteup = {};
  answers.forEach((a) => (answerByWriteup[String(a.writeup)] = a));
  const reviewedDocs = new Set(reviews.filter((r) => r.reviewed).map((r) => String(r.document)));

  const domainResult = {};

  for (const domain of domains) {
    const dId = String(domain._id);
    const domainDocs = docs.filter((d) => String(d.domain) === dId);
    const domainDocIds = new Set(domainDocs.map((d) => String(d._id)));

    // counters
    const catCounts = { tool: [0, 0], concepts: [0, 0], advanced: [0, 0] }; // [understood, total]
    let writeupAnswered = 0;
    let writeupTotal = 0;
    let materialsReviewed = 0;
    const materialsTotal = domainDocs.length;

    // ---- NEW: detailed, per-employee lists straight from the DB ----
    const materialsList = [];
    const checklistDetail = [];
    const writeupDetail = [];
    let checklistCompleted = 0;
    let checklistTotal = 0;

    // materials
    domainDocs.forEach((d) => {
      const reviewed = reviewedDocs.has(String(d._id));
      if (reviewed) materialsReviewed += 1;

      materialsList.push({
        id: String(d._id),
        title: d.title,
        originalName: d.originalName,
        description: d.description || '',
        mimeType: d.mimeType || '',
        cloudinaryUrl: d.cloudinaryUrl || null,
        previewUrl: d.previewUrl || null,
        reviewed,
      });
    });

    // checklists in this domain
    checklists
      .filter((c) => domainDocIds.has(String(c.document)) || String(c.domain) === dId)
      .forEach((c) => {
        const resp = responseByChecklist[String(c._id)];
        const respMap = {};
        if (resp) resp.responses.forEach((r) => (respMap[String(r.item)] = r));

        const items = [];

        c.items.forEach((item) => {
          const cat = ['tool', 'concepts', 'advanced'].includes(item.category)
            ? item.category
            : 'tool';
          catCounts[cat][1] += 1;
          const r = respMap[String(item._id)];
          const understood = !!(r && r.understood);
          if (understood) catCounts[cat][0] += 1;

          checklistTotal += 1;
          if (understood) checklistCompleted += 1;

          items.push({
            id: String(item._id),
            text: item.text,
            category: item.category || 'tool',
            section: item.section || '',
            code: item.code || '',
            topic: item.topic || '',
            understood,
            tried: !!(r && r.tried),
            proficiency: r ? r.proficiency || 0 : 0,
          });
        });

        checklistDetail.push({
          id: String(c._id),
          title: c.title,
          document: String(c.document),
          items,
        });
      });

    // writeups in this domain
    writeups
      .filter((w) => domainDocIds.has(String(w.document)) || String(w.domain) === dId)
      .forEach((w) => {
        const ans = answerByWriteup[String(w._id)];
        const ansMap = {};
        if (ans) ans.answers.forEach((a) => (ansMap[String(a.question)] = a.answer));

        const questions = [];

        w.questions.forEach((q) => {
          writeupTotal += 1;
          const a = ansMap[String(q._id)];
          const answered = !!(a && String(a).trim().length > 0);
          if (answered) writeupAnswered += 1;

          questions.push({
            id: String(q._id),
            text: q.text,
            section: q.section || 'General',
            answer: a || '',
            answered,
          });
        });

        writeupDetail.push({
          id: String(w._id),
          title: w.title,
          document: String(w.document),
          questions,
        });
      });

    const tool = pct(catCounts.tool[0], catCounts.tool[1]);
    const concepts = pct(catCounts.concepts[0], catCounts.concepts[1]);
    const practical = pct(writeupAnswered, writeupTotal);
    const advanced = pct(catCounts.advanced[0], catCounts.advanced[1]);

    // the four tracked areas
    const materialsPct = materialsTotal ? Math.round((materialsReviewed / materialsTotal) * 100) : null;
    const checklistPct = checklistTotal ? Math.round((checklistCompleted / checklistTotal) * 100) : null;
    const writeupPct = writeupTotal ? Math.round((writeupAnswered / writeupTotal) * 100) : null;
    const pptPct = pptByDomain.has(dId) ? 100 : 0;

    // training score = average of the four tracked areas
    const scoreParts = [materialsPct, checklistPct, writeupPct, pptPct].filter((v) => v != null);
    const overall = scoreParts.length
      ? Math.round(scoreParts.reduce((a, b) => a + b, 0) / scoreParts.length)
      : null;

    domainResult[domain.key] = {
      domainId: dId,
      key: domain.key,
      name: domain.name,
      icon: domain.icon,
      description: domain.description,
      tool,
      concepts,
      practical,
      advanced,
      overall,
      materials: { reviewed: materialsReviewed, total: materialsTotal },
      started: overall != null && overall > 0,

      // ---- NEW: everything the detail pages need, calculated from the DB ----
      score: overall || 0,

      materialsList,
      materialsReviewed,
      materialsTotal,

      checklists: checklistDetail,
      checklistCompleted,
      checklistTotal,
      toolCompleted: catCounts.tool[0],
      toolTotal: catCounts.tool[1],
      conceptCompleted: catCounts.concepts[0],
      conceptTotal: catCounts.concepts[1],
      advancedCompleted: catCounts.advanced[0],
      advancedTotal: catCounts.advanced[1],

      writeups: writeupDetail,
      writeupAnswered,
      writeupTotal,

      materialsPct,
      checklistPct,
      writeupPct,
      pptPct,
    };
  }

  return domainResult;
}

// GET /api/tracking/me  (employee's own progress)
exports.myProgress = async (req, res) => {
  const progress = await computeEmployeeProgress(req.user._id);
  const active = Object.values(progress).filter((d) => d.started);
  const overalls = active.map((d) => d.overall).filter((v) => v != null);
  const avg = overalls.length ? Math.round(overalls.reduce((a, b) => a + b, 0) / overalls.length) : 0;
  const best = Object.values(progress).reduce(
    (acc, d) => (d.overall != null && d.overall > acc.val ? { key: d.name, val: d.overall } : acc),
    { key: '-', val: -1 }
  );
  const days = daysEnrolled(req.user);
  res.json({
    user: req.user.toSafeJSON(),
    progress,
    summary: {
      daysEnrolled: days,
      avgCompletion: avg,
      domainsStarted: active.length,
      totalDomains: Object.keys(progress).length,
      strongestDomain: best.key,
      pace: paceLabel(best.val > 0 ? best.val : 0, days),
    },
  });
};

// GET /api/tracking/employee/:id  (manager/admin view of one employee)
exports.employeeProgress = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).populate(
      'assignedDomains',
      'name icon description'
    );

    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({
        message: 'Employee not found',
      });
    }

    if (
      req.user.role === 'manager' &&
      String(employee.manager) !== String(req.user._id)
    ) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    const progress = await computeEmployeeProgress(
      employee._id
    );

    const active = Object.values(progress).filter(
      (d) => d.started
    );

    const overalls = active
      .map((d) => d.overall)
      .filter((v) => v != null);

    const avg = overalls.length
      ? Math.round(
        overalls.reduce((a, b) => a + b, 0) /
        overalls.length
      )
      : 0;

    const best = Object.values(progress).reduce(
      (acc, d) =>
        d.overall != null &&
          d.overall > acc.val
          ? {
            key: d.name,
            val: d.overall,
          }
          : acc,
      {
        key: '-',
        val: -1,
      }
    );

    const days = daysEnrolled(employee);

    res.json({
      user: employee.toSafeJSON(),
      progress,
      summary: {
        daysEnrolled: days,
        avgCompletion: avg,
        domainsStarted: active.length,
        totalDomains: Object.keys(progress).length,
        strongestDomain: best.key,
        pace: paceLabel(
          best.val > 0 ? best.val : 0,
          days
        ),
      },
    });
  } catch (error) {
    console.error(
      '[employeeProgress] Error:',
      error
    );

    res.status(500).json({
      message: 'Failed to load employee progress',
    });
  }
};

// GET /api/tracking/cohort  (executive dashboard: all employees x domains x categories)
exports.cohort = async (req, res) => {
  let employeeFilter = { role: 'employee', active: true };
  if (req.user.role === 'manager') employeeFilter.manager = req.user._id;

  const employees = await User.find(employeeFilter).sort({ name: 1 });
  const rows = [];

  for (const emp of employees) {
    const progress = await computeEmployeeProgress(emp._id);
    rows.push({
      id: emp._id,
      name: emp.name,
      employeeCode: emp.employeeCode,
      daysEnrolled: daysEnrolled(emp),
      domains: progress,
    });
  }

  // cohort KPIs
  const allOveralls = [];
  let below20 = 0;
  const domainAgg = {}; // key -> [sum, count]
  const catAgg = { tool: [0, 0], concepts: [0, 0], practical: [0, 0], advanced: [0, 0] };

  rows.forEach((row) => {
    const active = Object.values(row.domains).filter((d) => d.started);
    const ovs = active.map((d) => d.overall).filter((v) => v != null);
    const empAvg = ovs.length ? Math.round(ovs.reduce((a, b) => a + b, 0) / ovs.length) : 0;
    allOveralls.push(empAvg);
    if (active.length > 0 && empAvg < 20) below20 += 1;

    Object.entries(row.domains).forEach(([key, d]) => {
      if (d.overall != null && d.started) {
        if (!domainAgg[key]) domainAgg[key] = [0, 0];
        domainAgg[key][0] += d.overall;
        domainAgg[key][1] += 1;
      }
      CATEGORIES.forEach((c) => {
        if (d[c] != null) {
          catAgg[c][0] += d[c];
          catAgg[c][1] += 1;
        }
      });
    });
  });

  const domainAverages = {};
  Object.entries(domainAgg).forEach(([k, [s, c]]) => (domainAverages[k] = c ? Math.round(s / c) : 0));
  const categoryAverages = {};
  CATEGORIES.forEach((c) => (categoryAverages[c] = catAgg[c][1] ? Math.round(catAgg[c][0] / catAgg[c][1]) : 0));

  const domainsWithTrainees = Object.values(domainAgg).filter(([, c]) => c > 0).length;
  const totalDomains = await Domain.countDocuments({ active: true });

  // flagged: active but below 20% overall
  const flagged = rows
    .map((row) => {
      const active = Object.values(row.domains).filter((d) => d.started);
      const best = Object.values(row.domains).reduce(
        (acc, d) => (d.overall != null && d.overall > acc.val ? { name: d.name, val: d.overall } : acc),
        { name: '-', val: -1 }
      );
      const ovs = active.map((d) => d.overall).filter((v) => v != null);
      const empAvg = ovs.length ? Math.round(ovs.reduce((a, b) => a + b, 0) / ovs.length) : 0;
      return { id: row.id, name: row.name, best, empAvg, days: row.daysEnrolled, active: active.length };
    })
    .filter((r) => r.active === 0 || r.empAvg < 20);

  // area averages (Training material / Tools & concept / Writeup / PPT) across all employees
  const AREAS = ['materials', 'checklist', 'writeup', 'ppt'];
  const areaField = { materials: 'materialsPct', checklist: 'checklistPct', writeup: 'writeupPct', ppt: 'pptPct' };
  const areaAgg = { materials: [0, 0], checklist: [0, 0], writeup: [0, 0], ppt: [0, 0] };
  const areaByDomainAgg = {};
  const areaDomainNames = {};

  rows.forEach((row) => {
    Object.entries(row.domains).forEach(([key, d]) => {
      const hasContent = (d.materialsTotal || 0) > 0 || (d.checklistTotal || 0) > 0 || (d.writeupTotal || 0) > 0;
      if (!hasContent) return;
      areaDomainNames[key] = d.name;
      if (!areaByDomainAgg[key]) areaByDomainAgg[key] = { materials: [0, 0], checklist: [0, 0], writeup: [0, 0], ppt: [0, 0] };
      AREAS.forEach((a) => {
        const v = d[areaField[a]];
        if (v == null) return;
        areaAgg[a][0] += v; areaAgg[a][1] += 1;
        areaByDomainAgg[key][a][0] += v; areaByDomainAgg[key][a][1] += 1;
      });
    });
  });

  const avgOf = (pair) => (pair[1] ? Math.round(pair[0] / pair[1]) : 0);
  const areaAverages = {
    materials: avgOf(areaAgg.materials), checklist: avgOf(areaAgg.checklist),
    writeup: avgOf(areaAgg.writeup), ppt: avgOf(areaAgg.ppt),
  };
  const areaAveragesByDomain = {};
  Object.entries(areaByDomainAgg).forEach(([key, agg]) => {
    areaAveragesByDomain[key] = {
      materials: avgOf(agg.materials), checklist: avgOf(agg.checklist),
      writeup: avgOf(agg.writeup), ppt: avgOf(agg.ppt),
    };
  });
  const areaDomains = Object.entries(areaDomainNames).map(([key, name]) => ({ key, name }));

  res.json({
    rows,
    kpis: {
      cohortSize: rows.length,
      avgCompletion: allOveralls.length
        ? Math.round(allOveralls.reduce((a, b) => a + b, 0) / allOveralls.length)
        : 0,
      domainsWithTrainees,
      totalDomains,
      below20,
    },
    domainAverages,
    categoryAverages,
    areaAverages,
    areaAveragesByDomain,
    areaDomains,
    flagged,

  });
};