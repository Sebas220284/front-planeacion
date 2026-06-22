import React, { useEffect, useRef, useState } from "react"

// Leaflet se carga dinámicamente para evitar problemas con SSR/StrictMode
let L = null

const TUXTLA = { lat: 16.7516, lng: -93.1040 }

export default function MapSelector({
  lat, lng, onSelect,
  titulo = "Selecciona ubicación",
  height = 300
}) {
  const mapContainer = useRef(null)
  const mapRef       = useRef(null)
  const markerRef    = useRef(null)

  const [coords, setCoords]     = useState({
    lat: lat || TUXTLA.lat,
    lng: lng || TUXTLA.lng
  })
  const [busqueda, setBusqueda] = useState("")
  const [buscando, setBuscando] = useState(false)
  const [listo,    setListo]    = useState(false)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    let mounted = true

    const initMap = async () => {
      try {
        if (!L) {
          L = (await import("leaflet")).default

          delete L.Icon.Default.prototype._getIconUrl
          L.Icon.Default.mergeOptions({
            iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          })
        }

        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link")
          link.id   = "leaflet-css"
          link.rel  = "stylesheet"
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          document.head.appendChild(link)
          await new Promise(r => setTimeout(r, 100))
        }

        if (!mounted || !mapContainer.current) return

        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }

        const initLat = lat || TUXTLA.lat
        const initLng = lng || TUXTLA.lng

        const map = L.map(mapContainer.current, {
          center: [initLat, initLng],
          zoom:   14,
          zoomControl: true,
        })

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map)

        const iconoRojo = L.divIcon({
          html: `<div style="
            width:24px; height:36px; position:relative; cursor:pointer;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" style="width:100%;height:100%">
              <path d="M12 0C7.8 0 4 3.8 4 8c0 6 8 20 8 20s8-14 8-20c0-4.2-3.8-8-8-8z"
                fill="#dc2626" stroke="white" stroke-width="1.5"/>
              <circle cx="12" cy="8" r="3.5" fill="white"/>
            </svg>
          </div>`,
          className: "",
          iconSize:    [24, 36],
          iconAnchor:  [12, 36],
          popupAnchor: [0, -36],
        })

        const marker = L.marker([initLat, initLng], {
          draggable: true,
          icon: iconoRojo,
        }).addTo(map)

        marker.bindPopup(`
          <div style="font-family:sans-serif;font-size:12px;min-width:140px">
            <b style="color:#dc2626">📍 Ubicación seleccionada</b><br/>
            <span style="color:#6b7280">Lat: ${initLat}</span><br/>
            <span style="color:#6b7280">Lng: ${initLng}</span>
          </div>
        `).openPopup()

        marker.on("dragend", () => {
          const pos = marker.getLatLng()
          const rounded = {
            lat: Math.round(pos.lat * 1000000) / 1000000,
            lng: Math.round(pos.lng * 1000000) / 1000000,
          }
          marker.setPopupContent(`
            <div style="font-family:sans-serif;font-size:12px;min-width:140px">
              <b style="color:#dc2626">📍 Ubicación seleccionada</b><br/>
              <span style="color:#6b7280">Lat: ${rounded.lat}</span><br/>
              <span style="color:#6b7280">Lng: ${rounded.lng}</span>
            </div>
          `).openPopup()
          if (mounted) { setCoords(rounded); onSelect(rounded) }
        })

        map.on("click", (e) => {
          const rounded = {
            lat: Math.round(e.latlng.lat * 1000000) / 1000000,
            lng: Math.round(e.latlng.lng * 1000000) / 1000000,
          }
          marker.setLatLng([rounded.lat, rounded.lng])
          marker.setPopupContent(`
            <div style="font-family:sans-serif;font-size:12px;min-width:140px">
              <b style="color:#dc2626">📍 Ubicación seleccionada</b><br/>
              <span style="color:#6b7280">Lat: ${rounded.lat}</span><br/>
              <span style="color:#6b7280">Lng: ${rounded.lng}</span>
            </div>
          `).openPopup()
          if (mounted) { setCoords(rounded); onSelect(rounded) }
        })

        mapRef.current    = map
        markerRef.current = marker
        if (mounted) setListo(true)

      } catch(e) {
        console.error("Error inicializando mapa:", e)
        if (mounted) setError(e.message)
      }
    }

    initMap()

    return () => {
      mounted = false
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, []) 
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    if (lat && lng && (lat !== coords.lat || lng !== coords.lng)) {
      markerRef.current.setLatLng([lat, lng])
      mapRef.current.setView([lat, lng], 15)
      setCoords({ lat, lng })
    }
  }, [lat, lng])

  const buscarDireccion = async () => {
    if (!busqueda.trim()) return
    setBuscando(true)
    try {
      const query = encodeURIComponent(`${busqueda}, Tuxtla Gutiérrez, Chiapas, México`)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=mx`,
        { headers: { "Accept-Language": "es" } }
      )
      const data = await res.json()

      if (data && data.length > 0) {
        const rounded = {
          lat: Math.round(Number(data[0].lat) * 1000000) / 1000000,
          lng: Math.round(Number(data[0].lon) * 1000000) / 1000000,
        }
        markerRef.current?.setLatLng([rounded.lat, rounded.lng])
        mapRef.current?.setView([rounded.lat, rounded.lng], 16)
        markerRef.current?.openPopup()
        setCoords(rounded)
        onSelect(rounded)
      } else {
        alert("No se encontró la dirección. Intenta con términos más específicos.")
      }
    } catch(e) {
      alert("Error al buscar dirección: " + e.message)
    }
    setBuscando(false)
  }

  if (error) {
    return (
      <div style={{ border:"1px solid #e5e7eb", borderRadius:"10px", overflow:"hidden" }}>
        <div style={{ background:"#fff7ed", padding:"12px 16px", borderBottom:"1px solid #fed7aa" }}>
          <p style={{ fontWeight:"700", color:"#92400e", margin:"0 0 4px", fontSize:"13px" }}>
            ⚠️ {titulo} — Ingreso manual de coordenadas
          </p>
          <p style={{ color:"#78350f", fontSize:"11px", margin:0 }}>
            El mapa no pudo cargarse. Puedes ingresar las coordenadas manualmente.
            Encuéntralas en Google Maps → clic derecho → "¿Qué hay aquí?"
          </p>
        </div>
        <div style={{ padding:"16px", background:"white", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          <div>
            <label style={{ display:"block", fontWeight:"600", fontSize:"12px", marginBottom:"4px", color:"#374151" }}>Latitud</label>
            <input type="number" step="any" value={coords.lat}
              onChange={e => { const v={...coords,lat:Number(e.target.value)}; setCoords(v); onSelect(v) }}
              placeholder="16.7516"
              style={{ width:"100%", padding:"8px", borderRadius:"6px", border:"1px solid #d1d5db", fontSize:"13px" }} />
          </div>
          <div>
            <label style={{ display:"block", fontWeight:"600", fontSize:"12px", marginBottom:"4px", color:"#374151" }}>Longitud</label>
            <input type="number" step="any" value={coords.lng}
              onChange={e => { const v={...coords,lng:Number(e.target.value)}; setCoords(v); onSelect(v) }}
              placeholder="-93.1040"
              style={{ width:"100%", padding:"8px", borderRadius:"6px", border:"1px solid #d1d5db", fontSize:"13px" }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ borderRadius:"10px", overflow:"hidden", border:"1px solid #e5e7eb" }}>

      <div style={{ padding:"10px 12px", background:"#f8fafc", borderBottom:"1px solid #e5e7eb" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"10px" }}>

          <div style={{ flex:1 }}>
            <p style={{ margin:"0 0 6px", fontSize:"11px", fontWeight:"700", color:"#374151" }}>📍 {titulo}</p>
            <div style={{ display:"flex", gap:"6px" }}>
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onKeyDown={e => e.key==="Enter" && buscarDireccion()}
                placeholder="Buscar calle, colonia o lugar..."
                style={{ flex:1, padding:"7px 10px", borderRadius:"6px", border:"1px solid #d1d5db", fontSize:"12px" }}
              />
              <button onClick={buscarDireccion} disabled={buscando}
                style={{ padding:"7px 14px", background:"#1e40af", color:"white", border:"none", borderRadius:"6px", cursor:"pointer", fontSize:"12px", fontWeight:"600", opacity:buscando?0.7:1, flexShrink:0 }}>
                {buscando ? "..." : "🔍 Buscar"}
              </button>
            </div>
          </div>

          <div style={{ background:"white", border:"1px solid #e5e7eb", borderRadius:"8px", padding:"6px 12px", textAlign:"center", flexShrink:0, minWidth:"120px" }}>
            <p style={{ margin:0, fontSize:"9px", color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.05em" }}>Coordenadas</p>
            <p style={{ margin:"3px 0 0", fontSize:"11px", fontWeight:"700", color:"#1e40af", fontFamily:"monospace" }}>
              {coords.lat}, {coords.lng}
            </p>
          </div>
        </div>
      </div>

      <div style={{ position:"relative" }}>
        <div ref={mapContainer} style={{ height:`${height}px`, width:"100%" }} />
        {!listo && (
          <div style={{ position:"absolute", inset:0, background:"rgba(248,250,252,0.9)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"32px", marginBottom:"8px" }}>🗺️</div>
              <p style={{ color:"#6b7280", fontSize:"13px", margin:0 }}>Cargando mapa...</p>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding:"6px 12px", background:"#f8fafc", borderTop:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <p style={{ margin:0, fontSize:"10px", color:"#9ca3af" }}>
           Haz clic en el mapa o arrastra el marcador rojo para ajustar la posición
        </p>
        <p style={{ margin:0, fontSize:"9px", color:"#d1d5db" }}>© OpenStreetMap</p>
      </div>
    </div>
  )
}