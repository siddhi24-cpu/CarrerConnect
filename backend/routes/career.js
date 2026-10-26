const express = require('express');
const User = require('../models/User');
const Drive = require('../models/Drive');
const Interview = require('../models/Interview');
const Offer = require('../models/Offer');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

const studentOnly = (req,res,next) => {
  if (req.user.role !== 'student') return res.status(403).json({message:'Students only'});
  next();
};
router.use(studentOnly);

const normalize = (value='') => String(value).toLowerCase().replace(/[^a-z0-9+#.\s-]/g,' ').split(/\s+/).filter(Boolean);
const unique = a => [...new Set(a)];

router.get('/readiness', async (req,res) => {
  try {
    const s = await User.findById(req.user._id).lean();
    const drives = await Drive.find({status: {$in:['open','soon']}}).select('role description eligibilityCriteria company package deadline').lean();
    const apps = await Drive.find({'applicants.student': req.user._id}).select('company role applicants').lean();
    const interviews = await Interview.countDocuments({studentId:req.user._id, status:'scheduled'});
    const offers = await Offer.countDocuments({studentId:req.user._id, status:{$in:['Offered','Accepted']}});
    const profile = Number(s.profileStrength || 0);
    const skills = Array.isArray(s.skills) ? s.skills : [];
    const projectScore = Math.min(10, (s.projects?.length || 0) * 3);
    const certScore = Math.min(8, (s.certifications?.length || 0) * 2);
    const expScore = Math.min(8, (s.experience?.length || 0) * 4);
    const prepScore = Math.min(10, interviews * 2 + offers * 3);
    const readiness = Math.min(100, Math.round(profile * .45 + projectScore * 2 + certScore * 1.5 + expScore * 1.2 + skills.length * 1.5 + prepScore));

    const missing = [];
    if (!s.resumeUrl) missing.push('Build a professional resume');
    if (skills.length < 6) missing.push('Add at least 6 technical skills');
    if (!s.projects?.length) missing.push('Add at least one project');
    if (!s.certifications?.length) missing.push('Add certifications');
    if (!s.github) missing.push('Add your GitHub profile');
    if (!s.linkedIn) missing.push('Add your LinkedIn profile');
    if (interviews === 0) missing.push('Prepare for your first interview');

    const skillDemand = {};
    drives.forEach(d => normalize(`${d.role} ${d.description}`).forEach(w => { if (w.length > 2) skillDemand[w] = (skillDemand[w]||0)+1; }));
    const userTokens = new Set(normalize(skills.join(' ')));
    const recommended = Object.entries(skillDemand).sort((a,b)=>b[1]-a[1]).map(([skill])=>skill).filter(x=>!userTokens.has(x)).slice(0,8);

    res.json({success:true,data:{score:readiness,profileScore:profile,components:{profile,skills:Math.min(100,skills.length*12),projects:Math.min(100,(s.projects?.length||0)*25),certifications:Math.min(100,(s.certifications?.length||0)*25),interviews:Math.min(100,interviews*25)},missing,recommendedSkills:unique(recommended),activeDrives:drives.length}});
  } catch(err){res.status(500).json({message:err.message});}
});

router.get('/calendar', async (req,res)=>{
  try {
    const drives = await Drive.find({status:{$in:['open','soon']}}).select('company role deadline package status').lean();
    const interviews = await Interview.find({studentId:req.user._id}).populate('driveId','company role').sort({scheduledAt:1}).lean();
    const events = [
      ...drives.map(d=>({id:`drive-${d._id}`,type:'deadline',title:`${d.company} — ${d.role}`,date:d.deadline,meta:`Application deadline · ${d.package}`})),
      ...interviews.map(i=>({id:`interview-${i._id}`,type:'interview',title:`${i.round} · ${i.driveId?.company||'Interview'}`,date:i.scheduledAt,meta:`${i.mode}${i.venue?` · ${i.venue}`:''}`}))
    ].filter(e=>e.date);
    res.json({success:true,data:events});
  }catch(err){res.status(500).json({message:err.message});}
});

router.get('/notifications', async(req,res)=>{
  try{
    const notifications=await Notification.find({userId:req.user._id}).sort({createdAt:-1}).limit(30).lean();
    const unread=await Notification.countDocuments({userId:req.user._id,read:false});
    res.json({success:true,data:notifications,unread});
  }catch(err){res.status(500).json({message:err.message});}
});
router.put('/notifications/read-all', async(req,res)=>{
  try{await Notification.updateMany({userId:req.user._id,read:false},{$set:{read:true}});res.json({success:true});}
  catch(err){res.status(500).json({message:err.message});}
});

router.get('/offers', async(req,res)=>{
  try{
    const offers=await Offer.find({studentId:req.user._id}).populate('driveId','role deadline').sort({offerDate:-1}).lean();
    res.json({success:true,data:offers});
  }catch(err){res.status(500).json({message:err.message});}
});

router.get('/skill-gap/:driveId', async(req,res)=>{
  try{
    const [student,drive]=await Promise.all([
      User.findById(req.user._id).select('skills projects certifications branch cgpa backlogs').lean(),
      Drive.findById(req.params.driveId).select('company role description eligibilityCriteria').lean()
    ]);
    if(!drive)return res.status(404).json({message:'Drive not found'});
    const required=unique(normalize(`${drive.role} ${drive.description}`)).filter(x=>x.length>2);
    const mine=new Set(normalize((student.skills||[]).join(' ')));
    const matched=required.filter(x=>mine.has(x));
    const missing=required.filter(x=>!mine.has(x)).slice(0,12);
    const match=Math.round((matched.length/Math.max(required.length,1))*100);
    res.json({success:true,data:{company:drive.company,role:drive.role,match,matched,missing,eligibility:drive.eligibilityCriteria}});
  }catch(err){res.status(500).json({message:err.message});}
});

router.post('/notifications/seed', async(req,res)=>{
  try{
    const count=await Notification.countDocuments({userId:req.user._id});
    if(count===0){
      await Notification.insertMany([
        {userId:req.user._id,title:'Welcome to CareerConnect',message:'Complete your profile and build your professional resume to improve placement readiness.',type:'profile',link:'/dashboard/resume'},
        {userId:req.user._id,title:'Explore placement drives',message:'Browse active opportunities and check your eligibility before applying.',type:'drive',link:'/dashboard/drives'}
      ]);
    }
    res.json({success:true});
  }catch(err){res.status(500).json({message:err.message});}
});

module.exports=router;
