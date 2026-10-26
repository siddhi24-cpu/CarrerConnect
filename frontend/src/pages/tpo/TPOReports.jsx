import {useEffect,useState} from 'react';
import {fetchTpoReportSummary,getTpoReportCsvUrl} from '../../api';
import {useAuth} from '../../context/AuthContext';

export default function TPOReports(){
 const {token}=useAuth(); const [data,setData]=useState(null); const [loading,setLoading]=useState(true);
 useEffect(()=>{fetchTpoReportSummary().then(r=>setData(r.data.data)).catch(()=>{}).finally(()=>setLoading(false));},[]);
 const exportCsv=()=>{const a=document.createElement('a');a.href=getTpoReportCsvUrl();a.setAttribute('download','placement-report.csv');const xhr=new XMLHttpRequest();xhr.open('GET',getTpoReportCsvUrl());xhr.setRequestHeader('Authorization',`Bearer ${token}`);xhr.responseType='blob';xhr.onload=()=>{const url=URL.createObjectURL(xhr.response);a.href=url;a.click();URL.revokeObjectURL(url)};xhr.send();};
 if(loading)return <div className="text-sm" style={{color:'var(--text-mid)'}}>Generating live placement report…</div>;
 if(!data)return <div className="glass-card p-6">Unable to load report data. Check your backend connection.</div>;
 return <>
  <div className="flex justify-between items-center mb-8"><div><h2 className="font-serif text-3xl">Reports & Analytics</h2><p className="mt-1 text-sm" style={{color:'var(--text-mid)'}}>Live statistics calculated from your placement database.</p></div><button onClick={exportCsv} className="px-5 py-2.5 rounded-full text-white text-sm" style={{background:'var(--matte)',border:0}}>Export Student CSV</button></div>
  <div className="grid gap-5 mb-8" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>{[['📊','Placement %',`${data.placementPercentage}%`],['💰','Highest Package',`₹${data.highestPackage} LPA`],['📈','Average Package',`₹${data.averagePackage} LPA`],['👥','Placed Students',data.placed],['🏢','Companies',data.companies],['🎓','Students',data.students]].map(([i,l,v])=><div className="glass-card p-5" key={l}><div className="text-2xl mb-2">{i}</div><p className="text-xs" style={{color:'var(--text-mid)'}}>{l}</p><p className="font-serif text-2xl mt-1">{v}</p></div>)}</div>
  <div className="grid gap-6" style={{gridTemplateColumns:'1fr 1fr'}}>
   <div className="glass-card p-6"><p className="font-serif text-xl mb-5">Branch-wise Placement</p>{data.branchStats.map(b=><div className="mb-5" key={b._id||'Unknown'}><div className="flex justify-between text-sm mb-2"><span>{b._id||'Unknown'}</span><b>{b.percentage}%</b></div><div className="h-2 rounded-full" style={{background:'rgba(176,196,222,.2)'}}><div className="h-full rounded-full" style={{width:`${b.percentage}%`,background:'linear-gradient(90deg,var(--pastel-blue),var(--pastel-green))'}}/></div><p className="text-xs mt-1" style={{color:'var(--text-mid)'}}>{b.placed} placed of {b.total}</p></div>)}</div>
   <div className="glass-card p-6"><p className="font-serif text-xl mb-5">Top Recruiters</p>{data.topCompanies.map(c=><div className="flex justify-between py-3" key={c._id}><div><b>{c._id}</b><p className="text-xs" style={{color:'var(--text-mid)'}}>Avg package ₹{Number(c.avgPackage||0).toFixed(1)} LPA</p></div><span className="badge badge-green">{c.offers} offers</span></div>)}</div>
  </div>
  <div className="mt-6 p-6 rounded-xl" style={{background:'var(--pastel-blue-light)'}}><p className="font-serif text-xl mb-2">Placement insight</p><p className="text-sm" style={{color:'#2a4a6c'}}>This report is now database-driven. Whenever students are placed, offers are accepted, or new drives are created, these figures update automatically.</p></div>
 </>;
}
