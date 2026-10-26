const express=require('express');
const User=require('../models/User');
const Drive=require('../models/Drive');
const Offer=require('../models/Offer');
const {protect,tpoOnly}=require('../middleware/authMiddleware');
const router=express.Router();
router.use(protect,tpoOnly);
router.get('/summary',async(req,res)=>{
 try{
  const [students,placed,offers,companies,branchRows,packageRows,topCompanies]=await Promise.all([
   User.countDocuments({role:'student'}), User.countDocuments({role:'student',placementStatus:'placed'}), Offer.countDocuments({status:'Accepted'}), Drive.distinct('company'),
   User.aggregate([{ $match:{role:'student'} },{$group:{_id:'$branch',total:{$sum:1},placed:{$sum:{$cond:[{$eq:['$placementStatus','placed']},1,0]}}}},{$sort:{total:-1}}]),
   Offer.aggregate([{$match:{status:'Accepted'}},{$group:{_id:null,highest:{$max:'$packageLPA'},lowest:{$min:'$packageLPA'},average:{$avg:'$packageLPA'}}}]),
   Offer.aggregate([{$match:{status:'Accepted'}},{$group:{_id:'$company',offers:{$sum:1},avgPackage:{$avg:'$packageLPA'}}},{$sort:{offers:-1}},{$limit:8}])
  ]);
  const p=packageRows[0]||{};
  res.json({success:true,data:{students,placed,placementPercentage:students?Number((placed/students*100).toFixed(1)):0,offers,companies:companies.length,highestPackage:p.highest||0,lowestPackage:p.lowest||0,averagePackage:Number((p.average||0).toFixed(2)),branchStats:branchRows.map(x=>({...x,percentage:x.total?Number((x.placed/x.total*100).toFixed(1)):0})),topCompanies}});
 }catch(err){res.status(500).json({message:err.message});}
});
router.get('/csv',async(req,res)=>{
 try{const students=await User.find({role:'student'}).select('name email rollNumber branch batch cgpa placementStatus placedAt').lean(); const header='Name,Email,Roll Number,Branch,Batch,CGPA,Placement Status,Placed At'; const rows=students.map(s=>[s.name,s.email,s.rollNumber,s.branch,s.batch,s.cgpa,s.placementStatus,s.placedAt].map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')); res.type('text/csv').send([header,...rows].join('\n'));}catch(err){res.status(500).json({message:err.message});}
});
module.exports=router;
