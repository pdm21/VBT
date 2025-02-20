import styles from "./MetricInput.module.css";

interface MetricInputProps {
  label: string;
  value: number | string;
  onChange: (newValue: string) => void;
}

export default function MetricInput({ label, value, onChange }: MetricInputProps) {
  return (
    <div className={styles.metricContainer}>
      <label className={styles.label}>{label}</label>
      <input
        type="number"
        className={styles.inputBox}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

