"use client";
import { useState } from "react";
import { useRouter } from "next/navigation" 
import styles from "./dashboard.module.css"


export default function Dashboard() {
  const router = useRouter();

  const handleHome = () => {
    // if someone clicks the home button, navigate Home
    router.push("/home")
  
  }

  return (
    // remove styles on main after page is setup (just for dev purposes)
    <main className={styles.main}>
      {/* home button div */}
      <div className={styles.homeButtonDiv}>
        <button className={styles.homeButton} onClick={handleHome}>HOME</button> 
      </div>

      {/* live dashboard div */}
      <div className={styles.liveDashboard}>
        <h1>Live Dashboard</h1>  
      </div>

      
    </main>
  );
}
