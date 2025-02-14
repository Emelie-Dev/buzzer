import NavBar from '../components/NavBar';
import styles from '../styles/Settings.module.css';

const Settings = () => {
  return (
    <>
      <NavBar page="settings" />

      <section className={styles.main}>
        <section className={styles['left-section']}>
          <h1 className={styles['left-section-head']}>Settings</h1>
        </section>
      </section>
    </>
  );
};

export default Settings;
