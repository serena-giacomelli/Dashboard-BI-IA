import '../styles/Global.css'; // Importamos el diseño unificado

function Detail() {
  return (
    <section className="cifas-page">
      <header className="cifas-header">
        <h1>Gestión Estratégica</h1>
      </header>

      <div className="cifas-card">
        <p className="cifas-card__description" style={{ fontSize: '14px', lineHeight: '1.6', color: '#334155', margin: 0 }}>
          Esta vista centraliza el análisis operativo y los comentarios de apoyo para la toma de decisiones.
        </p>
      </div>
    </section>
  );}

export default Detail;