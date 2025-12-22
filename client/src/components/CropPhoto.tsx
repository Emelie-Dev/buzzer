import AvatarEditor from 'react-avatar-editor';
import styles from '../styles/CropPhoto.module.css';
import { IoClose } from 'react-icons/io5';
import ReactDOM from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type CropPhotoProps = {
  src: string;
  setCropPhoto: React.Dispatch<
    React.SetStateAction<{
      value: boolean;
      src: string;
    }>
  >;
  setProfilePhoto: React.Dispatch<
    React.SetStateAction<{
      src: string;
      file: File;
      remove: boolean;
    }>
  >;
};

const CropPhoto = ({ src, setCropPhoto, setProfilePhoto }: CropPhotoProps) => {
  const target = document.getElementById('crop-portal') || document.body;
  const [avatarSize, setAvatarSize] = useState<{ border: number; dim: number }>(
    { border: 50, dim: 350 }
  );

  const editorRef = useRef<AvatarEditor | null>(null);

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

  const handlePhotoCrop = async () => {
    try {
      await new Promise((resolve, reject) => {
        if (editorRef.current) {
          const canvas = editorRef.current.getImageScaledToCanvas();
          if (!canvas) return reject();

          canvas.toBlob(
            (blob) => {
              if (!blob) return reject();

              const file = new File([blob], 'profile-photo', {
                type: 'image/jpeg',
              });

              setProfilePhoto({
                src: URL.createObjectURL(file),
                file,
                remove: false,
              });
              resolve(null);
            },
            'image/jpeg',
            0.9
          );
        } else reject();
      });
    } catch {
      return toast.error('Could not crop photo.');
    } finally {
      URL.revokeObjectURL(src);
      setCropPhoto({ value: false, src: '' });
    }
  };

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
            ref={editorRef}
            image={src}
            width={avatarSize.dim}
            height={avatarSize.dim}
            border={avatarSize.border}
            color={[255, 255, 255, 0.6]}
            borderRadius={1000}
          />
        </div>

        <div className={styles['btn-div']}>
          <button className={styles['done-btn']} onClick={handlePhotoCrop}>
            Done
          </button>
        </div>
      </div>
    </section>,
    target
  );
};

export default CropPhoto;
