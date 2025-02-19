import styles from "./styles/page.module.css"

export default function Home() {
  return (
    <main>
      {/* Welcome Header */}
      <div className={styles.welcomeHeader}>
        <p className={styles.welcomeText}>Welcome</p>
      </div>

      {/* Middle Area */}
      <div className={styles.middleDiv}></div>

      {/* Bottom Div */}
      <div className={styles.bottomDiv}>
        <button className={styles.startButton}>Start</button>
        <button className={styles.resetButton}>Reset</button>
      </div>
    </main>
  );
}