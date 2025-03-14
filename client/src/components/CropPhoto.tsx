import AvatarEditor from 'react-avatar-editor';
import styles from '../styles/CropPhoto.module.css';
import { IoClose } from 'react-icons/io5';
import ReactDOM from 'react-dom';
import { useEffect, useState } from 'react';

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
  const [avatarSize, setAvatarSize] = useState<{ border: number; dim: number }>(
    { border: 50, dim: 350 }
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.matchMedia('(max-width: 400px)').matches) {
        setAvatarSize({ dim: Number(`${window.innerWidth - 40}`), border: 5 });
      } else if (window.matchMedia('(max-width: 500px)').matches) {
        setAvatarSize({ dim: 325, border: 20 });
      } else if (window.matchMedia('(max-width: 600px)').matches) {
        setAvatarSize({ dim: 350, border: 30 });
      } else if (window.matchMedia('(max-width: 700px)').matches) {
        setAvatarSize({ dim: 350, border: 40 });
      } else {
        setAvatarSize({ border: 50, dim: 350 });
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
            width={avatarSize.dim}
            height={avatarSize.dim}
            border={avatarSize.border}
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
