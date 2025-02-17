import AvatarEditor from 'react-avatar-editor';
import styles from '../styles/CropPhoto.module.css';
import { IoClose } from 'react-icons/io5';

type CropPhotoProps = {
  src: string;
  setCropPhoto: React.Dispatch<
    React.SetStateAction<{
      value: boolean;
      src: string;
    }>
  >;
};

const CropPhoto = ({ src, setCropPhoto }: CropPhotoProps) => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.head}>Crop Photo</h1>

          <span
            className={styles['close-icon-box']}
            onClick={() => {
              URL.revokeObjectURL(src);
              setCropPhoto({ value: false, src: '' });
            }}
          >
            <IoClose className={styles['close-icon']} title="Close" />
          </span>
        </header>

        <div className={styles['avatar-box']}>
          <AvatarEditor
            image={src}
            width={350}
            height={350}
            border={50}
            color={[255, 255, 255, 0.6]} // RGBA
            borderRadius={1000}
          />
        </div>

        <div className={styles['btn-div']}>
          <button
            className={styles['done-btn']}
            onClick={() => {
              URL.revokeObjectURL(src);
              setCropPhoto({ value: false, src: '' });
            }}
          >
            Done
          </button>
        </div>
      </div>
    </section>
  );
};

export default CropPhoto;
