import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import socket from "../services/socket"
import { generarPDF } from "../utils/generarPDF"

import ReportesPlaneacion from "./ReportesPlaneacion"
import FichasTecnicas from "./FichasTecnicas"
import TransparenciaSeccion4 from "./TransparenciaSeccion4"
import TransparenciaSeccion5 from "./TransparenciaSeccion5"
import TransparenciaSeccion6 from "./TransparenciaSeccion6"
import TransparenciaSeccion40 from "./TransparenciaSeccion40"
import ExportarGlobalModal from "./ExportarGlobalModal"
import GestionUsers from "./GestionUsers"
import ChatPlaneacion from "./ChatPlaneacion"
import PonderacionFichas from "./PonderacionFichas"

import "../styles/dashboardPlaneacion.css"

const API = "http://localhost:3100"

export default function DashboardPlaneacion() {
  const [dependencias, setDependencias] = useState([])
  const [activa, setActiva] = useState(null)
  const [openDependencias, setOpenDependencias] = useState(false)
  const [trimestres, setTrimestres] = useState({})
  const [modalPDF, setModalPDF] = useState(false)
  const [vistaPonderacion, setVistaPonderacion] = useState(false)

  const [filtroPDF, setFiltroPDF] = useState({
    anio: 2025,
    trimestre: 1
  })

  const [lineasPendientes, setLineasPendientes] = useState([])
  const [showLineasPendientes, setShowLineasPendientes] = useState(true)

  const [modalRechazar, setModalRechazar] = useState(null)
  const [comentarioRechazo, setComentarioRechazo] = useState("")

  const [anioFiltro, setAnioFiltro] = useState(2025)

  const [modalHabilitarPDF, setModalHabilitarPDF] = useState(null)

  const [filtroHabilitar, setFiltroHabilitar] = useState({
    anio: 2025,
    trimestre: null
  })

  const [vistaAlineacion, setVistaAlineacion] = useState(false)
  const [estrategiasPMD, setEstrategiasPMD] = useState([])
  const [filtroEje, setFiltroEje] = useState(null)

  const [vistaReportes, setVistaReportes] = useState(false)
  const [vistaFichas, setVistaFichas] = useState(false)

  const [filtroEstrategia, setFiltroEstrategia] = useState("todas")

  const [vistaTransparencia, setVistaTransparencia] = useState(null)

  const [modalExportarGlobal, setModalExportarGlobal] = useState(false)

  const [vistaUsuarios, setVistaUsuarios] = useState(false)

  const [currentUser, setCurrentUser] = useState(null)

  const [vistaChat, setVistaChat] = useState(false)

  const [chatNoLeidos, setChatNoLeidos] = useState(0)

  const navigate = useNavigate()

  const años = [2025, 2026]

  const dependencia = dependencias.find(function (dep) {
    return dep.id === activa
  })

  const resetVistas = function () {
    setVistaReportes(false)
    setVistaFichas(false)
    setVistaAlineacion(false)
    setVistaUsuarios(false)
    setVistaTransparencia(null)
    setVistaChat(false)
    setVistaPonderacion(false)
  }

  useEffect(function () {
    const cargarBadge = async function () {
      try {
        const token = localStorage.getItem("token")

        const response = await fetch(
          API + "/api/chat/stats",
          {
            headers: token
              ? {
                  Authorization: "Bearer " + token
                }
              : {}
          }
        )

        if (!response.ok) {
          console.warn(
            "No se pudo cargar el badge del chat:",
            response.status
          )

          return
        }

        const data = await response.json()

        setChatNoLeidos(
          Number(data.total_no_leidos) || 0
        )
      } catch (error) {
        console.error(
          "Error cargando badge del chat:",
          error
        )
      }
    }

    cargarBadge()

    socket.on("chat_badge_update", cargarBadge)
    socket.on("chat_nuevo_mensaje", cargarBadge)

    return function () {
      socket.off("chat_badge_update", cargarBadge)
      socket.off("chat_nuevo_mensaje", cargarBadge)
    }
  }, [])

  useEffect(
    function () {
      const cargarUsuario = async function () {
        try {
          const token = localStorage.getItem("token")

          if (!token) {
            navigate("/")
            return
          }

          const response = await fetch(
            API + "/api/auth/me",
            {
              headers: {
                Authorization: "Bearer " + token
              }
            }
          )

          if (!response.ok) {
            throw new Error(
              "Error autenticación: " + response.status
            )
          }

          const data = await response.json()

          setCurrentUser(data)
        } catch (error) {
          console.error(
            "Error obteniendo usuario actual:",
            error
          )

          localStorage.removeItem("token")

          navigate("/")
        }
      }

      cargarUsuario()
    },
    [navigate]
  )

  useEffect(
    function () {
      if (!currentUser || !currentUser.id) {
        return
      }

      socket.emit("join_planeacion")

      const fetchData = async function () {
        try {
          const userId = currentUser.id

          const resDep = await fetch(
            API +
              "/api/planeacion/dashboard?user_id=" +
              userId
          )

          if (!resDep.ok) {
            throw new Error(
              "Error dashboard: " + resDep.status
            )
          }

          const data = await resDep.json()

          const listaDependencias = Array.isArray(data)
            ? data
            : []

          setDependencias(listaDependencias)

          if (listaDependencias.length > 0) {
            setActiva(listaDependencias[0].id)
          }

          const allTrimestres = {}

          for (const dep of listaDependencias) {
            const estrategias = dep.estrategias
              ? Object.values(dep.estrategias)
              : []

            for (const estrategia of estrategias) {
              const lineas = Array.isArray(
                estrategia.lineas
              )
                ? estrategia.lineas
                : []

              for (const linea of lineas) {
                try {
                  const resT = await fetch(
                    API +
                      "/api/trimestres/porLinea/" +
                      linea.id
                  )

                  if (!resT.ok) {
                    console.warn(
                      "Error cargando línea " +
                        linea.id +
                        ":",
                      resT.status
                    )

                    continue
                  }

                  allTrimestres[linea.id] =
                    await resT.json()
                } catch (error) {
                  console.error(
                    "Error cargando trimestre de " +
                      linea.id +
                      ":",
                    error
                  )
                }
              }
            }
          }

          setTrimestres(allTrimestres)

          const resPend = await fetch(
            API + "/api/lineas/pendientes"
          )

          if (resPend.ok) {
            const dataPend = await resPend.json()

            setLineasPendientes(
              Array.isArray(dataPend)
                ? dataPend
                : []
            )
          } else {
            console.warn(
              "No se pudieron cargar líneas pendientes:",
              resPend.status
            )
          }
        } catch (error) {
          console.error(
            "Error cargando datos del dashboard:",
            error
          )
        }
      }

      fetchData()

      const handleNuevaLineaPendiente = function (data) {
        setLineasPendientes(function (prev) {
          return [data, ...prev]
        })
      }

      const handleTrimestreActualizado = async function (data) {
        try {
          if (!data || !data.planning_id) {
            return
          }

          const response = await fetch(
            API +
              "/api/trimestres/porLinea/" +
              data.planning_id
          )

          if (!response.ok) {
            return
          }

          const trimestre = await response.json()

          setTrimestres(function (prev) {
            return {
              ...prev,
              [data.planning_id]: trimestre
            }
          })
        } catch (error) {
          console.error(
            "Error actualizando trimestre:",
            error
          )
        }
      }

      const handleRevisionTrimestre = function (data) {
        if (!data || !data.planning_id) {
          return
        }

        setTrimestres(function (prev) {
          const lista = prev[data.planning_id] || []

          return {
            ...prev,

            [data.planning_id]: lista.map(
              function (trimestre) {
                if (trimestre.id === data.id) {
                  return data
                }

                return trimestre
              }
            )
          }
        })
      }

      socket.on(
        "nueva_linea_pendiente",
        handleNuevaLineaPendiente
      )

      socket.on(
        "trimestre_actualizado",
        handleTrimestreActualizado
      )

      socket.on(
        "revision-trimestre",
        handleRevisionTrimestre
      )

      return function () {
        socket.off(
          "nueva_linea_pendiente",
          handleNuevaLineaPendiente
        )

        socket.off(
          "trimestre_actualizado",
          handleTrimestreActualizado
        )

        socket.off(
          "revision-trimestre",
          handleRevisionTrimestre
        )
      }
    },
    [currentUser]
  )

  useEffect(
    function () {
      setFiltroEstrategia("todas")
    },
    [activa]
  )

  const eliminarLineaDeAccion = async function (
    lineaId
  ) {
    const confirmar = window.confirm(
      "¿Estás seguro de que deseas eliminar esta línea de acción?"
    )

    if (!confirmar) {
      return
    }

    try {
      const response = await fetch(
        API + "/api/lineas/eliminar/" + lineaId,
        {
          method: "DELETE"
        }
      )

      if (!response.ok) {
        throw new Error(
          "Error HTTP " + response.status
        )
      }

      setDependencias(function (prev) {
        return prev.map(function (dep) {
          if (dep.id !== activa) {
            return dep
          }

          const nuevasEstrategias = {
            ...dep.estrategias
          }

          Object.keys(nuevasEstrategias).forEach(
            function (key) {
              nuevasEstrategias[key] = {
                ...nuevasEstrategias[key],

                lineas: (
                  nuevasEstrategias[key].lineas || []
                ).filter(function (linea) {
                  return linea.id !== lineaId
                })
              }
            }
          )

          return {
            ...dep,
            estrategias: nuevasEstrategias
          }
        })
      })
    } catch (error) {
      console.error(
        "Error eliminando línea de acción:",
        error
      )

      alert(
        "No se pudo eliminar la línea"
      )
    }
  }

  const habilitarPDF = async function () {
    if (!activa) {
      return
    }

    try {
      const response = await fetch(
        API + "/api/pdf/habilitar",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            dependency_id: activa,
            anio: filtroHabilitar.anio,
            trimestre:
              filtroHabilitar.trimestre ?? null
          })
        }
      )

      if (!response.ok) {
        throw new Error(
          "Error HTTP " + response.status
        )
      }

      setModalHabilitarPDF(null)

      alert("✅ PDF habilitado")
    } catch (error) {
      console.error(
        "Error habilitando PDF:",
        error
      )

      alert("No se pudo habilitar el PDF")
    }
  }

  const descargarPDFGlobal = async function () {
    if (!dependencia) {
      return
    }

    try {
      const response = await fetch(
        API +
          "/api/pdf/datos/" +
          dependencia.id +
          "/" +
          filtroPDF.anio +
          "/" +
          filtroPDF.trimestre
      )

      if (!response.ok) {
        throw new Error(
          "Error HTTP " + response.status
        )
      }

      const data = await response.json()

      generarPDF(
        data,
        dependencia.name,
        filtroPDF.anio,
        filtroPDF.trimestre
      )

      setModalPDF(false)
    } catch (error) {
      console.error(
        "Error descargando PDF:",
        error
      )

      alert("No se pudo generar el PDF")
    }
  }

  const revisarTrimestre = async function (
    planningId,
    anio,
    tipo,
    estado,
    dependencyId
  ) {
    try {
      const lista = trimestres[planningId] || []

      const registros = lista.filter(
        function (trimestre) {
          return (
            trimestre.anio === anio &&
            trimestre.tipo === tipo
          )
        }
      )

      for (const trimestre of registros) {
        const response = await fetch(
          API + "/api/review/" + trimestre.id,
          {
            method: "PUT",

            headers: {
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              estado: estado,

              comentario:
                estado === "rechazado"
                  ? comentarioRechazo
                  : "",

              dependency_id: dependencyId
            })
          }
        )

        if (!response.ok) {
          throw new Error(
            "Error revisando trimestre " +
              trimestre.id
          )
        }
      }

      setTrimestres(function (prev) {
        return {
          ...prev,

          [planningId]: (
            prev[planningId] || []
          ).map(function (trimestre) {
            if (
              trimestre.anio === anio &&
              trimestre.tipo === tipo
            ) {
              return {
                ...trimestre,
                estado_revision: estado
              }
            }

            return trimestre
          })
        }
      })

      setModalRechazar(null)
      setComentarioRechazo("")
    } catch (error) {
      console.error(
        "Error revisando trimestre:",
        error
      )

      alert("No se pudo realizar la revisión")
    }
  }

  const getValor = function (
    planningId,
    anio,
    trimestre,
    tipo
  ) {
    const lista = trimestres[planningId] || []

    const registro = lista.find(function (item) {
      return (
        item.anio === anio &&
        item.trimestre === trimestre &&
        item.tipo === tipo
      )
    })

    if (
      registro &&
      registro.valor !== undefined &&
      registro.valor !== null
    ) {
      return registro.valor
    }

    return "-"
  }

  const sumar = function (
    planningId,
    anio,
    tipo
  ) {
    return [1, 2, 3, 4].reduce(
      function (total, trimestre) {
        const valor = Number(
          getValor(
            planningId,
            anio,
            trimestre,
            tipo
          )
        )

        return total + (valor || 0)
      },
      0
    )
  }

  const getEstadoRevision = function (
    planningId,
    anio,
    tipo
  ) {
    const lista = trimestres[planningId] || []

    const registro = lista.find(function (item) {
      return (
        item.anio === anio &&
        item.tipo === tipo
      )
    })

    if (
      registro &&
      registro.estado_revision
    ) {
      return registro.estado_revision
    }

    return "pendiente"
  }

  const EstadoBadge = function ({ estado }) {
    const colores = {
      aprobado: {
        bg: "#d1fae5",
        color: "#065f46"
      },

      rechazado: {
        bg: "#fee2e2",
        color: "#991b1b"
      },

      pendiente: {
        bg: "#fef9c3",
        color: "#854d0e"
      }
    }

    const color =
      colores[estado] || colores.pendiente

    return (
      <span
        style={{
          background: color.bg,
          color: color.color,
          padding: "2px 8px",
          borderRadius: "999px",
          fontSize: "11px",
          fontWeight: "600"
        }}
      >
        {estado}
      </span>
    )
  }

  const listaEstrategiasDisponibles = dependencia
    ? Object.values(
        dependencia.estrategias || {}
      )
    : []

  const estrategiasAMostrar =
    filtroEstrategia === "todas"
      ? listaEstrategiasDisponibles
      : listaEstrategiasDisponibles.filter(
          function (estrategia) {
            return (
              String(estrategia.id) ===
              String(filtroEstrategia)
            )
          }
        )

  const cargarAlineacion = async function () {
    try {
      const response = await fetch(
        API + "/api/pmd/aprobados"
      )

      if (!response.ok) {
        throw new Error(
          "Error HTTP " + response.status
        )
      }

      const data = await response.json()

      setEstrategiasPMD(
        Array.isArray(data) ? data : []
      )

      resetVistas()

      setVistaAlineacion(true)

      setActiva(null)
    } catch (error) {
      console.error(
        "Error cargando alineación PMD:",
        error
      )
    }
  }

  const renderAlineacion = function () {
    const ejesUnicos = [
      ...new Set(
        estrategiasPMD.map(function (estrategia) {
          return estrategia.eje
        })
      )
    ]

    const filtradas = filtroEje
      ? estrategiasPMD.filter(
          function (estrategia) {
            return estrategia.eje === filtroEje
          }
        )
      : estrategiasPMD

    const porEje = filtradas.reduce(
      function (acc, estrategia) {
        if (!acc[estrategia.eje]) {
          acc[estrategia.eje] = {}
        }

        if (
          !acc[estrategia.eje][estrategia.tema]
        ) {
          acc[estrategia.eje][estrategia.tema] = {}
        }

        if (
          !acc[estrategia.eje][estrategia.tema][
            estrategia.politica_publica
          ]
        ) {
          acc[estrategia.eje][estrategia.tema][
            estrategia.politica_publica
          ] = {}
        }

        if (
          !acc[estrategia.eje][estrategia.tema][
            estrategia.politica_publica
          ][estrategia.objetivo]
        ) {
          acc[estrategia.eje][estrategia.tema][
            estrategia.politica_publica
          ][estrategia.objetivo] = []
        }

        const lista =
          acc[estrategia.eje][estrategia.tema][
            estrategia.politica_publica
          ][estrategia.objetivo]

        if (
          !lista.includes(
            estrategia.estrategia
          )
        ) {
          lista.push(estrategia.estrategia)
        }

        return acc
      },
      {}
    )

    return (
      <div className="alineacion-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px"
          }}
        >
          <h2
            style={{
              color: "#1e293b",
              margin: 0
            }}
          >
            🎯 Alineación Estratégica PMD
          </h2>

          <button
            onClick={function () {
              setVistaAlineacion(false)
            }}
            className="btn-tabla"
            style={{
              background: "#64748b",
              color: "white",
              padding: "10px 20px"
            }}
          >
            ← Volver
          </button>
        </div>

        <div className="filter-container">
          <button
            className={
              "filter-pill " +
              (filtroEje === null ? "active" : "")
            }
            onClick={function () {
              setFiltroEje(null)
            }}
          >
            Ver Todo
          </button>

          {ejesUnicos.map(function (eje) {
            return (
              <button
                key={eje}
                className={
                  "filter-pill " +
                  (filtroEje === eje
                    ? "active"
                    : "")
                }
                onClick={function () {
                  setFiltroEje(eje)
                }}
              >
                {eje
                  ? eje.substring(0, 40) + "..."
                  : ""}
              </button>
            )
          })}
        </div>

        {Object.entries(porEje).map(
          function ([eje, temas]) {
            return (
              <div
                key={eje}
                style={{
                  marginBottom: "30px"
                }}
              >
                <div
                  style={{
                    background: "#1e293b",
                    color: "white",
                    padding: "16px",
                    borderRadius: "12px"
                  }}
                >
                  <h3>{eje}</h3>
                </div>

                {Object.entries(temas).map(
                  function ([tema, politicas]) {
                    return (
                      <div
                        key={tema}
                        style={{
                          marginLeft: "20px",
                          borderLeft:
                            "3px solid #fecaca",
                          paddingLeft: "15px",
                          marginTop: "15px"
                        }}
                      >
                        <p
                          style={{
                            color: "#b91c1c",
                            fontWeight: "700"
                          }}
                        >
                          TEMA: {tema}
                        </p>

                        {Object.entries(
                          politicas
                        ).map(
                          function ([
                            politica,
                            objetivos
                          ]) {
                            return (
                              <div
                                key={politica}
                                style={{
                                  marginLeft:
                                    "20px",
                                  borderLeft:
                                    "3px solid #fed7aa",
                                  paddingLeft:
                                    "15px"
                                }}
                              >
                                <p
                                  style={{
                                    color:
                                      "#c2410c",
                                    fontWeight:
                                      "600"
                                  }}
                                >
                                  POLÍTICA:{" "}
                                  {politica}
                                </p>

                                {Object.entries(
                                  objetivos
                                ).map(
                                  function ([
                                    objetivo,
                                    estrategias
                                  ]) {
                                    return (
                                      <div
                                        key={
                                          objetivo
                                        }
                                        style={{
                                          marginLeft:
                                            "20px",
                                          borderLeft:
                                            "3px solid #bbf7d0",
                                          paddingLeft:
                                            "15px"
                                        }}
                                      >
                                        <p
                                          style={{
                                            color:
                                              "#15803d"
                                          }}
                                        >
                                          OBJETIVO:{" "}
                                          {objetivo}
                                        </p>

                                        {estrategias.map(
                                          function (
                                            estrategia,
                                            index
                                          ) {
                                            return (
                                              <div
                                                key={
                                                  index
                                                }
                                                className="notif-card-dark"
                                                style={{
                                                  margin:
                                                    "4px 0"
                                                }}
                                              >
                                                {
                                                  estrategia
                                                }
                                              </div>
                                            )
                                          }
                                        )}
                                      </div>
                                    )
                                  }
                                )}
                              </div>
                            )
                          }
                        )}
                      </div>
                    )
                  }
                )}
              </div>
            )
          }
        )}
      </div>
    )
  }

  return (
    <div className="layout">
      <div className="sidebar">
        <h2 className="logo">
          Planeación
        </h2>

        <button
          onClick={function () {
            resetVistas()
            setVistaChat(true)
            setActiva(null)
          }}
          style={{
            marginTop: "8px",
            background: vistaChat
              ? "#065f46"
              : "#059669",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px",
            width: "100%",
            cursor: "pointer",
            fontWeight: "600",
            position: "relative"
          }}
        >
          💬 Chat con Dependencias

          {chatNoLeidos > 0 && (
            <span
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                background: "#dc2626",
                color: "white",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                fontSize: "11px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {chatNoLeidos > 9
                ? "9+"
                : chatNoLeidos}
            </span>
          )}
        </button>
