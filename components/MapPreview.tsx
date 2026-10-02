import Link from "next/link";
import { defaultProfile, encodeProfile } from "@/lib/profile";
export default function MapPreview({ moveDate }: { moveDate: string }) {
  const nodes = [
    { x: 260, y: 222, r: 70, name: ['Emirates', 'ID'], color: '#b7f3da' },
    { x: 108, y: 119, r: 44, name: ['Medical', 'fitness'], color: '#edd8ba' },
    { x: 406, y: 136, r: 51, name: ['Bank', 'account'], color: '#d8d1f4' },
    { x: 426, y: 304, r: 43, name: ['UAE Pass'], color: '#b7f3da' },
    { x: 225, y: 389, r: 47, name: ['Sign', 'lease'], color: '#c7d9f3' },
    { x: 95, y: 289, r: 38, name: ['Mobile', 'plan'], color: '#d3dfd5' },
    { x: 335, y: 62, r: 30, name: ['Arrive'], color: '#f1c7ba' },
  ];
  return <Link href={`/map?p=${encodeProfile(defaultProfile(moveDate))}`} className="preview-link" aria-label="Explore a sample relocation map">
    <div className="preview-top"><span className="preview-tag">ABU DHABI</span></div>
    <svg viewBox="0 0 520 475" className="preview-svg" aria-hidden="true">
      <defs><radialGradient id="previewHalo"><stop stopColor="#b7f3da" stopOpacity=".15" /><stop offset="1" stopColor="#b7f3da" stopOpacity="0" /></radialGradient></defs>
      <circle cx="260" cy="222" r="190" fill="url(#previewHalo)" /><circle cx="260" cy="222" r="154" className="preview-orbit" /><circle cx="260" cy="222" r="221" className="preview-orbit" />
      {nodes.slice(1).map((node) => <line key={node.x} x1="260" y1="222" x2={node.x} y2={node.y} stroke="#6a8980" strokeOpacity=".45" />)}
      {nodes.map((node, index) => <g key={index} transform={`translate(${node.x} ${node.y})`}><circle r={node.r} fill={index === 0 ? node.color : '#223c38'} stroke={node.color} strokeOpacity={index === 0 ? '1' : '.5'} /><text fill={index === 0 ? '#14362c' : node.color} textAnchor="middle" fontSize={index === 0 ? '20' : '13'} fontWeight={index === 0 ? '600' : '500'}>{node.name.map((line, i) => <tspan x="0" y={(i - (node.name.length - 1) / 2) * 20 + 5} key={line}>{line}</tspan>)}</text></g>)}
      <g transform="translate(185 295)"><rect width="151" height="30" rx="15" fill="#f6faf7" /><text x="75.5" y="19" textAnchor="middle" fill="#214739" fontSize="11">One step. More unlocked.</text></g>
    </svg>
    <div className="preview-bottom"><span>Everything connects.<br /><b>See what comes next.</b></span><span className="round-arrow">↗</span></div>
  </Link>;
}
