import styles from "./page.module.css"

export default function Home() {
  return (
    <main>
      <div className={styles.page}>Please rotate your device to landscape mode.</div>
      <div className="app-content">Your app UI here</div>
    </main>
  );
}