import { useEffect, useRef, useState } from 'react';
import styles from '../styles/AccountSettings.module.css';
import Switch from './Switch';
import CropPhoto from './CropPhoto';

type AccountSettingsProps = {
  category: string;
};

const AccountSettings = ({ category }: AccountSettingsProps) => {
  return <>{category === 'profile' && <EditProfile />}</>;
};

const EditProfile = () => {
  const [displayEmail, setDisplayEmail] = useState<boolean>(false);
  const [cropPhoto, setCropPhoto] = useState<{ value: boolean; src: string }>({
    value: false,
    src: '',
  });

  const fileRef = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    return () => {
      if (cropPhoto.src) URL.revokeObjectURL(cropPhoto.src);
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];

      if (file.size > 1_073_741_824) return;

      const fileURL = URL.createObjectURL(file);
      setCropPhoto({ value: true, src: fileURL });
    }
  };

  return (
    <>
      <section className={styles.section}>
        <h1 className={styles['section-head']}>Edit Profile</h1>

        <input
          className={styles['file-input']}
          type="file"
          ref={fileRef}
          onChange={handleFileUpload}
        />

        <div className={styles.category}>
          <span className={styles['category-head']}>Profile Photo</span>

          <div className={styles['photo-div']}>
            <img
              className={styles['profile-photo']}
              src="../../assets/images/users/user14.jpeg"
            />

            <div className={styles['btn-div']}>
              <button className={styles['remove-btn']}>Remove</button>
              <button
                className={styles['change-btn']}
                onClick={() => fileRef.current.click()}
              >
                Change
              </button>
            </div>
          </div>
        </div>

        <div className={styles.category}>
          <span className={styles['category-head']}>Username</span>

          <div className={styles['username-div']}>
            <input className={styles.username} maxLength={50} />

            <span className={styles['username-text']}>
              Usernames can only contain letters, numbers and underscore.
            </span>
          </div>
        </div>

        <div className={styles.category}>
          <span className={styles['category-head']}>Name</span>

          <div className={styles['username-div']}>
            <input className={styles.username} />
          </div>
        </div>

        <div className={styles.category}>
          <span className={styles['category-head']}>Email</span>

          <div className={styles['username-div']}>
            <input className={styles.username} />
          </div>
        </div>

        <div className={styles.category}>
          <span className={styles['category-head']}>Bio</span>

          <div className={styles['username-div']}>
            <textarea className={styles.bio} maxLength={150}></textarea>
          </div>
        </div>

        <div className={styles.category}>
          <span className={styles['category-head']}>Links</span>

          <div className={styles['username-div']}>
            <span className={styles['link-box']}>
              <span className={styles['link-name']}>Website:</span>
              <input className={styles['link-value']} />
            </span>

            <span className={styles['link-box']}>
              <span className={styles['link-name']}>Youtube:</span>
              <input className={styles['link-value']} />
            </span>

            <span className={styles['link-box']}>
              <span className={styles['link-name']}>Instagram:</span>
              <input className={styles['link-value']} />
            </span>
          </div>
        </div>

        <div className={`${styles.category} ${styles['display-email']}`}>
          Display your email on your profile page.
          <Switch value={displayEmail} setter={setDisplayEmail} />
        </div>

        <div className={styles['save-btn-div']}>
          <button className={styles['save-btn']}>Save</button>
        </div>
      </section>

      {cropPhoto.value && (
        <CropPhoto src={cropPhoto.src} setCropPhoto={setCropPhoto} />
      )}
    </>
  );
};

export default AccountSettings;
