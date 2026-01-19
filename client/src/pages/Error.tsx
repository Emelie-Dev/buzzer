import { useEffect } from 'react';
import styles from '../styles/Error.module.css';
import { Link } from 'react-router-dom';

type ErrorPageProps = {
  code?: number;
};

const ErrorPage = ({ code }: ErrorPageProps) => {
  useEffect(() => {
    document.title = `Buzzer - ${code === 404 ? 'Not Found' : 'Error'}`;
  }, [code]);

  return (
    <section className={styles.body}>
      <h1 className={styles.head}>Buzzer</h1>

      {code === 404 && (
        <div className={styles['code-container']}>
          <span>4</span>
          <span>0</span>
          <span>4</span>
        </div>
      )}

      <div
        className={`${styles.message} ${code !== 404 ? styles.message2 : ''}`}
      >
        {code === 404
          ? `The page you're trying to access doesn't exist or may have been moved.
        Check the link or go back to the home page.`
          : `Something went wrong. Please refresh the page to continue.`}
      </div>

      <div className={styles['btn-box']}>
        {code === 404 ? (
          <Link className={styles.btn} to={'/home'}>
            Home Page
          </Link>
        ) : (
          <button
            className={styles.btn}
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        )}
      </div>

      <footer className={styles.footer}>
        &#169; 2025 Buzzer. All rights reserved.
      </footer>
    </section>
  );
};

export default ErrorPage;
