'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function VerificarZarpePage() {
  const params = useParams()
  const zarpeNumber = params.zarpeNumber as string
  const [loading, setLoading] = useState(true)
  const [found, setFound] = useState(false)
  const [zarpe, setZarpe] = useState<any>(null)

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/verificar/${encodeURIComponent(zarpeNumber)}`)
        const data = await res.json()
        if (data.found) {
          setZarpe(data.zarpe)
          setFound(true)
        } else {
          setFound(false)
        }
      } catch {
        setFound(false)
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [zarpeNumber])

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={{ ...styles.card, borderColor: '#e2e8f0' }}>
            <div style={{ ...styles.header, background: '#475569' }}>
              <div style={{ ...styles.iconCircle, color: '#475569' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              </div>
              <h1 style={styles.title}>VERIFICANDO ZARPE</h1>
              <p style={{ color: '#cbd5e1', marginTop: 8, fontSize: 14, margin: '8px 0 0 0' }}>Consultando registros...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!found) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={{ ...styles.card, borderColor: '#fecaca' }}>
            <div style={{ ...styles.header, background: '#dc2626' }}>
              <div style={{ ...styles.iconCircle, color: '#dc2626' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
              </div>
              <h1 style={styles.title}>ZARPE NO ENCONTRADO</h1>
              <p style={{ color: '#fecaca', marginTop: 8, fontSize: 14, margin: '8px 0 0 0' }}>Este documento no pudo ser verificado</p>
            </div>
            <div style={styles.body}>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 16, textAlign: 'center' as const }}>
                <p style={{ fontSize: 14, color: '#b91c1c', margin: 0 }}>
                  El numero de zarpe <strong>{decodeURIComponent(zarpeNumber)}</strong> no existe en nuestros registros. Este documento podria no ser autentico.
                </p>
              </div>
              <div style={styles.footer}>
                <p style={styles.footerText}>VUTMHN - Ventanilla Unica de Transporte Maritimo de Honduras</p>
                <p style={{ ...styles.footerText, marginTop: 4 }}>Para consultas, contacte a la Direccion General de la Marina Mercante</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isApproved = zarpe.status === 'approved'

  if (!isApproved) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={{ ...styles.card, borderColor: '#fde68a' }}>
            <div style={{ ...styles.header, background: '#f59e0b' }}>
              <div style={{ ...styles.iconCircle, color: '#f59e0b' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
              </div>
              <h1 style={styles.title}>ZARPE EN PROCESO</h1>
              <p style={{ color: '#fef3c7', marginTop: 8, fontSize: 14, margin: '8px 0 0 0' }}>Este zarpe aun no ha sido aprobado</p>
            </div>
            <div style={styles.body}>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 16, textAlign: 'center' as const }}>
                <p style={{ fontSize: 14, color: '#92400e', fontWeight: 500, margin: '0 0 4px 0' }}>Numero de Zarpe</p>
                <p style={{ fontSize: 24, fontWeight: 'bold', color: '#78350f', letterSpacing: 2, margin: 0 }}>{zarpe.zarpe_number}</p>
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginTop: 12 }}>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 2px 0' }}>Buque</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', margin: 0 }}>{zarpe.ship_name || 'N/A'}</p>
              </div>
              <div style={styles.footer}>
                <p style={styles.footerText}>VUTMHN - Ventanilla Unica de Transporte Maritimo de Honduras</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={{ ...styles.card, borderColor: '#bbf7d0' }}>
          <div style={{ ...styles.header, background: '#16a34a' }}>
            <div style={{ ...styles.iconCircle, color: '#16a34a' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h1 style={styles.title}>ZARPE AUTENTICO VERIFICADO</h1>
            <p style={{ color: '#bbf7d0', marginTop: 8, fontSize: 14, margin: '8px 0 0 0' }}>Este documento ha sido verificado exitosamente</p>
          </div>

          <div style={styles.body}>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16, textAlign: 'center' as const }}>
              <p style={{ fontSize: 14, color: '#15803d', fontWeight: 500, margin: '0 0 4px 0' }}>Numero de Zarpe</p>
              <p style={{ fontSize: 24, fontWeight: 'bold', color: '#14532d', letterSpacing: 2, margin: 0 }}>{zarpe.zarpe_number}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
              <div style={styles.infoBox}>
                <p style={styles.infoLabel}>Buque</p>
                <p style={styles.infoValue}>{zarpe.ship_name || 'N/A'}</p>
              </div>
              <div style={styles.infoBox}>
                <p style={styles.infoLabel}>OMI</p>
                <p style={styles.infoValue}>{zarpe.omi_number || 'N/A'}</p>
              </div>
              <div style={styles.infoBox}>
                <p style={styles.infoLabel}>Bandera</p>
                <p style={styles.infoValue}>{zarpe.vessel_flag || 'N/A'}</p>
              </div>
              <div style={styles.infoBox}>
                <p style={styles.infoLabel}>Fecha de Emision</p>
                <p style={styles.infoValue}>
                  {zarpe.approved_at
                    ? new Date(zarpe.approved_at).toLocaleDateString('es-HN', { year: 'numeric', month: 'short', day: 'numeric' })
                    : new Date(zarpe.created_at).toLocaleDateString('es-HN', { year: 'numeric', month: 'short', day: 'numeric' })
                  }
                </p>
              </div>
            </div>

            {zarpe.approved_by_name && (
              <div style={{ ...styles.infoBox, marginTop: 8 }}>
                <p style={styles.infoLabel}>Aprobado por</p>
                <p style={styles.infoValue}>{zarpe.approved_by_name}</p>
              </div>
            )}

            <div style={styles.footer}>
              <p style={styles.footerText}>Verificado por VUTMHN - Ventanilla Unica de Transporte Maritimo de Honduras</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  container: {
    width: '100%',
    maxWidth: 480,
  },
  card: {
    background: 'white',
    borderRadius: 16,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid',
    overflow: 'hidden',
  },
  header: {
    padding: '32px 24px',
    textAlign: 'center' as const,
  },
  iconCircle: {
    width: 80,
    height: 80,
    background: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    margin: 0,
  },
  body: {
    padding: 24,
  },
  infoBox: {
    background: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    margin: '0 0 2px 0',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 500,
    color: '#0f172a',
    margin: 0,
  },
  footer: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: 16,
    marginTop: 16,
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    margin: 0,
  },
}
