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
    <main>
      <div className={styles.header}>
      <h1>Live Dashboard</h1>  
      </div>
      <button className={styles.startButton} onClick={handleHome}>Start</button> 
    </main>
  );
}
