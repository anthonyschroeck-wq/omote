import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import * as Papa from "papaparse";
import { transform } from "sucrase";
import OMOTE_RUNTIME from "../public/omote-runtime.js?raw";
import { supabase } from "./supabase";
import * as db from "./db";

// ═══════════════════════════════════════════════════════════════
// OMOTE mk5.4 — Demo Stage Designer
// ═══════════════════════════════════════════════════════════════

const CREAM = "#F5F0E8"; const NAVY = "#6B7B8D"; const DK = "#1A1A1A"; const WARM = "#B8B0A4";
const ThemeContext = createContext({ mode: "light" });
function useTheme() { return useContext(ThemeContext); }
const LT = { bg:"#F5F0E8", surface:"#FAF7F2", ink:"#1A1A1A", ink80:"#333330", ink60:"#555550", ink40:"#888880", ink20:"#AAAAAA", border:"#CCC6BA", borderLight:"#DDD7CD", navy:"#5A6A7C", navyWash:"rgba(90,106,124,0.08)", gold:"#8C7A3C", goldWash:"#F0EBDB", matcha:"#4A6A48", akane:"#8B4D4D", warm:"#9A9488" };
const DT = { bg:"#141413", surface:"#1C1C1A", ink:"#E8E4DC", ink80:"#D0CCC4", ink60:"#A8A49C", ink40:"#787470", ink20:"#4A4844", border:"#2E2E2A", borderLight:"#252523", navy:"#8899AA", navyWash:"rgba(136,153,170,0.1)", gold:"#C4A855", goldWash:"rgba(196,168,85,0.08)", matcha:"#7A9A78", akane:"#C47070", warm:"#787470" };
function c() { const th = useTheme(); return th.mode === "dark" ? DT : LT; }

const PERSONAS = [
  { id:"chro", label:"CHRO", focus:"Executive insights" },
  { id:"vp_comp", label:"VP, Compensation", focus:"Pay equity, benchmarking" },
  { id:"vp_people", label:"VP, People Analytics", focus:"Dashboards, modeling" },
  { id:"hrbp", label:"HRBP", focus:"Team insights" },
  { id:"sales_leader", label:"Sales Leader", focus:"Pipeline, forecasting" },
  { id:"cro", label:"CRO", focus:"Revenue operations" },
];

// ─── Styles ──────────────────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Source+Sans+3:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  @keyframes breatheIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes drawFront { from{stroke-dashoffset:200} to{stroke-dashoffset:0} }
  @keyframes drawTop { from{stroke-dashoffset:200} to{stroke-dashoffset:0} }
  @keyframes dropIn { 0%{transform:translateY(-28px);opacity:0} 60%{transform:translateY(3px);opacity:1} 80%{transform:translateY(-2px)} 100%{transform:translateY(0);opacity:1} }
  @keyframes textureIn { from{opacity:0} to{opacity:1} }
  .breathe { animation:breatheIn 0.6s cubic-bezier(0.25,0.46,0.45,0.94) forwards; opacity:0; }
  .fadein { animation:fadeIn 0.4s ease forwards; opacity:0; }
`;

const ds = (s=34) => ({ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:s, fontWeight:400, letterSpacing:"0.01em", lineHeight:1.15 });
const ui = (s=15,w=400) => ({ fontFamily:"'Source Sans 3',sans-serif", fontSize:s, fontWeight:w, lineHeight:1.5 });
const mono = (s=11) => ({ fontFamily:"'IBM Plex Mono',monospace", fontSize:s, fontWeight:500, letterSpacing:"0.12em", textTransform:"uppercase" });

// ─── Omote Brand Icons (crayon texture style) ────────────────

function OIcon({ name, size=20, color }) {
  const cl = color || NAVY;
  const s = size; const vb = "0 0 48 48";
  const icons = {
    stages: <svg width={s} height={s} viewBox={vb} fill="none"><path d="M 10 10.5 L 22 10 L 22.5 22 L 10.5 22.5 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 26 10.3 L 38 10 L 37.5 22.5 L 25.5 22 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 10.5 26 L 22 25.5 L 22.5 38 L 10 37.5 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 26 26.3 L 38 25.5 L 37.5 38 L 25.5 37.5 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 10.3 10.8 L 21.8 10.3 L 22.2 21.8 L 10.8 22.2 Z" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    settings: <svg width={s} height={s} viewBox={vb} fill="none"><circle cx="24" cy="24" r="6" stroke={cl} strokeWidth="1.4" fill="none"/><path d="M 24 6 L 24 11 M 24 37 L 24 42 M 6 24 L 11 24 M 37 24 L 42 24 M 11.5 11.5 L 15 15 M 33 33 L 36.5 36.5 M 36.5 11.5 L 33 15 M 15 33 L 11.5 36.5" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round"/><circle cx="24" cy="24" r="6.3" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.3"/></svg>,
    help: <svg width={s} height={s} viewBox={vb} fill="none"><circle cx="24" cy="24" r="16" stroke={cl} strokeWidth="1.4" fill="none"/><path d="M 18 18 C 18 14, 21 11, 24 11 C 27 11, 30 14, 30 18 C 30 22, 26 22, 24 24 L 24 28" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><circle cx="24" cy="34" r="1.8" fill={cl}/><circle cx="24" cy="24" r="16.3" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.3"/></svg>,
    admin: <svg width={s} height={s} viewBox={vb} fill="none"><path d="M 12 22 L 36 22 L 36 40 L 12 40 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 16 22 L 16 16 C 16 10, 20 6, 24 6 C 28 6, 32 10, 32 16 L 32 22" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><circle cx="24" cy="30" r="3" fill={cl}/><path d="M 12.3 22.3 L 35.7 22.3 L 35.7 39.7 L 12.3 39.7 Z" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.25"/></svg>,
    pointer: <svg width={s} height={s} viewBox={vb} fill="none"><path d="M 12 8 L 12 36 L 20 30 L 28 40 L 32 38 L 24 28 L 34 26 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 12.5 8.5 L 12.5 35.5 L 20 30.5 L 27.5 39.5" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    storyteller: <svg width={s} height={s} viewBox={vb} fill="none"><path d="M 6 8 L 42 8 L 42 32 L 6 32 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 24 32 L 24 38" stroke={cl} strokeWidth="1.3" fill="none" strokeLinecap="round"/><path d="M 16 38 L 32 38" stroke={cl} strokeWidth="1.3" fill="none" strokeLinecap="round"/><path d="M 20 16 L 30 20 L 20 24 Z" stroke={cl} strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/><path d="M 6.3 8.3 L 41.7 8.3 L 41.7 31.7 L 6.3 31.7 Z" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.25"/></svg>,
    edit: <svg width={s} height={s} viewBox={vb} fill="none"><path d="M 32 8 L 40 16 L 18 38 L 8 40 L 10 30 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 28 12 L 36 20" stroke={cl} strokeWidth="1.2" fill="none" strokeLinecap="round"/><path d="M 32.3 8.5 L 39.5 16.3 L 18.3 37.5 L 8.5 39.5 L 10.5 30.3 Z" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.25"/></svg>,
    upload: <svg width={s} height={s} viewBox={vb} fill="none"><path d="M 24 32 L 24 12" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round"/><path d="M 16 18 L 24 10 L 32 18" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 8 36 L 8 40 L 40 40 L 40 36" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    play: <svg width={s} height={s} viewBox={vb} fill="none"><circle cx="24" cy="24" r="16" stroke={cl} strokeWidth="1.4" fill="none"/><path d="M 19 14 L 34 24 L 19 34 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><circle cx="24" cy="24" r="16.3" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.3"/></svg>,
    success: <svg width={s} height={s} viewBox={vb} fill="none"><circle cx="24" cy="24" r="16" stroke={cl} strokeWidth="1.4" fill="none"/><path d="M 14 24 L 21 31 L 34 17" stroke={cl} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    plus: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    x: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    send: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="1.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    team: <svg width={s} height={s} viewBox={vb} fill="none"><circle cx="24" cy="17" r="6" stroke={cl} strokeWidth="1.4" fill="none"/><path d="M 12 40 C 12 32, 18 28, 24 28 C 30 28, 36 32, 36 40" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round"/><circle cx="12" cy="14" r="4.5" stroke={cl} strokeWidth="1" fill="none" opacity="0.5"/><path d="M 3 36 C 3 30, 7 27, 12 27" stroke={cl} strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round"/><circle cx="36" cy="14" r="4.5" stroke={cl} strokeWidth="1" fill="none" opacity="0.5"/><path d="M 36 27 C 41 27, 45 30, 45 36" stroke={cl} strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round"/></svg>,
    // Stage icons (12 options)
    rocket: <svg width={s} height={s} viewBox={vb} fill="none"><path d="M 24 6 C 24 6, 36 10, 36 24 C 36 32, 30 38, 24 42 C 18 38, 12 32, 12 24 C 12 10, 24 6, 24 6 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><circle cx="24" cy="22" r="4" stroke={cl} strokeWidth="1.2" fill="none"/><path d="M 12 28 L 6 34 M 36 28 L 42 34" stroke={cl} strokeWidth="1.2" fill="none" strokeLinecap="round"/><path d="M 24.3 6.5 C 24.3 6.5, 35.5 10.5, 35.5 24" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.25" strokeLinecap="round"/></svg>,
    globe: <svg width={s} height={s} viewBox={vb} fill="none"><circle cx="24" cy="24" r="16" stroke={cl} strokeWidth="1.4" fill="none"/><ellipse cx="24" cy="24" rx="8" ry="16" stroke={cl} strokeWidth="1.2" fill="none"/><path d="M 8 24 L 40 24" stroke={cl} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6"/><path d="M 11 16 L 37 16 M 11 32 L 37 32" stroke={cl} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4"/><circle cx="24" cy="24" r="16.3" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.25"/></svg>,
    diamond: <svg width={s} height={s} viewBox={vb} fill="none"><path d="M 24 6 L 40 20 L 24 42 L 8 20 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 8 20 L 40 20" stroke={cl} strokeWidth="1.2" fill="none" strokeLinecap="round"/><path d="M 16 6 L 20 20 L 24 42 M 32 6 L 28 20" stroke={cl} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5"/><path d="M 24.3 6.5 L 39.5 20.3 L 24.3 41.5 L 8.5 20.3 Z" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.25"/></svg>,
    flask: <svg width={s} height={s} viewBox={vb} fill="none"><path d="M 18 6 L 18 18 L 8 38 L 40 38 L 30 18 L 30 6" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 14 6 L 34 6" stroke={cl} strokeWidth="1.3" fill="none" strokeLinecap="round"/><path d="M 12 30 L 36 30" stroke={cl} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4"/><circle cx="20" cy="34" r="2" fill={cl} opacity="0.3"/><circle cx="28" cy="33" r="1.5" fill={cl} opacity="0.3"/><path d="M 18.3 6.3 L 18.3 18.3 L 8.5 37.5" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.25"/></svg>,
    shield: <svg width={s} height={s} viewBox={vb} fill="none"><path d="M 24 6 L 40 14 L 40 26 C 40 34, 32 40, 24 44 C 16 40, 8 34, 8 26 L 8 14 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 17 24 L 22 29 L 32 18" stroke={cl} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 24 6.5 L 39.5 14.5 L 39.5 26" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.25" strokeLinecap="round"/></svg>,
    bolt: <svg width={s} height={s} viewBox={vb} fill="none"><path d="M 28 4 L 12 24 L 22 24 L 20 44 L 36 22 L 26 22 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 28.3 4.5 L 12.5 24.3 L 22.3 24.3 L 20.3 43.5" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.25" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    mountain: <svg width={s} height={s} viewBox={vb} fill="none"><path d="M 4 40 L 18 12 L 26 24 L 34 10 L 44 40 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 34 10 L 30 16 L 34 18 L 38 14" stroke={cl} strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4"/><path d="M 4.5 39.5 L 18 12.5 L 25.5 24 L 34 10.5 L 43.5 39.5" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.25"/></svg>,
    leaf: <svg width={s} height={s} viewBox={vb} fill="none"><path d="M 12 36 C 12 36, 8 16, 24 8 C 40 16, 36 36, 36 36" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 12 36 C 16 28, 20 24, 24 22 C 28 24, 32 28, 36 36" stroke={cl} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4"/><path d="M 24 22 L 24 40" stroke={cl} strokeWidth="1.2" fill="none" strokeLinecap="round"/><path d="M 12.5 35.5 C 12.5 35.5, 8.5 16.5, 24 8.5" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.25" strokeLinecap="round"/></svg>,
    compass: <svg width={s} height={s} viewBox={vb} fill="none"><circle cx="24" cy="24" r="16" stroke={cl} strokeWidth="1.4" fill="none"/><path d="M 18 30 L 22 22 L 30 18 L 26 26 Z" stroke={cl} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/><circle cx="24" cy="24" r="2" fill={cl}/><path d="M 24 8 L 24 11 M 24 37 L 24 40 M 8 24 L 11 24 M 37 24 L 40 24" stroke={cl} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.4"/><circle cx="24" cy="24" r="16.3" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.25"/></svg>,
    crown: <svg width={s} height={s} viewBox={vb} fill="none"><path d="M 8 34 L 8 16 L 18 24 L 24 10 L 30 24 L 40 16 L 40 34 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 8 38 L 40 38" stroke={cl} strokeWidth="1.3" fill="none" strokeLinecap="round"/><circle cx="8" cy="16" r="2" fill={cl} opacity="0.4"/><circle cx="24" cy="10" r="2" fill={cl} opacity="0.4"/><circle cx="40" cy="16" r="2" fill={cl} opacity="0.4"/><path d="M 8.3 33.5 L 8.3 16.5 L 18 24.3 L 24 10.5 L 30 24.3 L 39.7 16.5 L 39.7 33.5" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.25"/></svg>,
    star: <svg width={s} height={s} viewBox={vb} fill="none"><path d="M 24 6 L 29 18 L 42 20 L 32 30 L 35 42 L 24 36 L 13 42 L 16 30 L 6 20 L 19 18 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 24 6.5 L 28.5 18.3 L 41.5 20.3 L 31.5 30" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.25" strokeLinecap="round"/></svg>,
    cube: <svg width={s} height={s} viewBox={vb} fill="none"><path d="M 24 6 L 40 16 L 40 32 L 24 42 L 8 32 L 8 16 Z" stroke={cl} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 24 6 L 24 42 M 8 16 L 24 26 L 40 16" stroke={cl} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.5"/><path d="M 24 6.5 L 39.5 16.3 L 39.5 31.7 L 24 41.5" stroke={cl} strokeWidth="0.5" fill="none" opacity="0.25"/></svg>,
  };
  return icons[name] || null;
}

const STAGE_ICONS = ["rocket","globe","diamond","flask","shield","bolt","mountain","leaf","compass","crown","star","cube"];

function StageMark({ size=48, color=NAVY }) {
  return (<svg width={size} height={size*0.86} viewBox="0 0 140 120" fill="none"><path d="M 28 69 L 112 66 L 113 88 L 27 91 Z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 16 60 L 100 57 L 112 66 L 28 69 Z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M 29 69.5 L 111.5 66.5 L 112.5 87.5 L 27.5 90.5 Z" stroke={color} strokeWidth="0.6" fill="none" opacity="0.4"/><path d="M 17 60.5 L 99.5 57.5 L 111.5 66.5 L 29 69.5 Z" stroke={color} strokeWidth="0.6" fill="none" opacity="0.4"/><circle cx="60" cy="40" r="10" fill={color}/></svg>);
}

function SmallMark({ size=24, color=NAVY }) {
  return (<svg width={size} height={size*0.86} viewBox="0 0 140 120" fill="none"><path d="M 28 69 L 112 66 L 113 88 L 27 91 Z" stroke={color} strokeWidth="3" fill="none"/><path d="M 16 60 L 100 57 L 112 66 L 28 69 Z" stroke={color} strokeWidth="3" fill="none"/><circle cx="60" cy="40" r="13" fill={color}/></svg>);
}

// ─── Loading Animation ───────────────────────────────────────

function BuildingTheStage({ onComplete }) {
  const [phase, setPhase] = useState(0); const to = useRef([]);
  useEffect(() => { [300,900,1500,1900,2400,3400].forEach((d,i) => { to.current.push(setTimeout(()=>setPhase(i+1),d)); }); if (onComplete) to.current.push(setTimeout(onComplete, 4200)); return () => to.current.forEach(clearTimeout); }, []);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:280 }}>
      <svg width="140" height="120" viewBox="0 0 140 120" fill="none" style={{ overflow:"visible" }}>
        <style>{`.bf{stroke-dasharray:200;stroke-dashoffset:200;animation:${phase>=1?"drawFront 0.6s cubic-bezier(0.4,0,0.2,1) forwards":"none"}}.bt{stroke-dasharray:200;stroke-dashoffset:200;animation:${phase>=2?"drawTop 0.5s cubic-bezier(0.4,0,0.2,1) forwards":"none"}}.tx{opacity:0;animation:${phase>=3?"textureIn 0.4s ease forwards":"none"}}.pd{opacity:0;animation:${phase>=4?"dropIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards":"none"}}`}</style>
        <path className="bf" d="M 28 69 L 112 66 L 113 88 L 27 91 Z" stroke={NAVY} strokeWidth="1.5" fill="none"/><path className="bt" d="M 16 60 L 100 57 L 112 66 L 28 69 Z" stroke={NAVY} strokeWidth="1.5" fill="none"/>
        <g className="tx"><path d="M 29 69.5 L 111.5 66.5 L 112.5 87.5 L 27.5 90.5 Z" stroke={NAVY} strokeWidth="0.6" fill="none" opacity="0.4"/><path d="M 17 60.5 L 99.5 57.5 L 111.5 66.5 L 29 69.5 Z" stroke={NAVY} strokeWidth="0.6" fill="none" opacity="0.4"/></g>
        <circle className="pd" cx="60" cy="40" r="10" fill={NAVY}/>
      </svg>
      <div style={{ opacity:phase>=5?1:0, transform:phase>=5?"translateY(0)":"translateY(12px)", transition:"opacity 0.6s ease,transform 0.6s ease", display:"flex", flexDirection:"column", alignItems:"center", marginTop:24 }}>
        <span style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:48, color:DK, lineHeight:1 }}>Omote</span>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:12, opacity:phase>=5?1:0, transition:"opacity 0.5s ease 0.3s" }}><div style={{ width:20, height:0.5, background:WARM, opacity:0.5 }}/><span style={{ fontFamily:"'Source Sans 3',sans-serif", fontSize:11, fontWeight:300, letterSpacing:"0.3em", textTransform:"uppercase", color:WARM }}>Demo Stage Designer</span><div style={{ width:20, height:0.5, background:WARM, opacity:0.5 }}/></div>
      </div>
      <span style={{ fontFamily:"'Source Sans 3',sans-serif", fontSize:11, fontWeight:300, letterSpacing:"0.25em", textTransform:"uppercase", color:WARM, marginTop:32, opacity:phase>=1&&phase<5?0.6:0, transition:"opacity 0.4s" }}>Building the stage...</span>
    </div>
  );
}

// ─── Error Boundary ──────────────────────────────────────────

class ErrorBoundary extends React.Component {
  constructor(p){super(p);this.state={err:null}}
  static getDerivedStateFromError(e){return{err:e}}
  render(){if(this.state.err)return(<div style={{minHeight:"100vh",background:CREAM,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{maxWidth:480,padding:48,textAlign:"center"}}><h2 style={{...ds(24),marginBottom:12}}>Something went wrong</h2><pre style={{...mono(10),color:LT.akane,background:"rgba(139,77,77,0.06)",padding:16,textAlign:"left",overflow:"auto",marginBottom:20,border:"1px solid rgba(139,77,77,0.15)",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{this.state.err?.message}</pre><button onClick={()=>this.setState({err:null})} style={{padding:"10px 24px",background:DK,color:CREAM,border:"none",...mono(10),cursor:"pointer"}}>Retry</button></div></div>);return this.props.children}
}

// ─── Left Sidebar ────────────────────────────────────────────

function IconPicker({ value, onChange, size=28 }) {
  const cl = c();
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
      {STAGE_ICONS.map(name => (
        <div key={name} onClick={()=>onChange(name)} style={{ width:size+12, height:size+12, display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${value===name?cl.navy:cl.borderLight}`, background:value===name?cl.navyWash:"transparent", cursor:"pointer", transition:"all 0.15s" }}
          onMouseEnter={e=>{if(value!==name)e.currentTarget.style.borderColor=cl.navy}} onMouseLeave={e=>{if(value!==name)e.currentTarget.style.borderColor=cl.borderLight}}>
          <OIcon name={name} size={size-6} color={value===name?cl.ink:cl.ink40}/>
        </div>
      ))}
    </div>
  );
}

