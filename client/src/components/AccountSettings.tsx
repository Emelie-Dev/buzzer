import { useContext, useEffect, useRef, useState } from 'react';
import styles from '../styles/AccountSettings.module.css';
import Switch from './Switch';
import CropPhoto from './CropPhoto';
import { IoMdEye, IoMdEyeOff } from 'react-icons/io';
import { SettingsContext } from '../Contexts';
import { IoArrowBack } from 'react-icons/io5';

type AccountSettingsProps = {
  category: string;
};

type DisableAccountProps = {
  type: string;
};

const AccountSettings = ({ category }: AccountSettingsProps) => {
  return (
    <>
      {category === 'profile' ? (
        <EditProfile />
      ) : category === 'password' ? (
        <ChangePassword />
      ) : (
        <DisableAccount type={category} />
      )}
    </>
  );
};

const EditProfile = () => {
  const [displayEmail, setDisplayEmail] = useState<boolean>(false);
  const [cropPhoto, setCropPhoto] = useState<{ value: boolean; src: string }>({
    value: false,
    src: '',
  });

  const { setMainCategory } = useContext(SettingsContext);

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
        <h1 className={styles['section-head']}>
          <IoArrowBack
            className={styles['back-icon']}
            onClick={() => setMainCategory('')}
          />
          Edit Profile
        </h1>

        <input
          className={styles['file-input']}
          type="file"
          ref={fileRef}
          accept={'image/*'}
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

const ChangePassword = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');

  const { setMainCategory } = useContext(SettingsContext);

  const checkBoxRef = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (checkBoxRef.current.length > 0) {
      if (newPassword.match(/[A-z]/) && newPassword.match(/[0-9]/))
        checkBoxRef.current[0].checked = true;
      else checkBoxRef.current[0].checked = false;

      if (newPassword.match(/\W/)) checkBoxRef.current[1].checked = true;
      else checkBoxRef.current[1].checked = false;

      if (newPassword.length >= 8) checkBoxRef.current[2].checked = true;
      else checkBoxRef.current[2].checked = false;
    }
  }, [newPassword]);

  const addToRef =
    (ref: React.MutableRefObject<HTMLInputElement[]>) =>
    (el: HTMLInputElement) => {
      if (el && !ref.current.includes(el)) {
        ref.current.push(el);
      }
    };

  return (
    <section className={styles.section}>
      <h1 className={styles['section-head']}>
        <IoArrowBack
          className={styles['back-icon']}
          onClick={() => setMainCategory('')}
        />
        Change Password
      </h1>

      <div className={styles.category}>
        <span className={styles['category-head']}>Current Password</span>

        <div className={styles['username-div']}>
          <input className={styles.username} />
        </div>
      </div>

      <div className={styles.category}>
        <span className={styles['category-head']}>New Password</span>

        <div className={styles['username-div']}>
          <span className={styles['input-box']}>
            <input
              className={styles.password}
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            {showPassword ? (
              <IoMdEye
                className={styles['eye-icon']}
                onClick={() => setShowPassword(!showPassword)}
              />
            ) : (
              <IoMdEyeOff
                className={styles['eye-icon']}
                onClick={() => setShowPassword(!showPassword)}
              />
            )}
          </span>

          <div className={styles['criteria-container']}>
            <span className={styles['criteria-box']}>
              <input
                type="checkbox"
                className={styles['criteria-checkbox']}
                onChange={(e) => e.preventDefault()}
                ref={addToRef(checkBoxRef)}
              />
              <label className={styles['criteria-label']}>
                Must contain a letter and a digit.
              </label>
            </span>

            <span className={styles['criteria-box']}>
              <input
                type="checkbox"
                className={styles['criteria-checkbox']}
                onChange={(e) => e.preventDefault()}
                ref={addToRef(checkBoxRef)}
              />
              <label className={styles['criteria-label']}>
                Must contain a special character.
              </label>
            </span>
            <span className={styles['criteria-box']}>
              <input
                type="checkbox"
                className={styles['criteria-checkbox']}
                onChange={(e) => e.preventDefault()}
                ref={addToRef(checkBoxRef)}
              />
              <label className={styles['criteria-label']}>
                Must be at least 8 characters or more.
              </label>
            </span>
          </div>
        </div>
      </div>

      <div className={styles.category}>
        <span className={styles['category-head']}>Verification Code</span>

        <span className={styles['verification-text']}>
          To change your password, enter the six-digit code sent to your email
          address.
        </span>

        <div className={styles['verification-box']}>
          <input
            type="number"
            className={styles['verification-input']}
            onChange={(e) => {
              if (e.target.value.length > 6) {
                e.target.value = `${e.target.value.slice(0, 6)}`;
              }
            }}
          />

          <span className={styles['resend-box']}>
            <span className={styles['resend-text']}>Resend Code</span>{' '}
            <span className={styles['resend-time']}>30s</span>
          </span>
        </div>
      </div>
    </section>
  );
};

