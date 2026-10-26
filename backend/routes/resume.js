const express = require('express');
const PDFDocument = require('pdfkit');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

const clean = (v='') => String(v || '').replace(/\s+/g,' ').trim();
const safeFile = (v='Student') => clean(v).replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,'') || 'Student';
const templates = ['ats','modern','executive','graduate','minimal'];

router.get('/data', protect, async (req,res)=>{
  if(req.user.role!=='student') return res.status(403).json({message:'Students only'});
  const s=await User.findById(req.user._id).select('-password -resetPasswordToken -resetPasswordExpires').lean();
  res.json({success:true,data:s});
});

function header(doc,s,template){
  const accent = template==='modern' ? '#314B68' : template==='executive' ? '#6A5140' : '#222';
  if(template==='modern'){
    doc.fillColor(accent).fontSize(26).font('Helvetica-Bold').text(clean(s.name)||'Your Name');
    doc.fillColor('#555').fontSize(10).font('Helvetica').text([s.email,s.phone,s.location,s.linkedIn,s.github,s.portfolio].filter(Boolean).join('  •  '));
    doc.moveDown(.25).moveTo(50,doc.y).lineTo(545,doc.y).strokeColor(accent).lineWidth(2).stroke();
  } else if(template==='executive'){
    doc.fillColor(accent).fontSize(25).font('Times-Bold').text(clean(s.name)||'Your Name',{align:'center'});
    doc.fillColor('#666').fontSize(9).font('Helvetica').text([s.email,s.phone,s.location,s.linkedIn,s.github,s.portfolio].filter(Boolean).join('   |   '),{align:'center'});
    doc.moveDown(.35).moveTo(110,doc.y).lineTo(485,doc.y).strokeColor(accent).lineWidth(.8).stroke();
  } else {
    doc.fillColor('#111').fontSize(template==='graduate'?24:22).font('Helvetica-Bold').text(clean(s.name)||'Your Name');
    doc.fillColor('#555').fontSize(9).font('Helvetica').text([s.email,s.phone,s.location,s.linkedIn,s.github,s.portfolio].filter(Boolean).join('  |  '));
    doc.moveDown(.25).moveTo(50,doc.y).lineTo(545,doc.y).strokeColor('#333').lineWidth(template==='minimal'?.6:1).stroke();
  }
  doc.fillColor('#111');
}

function section(doc,title,template){
  const color=template==='modern'?'#314B68':template==='executive'?'#6A5140':'#222';
  doc.moveDown(.55).fillColor(color).fontSize(10.5).font('Helvetica-Bold').text(title.toUpperCase());
  doc.moveDown(.08).moveTo(50,doc.y).lineTo(545,doc.y).strokeColor(color).lineWidth(.5).stroke().moveDown(.22);
  doc.fillColor('#222').fontSize(9.4).font('Helvetica');
}

router.put('/template', protect, async(req,res)=>{
  if(req.user.role!=='student') return res.status(403).json({message:'Students only'});
  const template=templates.includes(req.body.template)?req.body.template:'ats';
  await User.findByIdAndUpdate(req.user._id,{resumeTemplate:template});
  res.json({success:true,template});
});

router.get('/generate', protect, async(req,res)=>{
 try{
  if(req.user.role!=='student')return res.status(403).json({message:'Students only'});
  const s=await User.findById(req.user._id).lean();
  const template=templates.includes(req.query.template)?req.query.template:(s.resumeTemplate||'ats');
  const doc=new PDFDocument({size:'A4',margin:50,info:{Title:`${s.name} Resume`,Author:'CareerConnect Resume Studio'}});
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition',`attachment; filename="${safeFile(s.name)}_${template}_Resume.pdf"`);
  doc.pipe(res);
  header(doc,s,template);
  if(s.resumeHeadline){doc.font('Helvetica-Bold').fontSize(11).fillColor('#444').text(clean(s.resumeHeadline)); doc.fillColor('#111');}
  if(s.about){section(doc,'Professional Summary',template);doc.text(clean(s.about),{lineGap:2});}
  section(doc,'Education',template);
  doc.font('Helvetica-Bold').text(`${clean(s.degree)||'Degree'}${s.branch?` — ${clean(s.branch)}`:''}`);
  doc.font('Helvetica').text(`Batch: ${s.batch||'—'}   |   CGPA: ${s.cgpa??'—'}${s.rollNumber?`   |   Roll No: ${s.rollNumber}`:''}`);
  if(s.tenthScore!=null||s.twelfthScore!=null) doc.text(`10th: ${s.tenthScore??'—'}%   |   12th: ${s.twelfthScore??'—'}%   |   Backlogs: ${s.backlogs??0}`);
  if(s.experience?.length){section(doc,'Experience',template);s.experience.forEach(x=>doc.text(`• ${clean(x)}`,{lineGap:2}).moveDown(.12));}
  if(s.projects?.length){section(doc,'Projects',template);s.projects.forEach(p=>{doc.font('Helvetica-Bold').text(clean(p.title)||'Project');doc.font('Helvetica').text(clean(p.description),{lineGap:2});if(p.technologies?.length)doc.fillColor('#555').text(`Technologies: ${p.technologies.map(clean).join(' • ')}`);if(p.github||p.liveDemo)doc.fillColor('#555').text([p.github,p.liveDemo].filter(Boolean).map(clean).join('  |  '));doc.fillColor('#222').moveDown(.3);});}
  if(s.skills?.length){section(doc,'Technical Skills',template);doc.text(s.skills.map(clean).filter(Boolean).join('  •  '));}
  if(s.certifications?.length){section(doc,'Certifications',template);s.certifications.forEach(x=>doc.text(`• ${clean(x)}`).moveDown(.08));}
  if(s.achievements?.length){section(doc,'Achievements & Leadership',template);s.achievements.forEach(x=>doc.text(`• ${clean(x)}`).moveDown(.08));}
  if(s.careerGoals?.length){section(doc,'Career Interests',template);doc.text(s.careerGoals.map(clean).join('  •  '));}
  if(s.customSections?.length){s.customSections.filter(x=>clean(x.title)).forEach(sec=>{section(doc,clean(sec.title),template);(sec.bullets||[]).filter(Boolean).forEach(x=>doc.text(`• ${clean(x)}`,{lineGap:2}).moveDown(.08));});}
  doc.end();
 }catch(err){res.status(500).json({message:err.message});}
});
module.exports=router;
