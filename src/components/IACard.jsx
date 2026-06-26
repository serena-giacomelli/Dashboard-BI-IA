import styles from '../styles/IACard.module.css';

function IACard({ text, title = 'Resumen IA' }) {
  return (
    <article className={styles.card}>
      <span className={styles.icon} aria-hidden="true">✨</span>
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </article>);}

export default IACard;