const DisableAccount = ({ type }: DisableAccountProps) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [Password, setPassword] = useState<string>('');

  const { setMainCategory } = useContext(SettingsContext);

  const [stage, setStage] = useState<'password' | 'token'>('password');

  useEffect(() => setStage('password'), [type]);

  return (
    <section className={styles.section}>
      <h1 className={styles['section-head']}>
        <IoArrowBack
          className={styles['back-icon']}
          onClick={() => setMainCategory('')}
        />
        {type === 'delete' ? 'Delete' : 'Deactivate'} Account
      </h1>

      {stage === 'password' ? (
        <div className={styles['info-div']}>
          <span className={styles['info-head']}>
            If you {type === 'delete' ? 'delete' : 'deactivate'} your account:
          </span>

          {type === 'delete' ? (
            <ul className={styles['info-list']}>
              <li className={styles['info-item']}>
                You will not be able to log in or access any Buzzer services
                with this account.
              </li>
              <li className={styles['info-item']}>
                All your contents and other data will be permanently deleted.
              </li>
              <li className={styles['info-item']}>
                Account deletion is permanent and cannot be undone, so please
                proceed with caution.
              </li>
            </ul>
          ) : (
            <ul className={styles['info-list']}>
              <li className={styles['info-item']}>
                Your account and content will no longer be visible to anyone.
              </li>
              <li className={styles['info-item']}>
                Buzzer will keep your data so you can easily recover it when you
                reactivate your account.
              </li>
              <li className={styles['info-item']}>
                You can log back in anytime to reactivate your account and
                restore all your content.
              </li>
            </ul>
          )}

          <div className={styles['disable-password-box']}>
            <span className={styles['disable-password-text']}>
              Enter your password to continue.
            </span>

            <span className={styles['input-box']}>
              <input
                className={styles.password}
                type={showPassword ? 'text' : 'password'}
                value={Password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {showPassword ? (
                <IoMdEye
                  className={styles['eye-icon']}
                  onClick={() => setShowPassword(!showPassword)}
                />
              ) : (
                <IoMdEyeOff
                  className={styles['eye-icon']}
                  onClick={() => setShowPassword(!showPassword)}
                />
              )}
            </span>
          </div>

          <div className={styles['disable-btn-div']}>
            <button
              className={styles['disable-btn']}
              onClick={() => setStage('token')}
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <div className={`${styles.category} ${styles['disable-category']}`}>
          <span className={styles['category-head']}>Verification Code</span>

          <span className={styles['verification-text']}>
            Enter the verification code sent to your email address to{' '}
            {type === 'delete' ? 'delete' : 'deactivate'} your account.
          </span>

          <div className={styles['verification-box']}>
            <input
              type="number"
              className={styles['verification-input']}
              onChange={(e) => {
                if (e.target.value.length > 6) {
                  e.target.value = `${e.target.value.slice(0, 6)}`;
                }
              }}
            />

            <span className={styles['resend-box']}>
              <span className={styles['resend-text']}>Resend Code</span>{' '}
              <span className={styles['resend-time']}>30s</span>
            </span>
          </div>

          <div className={styles['account-btn-div']}>
            <button
              className={styles['cancel-btn']}
              onClick={() => setStage('password')}
            >
              Cancel
            </button>
            <button className={styles['delete-btn']}>
              {type === 'delete' ? 'Delete' : 'Deactivate'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default AccountSettings;
