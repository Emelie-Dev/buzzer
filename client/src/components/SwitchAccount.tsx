import styles from '../styles/SwitchAccount.module.css';

type SwitchAccountProps = {
  setSwitchAccount: React.Dispatch<React.SetStateAction<boolean>>;
};

const SwitchAccount = ({ setSwitchAccount }: SwitchAccountProps) => {
  return (
    <section
      className={styles.section}
      onClick={(e) => {
        if (e.target === e.currentTarget) setSwitchAccount(false);
      }}
    ></section>
  );
};

export default SwitchAccount;
