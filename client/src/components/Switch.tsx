import styles from '../styles/Switch.module.css';

type SwitchProps = {
  setter: React.Dispatch<React.SetStateAction<boolean>>;
  value: boolean;
};

const Switch = ({ value, setter }: SwitchProps) => {
  return (
    <label className={styles.switch}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => setter(e.target.checked)}
      />
      <span className={styles.slider}></span>
    </label>
  );
};

export default Switch;
