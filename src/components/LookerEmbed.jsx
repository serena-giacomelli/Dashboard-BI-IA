import styles from '../styles/LookerEmbed.module.css';

function LookerEmbed({
  src,
  width = 600,
  height = 338,
  sandbox = 'allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation',
}) {
  const handleOpenReport = () => {
    if (!src) return;

    window.open(src, '_blank', 'noopener,noreferrer');
  };

  const placeholderMarkup = `
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          :root { color-scheme: light; }
          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: linear-gradient(135deg, #eff4f8, #ffffff);
            color: #16324f;
            display: grid;
            place-items: center;
            min-height: 100vh;
            padding: 24px;
            box-sizing: border-box;
          }
          .card {
            width: min(680px, 100%);
            padding: 28px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.92);
            border: 1px solid #c8d2dd;
            box-shadow: 0 18px 48px rgba(16, 33, 51, 0.12);
          }
          h3 { margin: 0 0 10px; font-size: 1.25rem; }
          p { margin: 0; line-height: 1.7; color: #5f6f82; }
        </style>
      </head>
      <body>
        <div class="card">
          <h3>Vista de Looker lista para conectar</h3>
          <p>Reemplaza la URL del embed con el enlace real del reporte cuando esté disponible.</p>
        </div>
      </body>
    </html>
  `;

  return (
    <section className={styles.wrapper}>

      <div className={styles.frameShell}>
        <iframe
          className={styles.frame}
          src={src || undefined}
          width={width}
          height={height}
          frameBorder="0"
          style={{ border: 0 }}
          sandbox={sandbox}
          title="Looker embed"
          loading="lazy"
          allowFullScreen
          srcDoc={!src ? placeholderMarkup : undefined}
        />
      </div>
    </section>
  );
}

export default LookerEmbed;