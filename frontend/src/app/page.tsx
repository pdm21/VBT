import styles from "./styles/page.module.css"

export default function Home() {
  return (
    <main>
      {/* Welcome Header */}
      <div className={styles.welcomeHeader}>
        {/* Empty left div for spacing */}
        <div className={styles.leftDiv}></div>  

        {/* Centered text div */}
        <div className={styles.centerDiv}>
          <p className={styles.welcomeText}>Welcome</p>
        </div>

        {/* Right div with logo aligned right */}
        <div className={styles.rightDiv}>
          <img src="/logo.png" alt="VBT Logo" className={styles.logo} />
        </div>
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