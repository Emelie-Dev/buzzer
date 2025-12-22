import { useContext, useEffect, useRef, useState } from 'react';
import styles from '../styles/AccountSettings.module.css';
import Switch from './Switch';
import CropPhoto from './CropPhoto';
import { IoMdEye, IoMdEyeOff } from 'react-icons/io';
import { AuthContext, SettingsContext } from '../Contexts';
import { IoArrowBack } from 'react-icons/io5';
import { apiClient, debounce, getUrl } from '../Utilities';
import { toast } from 'sonner';

type AccountSettingsProps = {
  category: string;
};

type DisableAccountProps = {
  type: string;
};

const checkFieldAvailability = async (...data: any[]) => {
  const [field, value, setter] = data;
  const stateSetter = setter as React.Dispatch<React.SetStateAction<any>>;

  try {
    await apiClient(`v1/auth/check-data/${field}/${value}`);
    stateSetter((prev: any) => ({
      ...prev,
      [field as string]: {
        message: '',
        checking: false,
      },
    }));
  } catch (err: any) {
    if (!err.response || err.response?.status !== 409) {
      stateSetter((prev: any) => ({
        ...prev,
        [field as string]: {
          message: `Could not verify ${field}. Try again.`,
          checking: false,
        },
      }));
    } else {
      stateSetter((prev: any) => ({
        ...prev,
        [field as string]: {
          message: `This ${field} already exists.`,
          checking: false,
        },
      }));
    }
  }
};

