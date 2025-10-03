import React, { useState, useMemo } from 'react'

// HabitatDesigner.jsx
// Single-file React + Tailwind component. Default export a component that
// provides a quick interactive habitat layout canvas with presets,
// partitioning, crew scaling, rule-checking, and export of layout JSON.

export default function HabitatDesigner(){
  // Preset shapes: cylinder, sphere, rectangular (box), inflatable module (ellipsoid)
  const presets = {
    Cylinder: { w: 6, h: 8, type: 'cylinder' }, // meters: diameter x length
    Box: { w: 4, h: 6, type: 'box' }, // meters: width x length x assume height
    Sphere: { w: 5, h: 5, type: 'sphere' },
    Inflatable: { w: 8, h: 4, type: 'ellipsoid' }
  }

  const [shapeName, setShapeName] = useState('Cylinder')
  const [dimensions, setDimensions] = useState(presets['Cylinder'])
  const [crew, setCrew] = useState(4)
  const [missionDays, setMissionDays] = useState(180)
  const [zones, setZones] = useState([
    { id: 1, name: 'Sleep', area_m2: 6 },
    { id: 2, name: 'Hab', area_m2: 8 },
    { id: 3, name: 'ECLSS', area_m2: 4 },
  ])

  // Simple approximations for volume/area depending on shape.
  function computeVolumeMeters3(d){
    const w = d.w
    const h = d.h
    if(d.type === 'cylinder'){
      const r = w/2
      return Math.PI * r*r * h
    }
    if(d.type === 'sphere'){
      const r = w/2
      return (4/3)*Math.PI*r*r*r
    }
    if(d.type === 'ellipsoid'){
      const a = w/2, b = w/2, c = h/2
      return (4/3)*Math.PI*a*b*c
    }
    if(d.type === 'box'){
      // interpret as floor w x h and height 2.5 m
      return w * h * 2.5
    }
    return 0
  }

  function computeFloorArea(d){
    if(d.type === 'cylinder'){
      return Math.PI*(d.w/2)*(d.w/2)
    }
    if(d.type === 'sphere'){
      // usable floor area approximated by great circle
      return Math.PI*(d.w/2)*(d.w/2)
    }
    if(d.type === 'ellipsoid'){
      return Math.PI*(d.w/2)*(d.h/2)
    }
    if(d.type === 'box'){
      return d.w * d.h
    }
    return 0
  }

  const volume = useMemo(()=> computeVolumeMeters3(dimensions), [dimensions])
  const floorArea = useMemo(()=> computeFloorArea(dimensions), [dimensions])

  // Rule engine: suggested minimum areas per function per crew member per mission length.
  // Values are intentionally conservative for education/demo purposes.
  const rules = {
    Sleep: { min_per_crew: 4 }, // m2 per person for bunks
    Recreation: { min_per_crew: 2 },
    Exercise: { min_per_crew: 3 },
    Hygiene: { fixed_min: 3 },
    ECLSS: { fixed_min: 4 },
    Stowage: { min_per_crew_per_30days: 0.5 } // m2 per crew per 30 days
  }

  function evaluateZones(zonesArr){
    const report = []
    const zoneMap = {}
    zonesArr.forEach(z=> zoneMap[z.name] = z)

    // for each rule, check
    Object.entries(rules).forEach(([k,v])=>{
      const z = zoneMap[k]
      if(!z){
        report.push({ok:false, msg:`Missing zone: ${k}`})
        return
      }
      let required = 0
      if(v.min_per_crew) required = v.min_per_crew * crew
      if(v.min_per_crew_per_30days) required = v.min_per_crew_per_30days * crew * (Math.max(1, missionDays)/30)
      if(v.fixed_min) required = v.fixed_min

      if(z.area_m2 < required){
        report.push({ok:false, msg: `${k} TOO SMALL: ${z.area_m2} m^2 < required ${required.toFixed(1)} m^2`})
      } else {
        report.push({ok:true, msg: `${k} OK: ${z.area_m2} m^2 >= required ${required.toFixed(1)} m^2`})
      }
    })

    // floor area check
    const totalZonesArea = zonesArr.reduce((a,b)=> a + (b.area_m2||0), 0)
    if(totalZonesArea > floorArea){
      report.push({ok:false, msg: `TOTAL AREA EXCEEDS USABLE FLOOR AREA: ${totalZonesArea.toFixed(1)} m^2 > floor ${floorArea.toFixed(1)} m^2`})
    } else {
      report.push({ok:true, msg: `Total zones ${totalZonesArea.toFixed(1)} m^2 within floor area ${floorArea.toFixed(1)} m^2`})
    }

    return report
  }

  const evaluation = useMemo(()=> evaluateZones(zones), [zones, crew, missionDays, dimensions])

  // UI helpers
  function addZone(){
    const next = { id: Date.now(), name: 'New', area_m2: 2 }
    setZones(z=>[...z, next])
  }
  function updateZone(id, patch){
    setZones(z=> z.map(x=> x.id===id ? {...x, ...patch} : x))
  }
  function removeZone(id){ setZones(z=> z.filter(x=> x.id!==id)) }

  function exportJSON(){
    const payload = { shapeName, dimensions, crew, missionDays, zones, volume, floorArea }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'habitat_layout.json'; a.click();
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 font-sans text-sm">
      <h1 className="text-2xl font-semibold mb-2">Habitat Designer — quick prototyping</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 p-3 border rounded">
          <label className="block font-medium">Preset</label>
          <select value={shapeName} onChange={e=>{ setShapeName(e.target.value); setDimensions(presets[e.target.value]) }} className="w-full p-1 border rounded mt-1">
            {Object.keys(presets).map(p=> <option key={p}>{p}</option>)}
          </select>

          <label className="block mt-2">Dimensions (meters)</label>
          <div className="flex gap-2 mt-1">
            <input value={dimensions.w} onChange={e=> setDimensions(d=>({...d, w: Number(e.target.value)}))} className="w-1/2 p-1 border rounded" />
            <input value={dimensions.h} onChange={e=> setDimensions(d=>({...d, h: Number(e.target.value)}))} className="w-1/2 p-1 border rounded" />
          </div>

          <label className="block mt-2">Crew</label>
          <input type="range" min={1} max={12} value={crew} onChange={e=> setCrew(Number(e.target.value))} />
          <div className="text-xs">Crew: {crew}</div>

          <label className="block mt-2">Mission duration (days)</label>
          <input type="number" value={missionDays} onChange={e=> setMissionDays(Number(e.target.value))} className="w-full p-1 border rounded" />

          <div className="mt-3 flex gap-2">
            <button onClick={addZone} className="px-2 py-1 bg-blue-600 text-white rounded">Add zone</button>
            <button onClick={exportJSON} className="px-2 py-1 bg-gray-700 text-white rounded">Export JSON</button>
          </div>
        </div>

        <div className="col-span-1 p-3 border rounded">
          <h2 className="font-medium">Zones</h2>
          <div className="space-y-2 mt-2">
            {zones.map(z=> (
              <div key={z.id} className="p-2 border rounded flex items-center gap-2">
                <input value={z.name} onChange={e=> updateZone(z.id, {name: e.target.value})} className="w-1/3 p-1 border rounded" />
                <input type="number" value={z.area_m2} onChange={e=> updateZone(z.id, {area_m2: Number(e.target.value)})} className="w-1/4 p-1 border rounded" />
                <div className="text-xs text-gray-600">m²</div>
                <button onClick={()=> removeZone(z.id)} className="ml-auto text-red-600">Remove</button>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-1 p-3 border rounded">
          <h2 className="font-medium">Evaluation</h2>
          <div className="mt-2 space-y-1">
            <div>Volume: {volume.toFixed(1)} m³</div>
            <div>Floor area (approx): {floorArea.toFixed(1)} m²</div>
          </div>

          <div className="mt-3">
            <h3 className="font-semibold">Rule checks</h3>
            <ul className="mt-2 space-y-1">
              {evaluation.map((r,i)=> (
                <li key={i} className={`p-2 rounded ${r.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {r.msg}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3">
            <h3 className="font-semibold">Quick tips</h3>
            <ul className="text-xs mt-2 list-disc pl-4 space-y-1">
              <li>Use modular zones to allow reconfiguration during the mission.</li>
              <li>Prioritize ECLSS and hygiene floor area before leisure if crew size increases.</li>
              <li>If total zones exceed floor area, create multiple levels or use radial arrangement.</li>
            </ul>
          </div>

        </div>

        {/* Canvas area spanning full width */}
        <div className="col-span-3 p-3 border rounded mt-2">
          <h2 className="font-medium mb-2">Visual canvas (schematic)</h2>
          <div className="w-full h-64 bg-gray-50 border rounded p-2 flex">
            <div className="m-auto w-3/4 h-5/6 relative border rounded bg-white flex items-center justify-center">
              {/* simplified representation: stacked color boxes showing zone proportions */}
              <div className="absolute top-2 left-2 text-xs text-gray-500">{shapeName} — floor {floorArea.toFixed(1)} m²</div>
              <div className="w-5/6 h-4/5 flex flex-wrap gap-1 p-1">
                {zones.map(z=> {
                  const total = zones.reduce((a,b)=>a+b.area_m2,0)
                  const pct = Math.max(0.02, (z.area_m2 / Math.max(1,total)))
                  const style = {flexBasis: `${pct*100}%`, minWidth: '40px', height: '48px'}
                  return (
                    <div key={z.id} style={style} className="border rounded p-1 text-xs bg-gradient-to-r from-indigo-100 to-indigo-200">
                      <div className="font-semibold">{z.name}</div>
                      <div className="text-xs">{z.area_m2} m²</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
