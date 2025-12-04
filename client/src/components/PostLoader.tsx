import styles from '../styles/PostLoader.module.css';

type PostLoaderProps = {
  postStage: {
    value: 'preparing' | 'validating' | 'processing' | 'saving' | 'finish';
    filesIndexes: Set<number>;
  };
  postProgress: number;
};

const PostLoader = ({ postStage, postProgress }: PostLoaderProps) => {
  const stage =
    postStage.value === 'preparing'
      ? 'Preparing Files'
      : postStage.value === 'validating'
      ? 'Validating Files'
      : postStage.value === 'processing'
      ? 'Processing Files'
      : 'Saving Content';

  return (
    <section className={styles.section}>
      <div className={styles['liquid-loader']}>
        <div className={styles['loading-text']}>
          {stage}
          <span className={styles['dot']}>.</span>
          <span className={styles['dot']}>.</span>
          <span className={styles['dot']}>.</span>
        </div>

        <div className={styles['loader-track']}>
          <div className={styles['liquid-fill']}></div>
          <span className={styles.percentage}>{postProgress}%</span>
        </div>
      </div>
    </section>
  );
};

export default PostLoader;