<button
  onClick={() => { resetVistas(); setVistaPonderacion(true); setActiva(null) }}
  style={{ marginTop:"8px", background:vistaPonderacion?"#065f46":"#0891b2", color:"white", border:"none", borderRadius:"8px", padding:"12px", width:"100%", cursor:"pointer", fontWeight:"600" }}
>
  📊 Ponderación de Indicadores
</button>
        <button
          onClick={function () {
            resetVistas()
            setVistaReportes(true)
            setActiva(null)
          }}
          className={
            "menu-btn " +
            (vistaReportes ? "active" : "")
          }
        >
          📊 Reportes Globales
        </button>

        <button
          onClick={function () {
            resetVistas()
            setVistaFichas(true)
            setActiva(null)
          }}
          style={{
            marginTop: "8px",
            background: vistaFichas
              ? "#854d0e"
              : "#d97706",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px",
            width: "100%",
            cursor: "pointer"
          }}
        >
          📋 Fichas Técnicas
        </button>

        <button
          onClick={cargarAlineacion}
          style={{
            marginTop: "8px",
            background: vistaAlineacion
              ? "#5b21b6"
              : "#7c3aed",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px",
            width: "100%",
            cursor: "pointer"
          }}
        >
          🎯 Alineación Estratégica
        </button>

        <button
          onClick={function () {
            resetVistas()
            setVistaUsuarios(true)
            setActiva(null)
          }}
          style={{
            marginTop: "8px",
            background: vistaUsuarios
              ? "#1e3a8a"
              : "#1e40af",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px",
            width: "100%",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          👤 Gestión de Usuarios
        </button>

        <div
          style={{
            margin: "15px 0",
            borderBottom:
              "1px solid #334155"
          }}
        />

        <button
          className="menu-btn"
          onClick={function () {
            setOpenDependencias(
              !openDependencias
            )
          }}
        >
          🏢 Dependencias{" "}
          {openDependencias ? "▲" : "▼"}
        </button>

        <div
          className={
            "submenu " +
            (openDependencias ? "open" : "")
          }
        >
          {dependencias.map(function (dep) {
            const activaSeleccionada =
              dep.id === activa &&
              !vistaAlineacion &&
              !vistaReportes &&
              !vistaFichas &&
              !vistaUsuarios &&
              !vistaTransparencia &&
              !vistaChat

            return (
              <button
                key={dep.id}
                className={
                  "dep-item " +
                  (activaSeleccionada
                    ? "active"
                    : "")
                }
                onClick={function () {
                  resetVistas()
                  setActiva(dep.id)
                }}
              >
                {dep.name}
              </button>
            )
          })}
        </div>

        <button
          className="logout-btn"
          onClick={function () {
            localStorage.removeItem("token")

            navigate("/")
          }}
        >
          Cerrar sesión
        </button>

        <div style={{ marginTop: "8px" }}>
          <p
            style={{
              fontSize: "10px",
              color: "#94a3b8",
              margin: "0 0 4px 6px",
              fontWeight: "600"
            }}
          >
            🔍 TRANSPARENCIA
          </p>

          <button
            onClick={function () {
              resetVistas()
              setVistaTransparencia("s4")
              setActiva(null)
            }}
            style={{
              background:
                vistaTransparencia === "s4"
                  ? "#065f46"
                  : "#059669",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 12px",
              width: "100%",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
              marginBottom: "4px"
            }}
          >
            Sección 4 (F4)
          </button>

          <button
            onClick={function () {
              resetVistas()
              setVistaTransparencia("s5")
              setActiva(null)
            }}
            style={{
              background:
                vistaTransparencia === "s5"
                  ? "#065f46"
                  : "#059669",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 12px",
              width: "100%",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
              marginBottom: "4px"
            }}
          >
            Sección 5 (F5)
          </button>

          <button
            onClick={function () {
              resetVistas()
              setVistaTransparencia("s6")
              setActiva(null)
            }}
            style={{
              background:
                vistaTransparencia === "s6"
                  ? "#065f46"
                  : "#059669",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 12px",
              width: "100%",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600",
              marginBottom: "4px"
            }}
          >
            Sección 6 (F6)
          </button>

          <button
            onClick={function () {
              resetVistas()
              setVistaTransparencia("s40")
              setActiva(null)
            }}
            style={{
              background:
                vistaTransparencia === "s40"
                  ? "#065f46"
                  : "#059669",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 12px",
              width: "100%",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600"
            }}
          >
            Sección 40 (Art.70)
          </button>
        </div>
      </div>

       <div className="contenido">
  {vistaUsuarios ? (
    <GestionUsers
      dependencias={dependencias}
      currentUser={currentUser}
    />
  ) : vistaTransparencia === "s4" ? (
    <TransparenciaSeccion4 />
  ) : vistaTransparencia === "s5" ? (
    <TransparenciaSeccion5 />
  ) : vistaTransparencia === "s6" ? (
    <TransparenciaSeccion6 />
  ) : vistaTransparencia === "s40" ? (
    <TransparenciaSeccion40 />
  ) : vistaFichas ? (
    <FichasTecnicas
      dependencias={dependencias}
    />
  ) : vistaReportes ? (
    <ReportesPlaneacion />
  ) : vistaAlineacion ? (
    renderAlineacion()
  ) : vistaChat ? (
    <ChatPlaneacion
      currentUser={currentUser}
    />
  ) : vistaPonderacion ? (
    <PonderacionFichas
      dependencias={dependencias}
      currentUser={currentUser}
    />
  ) : (
    <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px"
              }}
            >
              <h2 className="titulo">
                {dependencia
                  ? dependencia.name
                  : "Selecciona una dependencia"}
              </h2>



              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  alignItems: "center"
                }}
              >
                {dependencia && (
                  <select
                    value={filtroEstrategia}
                    onChange={function (event) {
                      setFiltroEstrategia(
                        event.target.value
                      )
                    }}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border:
                        "1px solid #cbd5e1",
                      fontSize: "14px",
                      background: "white",
                      color: "#000"
                    }}
                  >
                    <option value="todas">
                      Todas las estrategias
                    </option>

                    {listaEstrategiasDisponibles.map(
                      function (estrategia) {
                        return (
                          <option
                            key={estrategia.id}
                            value={estrategia.id}
                          >
                            {estrategia.name}
                          </option>
                        )
                      }
                    )}
                  </select>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    background: "#f3f4f6",
                    padding: "5px",
                    borderRadius: "12px",
                    alignItems: "center"
                  }}
                >
                  {años.map(function (anio) {
                    return (
                      <button
                        key={anio}
                        onClick={function () {
                          setAnioFiltro(anio)
                        }}
                        style={{
                          padding:
                            "10px 25px",
                          borderRadius:
                            "10px",
                          border: "none",
                          cursor: "pointer",
                          fontWeight:
                            "bold",
                          background:
                            anioFiltro === anio
                              ? "#2563eb"
                              : "transparent",
                          color:
                            anioFiltro === anio
                              ? "white"
                              : "#64748b",
                          transition:
                            "all 0.3s"
                        }}
                      >
                        {anio}
                      </button>
                    )
                  })}

                  <button
                    onClick={function () {
                      setModalExportarGlobal(true)
                    }}
                    style={{
                      background: "#7c3aed",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 18px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    📊 Exportar Global
                    (Programado vs Ejecutado)
                  </button>
                </div>
              </div>
            </div>

            {dependencia &&
            estrategiasAMostrar.length > 0 ? (
              <div className="card">
                <div className="tabla-wrapper">
                  <table className="tabla-poa">
                    <thead>
                      <tr>
                        <th rowSpan="2">
                          Acción
                        </th>

                        <th
                          rowSpan="2"
                          style={{
                            textAlign: "left",
                            minWidth: "300px"
                          }}
                        >
                          Línea de Acción
                        </th>

                        <th
                          colSpan="6"
                          className="header-section-prog"
                        >
                          PROGRAMADO {anioFiltro}
                        </th>

                        <th
                          colSpan="6"
                          className="header-section-ejec"
                        >
                          EJECUTADO {anioFiltro}
                        </th>
                      </tr>

                      <tr>
                        <th>T1</th>
                        <th>T2</th>
                        <th>T3</th>
                        <th>T4</th>

                        <th className="col-total">
                          Total
                        </th>

                        <th>Revisión</th>

                        <th>T1</th>
                        <th>T2</th>
                        <th>T3</th>
                        <th>T4</th>

                        <th className="col-total">
                          Total
                        </th>

                        <th>Revisión</th>
                      </tr>
                    </thead>

                    <tbody>
                      {estrategiasAMostrar.map(
                        function (estrategia) {
                          return (
                            <React.Fragment
                              key={estrategia.id}
                            >
                              {filtroEstrategia ===
                                "todas" && (
                                <tr
                                  style={{
                                    background:
                                      "#f1f5f9"
                                  }}
                                >
                                  <td
                                    colSpan="14"
                                    style={{
                                      padding:
                                        "12px",
                                      fontWeight:
                                        "800",
                                      color:
                                        "#334155",
                                      fontSize:
                                        "12px",
                                      textTransform:
                                        "uppercase"
                                    }}
                                  >
                                    ESTRATEGIA:{" "}
                                    {estrategia.name}

                                    <button
                                      onClick={function () {
                                        setModalHabilitarPDF(
                                          estrategia.id
                                        )
                                      }}
                                      style={{
                                        marginLeft:
                                          "20px",
                                        background:
                                          "#2563eb",
                                        color:
                                          "white",
                                        border:
                                          "none",
                                        borderRadius:
                                          "6px",
                                        padding:
                                          "5px 12px",
                                        fontSize:
                                          "11px",
                                        cursor:
                                          "pointer"
                                      }}
                                    >
                                      Habilitar PDF
                                    </button>
                                  </td>
                                </tr>
                              )}

                              {(
                                estrategia.lineas || []
                              ).map(
                                function (linea) {
                                  return (
                                    <tr
                                      key={linea.id}
                                    >
                                      <td
                                        style={{
                                          textAlign:
                                            "center"
                                        }}
                                      >
                                        <button
                                          onClick={function () {
                                            eliminarLineaDeAccion(
                                              linea.id
                                            )
                                          }}
                                          style={{
                                            background:
                                              "#fee2e2",
                                            color:
                                              "#dc2626",
                                            border:
                                              "none",
                                            padding:
                                              "8px",
                                            borderRadius:
                                              "8px",
                                            cursor:
                                              "pointer"
                                          }}
                                        >
                                          🗑️
                                        </button>
                                      </td>

                                      <td
                                        style={{
                                          fontSize:
                                            "13px",
                                          padding:
                                            "10px"
                                        }}
                                      >
                                        {
                                          linea.lineas_accion
                                        }
                                      </td>

                                      {[
                                        "programado",
                                        "ejecutado"
                                      ].map(
                                        function (tipo) {
                                          return (
                                            <React.Fragment
                                              key={
                                                tipo +
                                                "-" +
                                                linea.id
                                              }
                                            >
                                              {[
                                                1,
                                                2,
                                                3,
                                                4
                                              ].map(
                                                function (
                                                  trimestre
                                                ) {
                                                  return (
                                                    <td
                                                      key={
                                                        linea.id +
                                                        "-" +
                                                        tipo +
                                                        "-" +
                                                        trimestre
                                                      }
                                                      style={{
                                                        textAlign:
                                                          "center"
                                                      }}
                                                    >
                                                      {getValor(
                                                        linea.id,
                                                        anioFiltro,
                                                        trimestre,
                                                        tipo
                                                      )}
                                                    </td>
                                                  )
                                                }
                                              )}

                                              <td
                                                className="col-total"
                                                style={{
                                                  textAlign:
                                                    "center",
                                                  fontWeight:
                                                    "bold"
                                                }}
                                              >
                                                {sumar(
                                                  linea.id,
                                                  anioFiltro,
                                                  tipo
                                                )}
                                              </td>

                                              <td>
                                                <div
                                                  style={{
                                                    display:
                                                      "flex",
                                                    flexDirection:
                                                      "column",
                                                    gap:
                                                      "5px",
                                                    alignItems:
                                                      "center"
                                                  }}
                                                >
                                                  <EstadoBadge
                                                    estado={getEstadoRevision(
                                                      linea.id,
                                                      anioFiltro,
                                                      tipo
                                                    )}
                                                  />

                                                  <div
                                                    style={{
                                                      display:
                                                        "flex",
                                                      gap:
                                                        "5px"
                                                    }}
                                                  >
                                                    <button
                                                      className="btn-tabla btn-aprobar"
                                                      onClick={function () {
                                                        revisarTrimestre(
                                                          linea.id,
                                                          anioFiltro,
                                                          tipo,
                                                          "aprobado",
                                                          dependencia.id
                                                        )
                                                      }}
                                                    >
                                                      Ok
                                                    </button>

                                                    <button
                                                      className="btn-tabla btn-rechazar"
                                                      onClick={function () {
                                                        setModalRechazar(
                                                          {
                                                            id: linea.id,
                                                            anio:
                                                              anioFiltro,
                                                            tipo:
                                                              tipo
                                                          }
                                                        )
                                                      }}
                                                    >
                                                      X
                                                    </button>
                                                  </div>
                                                </div>
                                              </td>
                                            </React.Fragment>
                                          )
                                        }
                                      )}
                                    </tr>
                                  )
                                }
                              )}
                            </React.Fragment>
                          )
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              dependencia && (
                <div
                  className="card"
                  style={{
                    padding: "50px",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: "18px"
                  }}
                >
                  No hay líneas de acción para mostrar.
                </div>
              )
            )}

            {dependencia && (
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  marginTop: "30px"
                }}
              >
                <button
                  onClick={function () {
                    setModalPDF(true)
                  }}
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    padding: "15px 35px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow:
                      "0 4px 6px -1px rgba(0,0,0,0.1)"
                  }}
                >
                  📄 Exportar PDF Global
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {modalPDF && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              padding: "30px",
              borderRadius: "20px",
              width: "400px"
            }}
          >
            <h3>
              Configurar Exportación PDF
            </h3>

            <label>Año:</label>

            <select
              value={filtroPDF.anio}
              onChange={function (event) {
                setFiltroPDF({
                  ...filtroPDF,
                  anio: Number(
                    event.target.value
                  )
                })
              }}
            >
              {años.map(function (anio) {
                return (
                  <option
                    key={anio}
                    value={anio}
                  >
                    {anio}
                  </option>
                )
              })}
            </select>

            <label>Trimestre:</label>

            <select
              value={filtroPDF.trimestre}
              onChange={function (event) {
                setFiltroPDF({
                  ...filtroPDF,
                  trimestre: Number(
                    event.target.value
                  )
                })
              }}
            >
              <option value={1}>
                Trimestre 1
              </option>

              <option value={2}>
                Trimestre 2
              </option>

              <option value={3}>
                Trimestre 3
              </option>

              <option value={4}>
                Trimestre 4
              </option>
            </select>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px"
              }}
            >
              <button
                onClick={function () {
                  setModalPDF(false)
                }}
              >
                Cancelar
              </button>

              <button
                onClick={descargarPDFGlobal}
              >
                Descargar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalExportarGlobal && (
        <ExportarGlobalModal
          onClose={function () {
            setModalExportarGlobal(false)
          }}
        />
      )}

      {modalRechazar && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              padding: "30px",
              borderRadius: "20px",
              width: "400px"
            }}
          >
            <h3>
              Rechazar Registro
            </h3>

            <textarea
              placeholder="Escribe el motivo del rechazo..."
              value={comentarioRechazo}
              onChange={function (event) {
                setComentarioRechazo(
                  event.target.value
                )
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "10px"
              }}
            >
              <button
                onClick={function () {
                  setModalRechazar(null)
                  setComentarioRechazo("")
                }}
              >
                Cancelar
              </button>

              <button
                onClick={function () {
                  revisarTrimestre(
                    modalRechazar.id,
                    modalRechazar.anio,
                    modalRechazar.tipo,
                    "rechazado",
                    activa
                  )
                }}
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {modalHabilitarPDF && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              padding: "30px",
              borderRadius: "20px",
              width: "400px"
            }}
          >
            <h3>
              Habilitar Envío de PDF
            </h3>

            <label>
              Seleccionar Año:
            </label>

            <select
              value={filtroHabilitar.anio}
              onChange={function (event) {
                setFiltroHabilitar({
                  ...filtroHabilitar,
                  anio: Number(
                    event.target.value
                  )
                })
              }}
            >
              {años.map(function (anio) {
                return (
                  <option
                    key={anio}
                    value={anio}
                  >
                    {anio}
                  </option>
                )
              })}
            </select>

            <label>
              Seleccionar Periodo:
            </label>

            <select
              value={
                filtroHabilitar.trimestre ?? ""
              }
              onChange={function (event) {
                setFiltroHabilitar({
                  ...filtroHabilitar,

                  trimestre:
                    event.target.value === ""
                      ? null
                      : Number(
                          event.target.value
                        )
                })
              }}
            >
              <option value="">
                Todo el Año (POA)
              </option>

              <option value={1}>
                Trimestre 1
              </option>

              <option value={2}>
                Trimestre 2
              </option>

              <option value={3}>
                Trimestre 3
              </option>

              <option value={4}>
                Trimestre 4
              </option>
            </select>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px"
              }}
            >
              <button
                onClick={function () {
                  setModalHabilitarPDF(null)
                }}
              >
                Cerrar
              </button>

              <button
                onClick={habilitarPDF}
              >
                Habilitar Ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}