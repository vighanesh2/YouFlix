import styles from "./ProfileAvatar.module.css";

interface Props {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

export default function ProfileAvatar({ name, color, size = "md" }: Props) {
  return (
    <div
      className={`${styles.avatar} ${styles[size]}`}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      <div className={styles.face}>
        <div className={styles.eyes}>
          <span className={styles.eye} />
          <span className={styles.eye} />
        </div>
        <span className={styles.mouth} />
      </div>
      <span className={styles.srOnly}>{name}</span>
    </div>
  );
}
