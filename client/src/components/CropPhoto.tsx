import AvatarEditor from 'react-avatar-editor';
import styles from '../styles/CropPhoto.module.css';
import { IoClose } from 'react-icons/io5';
import ReactDOM from 'react-dom';

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
  const target = document.getElementById('crop-portal') || document.body;

  return ReactDOM.createPortal(
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
            color={[255, 255, 255, 0.6]}
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
    </section>,
    target
  );
};

export default CropPhoto;
