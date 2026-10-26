const express = require('express');
const Drive = require('../models/Drive');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Interview = require('../models/Interview');
const Offer = require('../models/Offer');
const sanitizeHtml = require('sanitize-html');
const Notification = require('../models/Notification');
const { protect, companyOnly } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect, companyOnly);

const cleanHtml = (html='') => sanitizeHtml(html, { allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1','h2','h3','u','s','br']), allowedAttributes: { a: ['href','target','rel'] } });

router.get('/dashboard', async (req,res)=>{
  try {
    const drives = await Drive.find({ createdBy: req.user._id }).lean();
    const driveIds = drives.map(d=>d._id);
    const applicants = drives.reduce((n,d)=>n+d.applicants.length,0);
    const shortlisted = drives.reduce((n,d)=>n+d.applicants.filter(a=>a.stage==='shortlisted'||a.stage==='technical'||a.stage==='hr'||a.stage==='selected').length,0);
    const selected = drives.reduce((n,d)=>n+d.applicants.filter(a=>a.stage==='selected').length,0);
    const interviews = await Interview.countDocuments({ driveId: {$in: driveIds}, status:'scheduled' });
    res.json({success:true,data:{drives:drives.length, applicants, shortlisted, selected, interviews, recentDrives:drives.slice(0,5)}});
  }catch(err){res.status(500).json({message:err.message});}
});

router.get('/drives', async (req,res)=>{
  const drives = await Drive.find({createdBy:req.user._id}).sort({createdAt:-1});
  res.json(drives);
});

router.post('/drives', async (req,res)=>{
  try{
    const body={...req.body, createdBy:req.user._id, company:req.user.companyName || req.body.company, description:cleanHtml(req.body.description || '')};
    const drive=await Drive.create(body);
    res.status(201).json(drive);
  }catch(err){res.status(400).json({message:err.message});}
});

router.put('/drives/:id', async (req,res)=>{
  try{
    const drive=await Drive.findOne({_id:req.params.id,createdBy:req.user._id});
    if(!drive)return res.status(404).json({message:'Drive not found'});
    Object.assign(drive, req.body, {description:cleanHtml(req.body.description || drive.description)});
    await drive.save(); res.json(drive);
  }catch(err){res.status(400).json({message:err.message});}
});

router.get('/drives/:id/applicants', async(req,res)=>{
  try{
    const drive=await Drive.findOne({_id:req.params.id,createdBy:req.user._id}).populate('applicants.student','name email rollNumber cgpa branch skills resumeUrl batch');
    if(!drive)return res.status(404).json({message:'Drive not found'});
    res.json(drive.applicants);
  }catch(err){res.status(500).json({message:err.message});}
});

router.put('/drives/:driveId/applicants/:studentId', async(req,res)=>{
  try{
    const {stage}=req.body;
    const allowed=['applied','shortlisted','technical','hr','selected','rejected'];
    if(!allowed.includes(stage))return res.status(400).json({message:'Invalid stage'});
    const drive=await Drive.findOne({_id:req.params.driveId,createdBy:req.user._id});
    if(!drive)return res.status(404).json({message:'Drive not found'});
    const applicant=drive.applicants.find(a=>String(a.student)===String(req.params.studentId));
    if(!applicant)return res.status(404).json({message:'Applicant not found'});
    applicant.stage=stage; if(stage==='selected') applicant.selectedAt=new Date(); await drive.save();
    if(stage==='selected') {
      const student = await User.findById(req.params.studentId).select('placementStatus placedAt');
      await User.findByIdAndUpdate(req.params.studentId, { placementStatus:'placed', placedAt:drive.company });
      await Offer.findOneAndUpdate({studentId:req.params.studentId, driveId:drive._id}, {studentId:req.params.studentId,driveId:drive._id,company:drive.company,packageLPA:Number(drive.packageValue)||0,status:'Accepted',offerDate:new Date()}, {upsert:true,new:true,setDefaultsOnInsert:true});
    }
    const stageLabel={applied:'Applied',shortlisted:'Shortlisted',technical:'Technical Interview',hr:'HR Round',selected:'Selected',rejected:'Rejected'}[stage] || stage;
    Notification.create({userId:req.params.studentId,title:`Application update · ${drive.company}`,message:`Your ${drive.role} application is now at: ${stageLabel}.`,type:stage==='selected'?'offer':'application',link:'/dashboard/applications'}).catch(()=>{});
    Activity.create({type:'APPLICATION_STATUS_UPDATED',text:`<b>${req.user.companyName || req.user.name}</b> moved an applicant to ${stage}`,createdBy:req.user._id,drive:drive._id,student:req.params.studentId}).catch(()=>{});
    res.json(applicant);
  }catch(err){res.status(500).json({message:err.message});}
});

router.post('/interviews', async(req,res)=>{
  try{
    const {driveId,studentId,round,scheduledAt,mode,meetingLink,venue,interviewer,notes}=req.body;
    const drive=await Drive.findOne({_id:driveId,createdBy:req.user._id});
    if(!drive)return res.status(404).json({message:'Drive not found'});
    const interview=await Interview.create({driveId,studentId,round,scheduledAt,mode,meetingLink,venue,interviewer,notes});
    Notification.create({userId:studentId,title:`Interview scheduled · ${drive.company}`,message:`${round} for ${drive.role} is scheduled for ${new Date(scheduledAt).toLocaleString('en-IN')}.`,type:'interview',link:'/dashboard/calendar'}).catch(()=>{});
    res.status(201).json(interview);
  }catch(err){res.status(400).json({message:err.message});}
});

router.get('/profile', async(req,res)=>res.json({success:true,data:req.user}));
module.exports=router;