const fieldValidator = debounce(checkFieldAvailability, 300);

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
  const { user, setUser } = useContext(AuthContext);
  const { setMainCategory } = useContext(SettingsContext);
  const [displayEmail, setDisplayEmail] = useState<boolean>(
    user.settings.account.emailVisibility
  );
  const [cropPhoto, setCropPhoto] = useState<{ value: boolean; src: string }>({
    value: false,
    src: '',
  });
  const [profilePhoto, setProfilePhoto] = useState<{
    src: string;
    file: File;
    remove: boolean;
  }>({ src: getUrl(user.photo, 'users'), file: null!, remove: false });
  const [accountData, setAccountData] = useState<{
    username: string;
    name: string;
    email: string;
    bio: string;
    links: {
      website: string;
      youtube: string;
      instagram: string;
    };
  }>({
    username: user.username,
    name: user.name,
    email: user.email,
    bio: user.bio,
    links: user.links,
  });
  const [errorMessage, setErrorMessage] = useState<{
    username: {
      message: string;
      checking: boolean;
    };
    email: {
      message: string;
      checking: boolean;
    };
  }>({
    username: { message: '', checking: false },
    email: { message: '', checking: false },
  });
  const [loading, setLoading] = useState(false);
  const [changed, setChanged] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null!);
  const emailRef = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    return () => {
      if (cropPhoto.src) URL.revokeObjectURL(cropPhoto.src);
    };
  }, []);

  useEffect(() => {
    // Validate email
    if (accountData.email !== user.email) {
      if (accountData.email.length === 0) {
        setErrorMessage((prev) => ({
          ...prev,
          email: {
            message: 'Please provide a value for the email.',
            checking: false,
          },
        }));
      } else if (!emailRef.current.validity.valid) {
        setErrorMessage((prev) => ({
          ...prev,
          email: { message: 'Please provide a valid email.', checking: false },
        }));
      } else {
        setErrorMessage((prev) => ({
          ...prev,
          email: { message: '', checking: true },
        }));
        fieldValidator('email', accountData.email, setErrorMessage);
      }
    } else {
      setErrorMessage((prev) => ({
        ...prev,
        email: { message: '', checking: false },
      }));
    }
  }, [accountData.email, user]);

  useEffect(() => {
    // Validate username
    if (accountData.username !== user.username) {
      if (accountData.username.length === 0) {
        setErrorMessage((prev) => ({
          ...prev,
          username: {
            message: 'Please provide a value for the username.',
            checking: false,
          },
        }));
      } else if (accountData.username.match(/\W/g)) {
        setErrorMessage((prev) => ({
          ...prev,
          username: {
            message:
              'Username must consist of letters, numbers, and underscores only.',
            checking: false,
          },
        }));
      } else {
        setErrorMessage((prev) => ({
          ...prev,
          username: { message: '', checking: true },
        }));
        fieldValidator('username', accountData.username, setErrorMessage);
      }
    } else {
      setErrorMessage((prev) => ({
        ...prev,
        username: { message: '', checking: false },
      }));
    }
  }, [accountData.username, user]);

  useEffect(() => {
    const photoChanged = profilePhoto.remove || profilePhoto.file;
    const emailVisibilityChanged =
      displayEmail !== user.settings.account.emailVisibility;
    let fieldChanged = false;

    for (const prop in accountData) {
      if (prop === 'links') {
        for (const field in accountData.links) {
          if (
            accountData.links[field as 'website' | 'youtube' | 'instagram'] !==
            user.links[field]
          ) {
            fieldChanged = true;
            break;
          }
        }
      } else {
        if (
          accountData[prop as 'username' | 'name' | 'email' | 'bio'] !==
          user[prop]
        ) {
          fieldChanged = true;
          break;
        }
      }
    }

    if (photoChanged || emailVisibilityChanged || fieldChanged) {
      setChanged(true);
    } else {
      setChanged(false);
    }
  }, [accountData, profilePhoto, displayEmail, user]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      e.target.files = new DataTransfer().files;

      if (file.size > 1_073_741_824) {
        return toast.error('The file exceeds the size limit.');
      }

      const fileURL = URL.createObjectURL(file);
      setCropPhoto({ value: true, src: fileURL });
    }
  };

  const isDefaultPhoto = () => {
    if (
      user.photo ===
        'https://res.cloudinary.com/dtwsoibt0/image/upload/v1765614386/default.jpg' ||
      user.photo === 'default.jpg'
    )
      return true;

    return;
  };

  const updateProfile = async () => {
    setLoading(true);

    try {
      const formData = new FormData();

      if (profilePhoto.remove) {
        formData.append('removePhoto', String(true));
      } else if (profilePhoto.file) {
        formData.append('photo', profilePhoto.file);
      }

      formData.append('username', accountData.username);
      formData.append('name', accountData.name);
      formData.append('email', accountData.email);
      formData.append('bio', accountData.bio);
      formData.append('links', JSON.stringify(accountData.links));
      formData.append('emailVisibility', String(displayEmail));

      const { data } = await apiClient.patch(
        'v1/users/settings/account',
        formData
      );

      setUser(data.data.user);
      setProfilePhoto({
        src: getUrl(data.data.user.photo, 'users'),
        file: null!,
        remove: false,
      });
      return toast.success('Profile updated successfully!');
    } catch (err: any) {
      const message = 'Could not update profile.';
      if (err.response) {
        return toast.error(err.response.data.message || message);
      } else {
        return toast.error(message);
      }
    } finally {
      setLoading(false);
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
            <img className={styles['profile-photo']} src={profilePhoto.src} />

            <div className={styles['btn-div']}>
              {profilePhoto.remove ? (
                <button
                  className={`${styles['remove-btn']}`}
                  onClick={() =>
                    setProfilePhoto({
                      src: getUrl(user.photo, 'users'),
                      file: null!,
                      remove: false,
                    })
                  }
                >
                  Cancel
                </button>
              ) : (
                <button
                  className={`${styles['remove-btn']} ${
                    isDefaultPhoto() ? styles['block-btn'] : ''
                  }`}
                  onClick={() =>
                    setProfilePhoto({
                      src: '../../assets/images/users/default.jpg',
                      file: null!,
                      remove: true,
                    })
                  }
                >
                  Remove
                </button>
              )}

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
            <input
              className={styles.username}
              maxLength={50}
              value={accountData.username}
              onChange={(e) =>
                setAccountData((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
            />

            {errorMessage.username.message ? (
              <span className={styles['error-text']}>
                {errorMessage.username.message}
              </span>
            ) : errorMessage.username.checking ? (
              <span className={styles['checking-text']}>
                Checking username....
              </span>
            ) : (
              ''
            )}
          </div>
        </div>

        <div className={styles.category}>
          <span className={styles['category-head']}>Name</span>

          <div className={styles['username-div']}>
            <input
              className={styles.username}
              maxLength={30}
              value={accountData.name}
              onChange={(e) =>
                setAccountData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className={styles.category}>
          <span className={styles['category-head']}>Email</span>

          <div className={styles['username-div']}>
            <input
              className={styles.username}
              type="email"
              maxLength={254}
              value={accountData.email}
              onChange={(e) =>
                setAccountData((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              ref={emailRef}
            />

            {errorMessage.email.message ? (
              <span className={styles['error-text']}>
                {errorMessage.email.message}
              </span>
            ) : errorMessage.email.checking ? (
              <span className={styles['checking-text']}>
                Checking email....
              </span>
            ) : (
              ''
            )}
          </div>
        </div>

        <div className={styles.category}>
          <span className={styles['category-head']}>Bio</span>

          <div className={styles['username-div']}>
            <textarea
              className={styles.bio}
              maxLength={150}
              rows={3}
              value={accountData.bio}
              onChange={(e) =>
                setAccountData((prev) => ({
                  ...prev,
                  bio: e.target.value,
                }))
              }
            ></textarea>
          </div>
        </div>

        <div className={styles.category}>
          <span className={styles['category-head']}>Links</span>

          <div className={styles['username-div']}>
            <span className={styles['link-box']}>
              <span className={styles['link-name']}>Website:</span>
              <input
                className={styles['link-value']}
                maxLength={255}
                value={accountData.links.website}
                onChange={(e) =>
                  setAccountData((prev) => ({
                    ...prev,
                    links: { ...prev.links, website: e.target.value },
                  }))
                }
              />
            </span>

            <span className={styles['link-box']}>
              <span className={styles['link-name']}>Youtube:</span>
              <input
                className={styles['link-value']}
                maxLength={255}
                value={accountData.links.youtube}
                onChange={(e) =>
                  setAccountData((prev) => ({
                    ...prev,
                    links: { ...prev.links, youtube: e.target.value },
                  }))
                }
              />
            </span>

            <span className={styles['link-box']}>
              <span className={styles['link-name']}>Instagram:</span>
              <input
                className={styles['link-value']}
                maxLength={255}
                value={accountData.links.instagram}
                onChange={(e) =>
                  setAccountData((prev) => ({
                    ...prev,
                    links: { ...prev.links, instagram: e.target.value },
                  }))
                }
              />
            </span>
          </div>
        </div>

        <div className={`${styles.category} ${styles['display-email']}`}>
          Display your email on your profile page.
          <Switch value={displayEmail} setter={setDisplayEmail} />
        </div>

        <div className={styles['save-btn-div']}>
          <button
            className={`${styles['save-btn']} ${
              !changed ||
              loading ||
              errorMessage.email.message ||
              errorMessage.username.message
                ? styles['loading-btn']
                : ''
            } `}
            onClick={updateProfile}
          >
            Save
          </button>
        </div>
      </section>

      {cropPhoto.value && (
        <CropPhoto
          src={cropPhoto.src}
          setCropPhoto={setCropPhoto}
          setProfilePhoto={setProfilePhoto}
        />
      )}
    </>
  );
};

const ChangePassword = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [code, setCode] = useState({ sent: false, sending: false });
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [token, setToken] = useState<string>('');

  const { setMainCategory } = useContext(SettingsContext);

  const checkBoxRef = useRef<HTMLInputElement[]>([]);
  const timerInterval = useRef<number>(null!);

  useEffect(() => {
    return () => {
      clearInterval(timerInterval.current);
    };
  }, []);

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

  useEffect(() => {
    if (timer === 60) {
      timerInterval.current = setInterval(
        () => setTimer((prev) => prev - 1),
        1000
      );
    }

    if (timer === 0) clearInterval(timerInterval.current);
  }, [timer]);

  const addToRef =
    (ref: React.MutableRefObject<HTMLInputElement[]>) =>
    (el: HTMLInputElement) => {
      if (el && !ref.current.includes(el)) {
        ref.current.push(el);
      }
    };

  const isDisabled = () => {
    const passwordValid = checkBoxRef.current.find((elem) => !elem.checked);
    return (
      !!passwordValid || loading || token.length < 6 || currentPassword === ''
    );
  };

  const getToken = async () => {
    setCode((prev) => ({ ...prev, sending: true }));

    try {
      const { data } = await apiClient('v1/users/password-token');
      setTimer(60);
      setCode({ sent: true, sending: false });
      return toast.success(data.message);
    } catch {
      setCode((prev) => ({ ...prev, sending: false }));
      return toast.error('An error occured while sending verification code.');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data } = await apiClient.patch('v1/users/password', {
        code: token,
        currentPassword,
        newPassword,
      });
      toast.success(data.message);

      return setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);
    } catch (err: any) {
      const message = 'Could not change password.';
      if (err.response) {
        return toast.error(err.response.data.message || message);
      } else {
        return toast.error(message);
      }
    } finally {
      setLoading(false);
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
          <input
            className={styles.username}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
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
            value={token}
            onChange={(e) => {
              if (e.target.value.length > 6) {
                setToken(`${e.target.value.slice(0, 6)}`);
              } else {
                setToken(e.target.value);
              }
            }}
          />

          <span className={styles['resend-box']}>
            <span
              className={`${styles['resend-text']} ${
                code.sending || timer > 0 ? styles['loading-btn'] : ''
              }`}
              onClick={getToken}
            >
              {code.sent ? 'Resend' : 'Send'} Code
            </span>

            {timer > 0 && (
              <span className={styles['resend-time']}>{timer}s</span>
            )}
          </span>
        </div>

        <br />
        <div className={styles['save-btn-div']}>
          <button
            className={`${styles['save-btn']} ${
              isDisabled() ? styles['loading-btn'] : ''
            } `}
            onClick={handleSubmit}
          >
            Change Password
          </button>
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
