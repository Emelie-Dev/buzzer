import styles from '../styles/Profile.module.css';
import NavBar from '../components/NavBar';

const Profile = () => {
  return (
    <>
      <NavBar page="profile" />

      <section className={styles.main}>
        <section className={styles.section}></section>

        <section className={styles.aside}></section>
      </section>
    </>
  );
};
export default Profile;
