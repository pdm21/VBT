"use client";
import { useState } from "react";
import styles from "./Dropdown.module.css";

interface DropdownProps {
  options: string[];
  onSelect: (option: string) => void;
}

export default function Dropdown({ options, onSelect }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.dropdown}>
      <button onClick={() => setIsOpen(!isOpen)} className={styles.dropdownButton}>
        Select an exercise ▼
      </button>

      {isOpen && (
        <ul className={styles.dropdownMenu}>
          {options.map((option, index) => (
            <li key={index} onClick={() => { onSelect(option); setIsOpen(false); }}>
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