function Sidebar({ expanded, setExpanded, screen, onNavigate, user, stages, activeStageId }) {
  const cl = c();
  const items = [
    { id:"stages", icon:"stages", label:"Stages" },
    { id:"settings", icon:"settings", label:"Settings" },
    { id:"help", icon:"help", label:"Help" },
  ];
  if (user?.role === "admin") items.push({ id:"admin", icon:"admin", label:"Admin" });
  items.push({ id:"pointer", icon:"pointer", label:"Pointer" });
  items.push({ id:"storyteller", icon:"storyteller", label:"Storyteller" });

  const [adminOpen, setAdminOpen] = useState(false);
  const w = expanded ? 180 : 52;

  return (
    <div style={{ width:w, flexShrink:0, background:cl.surface, borderRight:`1px solid ${cl.borderLight}`, display:"flex", flexDirection:"column", transition:"width 0.25s ease", overflow:"hidden", position:"relative", zIndex:50 }}>
      {/* Logo toggle */}
      <div onClick={()=>setExpanded(!expanded)} style={{ padding:expanded?"14px 16px":"14px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:10, borderBottom:`1px solid ${cl.borderLight}`, minHeight:52 }}>
        <SmallMark size={22} color={cl.navy}/>
        {expanded && <span style={{ ...ds(16), color:cl.ink, whiteSpace:"nowrap" }}>Omote</span>}
      </div>

      {/* Nav items */}
      <div style={{ flex:1, padding:"8px 0", overflow:"auto" }}>
        {items.map(item => {
          const isActive = screen === item.id || (item.id === "stages" && screen === "hub") || (item.id === "admin" && screen === "users");
          const isDisabled = item.disabled;
          const hasSubItems = item.id === "stages" || item.id === "admin";
          const isOpen = (item.id === "stages") || (item.id === "admin" && adminOpen);

          // Sub-items for Stages
          const subItems = item.id === "stages" ? (stages||[]).map(s => ({
            key: s.id, icon: s.icon||"cube", label: s.name, nav: "stage:"+s.id,
            active: activeStageId === s.id && (screen==="backstage"||screen==="audience"||screen==="cue-select"),
          })) : item.id === "admin" ? [
            { key:"users", icon:"team", label:"Users", nav:"users", active: screen==="users" },
          ] : [];

          return (
            <div key={item.id}>
              <div onClick={()=>{
                if(isDisabled) return;
                if(item.id === "admin") setAdminOpen(!adminOpen);
                else onNavigate(item.id);
              }} style={{
                padding:expanded?"10px 16px":"10px 14px", cursor:isDisabled?"default":"pointer",
                display:"flex", alignItems:"center", gap:10,
                background:isActive?cl.navyWash:"transparent",
                opacity:isDisabled?0.35:1, transition:"all 0.15s",
              }} onMouseEnter={e=>{if(!isDisabled&&!isActive)e.currentTarget.style.background=cl.navyWash}} onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background="transparent"}}
                title={!expanded?item.label:""}>
                <OIcon name={item.icon} size={20} color={isActive?cl.ink:cl.ink40}/>
                {expanded && <span style={{ ...ui(13,isActive?500:400), color:isActive?cl.ink:cl.ink60, whiteSpace:"nowrap" }}>{item.label}{isDisabled?" ·":""}</span>}
              </div>
              {isOpen && subItems.length > 0 && (
                <div style={{ padding:"2px 0 6px 0" }}>
                  {subItems.map(si => (
                    <div key={si.key} onClick={()=>onNavigate(si.nav)} style={{
                      padding:expanded?"7px 16px 7px 28px":"7px 14px", cursor:"pointer",
                      display:"flex", alignItems:"center", gap:8,
                      background:si.active?cl.navyWash:"transparent", transition:"all 0.15s",
                    }} onMouseEnter={e=>{if(!si.active)e.currentTarget.style.background=cl.navyWash}} onMouseLeave={e=>{if(!si.active)e.currentTarget.style.background="transparent"}}
                      title={!expanded?si.label:""}>
                      <OIcon name={si.icon} size={16} color={si.active?cl.ink:cl.ink40}/>
                      {expanded && <span style={{ ...ui(12,si.active?500:400), color:si.active?cl.ink:cl.ink60, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{si.label}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* User + version */}
      <div style={{ padding:expanded?"12px 16px":"12px 10px", borderTop:`1px solid ${cl.borderLight}` }}>
        {expanded ? (
          <div>
            <div style={{ ...ui(13,500), color:cl.ink, marginBottom:2 }}>{user?.name}</div>
            <div style={{ ...mono(8), color:cl.ink20 }}>{user?.role} · mk5.4</div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ width:24, height:24, borderRadius:"50%", background:cl.navyWash, display:"flex", alignItems:"center", justifyContent:"center", ...mono(10), color:cl.navy }}>{user?.name?.[0]}</div>
            <span style={{ ...mono(6), color:cl.ink20 }}>mk5.4</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sample Data ─────────────────────────────────────────────

const SAMPLE_CSV_HR = `employee_id,first_name,last_name,department,title,gender,ethnicity,base_salary,bonus_pct,equity_score,hire_date,location\nE001,Sarah,Mitchell,Engineering,Senior Engineer,Female,White,142500,12,96.1,2019-03-15,San Francisco\nE002,James,Chen,Engineering,Staff Engineer,Male,Asian,168000,15,94.8,2017-08-22,San Francisco\nE003,Maria,Gonzalez,Product,Product Manager,Female,Hispanic,138200,10,89.2,2020-01-10,New York\nE004,David,Williams,Sales,Account Executive,Male,Black,95000,22,95.4,2021-06-01,Chicago\nE005,Emily,Johnson,Engineering,Engineer,Female,White,125000,10,93.7,2022-02-14,San Francisco`;
const SAMPLE_CSV_CRM = `deal_id,company,contact,stage,amount,probability,close_date,rep,product,region\nD001,Acme Corp,John Smith,Negotiation,125000,80,2025-04-15,Sarah K,Enterprise,West\nD002,TechFlow Inc,Lisa Park,Discovery,85000,30,2025-05-20,Mike R,Professional,East\nD003,Global Systems,Tom Chen,Proposal,340000,60,2025-04-28,Sarah K,Enterprise,West\nD004,DataBridge,Amy Jones,Closed Won,92000,100,2025-03-01,James T,Professional,Central\nD005,CloudNine,Robert Lee,Demo,210000,45,2025-06-10,Mike R,Enterprise,East`;
const SAMPLE_CSV_TASKS = `task_id,title,status,priority,category,due_date,estimated_hours,assigned_to\nT001,Redesign homepage,In Progress,High,Design,2025-04-10,16,Alice\nT002,Fix login bug,Done,Critical,Engineering,2025-03-20,4,Bob\nT003,Write Q2 report,Not Started,Medium,Admin,2025-04-30,8,Alice\nT004,Update API docs,In Progress,Medium,Engineering,2025-04-15,12,Carol\nT005,Security audit,In Progress,Critical,Engineering,2025-04-05,24,Bob`;

const SAMPLE_HTML_HR = `<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#f7f8fa;color:#1a1a2e}.hdr{background:#fff;border-bottom:1px solid #e5e7eb;padding:18px 32px;display:flex;align-items:center;justify-content:space-between}.hdr h1{font-size:20px;font-weight:600}.cnt{max-width:1000px;margin:0 auto;padding:24px 32px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}.card{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px}.card .l{font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px}.card .v{font-size:24px;font-weight:700}table{width:100%;border-collapse:collapse}th{text-align:left;padding:10px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase}td{padding:10px 16px;border-bottom:1px solid #f3f4f6;font-size:14px}</style><div class="hdr"><h1>{{COMPANY_NAME}} Dashboard</h1></div><div class="cnt"><div class="cards" id="c"></div><div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden"><table><thead><tr id="th"></tr></thead><tbody id="tb"></tbody></table></div></div><script>const d=window.__DEMO_DATA__||[];const cols=d.length?Object.keys(d[0]):[];const nc=cols.filter(c=>{const v=d[0]?.[c];return v!=null&&!isNaN(parseFloat(v))});const ce=document.getElementById("c");nc.slice(0,4).forEach(c=>{const vs=d.map(r=>parseFloat(r[c])).filter(v=>!isNaN(v));const a=vs.length?(vs.reduce((a,b)=>a+b,0)/vs.length):0;const f=a>1000?Math.round(a).toLocaleString():a.toFixed(1);const el=document.createElement("div");el.className="card";el.innerHTML='<div class="l">'+c.replace(/_/g," ")+'</div><div class="v">'+f+'</div>';ce.appendChild(el)});const dc=cols.slice(0,7);const th=document.getElementById("th");dc.forEach(c=>{const e=document.createElement("th");e.textContent=c.replace(/_/g," ");th.appendChild(e)});const tb=document.getElementById("tb");d.slice(0,15).forEach(r=>{const tr=document.createElement("tr");dc.forEach(c=>{const td=document.createElement("td");td.textContent=r[c]||"";tr.appendChild(td)});tb.appendChild(tr)})<\/script>`;
const SAMPLE_HTML_CRM = `<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#f0f2f5}.top{background:#1e293b;padding:14px 32px}.top h1{color:#f1f5f9;font-size:18px}.cnt{max-width:1000px;margin:0 auto;padding:24px}.pipe{display:flex;gap:8px;margin-bottom:20px}.ps{flex:1;text-align:center;padding:12px 8px;border-radius:6px;background:#fff;border:1px solid #e2e8f0}.ps .n{font-size:20px;font-weight:700}.ps .l{font-size:10px;color:#94a3b8;text-transform:uppercase;margin-top:2px}table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden}th{text-align:left;padding:10px 14px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;border-bottom:2px solid #e2e8f0}td{padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:14px}</style><div class="top"><h1>{{COMPANY_NAME}} Pipeline</h1></div><div class="cnt"><div class="pipe" id="p"></div><table><thead><tr id="th"></tr></thead><tbody id="tb"></tbody></table></div><script>const d=window.__DEMO_DATA__||[];const cols=d.length?Object.keys(d[0]):[];const sc=cols.filter(c=>!d[0]?.[c]||isNaN(parseFloat(d[0][c])));const stg=sc.find(c=>c.toLowerCase().includes("stage"))||sc[1];if(stg){const s={};d.forEach(r=>{const k=r[stg]||"Other";s[k]=(s[k]||0)+1});const pe=document.getElementById("p");Object.entries(s).forEach(([k,v])=>{const e=document.createElement("div");e.className="ps";e.innerHTML='<div class="n">'+v+'</div><div class="l">'+k+'</div>';pe.appendChild(e)})}const dc=cols.slice(0,7);document.getElementById("th").innerHTML=dc.map(c=>"<th>"+c.replace(/_/g," ")+"</th>").join("");document.getElementById("tb").innerHTML=d.slice(0,20).map(r=>"<tr>"+dc.map(c=>"<td>"+(r[c]||"")+"</td>").join("")+"</tr>").join("")<\/script>`;
const SAMPLE_HTML_TASKS = `<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#fff;display:flex;height:100vh}.side{width:180px;background:#111827;color:#e5e7eb;padding:20px 0;flex-shrink:0}.side .logo{padding:0 20px 16px;font-size:14px;font-weight:600;border-bottom:1px solid #1f2937}.side a{display:block;padding:10px 20px;font-size:13px;color:#9ca3af;text-decoration:none}.side a.a{background:#1f2937;color:#fff}.main{flex:1;overflow:auto}.bar{padding:16px 28px;border-bottom:1px solid #e5e7eb}.bar h2{font-size:20px;font-weight:600}.cols{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:24px 28px}.col h3{font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e5e7eb}.tk{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin-bottom:8px}.tk .t{font-size:13px;font-weight:500;margin-bottom:4px}.pr{font-size:9px;padding:2px 6px;border-radius:4px;font-weight:600;text-transform:uppercase}</style><div class="side"><div class="logo">{{COMPANY_NAME}}</div><a class="a" href="#">Tasks</a><a href="#">Calendar</a></div><div class="main"><div class="bar"><h2>Task Board</h2></div><div class="cols" id="c"></div></div><script>const d=window.__DEMO_DATA__||[];const cols=d.length?Object.keys(d[0]):[];const sc=cols.find(c=>c.toLowerCase().includes("status"))||cols[2];const tc=cols.find(c=>c.toLowerCase().includes("title")||c.toLowerCase().includes("name"))||cols[1];const pc=cols.find(c=>c.toLowerCase().includes("prio"));const g={};d.forEach(r=>{const s=r[sc]||"Other";if(!g[s])g[s]=[];g[s].push(r)});const ct=document.getElementById("c");Object.entries(g).forEach(([s,items])=>{const col=document.createElement("div");col.className="col";col.innerHTML="<h3>"+s+" ("+items.length+")</h3>";items.forEach(r=>{const tk=document.createElement("div");tk.className="tk";const p=r[pc]||"";const cls=p.includes("Crit")?"#fef2f2;color:#dc2626":p.includes("High")?"#fef3c7;color:#d97706":"#eff6ff;color:#3b82f6";tk.innerHTML='<div class="t">'+(r[tc]||"Task")+'</div>'+(p?'<span class="pr" style="background:'+cls+'">'+p+'</span>':"");col.appendChild(tk)});ct.appendChild(col)})<\/script>`;

// ─── API + JSX Runtime (preserved from mk4) ─────────────────

// API disabled for public alpha — re-enable by restoring callClaude implementation
async function callClaude(messages, system) {
  return { content: [{ type: "text", text: "AI Canvas is disabled in this public alpha." }] };
}

function buildSystemPrompt(columns, sampleRow) {
  return `You are a UI designer for Omote. Generate HTML that recreates product interfaces.
RULES: Return ONLY raw HTML for <body>. No markdown, no backticks. Inline <style>. Modern CSS. Use {{COMPANY_NAME}} placeholder. Font: -apple-system, sans-serif.
DATA: Columns: ${columns.join(", ")}
${sampleRow ? `Sample: ${JSON.stringify(sampleRow)}` : ""}
JS access: window.__DEMO_DATA__ (array), window.__COMPANY_NAME__`;
}

// ─── Import Transform ────────────────────────────────────────

const BLESSED = { "react":"React", "react-dom":"ReactDOM", "react-dom/client":"ReactDOM", "recharts":"Recharts", "lodash":"_", "d3":"d3" };
const NAMED_MAP = { "react":(n)=>`React.${n}`, "recharts":(n)=>`Recharts.${n}`, "d3":(n)=>`d3.${n}` };

function transformJsx(code) {
  let c2 = code;
  c2 = c2.replace(/^import\s+(.+?)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/gm, (match, imports, pkg) => {
    const bp = Object.keys(BLESSED).find(k => pkg === k || pkg.startsWith(k + "/")) || pkg;
    const gn = BLESSED[bp];
    if (!gn) return `// [Omote] Unsupported: ${pkg}`;
    const def = imports.match(/^(\w+)$/);
    if (def) return `const ${def[1]} = ${gn};`;
    const named = imports.match(/\{([^}]+)\}/);
    if (named) { const r = NAMED_MAP[bp] || ((n)=>`${gn}.${n}`); return named[1].split(",").map(n=>{const [o,a]=n.trim().split(/\s+as\s+/);return `const ${(a||o).trim()} = ${r(o.trim())};`}).join("\n"); }
    const wild = imports.match(/\*\s+as\s+(\w+)/);
    if (wild) return `const ${wild[1]} = ${gn};`;
    const dn = imports.match(/^(\w+)\s*,\s*\{([^}]+)\}/);
    if (dn) { const r = NAMED_MAP[bp] || ((n)=>`${gn}.${n}`); return `const ${dn[1]} = ${gn};\n` + dn[2].split(",").map(n=>`const ${n.trim()} = ${r(n.trim())};`).join("\n"); }
    return `const ${imports.trim()} = ${gn};`;
  });
  c2 = c2.replace(/export\s+default\s+function\s+(\w+)/g, "function $1");
  c2 = c2.replace(/export\s+default\s+/g, "window.__OMOTE_COMPONENT__ = ");
  if (!c2.includes("window.__OMOTE_COMPONENT__")) { const m = c2.match(/(?:function|const)\s+([A-Z]\w+)/g); if (m) { const last = m[m.length-1].replace(/^(?:function|const)\s+/,""); c2 += `\nwindow.__OMOTE_COMPONENT__ = ${last};`; } }
  try { const r = transform(c2, { transforms:["jsx"], jsxRuntime:"classic", production:true }); return { code:r.code, error:null }; }
  catch(e) { return { code:null, error:e.message }; }
}

// ─── Frame Components ────────────────────────────────────────

function JsxFrame({ jsxCode, data, company, banner }) {
  const iframeRef = useRef(null);
  const [transpileError, setTranspileError] = useState(null);
  useEffect(() => {
    if (!jsxCode) return;
    const { code, error } = transformJsx(jsxCode);
    if (error) { setTranspileError(error); return; }
    setTranspileError(null);
    const sd = Array.isArray(data) ? data : [];
    const dn = company || "Company";
    const bh = banner ? '<div style="background:#F0EBDB;border-bottom:1px solid #E8D9A0;padding:10px 24px;font-family:-apple-system,sans-serif;font-size:13px;color:#7A6518;display:flex;align-items:center;gap:8px"><span style="font-size:8px">&#9679;</span>' + banner + '</div>' : "";
    const loaderHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}#root{min-height:100vh}</style><link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet"></head><body>${bh}<div id="root"><div style="padding:40px;text-align:center;color:#999">Loading...</div></div><script>window.addEventListener("message",function(e){if(!e.data||e.data.type!=="omote-runtime")return;try{window.process={env:{NODE_ENV:"production"}};var fn=new Function(e.data.runtime);fn();window.__DEMO_DATA__=e.data.data;window.__COMPANY_NAME__=e.data.company;var fn2=new Function(e.data.code);fn2();var Component=window.__OMOTE_COMPONENT__;if(Component){var root=ReactDOM.createRoot(document.getElementById("root"));root.render(React.createElement(Component,{data:window.__DEMO_DATA__,companyName:window.__COMPANY_NAME__}))}else{document.getElementById("root").innerHTML="<div style='padding:40px;text-align:center;color:#999'>No component exported.</div>"}}catch(err){document.getElementById("root").innerHTML="<div style='padding:40px;font-family:monospace'><div style='color:#c44;font-weight:bold;margin-bottom:8px'>Runtime Error</div><pre style='background:#fff5f5;padding:16px;border:1px solid #fcc;overflow:auto;font-size:12px;white-space:pre-wrap'>"+err.message+"</pre></div>";console.error(err)}});window.parent.postMessage({type:"omote-ready"},"*");<\/script></body></html>`;
    const iframe = iframeRef.current; if (!iframe) return;
    const handleMsg = (e) => { if (e.data?.type === "omote-ready") iframe.contentWindow.postMessage({ type:"omote-runtime", runtime:OMOTE_RUNTIME, code, data:sd.slice(0,100), company:dn }, "*"); };
    window.addEventListener("message", handleMsg);
    iframe.srcdoc = loaderHtml;
    return () => window.removeEventListener("message", handleMsg);
  }, [jsxCode, data, company, banner]);
  if (transpileError) return <div style={{ padding:32, fontFamily:"'IBM Plex Mono',monospace" }}><div style={{ color:"#8B4D4D", fontWeight:"bold", marginBottom:8, fontSize:12, textTransform:"uppercase", letterSpacing:"0.1em" }}>Transpile Error</div><pre style={{ background:"#FFF5F5", padding:16, border:"1px solid #FCC", overflow:"auto", fontSize:12, whiteSpace:"pre-wrap", color:"#8B4D4D" }}>{transpileError}</pre></div>;
  return <iframe ref={iframeRef} sandbox="allow-scripts" style={{ width:"100%", height:"100%", border:"none", background:"#fff" }} title="JSX Preview"/>;
}

function HtmlFrame({ html, data, company, banner }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const sd = Array.isArray(data)?data:[]; const dn = company||"Company";
  const ds2 = `<script>window.__DEMO_DATA__=${JSON.stringify(sd.slice(0,100))};window.__COMPANY_NAME__=${JSON.stringify(dn)};<\/script>`;
  const bh = banner?`<div style="background:#F0EBDB;border-bottom:1px solid #E8D9A0;padding:10px 24px;font-family:-apple-system,sans-serif;font-size:13px;color:#7A6518;display:flex;align-items:center;gap:8px;position:fixed;top:0;left:0;right:0;z-index:9999"><span style="font-size:8px">&#9679;</span>${banner}</div>`:"";
  const raw = (html||"").replace(/\{\{COMPANY_NAME\}\}/g,dn);
  const isFull = raw.includes("<!DOCTYPE")||raw.includes("<html");
  useEffect(() => {
    let doc; if (isFull) { doc=raw.replace(/<head>/i,`<head>${ds2}`).replace(/<body[^>]*>/i,m=>`${m}${bh}`); if(!doc.includes("window.__DEMO_DATA__"))doc=ds2+doc; } else { doc=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0}</style>${ds2}</head><body>${bh}${raw}</body></html>`; }
    if (isFull) { const b=new Blob([doc],{type:"text/html"}); const u=URL.createObjectURL(b); setBlobUrl(u); return ()=>URL.revokeObjectURL(u); } else { setBlobUrl(null); }
  }, [html,data,company,banner]);
  if (isFull&&blobUrl) return <iframe src={blobUrl} style={{width:"100%",height:"100%",border:"none",background:"#fff"}} title="Preview"/>;
  const fragDoc=`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box;margin:0;padding:0}</style>${ds2}</head><body>${bh}${raw}</body></html>`;
  return <iframe srcDoc={fragDoc} style={{width:"100%",height:"100%",border:"none",background:"#fff"}} sandbox="allow-scripts allow-same-origin" title="Preview"/>;
}

function StageFrame({ content, contentType, data, company, banner }) {
  if (contentType==="jsx") return <JsxFrame jsxCode={content} data={data} company={company} banner={banner}/>;
  return <HtmlFrame html={content} data={data} company={company} banner={banner}/>;
}

// ─── About Modal ─────────────────────────────────────────────

function AboutModal({ onClose, onTutorial }) {
  return (<>
    <div className="fadein" onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(26,26,26,0.3)", zIndex:300, backdropFilter:"blur(3px)" }}/>
    <div className="fadein" style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:480, background:LT.surface, border:`1px solid ${LT.borderLight}`, zIndex:301, boxShadow:"0 24px 64px rgba(26,26,26,0.15)", padding:"40px 40px 32px" }}>
      <div style={{ textAlign:"center", marginBottom:28 }}><StageMark size={44}/><h2 style={{ ...ds(30), marginTop:12, marginBottom:4 }}>Welcome to Omote</h2><p style={{ ...ui(14,300), color:WARM, fontStyle:"italic" }}>表 — "surface," "front," "the public face"</p></div>
      <div style={{ ...ui(15,300), color:LT.ink80, lineHeight:1.7, marginBottom:24 }}>
        <p style={{ marginBottom:16 }}>Omote is a stage designer for product demonstrations. Build immersive, data-driven demo environments that adapt to your audience — without touching the production product.</p>
        <div style={{ padding:"14px 18px", background:LT.goldWash, border:"1px solid rgba(140,122,60,0.15)", marginBottom:16 }}><p style={{ ...ui(13,400), color:LT.gold }}>This is a public alpha prototype with limited functionality. Stages and cues you create will not persist between sessions.</p></div>
        <p>New here? The <strong>Tutorial Stage</strong> walks you through every step with sample data ready to go.</p>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onClose} style={{ flex:1, padding:"12px 0", background:"none", border:`1px solid ${LT.border}`, ...mono(10), color:LT.ink60, cursor:"pointer" }}>Skip</button>
        <button onClick={onTutorial} style={{ flex:2, padding:"12px 0", background:DK, color:CREAM, border:"none", ...mono(10), letterSpacing:"0.12em", cursor:"pointer" }}>Start Tutorial</button>
      </div>
    </div>
  </>);
}


// ─── Set Builder ─────────────────────────────────────────────

function SetBuilder({ set, csvData, columns, onUpdate, onComplete, isTutorial }) {
  const cl = c();
  const [mode, setMode] = useState((set.shellHtml||set.jsxCode) ? "edit" : null);
  const [messages, setMessages] = useState(set.messages || []);
  const [editBanner, setEditBanner] = useState(false);
  const [bannerDraft, setBannerDraft] = useState(set.banner || "");
  const [tutorialHtmlPicker, setTutorialHtmlPicker] = useState(false);
  const [htmlDrag, setHtmlDrag] = useState(false);
  const [chatWidth, setChatWidth] = useState(420);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const chatEnd = useRef(null);
  const fileRef = useRef(null);
  const jsxFileRef = useRef(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const handleFileUpload = (content, filename) => { let html = content; if (!html.includes("<html") && !html.includes("<!DOCTYPE")) html = `<div>${html}</div>`; onUpdate({ ...set, shellHtml:html, sourceFile:filename, method:"html" }); setMode("edit"); };
  const handleFileDrop = (files) => { const f = files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => handleFileUpload(ev.target.result, f.name); r.readAsText(f); };
  const handleJsxFileDrop = (files) => { const f = files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { onUpdate({ ...set, jsxCode:ev.target.result, shellHtml:"", sourceFile:f.name, method:"jsx" }); setMode("edit"); }; r.readAsText(f); };

  const tutorialHtmlOptions = [
    { label:"HR / Pay Equity", desc:"Employee dashboard with equity scores", html:SAMPLE_HTML_HR },
    { label:"CRM / Pipeline", desc:"Sales pipeline with deal tracking", html:SAMPLE_HTML_CRM },
    { label:"Task Manager", desc:"Kanban board with task cards", html:SAMPLE_HTML_TASKS },
  ];

  const hasContent = set.shellHtml || set.jsxCode;

  // ─── Mode Chooser ───
  if (!mode && !hasContent) {
    return (
      <div style={{ padding:"36px 28px", maxWidth:800 }}>
        <h3 style={{ ...ds(28), color:cl.ink, marginBottom:8 }}>Build Your Set</h3>
        <p style={{ ...ui(16,300), color:cl.ink60, marginBottom:32 }}>The set is the visual shell your audience sees. How do you want to build it?</p>
        <div style={{ display:"flex", gap:16, marginBottom:20 }}>
          <div style={{ flex:1, padding:"28px 20px", border:`1px solid ${cl.borderLight}`, background:cl.surface, textAlign:"center", opacity:0.4, cursor:"not-allowed" }}>
            <div style={{ fontSize:28, marginBottom:12, opacity:0.6 }}>📸</div>
            <div style={{ ...ui(16,500), color:cl.ink, marginBottom:4 }}>Start with Images</div>
            <div style={{ ...mono(9), color:cl.ink40, marginTop:8 }}>Coming Soon</div>
          </div>
          <div onClick={()=>{if(isTutorial)setTutorialHtmlPicker(true);else setMode("html")}} style={{ flex:1, padding:"28px 20px", border:`1px solid ${cl.borderLight}`, background:cl.surface, cursor:"pointer", textAlign:"center", transition:"all 0.2s" }} onMouseEnter={e=>e.currentTarget.style.borderColor=cl.navy} onMouseLeave={e=>e.currentTarget.style.borderColor=cl.borderLight}>
            <div style={{ fontSize:28, marginBottom:12, opacity:0.6 }}>📄</div>
            <div style={{ ...ui(16,500), color:cl.ink, marginBottom:4 }}>Import HTML</div>
            <div style={{ ...ui(13,300), color:cl.ink60 }}>Self-contained HTML file</div>
          </div>
          <div onClick={()=>setMode("jsx")} style={{ flex:1, padding:"28px 20px", border:`1px solid ${cl.borderLight}`, background:cl.surface, cursor:"pointer", textAlign:"center", transition:"all 0.2s" }} onMouseEnter={e=>e.currentTarget.style.borderColor=cl.navy} onMouseLeave={e=>e.currentTarget.style.borderColor=cl.borderLight}>
            <div style={{ fontSize:28, marginBottom:12, opacity:0.6 }}>⚛</div>
            <div style={{ ...ui(16,500), color:cl.ink, marginBottom:4 }}>Import JSX</div>
            <div style={{ ...ui(13,300), color:cl.ink60 }}>React component — Omote runtime</div>
          </div>
        </div>
        {tutorialHtmlPicker && <div className="fadein" onClick={()=>setTutorialHtmlPicker(false)} style={{ position:"fixed", inset:0, background:"rgba(26,26,26,0.25)", zIndex:200 }}/>}
        {tutorialHtmlPicker && <div className="fadein" style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:440, background:cl.surface, border:`1px solid ${cl.borderLight}`, zIndex:201, boxShadow:"0 16px 48px rgba(0,0,0,0.12)", padding:28 }}><h3 style={{ ...ds(22), marginBottom:16 }}>Choose a template</h3>{tutorialHtmlOptions.map(opt=><div key={opt.label} onClick={()=>{handleFileUpload(opt.html,opt.label+".html");setTutorialHtmlPicker(false)}} style={{ padding:"14px 18px", border:`1px solid ${cl.borderLight}`, background:cl.bg, marginBottom:8, cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.borderColor=cl.navy} onMouseLeave={e=>e.currentTarget.style.borderColor=cl.borderLight}><div style={{ ...ui(15,500), color:cl.ink }}>{opt.label}</div><div style={{ ...ui(13,300), color:cl.ink60 }}>{opt.desc}</div></div>)}<button onClick={()=>{setTutorialHtmlPicker(false);setMode("html")}} style={{ width:"100%", padding:"10px 0", marginTop:8, background:"none", border:`1px solid ${cl.borderLight}`, ...mono(10), color:cl.ink40, cursor:"pointer" }}>Or upload your own file</button></div>}
      </div>
    );
  }

  // ─── HTML Upload ───
  if (mode==="html" && !hasContent) {
    return (
      <div style={{ padding:"36px 28px", maxWidth:600 }}>
        <button onClick={()=>setMode(null)} style={{ background:"none", border:"none", cursor:"pointer", ...mono(10), color:cl.ink60, marginBottom:20 }}>← Back</button>
        <div onDragOver={e=>{e.preventDefault();setHtmlDrag(true)}} onDragLeave={()=>setHtmlDrag(false)} onDrop={e=>{e.preventDefault();setHtmlDrag(false);handleFileDrop(Array.from(e.dataTransfer?.files||[]))}} onClick={()=>fileRef.current?.click()} style={{ padding:"64px 40px", border:`2px dashed ${htmlDrag?cl.navy:cl.border}`, background:htmlDrag?cl.navyWash:"transparent", cursor:"pointer", textAlign:"center" }}>
          <input ref={fileRef} type="file" accept=".html,.htm" onChange={e=>{if(e.target.files?.[0])handleFileDrop(Array.from(e.target.files))}} style={{ display:"none" }}/>
          <OIcon name="upload" size={28} color={cl.ink40}/><p style={{ ...mono(11), color:cl.ink60, marginTop:16, marginBottom:6 }}>Drop HTML file here</p><p style={{ ...ui(14,300), color:cl.ink40 }}>or click to browse</p>
        </div>
      </div>
    );
  }

  // ─── JSX Upload ───
  if (mode==="jsx" && !hasContent) {
    return (
      <div style={{ padding:"36px 28px", maxWidth:600 }}>
        <button onClick={()=>setMode(null)} style={{ background:"none", border:"none", cursor:"pointer", ...mono(10), color:cl.ink60, marginBottom:20 }}>← Back</button>
        <div onDragOver={e=>{e.preventDefault();setHtmlDrag(true)}} onDragLeave={()=>setHtmlDrag(false)} onDrop={e=>{e.preventDefault();setHtmlDrag(false);handleJsxFileDrop(Array.from(e.dataTransfer?.files||[]))}} onClick={()=>jsxFileRef.current?.click()} style={{ padding:"56px 40px", border:`2px dashed ${htmlDrag?cl.navy:cl.border}`, cursor:"pointer", textAlign:"center", marginBottom:20 }}>
          <input ref={jsxFileRef} type="file" accept=".jsx,.tsx,.js" onChange={e=>{if(e.target.files?.[0])handleJsxFileDrop(Array.from(e.target.files))}} style={{ display:"none" }}/>
          <div style={{ fontSize:32, marginBottom:12, opacity:0.5 }}>⚛</div>
          <p style={{ ...mono(11), color:cl.ink60, marginBottom:6 }}>Drop JSX file here</p>
        </div>
        <div style={{ padding:"16px 20px", background:cl.surface, border:`1px solid ${cl.borderLight}` }}>
          <div style={{ ...mono(8), color:cl.ink40, marginBottom:8 }}>Blessed Libraries</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{["React 18","Recharts","D3","Lodash","Tailwind CSS"].map(lib=><span key={lib} style={{ ...mono(8), padding:"3px 8px", background:cl.navyWash, color:cl.navy }}>{lib}</span>)}</div>
        </div>
      </div>
    );
  }

  // ─── Edit Mode (Preview + Canvas) ───
  return (
    <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
      <div ref={containerRef} style={{ display:"flex", flex:1, overflow:"hidden" }}>
        <div style={{ width:chatWidth, minWidth:280, maxWidth:"70%", flexShrink:0, display:"flex", flexDirection:"column", background:cl.surface }}>
          <div style={{ padding:"0 18px", minHeight:42, display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${cl.borderLight}` }}>
            <span style={{ ...mono(9), color:cl.ink40 }}>Canvas</span>
            <div style={{ display:"flex", gap:8 }}>
              {editBanner ? (
                <div style={{ display:"flex", gap:6 }}><input type="text" value={bannerDraft} onChange={e=>setBannerDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){onUpdate({...set,banner:bannerDraft.trim()});setEditBanner(false)}}} style={{ padding:"4px 8px", border:`1px solid ${cl.border}`, background:cl.bg, ...ui(12), color:cl.ink, outline:"none", width:200 }} autoFocus/><button onClick={()=>{onUpdate({...set,banner:bannerDraft.trim()});setEditBanner(false)}} style={{ padding:"4px 10px", background:cl.ink, color:cl.bg, border:"none", ...mono(7), cursor:"pointer" }}>Save</button></div>
              ) : (
                <button onClick={()=>{setBannerDraft(set.banner||"");setEditBanner(true)}} style={{ padding:"4px 10px", background:"none", border:`1px solid ${cl.borderLight}`, ...mono(8), color:cl.ink40, cursor:"pointer" }}>{set.banner?"Edit Banner":"Banner"}</button>
              )}
              <button onClick={onComplete} style={{ padding:"4px 14px", background:cl.matcha, color:"#fff", border:"none", ...mono(8), cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}><OIcon name="success" size={12} color="#fff"/> Done</button>
            </div>
          </div>
          <div style={{ flex:1, overflow:"auto", padding:18 }}>
            {messages.length===0 && hasContent && <div style={{ textAlign:"center", padding:"24px 16px" }}><div style={{ ...ds(18), color:cl.ink, marginBottom:8 }}>Set built</div><p style={{ ...ui(14,300), color:cl.ink60 }}>Your set is ready. Use the AI Canvas to refine it when available.</p></div>}
            {messages.length===0 && !hasContent && <div style={{ textAlign:"center", padding:"36px 20px" }}><div style={{ ...ds(20), color:cl.ink, marginBottom:10 }}>Design the set</div><p style={{ ...ui(14,300), color:cl.ink60 }}>Upload content to get started.</p></div>}
            {messages.map((m,i) => <div key={i} style={{ marginBottom:14, display:"flex", flexDirection:"column", alignItems:m.role==="user"?"flex-end":"flex-start" }}><div style={{ maxWidth:"88%", padding:"10px 14px", borderRadius:m.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px", background:m.role==="user"?cl.navy:cl.bg, color:m.role==="user"?"#fff":cl.ink, ...ui(14) }}>{m.image && <img src={m.image} alt="" style={{ maxWidth:"100%", maxHeight:140, borderRadius:6, marginBottom:m.text?8:0, display:"block" }}/>}{m.text && <div style={{ whiteSpace:"pre-wrap" }}>{m.text}</div>}</div></div>)}
            <div ref={chatEnd}/>
          </div>
          <div style={{ padding:"12px 18px", borderTop:`1px solid ${cl.borderLight}`, position:"relative" }}>
            <div style={{ position:"absolute", inset:0, background:cl.surface, opacity:0.7, zIndex:2 }}/>
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:3 }}><span style={{ ...mono(9), color:cl.ink40 }}>AI Canvas — Coming Soon</span></div>
            <div style={{ display:"flex", gap:10, alignItems:"flex-end", opacity:0.3, pointerEvents:"none" }}>
              <textarea disabled placeholder="Describe changes, paste images..." rows={2} style={{ flex:1, padding:"10px 12px", border:`1px solid ${cl.border}`, background:cl.bg, ...ui(15), color:cl.ink40, outline:"none", resize:"none", lineHeight:1.5 }}/>
              <button disabled style={{ padding:"10px 14px", background:cl.border, color:cl.ink40, border:"none", cursor:"not-allowed", flexShrink:0 }}><OIcon name="send" size={16} color={cl.ink40}/></button>
            </div>
          </div>
        </div>
        <div onMouseDown={(e) => { e.preventDefault(); const startX=e.clientX; const startW=chatWidth; setIsDragging(true); const onMove=(ev)=>{const c2=containerRef.current;const max=c2?c2.offsetWidth*0.7:900;setChatWidth(Math.max(280,Math.min(max,startW+ev.clientX-startX)))}; const onUp=()=>{setIsDragging(false);document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);document.body.style.cursor="";document.body.style.userSelect=""}; document.addEventListener("mousemove",onMove); document.addEventListener("mouseup",onUp); document.body.style.cursor="col-resize"; document.body.style.userSelect="none"; }} style={{ width:6, cursor:"col-resize", background:"transparent", flexShrink:0, position:"relative", zIndex:10 }}>
          <div style={{ position:"absolute", top:0, bottom:0, left:2, width:1, background:isDragging?cl.navy:cl.borderLight, transition:isDragging?"none":"background 0.2s" }}/>
        </div>
        <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#fff", position:"relative" }}>
          {isDragging && <div style={{ position:"absolute", inset:0, zIndex:5 }}/>}
          <div style={{ padding:"0 18px", minHeight:42, display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${cl.borderLight}`, background:cl.surface }}>
            <span style={{ ...mono(9), color:cl.ink40 }}>Preview</span>
            {hasContent && <span style={{ ...mono(8), color:cl.matcha }}>● Live</span>}
          </div>
          <div style={{ flex:1 }}>
            {hasContent ? <StageFrame content={set.jsxCode||set.shellHtml} contentType={set.jsxCode?"jsx":"html"} data={csvData} company="Acme Corp" banner={set.banner}/> : <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", ...ui(15,300), color:cl.ink40 }}>Upload content to preview your set</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Backstage ───────────────────────────────────────────────

function Backstage({ workspace, onUpdate, onPublish, isTutorial }) {
  const cl = c();
  const hasData = Array.isArray(workspace.csvData) && workspace.csvData.length > 0;
  const set = workspace.set || {};
  const hasSet = !!(set.shellHtml || set.jsxCode);
  const cues = workspace.cues || [];
  const canPublish = cues.length > 0;
  const defaultTab = !workspace.csvData ? "data" : !hasSet ? "set" : "cues";
  const [tab, setTab] = useState(defaultTab);
  const [csvData, setCsvData] = useState(workspace.csvData||null);
  const [columns, setColumns] = useState(workspace.columns||[]);
  const [csvFile, setCsvFile] = useState(workspace.csvFilename||null);
  const [showNewCue, setShowNewCue] = useState(false);
  const [cn, setCn] = useState(""); const [cb, setCb] = useState("");
  const [namingFirst, setNamingFirst] = useState(false);
  const [drag, setDrag] = useState(false);
  const [tutorialCsvPicker, setTutorialCsvPicker] = useState(false);
  const fileRef = useRef(null);

  const parseCsv = (file) => { setCsvFile(file.name); Papa.parse(file, { header:true, skipEmptyLines:true, complete:r => { setCsvData(r.data); setColumns(r.meta.fields||[]); onUpdate({ ...workspace, csvData:r.data, columns:r.meta.fields, csvFilename:file.name }); setTab("set"); }}); };
  const parseCsvString = (csvStr, filename) => { const p = Papa.parse(csvStr, { header:true, skipEmptyLines:true }); setCsvData(p.data); setColumns(p.meta.fields||[]); setCsvFile(filename); onUpdate({ ...workspace, csvData:p.data, columns:p.meta.fields, csvFilename:filename }); setTab("set"); };
  const updateSet = (s) => { onUpdate({ ...workspace, set:s, csvData, columns, csvFilename:csvFile }); };
  const onSetComplete = () => { if (cues.length === 0) { setNamingFirst(true); setTab("cues"); } else { setTab("cues"); } };
  const createCue = (name, banner) => {
    if (!name.trim()) return;
    const s = workspace.set || {};
    const cue = { id:Date.now().toString(), name:name.trim(), banner:(banner||"").trim(), shellHtml:s.shellHtml||"", jsxCode:s.jsxCode||"", method:s.method, notes:[] };
    const list = [...cues, cue];
    onUpdate({ ...workspace, cues:list, csvData, columns, csvFilename:csvFile });
    setNamingFirst(false); setShowNewCue(false); setCn(""); setCb("");
  };
  const deleteCue = (id) => { const list = cues.filter(v=>v.id!==id); onUpdate({ ...workspace, cues:list }); };

  const tutorialCsvOptions = [
    { label:"HR / People Data", desc:"Employees with salaries, equity scores", csv:SAMPLE_CSV_HR, file:"hr-employees.csv" },
    { label:"CRM / Sales Pipeline", desc:"Deals with amounts, stages, reps", csv:SAMPLE_CSV_CRM, file:"crm-pipeline.csv" },
    { label:"Task List", desc:"Tasks with status, priority", csv:SAMPLE_CSV_TASKS, file:"task-list.csv" },
  ];

  // Set edit mode takes full area
  if (tab === "set" && hasSet) {
    return (
      <div style={{ height:"100%", background:cl.bg, display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", minHeight:52, borderBottom:`1px solid ${cl.borderLight}`, background:cl.surface }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}><h2 style={{ ...ds(20), color:cl.ink }}>{workspace.name}</h2><span style={{ ...mono(9), padding:"2px 8px", background:cl.navyWash, color:cl.navy }}>Set</span><span style={{ ...mono(8), color:cl.matcha }}>● Built</span></div>
        </div>
        <SetBuilder set={set} csvData={csvData} columns={columns} onUpdate={updateSet} onComplete={onSetComplete} isTutorial={isTutorial}/>
      </div>
    );
  }

  return (
    <div style={{ height:"100%", background:cl.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 28px", minHeight:52, borderBottom:`1px solid ${cl.borderLight}`, background:cl.surface }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <h2 style={{ ...ds(20), color:cl.ink }}>{workspace.name}</h2>
          <span style={{ ...mono(9), padding:"2px 8px", background:workspace.status==="active"?`${cl.matcha}15`:cl.goldWash, color:workspace.status==="active"?cl.matcha:cl.gold }}>{workspace.status==="active"?"Active":"Draft"}</span>
          {isTutorial && <span style={{ ...mono(8), padding:"2px 8px", background:cl.navyWash, color:cl.navy }}>Tutorial</span>}
        </div>
        <button onClick={()=>onPublish({...workspace,status:"active",csvData,columns,csvFilename:csvFile})} disabled={!canPublish} style={{ padding:"9px 22px", background:canPublish?cl.ink:cl.border, color:canPublish?cl.bg:cl.ink40, border:"none", ...mono(10), cursor:canPublish?"pointer":"not-allowed" }}>Publish</button>
      </div>
      <div style={{ display:"flex", borderBottom:`1px solid ${cl.borderLight}`, background:cl.surface, padding:"0 28px" }}>
        {[{id:"data",label:"Data",ok:hasData},{id:"set",label:"Set",ok:hasSet},{id:"cues",label:"Cues",ok:cues.length>0},{id:"notes",label:"Notes",ok:cues.some(c=>(c.notes||[]).length>0)}].map(tb => (
          <button key={tb.id} onClick={()=>setTab(tb.id)} style={{ padding:"12px 20px", background:"none", border:"none", borderBottom:`2px solid ${tab===tb.id?cl.ink:"transparent"}`, ...ui(15,tab===tb.id?500:300), color:tab===tb.id?cl.ink:cl.ink40, cursor:"pointer", marginBottom:-1, display:"flex", alignItems:"center", gap:8 }}>{tb.label}{tb.ok && <div style={{ width:6, height:6, borderRadius:"50%", background:cl.matcha }}/>}</button>
        ))}
      </div>
      <div style={{ flex:1, overflow:"auto" }}>
        {tab==="data" && (
          <div style={{ padding:"36px 28px", maxWidth:800 }}>
            <h3 style={{ ...ds(28), color:cl.ink, marginBottom:8 }}>Data Model</h3>
            <p style={{ ...ui(16,300), color:cl.ink60, marginBottom:32 }}>One dataset per stage. Column headers become the schema.</p>
            {!hasData ? (
              <div>
                <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);if(e.dataTransfer?.files?.[0])parseCsv(e.dataTransfer.files[0])}} onClick={()=>{if(isTutorial)setTutorialCsvPicker(true);else fileRef.current?.click()}} style={{ padding:"56px 40px", border:`2px dashed ${drag?cl.navy:cl.border}`, background:drag?cl.navyWash:"transparent", cursor:"pointer", textAlign:"center" }}>
                  <input ref={fileRef} type="file" accept=".csv,.tsv" onChange={e=>{if(e.target.files?.[0])parseCsv(e.target.files[0])}} style={{ display:"none" }}/>
                  <OIcon name="upload" size={28} color={cl.ink20}/><p style={{ ...mono(11), color:cl.ink60, marginTop:16, marginBottom:6 }}>Upload CSV</p>
                  {isTutorial && <p style={{ ...ui(14,300), color:cl.navy, marginTop:8 }}>Click to choose from sample datasets</p>}
                </div>
                <button onClick={()=>setTab("set")} style={{ width:"100%", padding:"12px 0", marginTop:14, background:"none", border:`1px solid ${cl.borderLight}`, ...mono(10), color:cl.ink40, cursor:"pointer" }}>Skip — my HTML or JSX has its own data</button>
                {tutorialCsvPicker && <><div className="fadein" onClick={()=>setTutorialCsvPicker(false)} style={{ position:"fixed", inset:0, background:"rgba(26,26,26,0.25)", zIndex:200 }}/><div className="fadein" style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:440, background:cl.surface, border:`1px solid ${cl.borderLight}`, zIndex:201, boxShadow:"0 16px 48px rgba(0,0,0,0.12)", padding:28 }}><h3 style={{ ...ds(22), marginBottom:16 }}>Choose sample data</h3>{tutorialCsvOptions.map(opt=><div key={opt.label} onClick={()=>{parseCsvString(opt.csv,opt.file);setTutorialCsvPicker(false)}} style={{ padding:"14px 18px", border:`1px solid ${cl.borderLight}`, background:cl.bg, marginBottom:8, cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.borderColor=cl.navy} onMouseLeave={e=>e.currentTarget.style.borderColor=cl.borderLight}><div style={{ ...ui(15,500), color:cl.ink }}>{opt.label}</div><div style={{ ...ui(13,300), color:cl.ink60 }}>{opt.desc}</div></div>)}<button onClick={()=>{setTutorialCsvPicker(false);fileRef.current?.click()}} style={{ width:"100%", padding:"10px 0", marginTop:8, background:"none", border:`1px solid ${cl.borderLight}`, ...mono(10), color:cl.ink40, cursor:"pointer" }}>Or upload your own file</button></div></>}
              </div>
            ) : (
              <div>
                <div style={{ display:"flex", gap:24, marginBottom:28, padding:"18px 22px", background:cl.surface, border:`1px solid ${cl.borderLight}` }}>
                  <div><div style={{ ...mono(9), color:cl.ink40, marginBottom:3 }}>File</div><div style={{ ...ui(16,500), color:cl.ink80 }}>{csvFile}</div></div>
                  <div style={{ width:1, background:cl.borderLight }}/>
                  <div><div style={{ ...mono(9), color:cl.ink40, marginBottom:3 }}>Columns</div><div style={{ ...ui(16,500), color:cl.ink80 }}>{columns.length}</div></div>
                  <div style={{ width:1, background:cl.borderLight }}/>
                  <div><div style={{ ...mono(9), color:cl.ink40, marginBottom:3 }}>Rows</div><div style={{ ...ui(16,500), color:cl.ink80 }}>{csvData.length}</div></div>
                </div>
                <div style={{ ...mono(10), color:cl.ink60, marginBottom:10 }}>Schema</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{columns.map(col=>{const n=csvData[0]?.[col]!=null&&!isNaN(parseFloat(csvData[0][col]));return <span key={col} style={{ ...mono(9), padding:"4px 10px", background:n?`${cl.matcha}10`:cl.surface, border:`1px solid ${n?`${cl.matcha}30`:cl.borderLight}`, color:n?cl.matcha:cl.ink60 }}>{col}</span>})}</div>
              </div>
            )}
          </div>
        )}
        {tab==="set" && !hasSet && <SetBuilder set={set} csvData={csvData} columns={columns} onUpdate={updateSet} onComplete={onSetComplete} isTutorial={isTutorial}/>}
        {tab==="cues" && (
          <div style={{ padding:"36px 28px", maxWidth:800 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
              <div><h3 style={{ ...ds(28), color:cl.ink, marginBottom:6 }}>Cues</h3><p style={{ ...ui(15,300), color:cl.ink60 }}>Named versions of your set. Each cue can have its own banner.</p></div>
              {hasSet && !showNewCue && !namingFirst && <button onClick={()=>setShowNewCue(true)} style={{ padding:"9px 20px", background:cl.ink, color:cl.bg, border:"none", ...mono(10), cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}><OIcon name="plus" size={13} color={cl.bg}/> New Cue</button>}
            </div>
            {!hasSet && <div style={{ padding:"24px 28px", background:cl.goldWash, border:"1px solid rgba(140,122,60,0.15)" }}><p style={{ ...ui(14,300), color:cl.gold }}>Build a Set first — cues are created from your set design.</p><button onClick={()=>setTab("set")} style={{ marginTop:12, padding:"8px 18px", background:cl.ink, color:cl.bg, border:"none", ...mono(9), cursor:"pointer" }}>Build Set</button></div>}
            {namingFirst && (
              <div className="fadein" style={{ padding:24, background:cl.surface, border:`2px solid ${cl.navy}`, marginBottom:24 }}>
                <h4 style={{ ...ds(20), color:cl.ink, marginBottom:6 }}>Name your first cue</h4>
                <p style={{ ...ui(14,300), color:cl.ink60, marginBottom:16 }}>Your set is ready. Give this version a name to create your first performable cue.</p>
                <div style={{ marginBottom:14 }}><label style={{ ...mono(9), color:cl.ink40, display:"block", marginBottom:6 }}>Cue Name</label><input type="text" value={cn} onChange={e=>setCn(e.target.value)} autoFocus onKeyDown={e=>{if(e.key==="Enter"&&cn.trim())createCue(cn,cb)}} placeholder="e.g. Current Product, Q3 Roadmap" style={{ width:"100%", padding:"10px 12px", border:`1px solid ${cl.border}`, background:cl.bg, ...ui(15), color:cl.ink, outline:"none" }} onFocus={e=>e.target.style.borderColor=cl.navy} onBlur={e=>e.target.style.borderColor=cl.border}/></div>
                <div style={{ marginBottom:14 }}><label style={{ ...mono(9), color:cl.ink40, display:"block", marginBottom:6 }}>Banner <span style={{ ...ui(12,300), textTransform:"none", letterSpacing:0, color:cl.ink20 }}>Optional</span></label><input type="text" value={cb} onChange={e=>setCb(e.target.value)} placeholder="e.g. Safe Harbor: Features shown are 6+ months out" style={{ width:"100%", padding:"10px 12px", border:`1px solid ${cl.border}`, background:cl.bg, ...ui(15), color:cl.ink, outline:"none" }} onFocus={e=>e.target.style.borderColor=cl.gold} onBlur={e=>e.target.style.borderColor=cl.border}/></div>
                <button onClick={()=>createCue(cn,cb)} disabled={!cn.trim()} style={{ padding:"10px 24px", background:cn.trim()?cl.ink:cl.border, color:cn.trim()?cl.bg:cl.ink40, border:"none", ...mono(10), cursor:cn.trim()?"pointer":"not-allowed" }}>Create Cue</button>
              </div>
            )}
            {showNewCue && !namingFirst && (
              <div className="fadein" style={{ padding:24, background:cl.surface, border:`1px solid ${cl.borderLight}`, marginBottom:24 }}>
                <h4 style={{ ...ds(20), color:cl.ink, marginBottom:16 }}>New Cue</h4>
                <p style={{ ...ui(13,300), color:cl.ink60, marginBottom:16 }}>Creates a new cue cloned from your current set.</p>
                <div style={{ marginBottom:14 }}><label style={{ ...mono(9), color:cl.ink40, display:"block", marginBottom:6 }}>Name</label><input type="text" value={cn} onChange={e=>setCn(e.target.value)} autoFocus onKeyDown={e=>{if(e.key==="Enter"&&cn.trim())createCue(cn,cb)}} placeholder="e.g. Long-Term Vision, Safe Harbor Demo" style={{ width:"100%", padding:"10px 12px", border:`1px solid ${cl.border}`, background:cl.bg, ...ui(15), color:cl.ink, outline:"none" }} onFocus={e=>e.target.style.borderColor=cl.navy} onBlur={e=>e.target.style.borderColor=cl.border}/></div>
                <div style={{ marginBottom:14 }}><label style={{ ...mono(9), color:cl.ink40, display:"block", marginBottom:6 }}>Banner <span style={{ ...ui(12,300), textTransform:"none", letterSpacing:0, color:cl.ink20 }}>Optional</span></label><input type="text" value={cb} onChange={e=>setCb(e.target.value)} placeholder="e.g. Safe Harbor: Features shown are 6+ months out" style={{ width:"100%", padding:"10px 12px", border:`1px solid ${cl.border}`, background:cl.bg, ...ui(15), color:cl.ink, outline:"none" }}/></div>
                <div style={{ display:"flex", gap:8 }}><button onClick={()=>{setShowNewCue(false);setCn("");setCb("")}} style={{ flex:1, padding:"10px 0", background:"none", border:`1px solid ${cl.border}`, ...mono(10), color:cl.ink40, cursor:"pointer" }}>Cancel</button><button onClick={()=>createCue(cn,cb)} disabled={!cn.trim()} style={{ flex:1, padding:"10px 0", background:cn.trim()?cl.ink:cl.border, color:cn.trim()?cl.bg:cl.ink40, border:"none", ...mono(10), cursor:cn.trim()?"pointer":"not-allowed" }}>Create</button></div>
              </div>
            )}
            {cues.map(v => (
              <div key={v.id} style={{ padding:"20px 24px", border:`1px solid ${cl.borderLight}`, background:cl.surface, marginBottom:10, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ flex:1 }}><div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}><span style={{ ...ds(20), color:cl.ink }}>{v.name}</span><span style={{ ...mono(8), color:cl.matcha }}>● Ready</span></div>{v.banner && <p style={{ ...ui(13,300), color:cl.gold }}>{v.banner}</p>}</div>
                <button onClick={()=>deleteCue(v.id)} style={{ padding:"8px 12px", background:"none", border:`1px solid ${cl.borderLight}`, ...mono(9), color:cl.ink40, cursor:"pointer" }} onMouseEnter={e=>{e.currentTarget.style.borderColor=cl.akane;e.currentTarget.style.color=cl.akane}} onMouseLeave={e=>{e.currentTarget.style.borderColor=cl.borderLight;e.currentTarget.style.color=cl.ink40}}>Remove</button>
              </div>
            ))}
          </div>
        )}
        {tab==="notes" && (
          <div style={{ padding:"36px 28px", maxWidth:800 }}>
            <h3 style={{ ...ds(28), color:cl.ink, marginBottom:6 }}>Speaker Notes</h3>
            <p style={{ ...ui(15,300), color:cl.ink60, marginBottom:32 }}>Talking points for each cue. Visible only to you via the Omote Companion extension during Perform.</p>
            {cues.length === 0 && <div style={{ padding:"24px 28px", background:cl.goldWash, border:"1px solid rgba(140,122,60,0.15)" }}><p style={{ ...ui(14,300), color:cl.gold }}>Create cues first to add speaker notes.</p></div>}
            {cues.map(cue => {
              const notes = cue.notes || [];
              const addNote = () => {
                const updated = { ...cue, notes: [...notes, { id: Date.now().toString(), title: "", tip: "" }] };
                const list = cues.map(c => c.id === cue.id ? updated : c);
                onUpdate({ ...workspace, cues: list, csvData, columns, csvFilename: csvFile });
              };
              const updateNote = (noteId, field, value) => {
                const updatedNotes = notes.map(n => n.id === noteId ? { ...n, [field]: value } : n);
                const updated = { ...cue, notes: updatedNotes };
                const list = cues.map(c => c.id === cue.id ? updated : c);
                onUpdate({ ...workspace, cues: list, csvData, columns, csvFilename: csvFile });
              };
              const removeNote = (noteId) => {
                const updated = { ...cue, notes: notes.filter(n => n.id !== noteId) };
                const list = cues.map(c => c.id === cue.id ? updated : c);
                onUpdate({ ...workspace, cues: list, csvData, columns, csvFilename: csvFile });
              };
              const moveNote = (noteId, dir) => {
                const idx = notes.findIndex(n => n.id === noteId);
                if ((dir === -1 && idx === 0) || (dir === 1 && idx === notes.length - 1)) return;
                const arr = [...notes]; const tmp = arr[idx]; arr[idx] = arr[idx + dir]; arr[idx + dir] = tmp;
                const updated = { ...cue, notes: arr };
                const list = cues.map(c => c.id === cue.id ? updated : c);
                onUpdate({ ...workspace, cues: list, csvData, columns, csvFilename: csvFile });
              };
              return (
                <div key={cue.id} style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ ...ds(20), color: cl.ink }}>{cue.name}</span>
                      <span style={{ ...mono(8), color: cl.ink20 }}>{notes.length} note{notes.length !== 1 ? "s" : ""}</span>
                    </div>
                    <button onClick={addNote} style={{ padding: "6px 14px", background: cl.ink, color: cl.bg, border: "none", ...mono(9), cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><OIcon name="plus" size={12} color={cl.bg}/> Add</button>
                  </div>
                  {notes.length === 0 && <div style={{ padding: "16px 20px", border: `1px dashed ${cl.border}`, textAlign: "center", ...ui(14, 300), color: cl.ink40 }}>No notes yet. Add talking points your audience won't see.</div>}
                  {notes.map((note, ni) => (
                    <div key={note.id} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 8 }}>
                        <button onClick={() => moveNote(note.id, -1)} disabled={ni === 0} style={{ background: "none", border: "none", cursor: ni === 0 ? "default" : "pointer", opacity: ni === 0 ? 0.2 : 0.5, fontSize: 10, lineHeight: 1, padding: 2 }}>▲</button>
                        <span style={{ ...mono(9), color: cl.ink20, textAlign: "center" }}>{ni + 1}</span>
                        <button onClick={() => moveNote(note.id, 1)} disabled={ni === notes.length - 1} style={{ background: "none", border: "none", cursor: ni === notes.length - 1 ? "default" : "pointer", opacity: ni === notes.length - 1 ? 0.2 : 0.5, fontSize: 10, lineHeight: 1, padding: 2 }}>▼</button>
                      </div>
                      <div style={{ flex: 1, padding: "10px 14px", background: cl.surface, border: `1px solid ${cl.borderLight}` }}>
                        <input type="text" value={note.title} onChange={e => updateNote(note.id, "title", e.target.value)} placeholder="Section or topic" style={{ width: "100%", padding: "4px 0", border: "none", background: "transparent", ...ui(14, 500), color: cl.ink, outline: "none", marginBottom: 6 }}/>
                        <textarea value={note.tip} onChange={e => updateNote(note.id, "tip", e.target.value)} placeholder="Your zinger — customer story, value stat, or key talking point" rows={2} style={{ width: "100%", padding: "4px 0", border: "none", background: "transparent", ...ui(14, 300), color: cl.ink80, outline: "none", resize: "vertical", lineHeight: 1.5 }}/>
                      </div>
                      <button onClick={() => removeNote(note.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "10px 4px", opacity: 0.3 }} onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.3"}><OIcon name="x" size={14} color={cl.akane}/></button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Login ───────────────────────────────────────────────────

function Login({ onLogin }) {
  const [stage,setStage]=useState("anim");
  const [email,setEmail]=useState(""); const [pw,setPw]=useState("");
  const [err,setErr]=useState(null); const [ld,setLd]=useState(false);

  const go = async () => {
    setLd(true); setErr(null);
    try {
      const { user } = await db.signIn(email.trim(), pw);
      const profile = await db.getProfile(user.id);
      onLogin(profile);
    } catch (e) {
      setErr(e.message || "Invalid credentials");
      setLd(false);
    }
  };

  if (stage==="anim") return <div style={{minHeight:"100vh",background:CREAM,display:"flex",alignItems:"center",justifyContent:"center"}}><BuildingTheStage onComplete={()=>setStage("form")}/></div>;
  return (
    <div style={{minHeight:"100vh",background:CREAM,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div className="breathe" style={{width:360,padding:"48px 44px",textAlign:"center"}}>
        <div style={{marginBottom:28}}><StageMark size={56}/></div>
        <h1 style={{...ds(38),marginBottom:4}}>Omote</h1>
        <p style={{...ui(12,300),color:WARM,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:36}}>Demo Stage Designer</p>
        <div style={{textAlign:"left",marginBottom:16}}>
          <div style={{marginBottom:12}}><label style={{...mono(9),color:"#888880",display:"block",marginBottom:5}}>Email</label><input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr(null)}} onKeyDown={e=>{if(e.key==="Enter"&&email&&pw)go()}} autoFocus style={{width:"100%",padding:"12px 14px",border:`1px solid ${err?"#8B4D4D":"#CCC6BA"}`,background:CREAM,fontFamily:"'Source Sans 3',sans-serif",fontSize:16,color:DK,outline:"none"}} onFocus={e=>{if(!err)e.target.style.borderColor="#5A6A7C"}} onBlur={e=>{if(!err)e.target.style.borderColor="#CCC6BA"}}/></div>
          <div><label style={{...mono(9),color:"#888880",display:"block",marginBottom:5}}>Password</label><input type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr(null)}} onKeyDown={e=>{if(e.key==="Enter"&&email&&pw)go()}} style={{width:"100%",padding:"12px 14px",border:`1px solid ${err?"#8B4D4D":"#CCC6BA"}`,background:CREAM,fontFamily:"'Source Sans 3',sans-serif",fontSize:16,color:DK,outline:"none"}} onFocus={e=>{if(!err)e.target.style.borderColor="#5A6A7C"}} onBlur={e=>{if(!err)e.target.style.borderColor="#CCC6BA"}}/></div>
        </div>
        {err && <div style={{padding:"8px 12px",marginBottom:12,background:"rgba(139,77,77,0.06)",border:"1px solid rgba(139,77,77,0.15)",...ui(14,400),color:"#8B4D4D",textAlign:"center"}}>{err}</div>}
        <button onClick={go} disabled={ld||!email||!pw} style={{width:"100%",padding:"13px 0",background:(email&&pw)?DK:"#CCC6BA",color:(email&&pw)?CREAM:WARM,border:"none",...mono(11),letterSpacing:"0.15em",cursor:ld?"wait":(email&&pw)?"pointer":"not-allowed",marginBottom:8}}>{ld?"Entering...":"Sign In"}</button>
        <button disabled style={{width:"100%",padding:"11px 0",background:"transparent",border:"1px solid #DDD7CD",...mono(10),color:"#CCC6BA",cursor:"not-allowed",marginBottom:8}}>SSO — Coming Soon</button>
        <div style={{...mono(8),color:"#CCC6BA",marginTop:20}}>mk5.4</div>
      </div>
    </div>
  );
}

// ─── Hub ─────────────────────────────────────────────────────

function Hub({ stages, onSelect, onEdit, onCreate, onDelete, onTutorial, role, users, onShare }) {
  const cl = c();
  const [modal,setModal]=useState(false); const [nn,setNn]=useState(""); const [nd,setNd]=useState(""); const [ni,setNi]=useState("rocket");
  const [shareModal, setShareModal] = useState(null); // stage being shared
  const reset=()=>{setModal(false);setNn("");setNd("");setNi("rocket")};
  const hasTutorial = stages.some(s=>s.isTutorial);
  return (
    <div style={{ height:"100%", overflow:"auto", background:cl.bg }}>
      <div style={{ maxWidth:800, margin:"0 auto", padding:"48px 40px" }}>
        <div className="breathe" style={{ marginBottom:48 }}><h2 style={{...ds(38),color:cl.ink,marginBottom:8}}>Stages</h2><p style={{...ui(17,300),color:cl.ink60}}>Select a stage to perform, or build a new one.</p></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {!hasTutorial && <div className="breathe" style={{ animationDelay:"0.05s" }}><div onClick={onTutorial} style={{ padding:"24px 28px", border:`2px dashed ${cl.navy}`, background:cl.navyWash, cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.06)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}><div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}><span style={{ fontSize:20 }}>🎓</span><h3 style={{ ...ds(22), color:cl.navy }}>Tutorial Stage</h3></div><p style={{ ...ui(14,300), color:cl.ink60 }}>Learn by doing — guided walkthrough with sample data.</p></div></div>}
          {stages.map((s,i) => (
            <div key={s.id} className="breathe" style={{ animationDelay:`${0.1+i*0.05}s` }}>
              <div style={{ padding:"24px 28px", border:`1px solid ${cl.borderLight}`, background:cl.surface, transition:"all 0.3s" }} onMouseEnter={e=>{e.currentTarget.style.borderColor=cl.navy}} onMouseLeave={e=>{e.currentTarget.style.borderColor=cl.borderLight}}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}><OIcon name={s.icon||"cube"} size={18} color={cl.navy}/><h3 style={{ ...ds(22), color:cl.ink }}>{s.name}</h3>{s.isTutorial && <span style={{ ...mono(7), padding:"2px 6px", background:cl.navyWash, color:cl.navy }}>Tutorial</span>}</div>
                  <span style={{ ...mono(8), padding:"2px 8px", background:s.status==="active"?`${cl.matcha}15`:cl.goldWash, color:s.status==="active"?cl.matcha:cl.gold }}>{s.status==="active"?"Active":"Draft"}</span>
                </div>
                <p style={{ ...ui(14,300), color:cl.ink60, marginBottom:4 }}>{s.description}</p>
                {s.cues?.length>0 && <p style={{...mono(8),color:cl.ink20,marginBottom:14}}>{s.cues.length} cue{s.cues.length!==1?"s":""}</p>}
                <div style={{ display:"flex", gap:8 }}>
                  {s.status==="active"&&s.cues?.some(v=>v.shellHtml||v.jsxCode)?(<button onClick={()=>onSelect(s)} style={{flex:1,padding:"10px 0",background:cl.ink,color:cl.bg,border:"none",...mono(10),cursor:"pointer"}}>Perform</button>):(<button onClick={()=>onEdit(s)} style={{flex:1,padding:"10px 0",background:cl.ink,color:cl.bg,border:"none",...mono(10),cursor:"pointer"}}>Configure</button>)}
                  {role==="admin"&&s.status==="active" && <button onClick={()=>onEdit(s)} style={{padding:"10px 16px",background:"none",border:`1px solid ${cl.borderLight}`,...mono(10),color:cl.ink60,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><OIcon name="edit" size={12} color={cl.ink60}/> Edit</button>}
                  {role==="admin" && <button onClick={()=>setShareModal(s)} style={{padding:"10px 12px",background:"none",border:`1px solid ${cl.borderLight}`,...mono(10),color:cl.ink60,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor=cl.navy} onMouseLeave={e=>e.currentTarget.style.borderColor=cl.borderLight}>Share</button>}
                  {role==="admin" && <button onClick={(e)=>{e.stopPropagation();if(confirm("Delete stage '"+s.name+"'? This cannot be undone."))onDelete(s.id)}} style={{padding:"10px 12px",background:"none",border:`1px solid ${cl.borderLight}`,...mono(10),color:cl.ink40,cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=cl.akane;e.currentTarget.style.color=cl.akane}} onMouseLeave={e=>{e.currentTarget.style.borderColor=cl.borderLight;e.currentTarget.style.color=cl.ink40}}>Delete</button>}
                </div>
              </div>
            </div>
          ))}
          {role==="admin" && <div className="breathe" style={{ animationDelay:`${0.15+stages.length*0.05}s` }}><div onClick={()=>setModal(true)} style={{padding:"24px 28px",border:`1px dashed ${cl.border}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:160,gap:14,transition:"all 0.3s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=cl.navy;e.currentTarget.style.background=cl.surface}} onMouseLeave={e=>{e.currentTarget.style.borderColor=cl.border;e.currentTarget.style.background="transparent"}}><OIcon name="plus" size={18} color={cl.ink40}/><span style={{...mono(10),color:cl.ink40}}>New Stage</span></div></div>}
        </div>
      </div>
      {modal && (<><div className="fadein" onClick={reset} style={{position:"fixed",inset:0,background:"rgba(26,26,26,0.25)",zIndex:200,backdropFilter:"blur(2px)"}}/><div className="fadein" style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:440,background:cl.surface,border:`1px solid ${cl.borderLight}`,zIndex:201,boxShadow:"0 16px 48px rgba(0,0,0,0.12)"}}><div style={{padding:28}}><h3 style={{...ds(24),color:cl.ink,marginBottom:24}}>New Stage</h3><div style={{marginBottom:14}}><label style={{...mono(9),color:cl.ink40,display:"block",marginBottom:6}}>Name</label><input type="text" value={nn} onChange={e=>setNn(e.target.value)} autoFocus onKeyDown={e=>{if(e.key==="Enter"&&nn.trim()){onCreate({name:nn,description:nd||"New stage",icon:ni});reset()}}} style={{width:"100%",padding:"10px 12px",border:`1px solid ${cl.border}`,background:cl.bg,...ui(16),color:cl.ink,outline:"none"}} onFocus={e=>e.target.style.borderColor=cl.navy} onBlur={e=>e.target.style.borderColor=cl.border}/></div><div style={{marginBottom:14}}><label style={{...mono(9),color:cl.ink40,display:"block",marginBottom:6}}>Description</label><input type="text" value={nd} onChange={e=>setNd(e.target.value)} style={{width:"100%",padding:"10px 12px",border:`1px solid ${cl.border}`,background:cl.bg,...ui(16),color:cl.ink,outline:"none"}}/></div><div style={{marginBottom:24}}><label style={{...mono(9),color:cl.ink40,display:"block",marginBottom:8}}>Icon</label><IconPicker value={ni} onChange={setNi}/></div><div style={{display:"flex",gap:10}}><button onClick={reset} style={{flex:1,padding:"10px 0",background:"none",border:`1px solid ${cl.border}`,...mono(10),color:cl.ink40,cursor:"pointer"}}>Cancel</button><button onClick={()=>{if(nn.trim()){onCreate({name:nn,description:nd||"New stage",icon:ni});reset()}}} disabled={!nn.trim()} style={{flex:1,padding:"10px 0",background:nn.trim()?cl.ink:cl.border,color:nn.trim()?cl.bg:cl.ink40,border:"none",...mono(10),cursor:nn.trim()?"pointer":"not-allowed"}}>Create</button></div></div></div></>)}
      {shareModal && (<><div className="fadein" onClick={()=>setShareModal(null)} style={{position:"fixed",inset:0,background:"rgba(26,26,26,0.25)",zIndex:200,backdropFilter:"blur(2px)"}}/><div className="fadein" style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:440,background:cl.surface,border:`1px solid ${cl.borderLight}`,zIndex:201,boxShadow:"0 16px 48px rgba(0,0,0,0.12)",maxHeight:"70vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"24px 28px 16px"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><OIcon name={shareModal.icon||"cube"} size={20} color={cl.navy}/><h3 style={{...ds(22),color:cl.ink}}>Share Stage</h3></div><p style={{...ui(14,300),color:cl.ink60}}>Select users who can access <strong>{shareModal.name}</strong></p></div>
        <div style={{flex:1,overflow:"auto",padding:"0 28px 24px"}}>
          {(users||[]).filter(u=>u.role!=="admin").length===0 && <div style={{padding:"20px 0",textAlign:"center",...ui(14,300),color:cl.ink40}}>No users to share with. Invite users first.</div>}
          {(users||[]).filter(u=>u.role!=="admin").map(u => {
            const assigned = (shareModal.assignedUsers||[]).includes(u.id);
            return (
              <div key={u.id} onClick={()=>{ onShare(shareModal.id, u.id, !assigned); setShareModal({...shareModal, assignedUsers: assigned ? (shareModal.assignedUsers||[]).filter(id=>id!==u.id) : [...(shareModal.assignedUsers||[]), u.id] }); }} style={{
                display:"flex", alignItems:"center", padding:"12px 14px", cursor:"pointer",
                border:`1px solid ${assigned?cl.navy:cl.borderLight}`, background:assigned?cl.navyWash:"transparent",
                marginBottom:6, transition:"all 0.15s",
              }} onMouseEnter={e=>{if(!assigned)e.currentTarget.style.borderColor=cl.navy}} onMouseLeave={e=>{if(!assigned)e.currentTarget.style.borderColor=cl.borderLight}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:cl.bg,border:`1px solid ${cl.borderLight}`,display:"flex",alignItems:"center",justifyContent:"center",...mono(11),color:cl.ink40,flexShrink:0}}>{(u.name||u.email)[0].toUpperCase()}</div>
                <div style={{flex:1,marginLeft:12}}><div style={{...ui(14,500),color:cl.ink}}>{u.name}</div><div style={{...ui(12,300),color:cl.ink40}}>{u.email}</div></div>
                <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${assigned?cl.navy:cl.border}`,background:assigned?cl.navy:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {assigned && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{padding:"16px 28px",borderTop:`1px solid ${cl.borderLight}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{...mono(8),color:cl.ink20}}>{(shareModal.assignedUsers||[]).length} user{(shareModal.assignedUsers||[]).length!==1?"s":""} assigned</span>
          <button onClick={()=>setShareModal(null)} style={{padding:"8px 20px",background:cl.ink,color:cl.bg,border:"none",...mono(10),cursor:"pointer"}}>Done</button>
        </div>
      </div></>)}
    </div>
  );
}

// ─── Seller Screens ──────────────────────────────────────────

function AudienceSetup({ onNext, stage, companyName, setCompanyName, persona, setPersona }) {
  const cl = c(); const ok = companyName.trim().length>0 && persona;
  return (
    <div style={{ height:"100%", overflow:"auto", background:cl.bg, padding:"48px 40px" }}>
      <div style={{ maxWidth:540, margin:"0 auto" }}>
        <span style={{...mono(10),padding:"3px 10px",background:cl.navyWash,color:cl.navy,marginBottom:12,display:"inline-block"}}>{stage.name}</span>
        <h2 style={{...ds(34),color:cl.ink,marginBottom:8}}>Who is your audience?</h2>
        <p style={{...ui(16,300),color:cl.ink60,marginBottom:40}}>Set the context for this performance.</p>
        <div style={{marginBottom:32}}><label style={{...mono(10),color:cl.ink40,display:"block",marginBottom:10}}>Company Name</label><input type="text" value={companyName} onChange={e=>setCompanyName(e.target.value)} style={{width:"100%",padding:"14px 16px",border:`1px solid ${cl.border}`,background:cl.surface,...ui(18),color:cl.ink,outline:"none"}} onFocus={e=>e.target.style.borderColor=cl.navy} onBlur={e=>e.target.style.borderColor=cl.border}/></div>
        <div style={{marginBottom:48}}><label style={{...mono(10),color:cl.ink40,display:"block",marginBottom:10}}>Their Role</label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{PERSONAS.map(pp=>{const s=persona===pp.id;return(<div key={pp.id} onClick={()=>setPersona(pp.id)} style={{padding:"18px 20px",border:`1px solid ${s?cl.navy:cl.borderLight}`,background:s?cl.navyWash:cl.surface,cursor:"pointer",transition:"all 0.2s"}}><div style={{...ui(16,500),color:s?cl.navy:cl.ink,marginBottom:3}}>{pp.label}</div><div style={{...ui(13,300),color:cl.ink60}}>{pp.focus}</div></div>)})}</div></div>
        <div style={{display:"flex",justifyContent:"flex-end"}}><button onClick={onNext} disabled={!ok} style={{padding:"14px 32px",background:ok?cl.ink:cl.border,color:ok?cl.bg:cl.ink40,border:"none",...mono(11),cursor:ok?"pointer":"not-allowed"}}>Continue</button></div>
      </div>
    </div>
  );
}

function CueSelect({ stage, companyName, onSelect }) {
  const cl = c(); const cues = (stage.cues||[]).filter(v=>v.shellHtml||v.jsxCode);
  return (
    <div style={{height:"100%",overflow:"auto",background:cl.bg,padding:"48px 40px"}}>
      <div style={{maxWidth:540,margin:"0 auto"}}>
        <span style={{...mono(10),padding:"3px 10px",background:cl.navyWash,color:cl.navy,marginBottom:12,display:"inline-block"}}>{stage.name}</span>
        <h2 style={{...ds(34),color:cl.ink,marginBottom:8}}>Select Cue</h2>
        <p style={{...ui(16,300),color:cl.ink60,marginBottom:40}}>Choose which version to perform for {companyName}.</p>
        {cues.map(v=>(<div key={v.id} onClick={()=>onSelect(v)} style={{padding:"22px 26px",border:`1px solid ${cl.borderLight}`,background:cl.surface,cursor:"pointer",marginBottom:10,transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=cl.navy} onMouseLeave={e=>e.currentTarget.style.borderColor=cl.borderLight}><div style={{...ds(22),color:cl.ink,marginBottom:4}}>{v.name}</div>{v.banner && <p style={{...ui(13,300),color:cl.gold}}>{v.banner}</p>}</div>))}
        {cues.length===0 && <div style={{padding:32,border:`1px dashed ${cl.border}`,textAlign:"center"}}><p style={{...ui(15,300),color:cl.ink40}}>No designed cues</p></div>}
      </div>
    </div>
  );
}

// ─── Pointer Settings ────────────────────────────────────────

const DEFAULT_POINTER = {
  penColor: "#C4A855",
  penWidth: 3,
  spotlightRadius: 120,
  fadeSeconds: 4,
  hotkeys: { toggle: "p", pen: "d", spotlight: "s", undo: "z", clear: "c" },
};

const PEN_COLORS = [
  { label:"Gold", hex:"#C4A855" },
  { label:"Navy", hex:"#5A6A7C" },
  { label:"Coral", hex:"#C47070" },
  { label:"Matcha", hex:"#4A6A48" },
  { label:"Ink", hex:"#1A1A1A" },
  { label:"White", hex:"#FFFFFF" },
];

function PointerSettings({ config, onChange }) {
  const cl = c();
  const update = (k, v) => onChange({ ...config, [k]: v });
  const updateHotkey = (k, v) => onChange({ ...config, hotkeys: { ...config.hotkeys, [k]: v } });

  return (
    <div style={{ height:"100%", overflow:"auto", background:cl.bg, padding:"48px 40px" }}>
      <div style={{ maxWidth:500, margin:"0 auto" }}>
        <h2 style={{ ...ds(32), color:cl.ink, marginBottom:8 }}>Pointer</h2>
        <p style={{ ...ui(16,300), color:cl.ink60, marginBottom:40 }}>Annotate and spotlight during live performances. Activate with <kbd style={{ ...mono(10), padding:"2px 6px", background:cl.surface, border:`1px solid ${cl.borderLight}` }}>{config.hotkeys.toggle.toUpperCase()}</kbd> during Perform.</p>

        {/* Pen Color */}
        <div style={{ padding:"24px 28px", background:cl.surface, border:`1px solid ${cl.borderLight}`, marginBottom:16 }}>
          <div style={{ ...mono(9), color:cl.ink40, marginBottom:14 }}>Pen Color</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {PEN_COLORS.map(pc => (
              <div key={pc.hex} onClick={() => update("penColor", pc.hex)} style={{
                width:36, height:36, borderRadius:"50%", background:pc.hex,
                border:`2px solid ${config.penColor === pc.hex ? cl.ink : cl.borderLight}`,
                cursor:"pointer", transition:"all 0.15s",
                boxShadow: config.penColor === pc.hex ? `0 0 0 3px ${cl.navyWash}` : "none",
                ...(pc.hex === "#FFFFFF" ? { border:`2px solid ${config.penColor === pc.hex ? cl.ink : cl.border}` } : {}),
              }} title={pc.label}/>
            ))}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:8 }}>
              <input type="color" value={config.penColor} onChange={e => update("penColor", e.target.value)} style={{ width:36, height:36, border:"none", padding:0, cursor:"pointer", background:"none" }}/>
              <span style={{ ...ui(12,300), color:cl.ink40 }}>Custom</span>
            </div>
          </div>
        </div>

        {/* Pen Width */}
        <div style={{ padding:"24px 28px", background:cl.surface, border:`1px solid ${cl.borderLight}`, marginBottom:16 }}>
          <div style={{ ...mono(9), color:cl.ink40, marginBottom:14 }}>Pen Width</div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <input type="range" min="1" max="12" step="1" value={config.penWidth} onChange={e => update("penWidth", parseInt(e.target.value))} style={{ flex:1, accentColor:cl.navy }}/>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", width:48 }}>
              <div style={{ width:config.penWidth * 3, height:config.penWidth * 3, borderRadius:"50%", background:config.penColor, border:config.penColor==="#FFFFFF"?`1px solid ${cl.border}`:"none" }}/>
            </div>
            <span style={{ ...mono(10), color:cl.ink60, width:24, textAlign:"right" }}>{config.penWidth}</span>
          </div>
        </div>

        {/* Spotlight */}
        <div style={{ padding:"24px 28px", background:cl.surface, border:`1px solid ${cl.borderLight}`, marginBottom:16 }}>
          <div style={{ ...mono(9), color:cl.ink40, marginBottom:14 }}>Spotlight Radius</div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <input type="range" min="60" max="300" step="10" value={config.spotlightRadius} onChange={e => update("spotlightRadius", parseInt(e.target.value))} style={{ flex:1, accentColor:cl.navy }}/>
            <span style={{ ...mono(10), color:cl.ink60 }}>{config.spotlightRadius}px</span>
          </div>
        </div>

        {/* Fade */}
        <div style={{ padding:"24px 28px", background:cl.surface, border:`1px solid ${cl.borderLight}`, marginBottom:16 }}>
          <div style={{ ...mono(9), color:cl.ink40, marginBottom:14 }}>Auto-fade</div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <input type="range" min="1" max="15" step="1" value={config.fadeSeconds} onChange={e => update("fadeSeconds", parseInt(e.target.value))} style={{ flex:1, accentColor:cl.navy }}/>
            <span style={{ ...mono(10), color:cl.ink60 }}>{config.fadeSeconds}s</span>
          </div>
          <p style={{ ...ui(12,300), color:cl.ink20, marginTop:8 }}>Strokes dissolve after this duration. Double-click a stroke to pin it.</p>
        </div>

        {/* Hotkeys */}
        <div style={{ padding:"24px 28px", background:cl.surface, border:`1px solid ${cl.borderLight}`, marginBottom:16 }}>
          <div style={{ ...mono(9), color:cl.ink40, marginBottom:14 }}>Hotkeys</div>
          {[
            { key:"toggle", label:"Toggle Pointer" },
            { key:"pen", label:"Pen Tool" },
            { key:"spotlight", label:"Spotlight" },
            { key:"undo", label:"Undo" },
            { key:"clear", label:"Clear All" },
          ].map(hk => (
            <div key={hk.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${cl.borderLight}` }}>
              <span style={{ ...ui(14,400), color:cl.ink80 }}>{hk.label}</span>
              <input type="text" value={config.hotkeys[hk.key].toUpperCase()} maxLength={1}
                onChange={e => { const v = e.target.value.toLowerCase(); if (v.length === 1 && /[a-z]/.test(v)) updateHotkey(hk.key, v); }}
                style={{ width:40, textAlign:"center", padding:"6px 0", border:`1px solid ${cl.border}`, background:cl.bg, ...mono(12), color:cl.ink, outline:"none" }}
                onFocus={e => e.target.style.borderColor = cl.navy} onBlur={e => e.target.style.borderColor = cl.border}/>
            </div>
          ))}
        </div>

        {/* Preview hint */}
        <div style={{ padding:"18px 24px", background:cl.navyWash, border:`1px solid ${cl.borderLight}` }}>
          <p style={{ ...ui(14,300), color:cl.navy }}>During Perform, press <kbd style={{ ...mono(10), padding:"1px 5px", background:cl.surface, border:`1px solid ${cl.borderLight}` }}>{config.hotkeys.toggle.toUpperCase()}</kbd> to activate the pointer toolbar. A floating bar will appear with pen and spotlight tools.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Pointer Overlay (Performance mode) ──────────────────────

function PointerOverlay({ config, onExit }) {
  const canvasRef = useRef(null);
  const [active, setActive] = useState(false);
  const [tool, setTool] = useState("pen"); // "pen" | "spotlight"
  const [drawing, setDrawing] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const strokesRef = useRef([]);
  const currentStroke = useRef(null);
  const animRef = useRef(null);
  const [, forceRender] = useState(0);
  const [barHover, setBarHover] = useState(false);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => { canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr; };
    resize(); window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Hotkey handler
  useEffect(() => {
    const handleKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === config.hotkeys.toggle) { setActive(a => !a); e.preventDefault(); }
      if (!active) return;
      if (k === config.hotkeys.pen) { setTool("pen"); e.preventDefault(); }
      if (k === config.hotkeys.spotlight) { setTool("spotlight"); e.preventDefault(); }
      if (k === config.hotkeys.undo) { strokesRef.current.pop(); e.preventDefault(); }
      if (k === config.hotkeys.clear) { strokesRef.current = []; e.preventDefault(); }
      if (k === "escape") { setActive(false); e.preventDefault(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, config.hotkeys]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const render = () => {
      const w = window.innerWidth; const h = window.innerHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (!active) { animRef.current = requestAnimationFrame(render); return; }

      const now = Date.now();
      const fadeMs = config.fadeSeconds * 1000;

      // Draw spotlight
      if (tool === "spotlight") {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        const grad = ctx.createRadialGradient(mousePos.x, mousePos.y, 0, mousePos.x, mousePos.y, config.spotlightRadius);
        grad.addColorStop(0, "rgba(0,0,0,1)");
        grad.addColorStop(0.7, "rgba(0,0,0,0.8)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, config.spotlightRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw strokes
      strokesRef.current = strokesRef.current.filter(s => s.pinned || (now - s.timestamp < fadeMs));
      strokesRef.current.forEach(stroke => {
        if (stroke.points.length < 2) return;
        const age = now - stroke.timestamp;
        const fadeRatio = stroke.pinned ? 1 : Math.max(0, 1 - age / fadeMs);
        const alpha = fadeRatio;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Crayon texture: draw main path + offset path
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();

        // Texture offset
        ctx.globalAlpha = alpha * 0.3;
        ctx.lineWidth = stroke.width * 0.5;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x + 0.5, stroke.points[0].y + 0.8);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x + 0.5, stroke.points[i].y + 0.8);
        }
        ctx.stroke();

        // Glow
        ctx.globalAlpha = alpha * 0.15;
        ctx.lineWidth = stroke.width * 3;
        ctx.filter = "blur(4px)";
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        ctx.filter = "none";

        ctx.restore();
      });

      // Current stroke being drawn
      if (currentStroke.current && currentStroke.current.points.length > 1) {
        const s = currentStroke.current;
        ctx.save();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) {
          ctx.lineTo(s.points[i].x, s.points[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [active, tool, mousePos, config]);

  const handleMouseDown = (e) => {
    if (!active || tool !== "pen") return;
    setDrawing(true);
    currentStroke.current = { points: [{ x: e.clientX, y: e.clientY }], color: config.penColor, width: config.penWidth, timestamp: Date.now(), pinned: false };
  };

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (drawing && currentStroke.current) {
      currentStroke.current.points.push({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (drawing && currentStroke.current && currentStroke.current.points.length > 1) {
      strokesRef.current.push({ ...currentStroke.current, timestamp: Date.now() });
    }
    currentStroke.current = null;
    setDrawing(false);
  };

  const handleDblClick = (e) => {
    // Pin nearest stroke
    const strokes = strokesRef.current;
    for (let i = strokes.length - 1; i >= 0; i--) {
      const s = strokes[i];
      for (const p of s.points) {
        if (Math.abs(p.x - e.clientX) < 20 && Math.abs(p.y - e.clientY) < 20) {
          strokes[i].pinned = !strokes[i].pinned;
          forceRender(n => n + 1);
          return;
        }
      }
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDblClick}
        style={{
          position: "fixed", inset: 0, zIndex: 250,
          pointerEvents: active ? "auto" : "none",
          cursor: active ? (tool === "pen" ? "crosshair" : "none") : "default",
          width: "100%", height: "100%",
        }}
      />
      {/* Unified ghost bar — nearly invisible until needed */}
      <div
        onMouseEnter={() => setBarHover(true)}
        onMouseLeave={() => setBarHover(false)}
        style={{
          position: "fixed", bottom: 12, left: 12, zIndex: 260,
          display: "flex", alignItems: "center", gap: 0,
          transition: "opacity 0.3s",
        }}
      >
        {/* Exit mark */}
        <div onClick={onExit} title="Return to Omote" style={{
          padding: "8px 10px", cursor: "pointer",
          opacity: active ? 0.9 : barHover ? 0.7 : 0.1,
          transition: "opacity 0.3s",
          display: "flex", alignItems: "center",
        }}>
          <SmallMark size={18}/>
        </div>

        {/* Tool tray */}
        <div style={{
          display: "flex", alignItems: "center", gap: 2,
          padding: "5px 10px",
          background: "rgba(26,26,26,0.8)",
          backdropFilter: "blur(8px)",
          borderRadius: 6,
          opacity: (active || barHover) ? 1 : 0,
          pointerEvents: (active || barHover) ? "auto" : "none",
          transition: "opacity 0.3s",
          maxHeight: 36,
        }}>
          <button onClick={() => { setActive(a => !a); }} style={{
            padding: "4px 8px", border: "none", borderRadius: 3,
            background: active ? "rgba(255,255,255,0.1)" : "transparent",
            color: active ? "#fff" : "rgba(255,255,255,0.7)",
            ...mono(8), cursor: "pointer", whiteSpace: "nowrap",
          }}>
            {active ? "ON" : "OFF"}
          </button>

          {active && <>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)", margin: "0 3px" }}/>
            <button onClick={() => setTool("pen")} style={{
              padding: "4px 8px", border: "none", borderRadius: 3,
              background: tool === "pen" ? "rgba(255,255,255,0.15)" : "transparent",
              color: "#fff", ...mono(8), cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: config.penColor, border: config.penColor === "#FFFFFF" ? "1px solid rgba(255,255,255,0.3)" : "none" }}/>
              {config.hotkeys.pen.toUpperCase()}
            </button>
            <button onClick={() => setTool("spotlight")} style={{
              padding: "4px 8px", border: "none", borderRadius: 3,
              background: tool === "spotlight" ? "rgba(255,255,255,0.15)" : "transparent",
              color: "#fff", ...mono(8), cursor: "pointer",
            }}>
              {config.hotkeys.spotlight.toUpperCase()}
            </button>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)", margin: "0 3px" }}/>
            <button onClick={() => { strokesRef.current.pop(); forceRender(n => n + 1); }} style={{ padding: "4px 6px", border: "none", borderRadius: 3, background: "transparent", color: "rgba(255,255,255,0.5)", ...mono(7), cursor: "pointer" }}>
              {config.hotkeys.undo.toUpperCase()}
            </button>
            <button onClick={() => { strokesRef.current = []; forceRender(n => n + 1); }} style={{ padding: "4px 6px", border: "none", borderRadius: 3, background: "transparent", color: "rgba(255,255,255,0.5)", ...mono(7), cursor: "pointer" }}>
              {config.hotkeys.clear.toUpperCase()}
            </button>
          </>}
        </div>
      </div>
    </>
  );
}

// ─── Storyteller Settings ─────────────────────────────────────

function StorytellerSettings({ stages }) {
  const cl = c();
  const activeStages = stages.filter(s => s.cues?.some(c => (c.notes || []).length > 0));
  return (
    <div style={{ height:"100%", overflow:"auto", background:cl.bg, padding:"48px 40px" }}>
      <div style={{ maxWidth:560, margin:"0 auto" }}>
        <h2 style={{ ...ds(32), color:cl.ink, marginBottom:8 }}>Storyteller</h2>
        <p style={{ ...ui(16,300), color:cl.ink60, marginBottom:32 }}>Speaker notes visible only to you during Perform. Your audience never sees them.</p>

        <div style={{ padding:"24px 28px", background:cl.surface, border:`1px solid ${cl.borderLight}`, marginBottom:20 }}>
          <div style={{ ...mono(9), color:cl.ink40, marginBottom:14 }}>How It Works</div>
          <div style={{ display:"flex", gap:16, marginBottom:16 }}>
            {[
              { step:"1", label:"Add Notes", desc:"Write talking points per cue in the Notes tab of any stage" },
              { step:"2", label:"Install Companion", desc:"Add the Omote Companion Chrome extension" },
              { step:"3", label:"Perform", desc:"Notes appear in the extension side panel — invisible to screen share" },
            ].map(s => (
              <div key={s.step} style={{ flex:1 }}>
                <div style={{ width:24, height:24, borderRadius:"50%", background:cl.navyWash, display:"flex", alignItems:"center", justifyContent:"center", ...mono(10), color:cl.navy, marginBottom:8 }}>{s.step}</div>
                <div style={{ ...ui(13,500), color:cl.ink, marginBottom:3 }}>{s.label}</div>
                <div style={{ ...ui(12,300), color:cl.ink60 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:"24px 28px", background:cl.navyWash, border:`1px solid ${cl.borderLight}`, marginBottom:20 }}>
          <div style={{ ...mono(9), color:cl.navy, marginBottom:10 }}>Omote Companion Extension</div>
          <p style={{ ...ui(14,300), color:cl.ink60, marginBottom:14 }}>The companion opens a side panel in Chrome that displays your speaker notes during Perform. When you share a tab in Zoom or Teams, the side panel is not captured.</p>
          <button disabled style={{ padding:"10px 20px", background:cl.border, color:cl.ink40, border:"none", ...mono(9), cursor:"not-allowed" }}>Install Extension — Coming Soon</button>
        </div>

        <div style={{ padding:"24px 28px", background:cl.surface, border:`1px solid ${cl.borderLight}`, marginBottom:20 }}>
          <div style={{ ...mono(9), color:cl.ink40, marginBottom:10 }}>Live Broadcasting</div>
          <p style={{ ...ui(14,300), color:cl.ink60, marginBottom:8 }}>During Perform, Omote broadcasts your session state. The companion extension listens automatically.</p>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:8, height:8, borderRadius:"50%", background:cl.matcha }}/><span style={{ ...ui(13,400), color:cl.matcha }}>Broadcasting is automatic during Perform</span></div>
        </div>

        <div style={{ padding:"24px 28px", background:cl.surface, border:`1px solid ${cl.borderLight}` }}>
          <div style={{ ...mono(9), color:cl.ink40, marginBottom:14 }}>Your Notes</div>
          {activeStages.length === 0 && <p style={{ ...ui(14,300), color:cl.ink40 }}>No speaker notes yet. Add them in the Notes tab when editing a stage.</p>}
          {activeStages.map(s => (
            <div key={s.id} style={{ marginBottom:16 }}>
              <div style={{ ...ui(15,500), color:cl.ink, marginBottom:6, display:"flex", alignItems:"center", gap:8 }}><OIcon name={s.icon||"cube"} size={16} color={cl.navy}/>{s.name}</div>
              {(s.cues||[]).filter(c=>(c.notes||[]).length>0).map(c => (
                <div key={c.id} style={{ marginLeft:24, padding:"6px 0", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ ...ui(13,400), color:cl.ink60 }}>{c.name}</span>
                  <span style={{ ...mono(8), color:cl.ink20 }}>{c.notes.length} note{c.notes.length!==1?"s":""}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Performance({ stage, cue, companyName, onExit, pointerConfig }) {
  // BroadcastChannel — emits session state for companion extension
  const channelRef = useRef(null);
  const [noteStep, setNoteStep] = useState(0);
  const notes = cue.notes || [];

  useEffect(() => {
    const ch = new BroadcastChannel("omote-storyteller");
    channelRef.current = ch;
    // Broadcast initial state
    ch.postMessage({ type:"session-start", stage:stage.name, cue:cue.name, company:companyName, notes, noteStep:0, timestamp:Date.now() });
    return () => { ch.postMessage({ type:"session-end" }); ch.close(); };
  }, []);

  useEffect(() => {
    if (channelRef.current) {
      channelRef.current.postMessage({ type:"note-update", noteStep, note: notes[noteStep] || null, total: notes.length, cue: cue.name, timestamp: Date.now() });
    }
  }, [noteStep]);

  // Arrow keys advance notes
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { setNoteStep(s => Math.min(s + 1, notes.length - 1)); e.preventDefault(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { setNoteStep(s => Math.max(s - 1, 0)); e.preventDefault(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [notes.length]);

  return (
    <div style={{position:"fixed",inset:0,display:"flex",flexDirection:"column",zIndex:200,background:"#fff"}}>
      <div style={{flex:1}}><StageFrame content={cue.jsxCode||cue.shellHtml} contentType={cue.jsxCode?"jsx":"html"} data={stage.csvData} company={companyName} banner={cue.banner}/></div>
      <PointerOverlay config={pointerConfig} onExit={onExit}/>
    </div>
  );
}

// ─── Help ────────────────────────────────────────────────────

function HelpPage({ onTutorial }) {
  const cl = c();
  return (
    <div style={{ height:"100%", overflow:"auto", background:cl.bg, padding:"48px 40px" }}>
      <div style={{ maxWidth:540, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <StageMark size={44}/>
          <h2 style={{ ...ds(30), marginTop:12, marginBottom:4 }}>Welcome to Omote</h2>
          <p style={{ ...ui(14,300), color:WARM, fontStyle:"italic" }}>表 — "surface," "front," "the public face"</p>
        </div>

        <div style={{ ...ui(15,300), color:cl.ink80, lineHeight:1.7, marginBottom:28 }}>
          <p style={{ marginBottom:16 }}>Omote is a stage designer for product demonstrations. Build immersive, data-driven demo environments that adapt to your audience — without touching the production product.</p>
        </div>

        <div style={{ padding:"20px 24px", background:cl.surface, border:`1px solid ${cl.borderLight}`, marginBottom:16 }}>
          <div style={{ ...mono(9), color:cl.ink40, marginBottom:12 }}>Key Concepts</div>
          <div style={{ marginBottom:12 }}><span style={{ ...ui(14,500), color:cl.ink }}>Stage</span><span style={{ ...ui(14,300), color:cl.ink60 }}> — A demo environment with its own data, design, and audience context.</span></div>
          <div style={{ marginBottom:12 }}><span style={{ ...ui(14,500), color:cl.ink }}>Set</span><span style={{ ...ui(14,300), color:cl.ink60 }}> — The visual shell your audience sees. Built from HTML or JSX.</span></div>
          <div style={{ marginBottom:12 }}><span style={{ ...ui(14,500), color:cl.ink }}>Cue</span><span style={{ ...ui(14,300), color:cl.ink60 }}> — A named version of the set. Each cue can have its own banner and speaker notes.</span></div>
          <div style={{ marginBottom:12 }}><span style={{ ...ui(14,500), color:cl.ink }}>Pointer</span><span style={{ ...ui(14,300), color:cl.ink60 }}> — Pen and spotlight annotations during live performance. Visible to your audience via screen share.</span></div>
          <div><span style={{ ...ui(14,500), color:cl.ink }}>Storyteller</span><span style={{ ...ui(14,300), color:cl.ink60 }}> — Speaker notes visible only to you via the Companion extension. Invisible to screen share.</span></div>
        </div>

        <div style={{ padding:"20px 24px", background:cl.surface, border:`1px solid ${cl.borderLight}`, marginBottom:16 }}>
          <div style={{ ...mono(9), color:cl.ink40, marginBottom:12 }}>Workflow</div>
          {["Create a Stage — name it, choose an icon, add a description.",
            "Upload Data — CSV with column headers. Or skip if your HTML has its own.",
            "Build the Set — import HTML or JSX. The set is your demo's visual shell.",
            "Create Cues — name your first cue from the set. Add more for different audiences.",
            "Add Notes — speaker notes per cue for the Storyteller companion.",
            "Publish — make the stage available for performance.",
            "Perform — full-screen immersive demo with pointer and storyteller."
          ].map((step, i) => (
            <div key={i} style={{ display:"flex", gap:12, marginBottom:10 }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:cl.navyWash, display:"flex", alignItems:"center", justifyContent:"center", ...mono(9), color:cl.navy, flexShrink:0, marginTop:1 }}>{i+1}</div>
              <span style={{ ...ui(14,300), color:cl.ink80 }}>{step}</span>
            </div>
          ))}
        </div>

        <div style={{ padding:"20px 24px", background:cl.goldWash, border:"1px solid rgba(140,122,60,0.15)", marginBottom:16 }}>
          <p style={{ ...ui(14,400), color:cl.gold, marginBottom:4 }}>This is a public alpha prototype.</p>
          <p style={{ ...ui(13,300), color:cl.gold }}>Some features are still in development. Stages persist via Supabase.</p>
        </div>

        <button onClick={onTutorial} style={{ width:"100%", padding:"14px 0", background:cl.ink, color:cl.bg, border:"none", ...mono(10), cursor:"pointer" }}>Start Tutorial Stage</button>
      </div>
    </div>
  );
}

// ─── Settings + Users ────────────────────────────────────────

function PersonalSettings({ user, themeMode, setThemeMode }) {
  const cl = c();
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState(null); const [pwErr, setPwErr] = useState(null); const [pwBusy, setPwBusy] = useState(false);

  const changePassword = async () => {
    setPwErr(null); setPwMsg(null);
    if (pw.length < 6) { setPwErr("Password must be at least 6 characters"); return; }
    if (pw !== pw2) { setPwErr("Passwords do not match"); return; }
    setPwBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setPwMsg("Password updated successfully");
      setPw(""); setPw2("");
    } catch(e) { setPwErr(e.message); }
    setPwBusy(false);
  };

  return (
    <div style={{height:"100%",overflow:"auto",background:cl.bg,padding:"48px 40px"}}>
      <div style={{maxWidth:500,margin:"0 auto"}}>
        <h2 style={{...ds(32),color:cl.ink,marginBottom:8}}>Settings</h2>
        <p style={{...ui(16,300),color:cl.ink60,marginBottom:40}}>Personal preferences for {user?.name}.</p>

        {/* Display */}
        <div style={{padding:"24px 28px",background:cl.surface,border:`1px solid ${cl.borderLight}`,marginBottom:20}}>
          <div style={{...mono(9),color:cl.ink40,marginBottom:12}}>Display</div>
          <div style={{display:"flex",gap:10}}>{["light","dark"].map(m=>(<button key={m} onClick={()=>setThemeMode(m)} style={{flex:1,padding:"14px 0",background:themeMode===m?(m==="dark"?"#1A1A1A":cl.surface):"transparent",border:`1px solid ${themeMode===m?cl.navy:cl.borderLight}`,...mono(10),color:themeMode===m?(m==="dark"?"#E8E4DC":cl.navy):cl.ink40,cursor:"pointer"}}>{m==="light"?"☀ Light":"☾ Dark"}</button>))}</div>
        </div>

        {/* Change Password */}
        <div style={{padding:"24px 28px",background:cl.surface,border:`1px solid ${cl.borderLight}`,marginBottom:20}}>
          <div style={{...mono(9),color:cl.ink40,marginBottom:12}}>Change Password</div>
          <div style={{marginBottom:12}}>
            <label style={{...mono(9),color:cl.ink40,display:"block",marginBottom:5}}>New Password</label>
            <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setPwErr(null);setPwMsg(null)}} style={{width:"100%",padding:"10px 12px",border:`1px solid ${cl.border}`,background:cl.bg,...ui(15),color:cl.ink,outline:"none"}} onFocus={e=>e.target.style.borderColor=cl.navy} onBlur={e=>e.target.style.borderColor=cl.border}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{...mono(9),color:cl.ink40,display:"block",marginBottom:5}}>Confirm Password</label>
            <input type="password" value={pw2} onChange={e=>{setPw2(e.target.value);setPwErr(null);setPwMsg(null)}} onKeyDown={e=>{if(e.key==="Enter"&&pw&&pw2)changePassword()}} style={{width:"100%",padding:"10px 12px",border:`1px solid ${cl.border}`,background:cl.bg,...ui(15),color:cl.ink,outline:"none"}} onFocus={e=>e.target.style.borderColor=cl.navy} onBlur={e=>e.target.style.borderColor=cl.border}/>
          </div>
          {pwErr && <div style={{padding:"8px 12px",marginBottom:12,background:"rgba(139,77,77,0.06)",border:"1px solid rgba(139,77,77,0.15)",...ui(13),color:"#8B4D4D"}}>{pwErr}</div>}
          {pwMsg && <div style={{padding:"8px 12px",marginBottom:12,background:`${cl.matcha}10`,border:`1px solid ${cl.matcha}30`,...ui(13),color:cl.matcha}}>{pwMsg}</div>}
          <button onClick={changePassword} disabled={!pw||!pw2||pwBusy} style={{padding:"10px 24px",background:(pw&&pw2)?cl.ink:cl.border,color:(pw&&pw2)?cl.bg:cl.ink40,border:"none",...mono(10),cursor:(pw&&pw2&&!pwBusy)?"pointer":"not-allowed"}}>{pwBusy?"Updating...":"Update Password"}</button>
        </div>

        {/* Account info */}
        <div style={{padding:"24px 28px",background:cl.surface,border:`1px solid ${cl.borderLight}`}}>
          <div style={{...mono(9),color:cl.ink40,marginBottom:12}}>Account</div>
          <div style={{display:"flex",gap:24}}>
            <div><div style={{...mono(8),color:cl.ink20,marginBottom:3}}>Email</div><div style={{...ui(14,400),color:cl.ink80}}>{user?.email}</div></div>
            <div><div style={{...mono(8),color:cl.ink20,marginBottom:3}}>Role</div><div style={{...ui(14,400),color:cl.ink80}}>{user?.role}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TEST_USER = { id:"test-user-000", name:"Test User", email:"test@omote.internal", role:"user" };

function Users({ users, onRefresh, currentUserId, onImpersonate }) {
  const cl = c(); const [show,setShow]=useState(false); const [nn,setNn]=useState(""); const [ne,setNe]=useState(""); const [np,setNp]=useState(""); const [nr,setNr]=useState("user"); const [err,setErr]=useState(null); const [busy,setBusy]=useState(false);
  const add = async () => {
    if(!ne||!np) return; setBusy(true); setErr(null);
    try {
      await db.signUp(ne.trim(), np, nn || ne.split("@")[0], nr);
      setShow(false); setNn(""); setNe(""); setNp(""); setNr("user");
      onRefresh();
    } catch(e) { setErr(e.message); }
    setBusy(false);
  };
  const remove = async (uid) => {
    if(uid === currentUserId) return;
    try { await db.deleteProfile(uid); onRefresh(); } catch(e) { console.error(e); }
  };

  const allUsers = [TEST_USER, ...users];

  return (
    <div style={{height:"100%",overflow:"auto",background:cl.bg}}>
      <div style={{maxWidth:640,margin:"0 auto",padding:"48px 40px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:32}}><h2 style={{...ds(34),color:cl.ink}}>Users</h2>{!show && <button onClick={()=>setShow(true)} style={{padding:"9px 20px",background:cl.ink,color:cl.bg,border:"none",...mono(10),cursor:"pointer"}}>Invite User</button>}</div>
        {show && <div className="fadein" style={{padding:24,background:cl.surface,border:`1px solid ${cl.borderLight}`,marginBottom:24}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div><label style={{...mono(9),color:cl.ink40,display:"block",marginBottom:5}}>Name</label><input type="text" value={nn} onChange={e=>setNn(e.target.value)} style={{width:"100%",padding:"9px 10px",border:`1px solid ${cl.border}`,background:cl.bg,...ui(15),color:cl.ink,outline:"none"}}/></div>
            <div><label style={{...mono(9),color:cl.ink40,display:"block",marginBottom:5}}>Email</label><input type="email" value={ne} onChange={e=>{setNe(e.target.value);setErr(null)}} autoFocus style={{width:"100%",padding:"9px 10px",border:`1px solid ${cl.border}`,background:cl.bg,...ui(15),color:cl.ink,outline:"none"}}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div><label style={{...mono(9),color:cl.ink40,display:"block",marginBottom:5}}>Temporary Password</label><input type="text" value={np} onChange={e=>setNp(e.target.value)} style={{width:"100%",padding:"9px 10px",border:`1px solid ${cl.border}`,background:cl.bg,...mono(12),color:cl.ink,outline:"none"}}/></div>
            <div><label style={{...mono(9),color:cl.ink40,display:"block",marginBottom:5}}>Role</label><div style={{display:"flex",border:`1px solid ${cl.border}`}}>{["admin","user"].map(r=><button key={r} onClick={()=>setNr(r)} style={{flex:1,padding:"9px 0",background:nr===r?cl.navyWash:cl.bg,border:"none",...mono(10),color:nr===r?cl.navy:cl.ink40,cursor:"pointer"}}>{r}</button>)}</div></div>
          </div>
          {err && <div style={{padding:"8px 12px",marginBottom:12,background:"rgba(139,77,77,0.06)",border:"1px solid rgba(139,77,77,0.15)",...ui(13),color:"#8B4D4D"}}>{err}</div>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setShow(false);setErr(null)}} style={{flex:1,padding:"9px 0",background:"none",border:`1px solid ${cl.border}`,...mono(10),color:cl.ink40,cursor:"pointer"}}>Cancel</button>
            <button onClick={add} disabled={!ne||!np||busy} style={{flex:1,padding:"9px 0",background:(ne&&np)?cl.ink:cl.border,color:(ne&&np)?cl.bg:cl.ink40,border:"none",...mono(10),cursor:(ne&&np&&!busy)?"pointer":"not-allowed"}}>{busy?"Creating...":"Create & Invite"}</button>
          </div>
        </div>}
        {allUsers.map((u,i)=>{
          const isTestUser = u.id === TEST_USER.id;
          const isSelf = u.id === currentUserId;
          return (
            <div key={u.id} style={{display:"flex",alignItems:"center",padding:"14px 20px",background:i%2===0?cl.surface:"transparent",border:`1px solid ${isTestUser?`${cl.navy}30`:cl.borderLight}`,borderTop:i===0?undefined:"none"}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:isTestUser?cl.goldWash:u.role==="admin"?cl.navyWash:cl.bg,border:`1px solid ${cl.borderLight}`,display:"flex",alignItems:"center",justifyContent:"center",...mono(11),color:isTestUser?cl.gold:u.role==="admin"?cl.navy:cl.ink40,flexShrink:0}}>{isTestUser?"T":(u.name||u.email)[0].toUpperCase()}</div>
              <div style={{flex:1,marginLeft:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{...ui(15,500),color:cl.ink}}>{u.name}</span>
                  <span style={{...mono(8),padding:"1px 6px",background:isTestUser?cl.goldWash:u.role==="admin"?cl.navyWash:cl.bg,color:isTestUser?cl.gold:u.role==="admin"?cl.navy:cl.ink40,border:`1px solid ${cl.borderLight}`}}>{isTestUser?"test":u.role}</span>
                  {isSelf && <span style={{...mono(7),color:cl.ink20}}>You</span>}
                </div>
                <div style={{...ui(13,300),color:cl.ink40}}>{u.email}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                {onImpersonate && !isSelf && <button onClick={()=>onImpersonate(u)} style={{background:"none",border:`1px solid ${cl.borderLight}`,padding:"5px 12px",...mono(8),color:cl.ink60,cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=cl.navy;e.currentTarget.style.color=cl.navy}} onMouseLeave={e=>{e.currentTarget.style.borderColor=cl.borderLight;e.currentTarget.style.color=cl.ink60}}>View as</button>}
                {!isSelf && !isTestUser && <button onClick={()=>remove(u.id)} style={{background:"none",border:`1px solid ${cl.borderLight}`,padding:"5px 12px",...mono(8),color:cl.ink40,cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=cl.akane;e.currentTarget.style.color=cl.akane}} onMouseLeave={e=>{e.currentTarget.style.borderColor=cl.borderLight;e.currentTarget.style.color=cl.ink40}}>Remove</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────

export default function Omote() {
  const [screen, setScreen] = useState("loading");
  const [user, setUser] = useState(null);
  const [stages, setStages] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeStage, setActiveStage] = useState(null);
  const [activeCue, setActiveCue] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [persona, setPersona] = useState(null);
  const [themeMode, setThemeMode] = useState("light");
  const [showAbout, setShowAbout] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [pointerConfig, setPointerConfig] = useState(DEFAULT_POINTER);
  const [impersonating, setImpersonating] = useState(null); // null or { id, name, email, role }

  const effectiveRole = impersonating ? impersonating.role : (user?.role || "user");
  const effectiveUserId = impersonating ? impersonating.id : user?.id;
  // Filter stages when impersonating — only show assigned stages
  const visibleStages = impersonating
    ? stages.filter(s => (s.assignedUsers || []).includes(impersonating.id))
    : stages;

  // ─── Session bootstrap ───
  useEffect(() => {
    let sub;
    const init = async () => {
      const session = await db.getSession();
      if (session?.user) {
        try {
          const profile = await db.getProfile(session.user.id);
          setUser(profile);
          setScreen("hub");
          loadStages();
          if (profile.role === "admin") loadUsers();
        } catch { setScreen("login"); }
      } else {
        setScreen("login");
      }
    };
    init();
    sub = db.onAuthChange((event, session) => {
      if (event === "SIGNED_OUT") { setUser(null); setScreen("login"); setStages([]); setUsers([]); }
    });
    return () => sub?.unsubscribe();
  }, []);

  const loadStages = async () => {
    try { const s = await db.getStages(); setStages(s); } catch(e) { console.error("Failed to load stages", e); }
  };
  const loadUsers = async () => {
    try { const u = await db.getAllProfiles(); setUsers(u); } catch(e) { console.error("Failed to load users", e); }
  };

  const handleLogin = (profile) => {
    setUser(profile);
    setShowAbout(true);
    setScreen("hub");
    loadStages();
    if (profile.role === "admin") loadUsers();
    db.logActivity(profile.id, "login");
  };

  const handleLogout = async () => {
    await db.signOut();
    setUser(null); setScreen("login"); setStages([]); setUsers([]);
  };

  const goHome = () => { setActiveStage(null); setActiveCue(null); setCompanyName(""); setPersona(null); setScreen("hub"); loadStages(); };
  const isLoggedIn = screen !== "login" && screen !== "loading";
  const isPerforming = screen === "perform";
  const theme = { mode: themeMode };

  const startTutorial = () => {
    const ts = { id:"tutorial-"+Date.now(), name:"Tutorial Stage", description:"Guided walkthrough with sample data", status:"draft", icon:"compass", csvData:null, columns:[], csvFilename:null, set:{}, cues:[], isTutorial:true };
    setStages(p => [ts, ...p]); setActiveStage(ts); setShowAbout(false); setScreen("backstage");
  };

  // ─── Stage CRUD (persists to Supabase) ───
  const handleCreateStage = async (s) => {
    try {
      const id = await db.createStage(s, user.id);
      db.logActivity(user.id, "create_stage", { name: s.name });
      const full = { ...s, id, set:{}, cues:[], assignedUsers:[] };
      setStages(p => [...p, full]);
      setActiveStage(full);
      setScreen("backstage");
    } catch(e) { console.error(e); }
  };

  const handleUpdateStage = async (updated) => {
    setStages(p => p.map(s => s.id === updated.id ? updated : s));
    setActiveStage(updated);
    // Persist — skip for tutorial (no real ID)
    if (updated.id?.toString().startsWith("tutorial-")) return;
    try {
      await db.updateStage(updated.id, {
        name: updated.name, description: updated.description, icon: updated.icon,
        status: updated.status, csvData: updated.csvData, columns: updated.columns,
        csvFilename: updated.csvFilename, set: updated.set,
      });
      // Sync cues
      for (let i = 0; i < (updated.cues || []).length; i++) {
        const cue = updated.cues[i];
        const newId = await db.saveCue(updated.id, cue, i);
        if (cue.id !== newId) updated.cues[i] = { ...cue, id: newId };
      }
    } catch(e) { console.error("Save error", e); }
  };

  const handlePublish = async (p) => {
    const updated = { ...p, status: "active" };
    await handleUpdateStage(updated);
    setActiveStage(updated);
    setScreen("hub");
    loadStages();
  };

  const handleDeleteStage = async (stageId) => {
    try {
      await db.deleteStage(stageId);
      db.logActivity(user.id, "delete_stage", { stageId });
      setStages(p => p.filter(s => s.id !== stageId));
    } catch(e) { console.error(e); }
  };

  const handleShareStage = async (stageId, userId, assign) => {
    try {
      if (assign) {
        await db.assignStage(stageId, userId);
      } else {
        await db.unassignStage(stageId, userId);
      }
      // Update local state
      setStages(p => p.map(s => {
        if (s.id !== stageId) return s;
        const current = s.assignedUsers || [];
        return { ...s, assignedUsers: assign ? [...current, userId] : current.filter(id => id !== userId) };
      }));
      db.logActivity(user.id, assign ? "assign_stage" : "unassign_stage", { stageId, userId });
    } catch(e) { console.error(e); }
  };

  const handleNav = (id) => {
    if (id === "stages") goHome();
    else if (id === "settings") setScreen("personal-settings");
    else if (id === "pointer") setScreen("pointer");
    else if (id === "storyteller") setScreen("storyteller");
    else if (id === "users") setScreen("users");
    else if (id === "help") setScreen("help");
    else if (id.startsWith("stage:")) {
      const stageId = id.replace("stage:", "");
      const s = stages.find(st => st.id === stageId);
      if (s) { setActiveStage(s); setScreen("backstage"); }
    }
  };

  // Loading screen
  if (screen === "loading") return (
    <div style={{ minHeight:"100vh", background:CREAM, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{STYLES}</style>
      <div style={{ textAlign:"center" }}><StageMark size={44}/><p style={{ ...mono(10), color:WARM, marginTop:16 }}>Loading...</p></div>
    </div>
  );

  return (
    <ErrorBoundary>
      <ThemeContext.Provider value={theme}>
        <div style={{ fontFamily:"'Source Sans 3',sans-serif", color:themeMode==="dark"?DT.ink:LT.ink, ...(isLoggedIn && !isPerforming ? { display:"flex", height:"100vh", overflow:"hidden" } : {}) }}>
          <style>{STYLES}</style>

          {screen==="login" && <Login onLogin={handleLogin}/>}

          {isLoggedIn && !isPerforming && <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} screen={screen} onNavigate={handleNav} user={{...user, role:effectiveRole}} stages={visibleStages} activeStageId={activeStage?.id}/>}

          {showAbout && <AboutModal onClose={()=>setShowAbout(false)} onTutorial={startTutorial}/>}

          {isLoggedIn && !isPerforming && (
            <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
              {/* Top bar — impersonation banner + sign out */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:12, padding:"6px 20px", borderBottom:`1px solid ${themeMode==="dark"?DT.borderLight:LT.borderLight}`, background:impersonating?"rgba(139,77,77,0.06)":(themeMode==="dark"?DT.surface:LT.surface) }}>
                {impersonating && (
                  <div style={{ flex:1, display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:"#8B4D4D" }}/>
                    <span style={{ ...mono(8), color:"#8B4D4D" }}>Viewing as <strong style={{ ...ui(12,600), textTransform:"none", letterSpacing:0 }}>{impersonating.name}</strong></span>
                    <button onClick={()=>setImpersonating(null)} style={{ padding:"3px 10px", background:"rgba(139,77,77,0.1)", border:"1px solid rgba(139,77,77,0.25)", ...mono(8), color:"#8B4D4D", cursor:"pointer", marginLeft:4 }}>Exit</button>
                  </div>
                )}
                <button onClick={handleLogout} style={{ padding:"4px 12px", background:"transparent", border:`1px solid ${themeMode==="dark"?DT.borderLight:LT.borderLight}`, ...mono(8), color:themeMode==="dark"?DT.ink40:LT.ink40, cursor:"pointer" }}>Sign Out</button>
              </div>

              {screen==="hub" && <Hub stages={visibleStages} role={effectiveRole}
                users={users}
                onSelect={s=>{setActiveStage(s);setScreen("audience")}}
                onEdit={s=>{setActiveStage(s);setScreen("backstage")}}
                onCreate={handleCreateStage}
                onDelete={handleDeleteStage}
                onShare={handleShareStage}
                onTutorial={startTutorial}/>}

              {screen==="users" && <Users users={users} onRefresh={loadUsers} currentUserId={user?.id} onImpersonate={user?.role==="admin"?setImpersonating:null}/>}
              {screen==="personal-settings" && <PersonalSettings user={user} themeMode={themeMode} setThemeMode={setThemeMode}/>}
              {screen==="help" && <HelpPage onTutorial={startTutorial}/>}
              {screen==="pointer" && <PointerSettings config={pointerConfig} onChange={setPointerConfig}/>}
              {screen==="storyteller" && <StorytellerSettings stages={visibleStages}/>}

              {screen==="backstage" && activeStage && <Backstage workspace={activeStage} isTutorial={activeStage?.isTutorial}
                onUpdate={handleUpdateStage}
                onPublish={handlePublish}/>}

              {screen==="audience" && activeStage && <AudienceSetup stage={activeStage} companyName={companyName} setCompanyName={setCompanyName} persona={persona} setPersona={setPersona}
                onNext={()=>{db.logActivity(user.id,"perform",{stage:activeStage.name,company:companyName});setScreen("cue-select")}}/>}

              {screen==="cue-select" && activeStage && <CueSelect stage={activeStage} companyName={companyName}
                onSelect={v=>{setActiveCue(v);setScreen("perform")}}/>}
            </div>
          )}

          {isPerforming && activeStage && activeCue && <Performance stage={activeStage} cue={activeCue} companyName={companyName} onExit={goHome} pointerConfig={pointerConfig}/>}
        </div>
      </ThemeContext.Provider>
    </ErrorBoundary>
  );
}
