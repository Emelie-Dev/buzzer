import styles from '../styles/PostLoader.module.css';

type PostLoaderProps = {
  postStage: {
    value: 'preparing' | 'validating' | 'processing' | 'saving' | 'finish';
    filesIndexes: Set<number>;
    percent: number;
  };
  postProgress: number;
  postLength: number;
  postType: 'Content' | 'Reel' | 'Story';
};

const PostLoader = ({
  postStage,
  postProgress,
  postLength,
  postType,
}: PostLoaderProps) => {
  const fileText = postLength === 1 ? 'File' : 'Files';
  const stage =
    postStage.value === 'preparing'
      ? `Preparing ${fileText}`
      : postStage.value === 'validating'
      ? `Validating ${fileText}`
      : postStage.value === 'processing'
      ? `Processing ${fileText}`
      : `Saving ${postType}`;

  return (
    <section
      className={`${styles.section}  ${
        postType === 'Reel' ? styles['reel-section'] : ''
      }`}
    >
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
