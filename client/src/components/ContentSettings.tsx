import styles from '../styles/ContentSettings.module.css';

type ContentSettingsProps = {
  category: string;
};

const ContentSettings = ({ category }: ContentSettingsProps) => {
  return <>{category === 'notifications' ? <Notifications /> : ''}</>;
};

const Notifications = () => {
  return (
    <section className={styles.section}>
      <h1 className={styles['section-head']}>Notifications</h1>
    </section>
  );
};

export default ContentSettings;
