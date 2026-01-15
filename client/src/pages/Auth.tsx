import { useEffect, useState, useRef, useContext } from 'react';
import styles from '../styles/Auth.module.css';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebookSquare } from 'react-icons/fa';
import { IoMdEye, IoMdEyeOff } from 'react-icons/io';
import { useLocation, useNavigate } from 'react-router-dom';
import { GeneralContext } from '../Contexts';
import { debounce, apiClient } from '../Utilities';
import LoadingAnimation from '../components/LoadingAnimation';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

type AuthProps = {
  leftStatus?: 'signin' | 'forgot' | 'reset';
};

type SignupType = {
  username: string;
  email: string;
  password: string;
};

type SigninType = {
  email: string;
  password: string;
};

type statusType = {
  username: 'empty' | 'invalid' | 'loading' | 'exist' | 'valid' | 'error';
  email: 'empty' | 'invalid' | 'loading' | 'exist' | 'valid' | 'error';
  password: 'empty' | 'valid' | 'invalid';
};

type AuthValidType = {
  signup: boolean;
  signin: boolean;
  forgot?: boolean;
  reset?: boolean;
};

const checkFieldAvailability = async (
  ...data: unknown[]
): Promise<statusType> => {
  const [field, value, status, setter] = data;
  const state = status as statusType;
  const stateSetter = setter as React.Dispatch<
    React.SetStateAction<statusType>
  >;

  stateSetter((prevValue) => ({
    ...prevValue,
    [field as string]: 'loading',
  }));

  try {
    await apiClient(`v1/auth/check-data/${field}/${value}`);
    return { ...state, [field as string]: 'valid' };
  } catch (err: any) {
    if (!err.response || err.response?.status !== 409) {
      return { ...state, [field as string]: 'error' };
    } else {
      return { ...state, [field as string]: 'exist' };
    }
  }
};

const fieldValidator = debounce(checkFieldAvailability, 300);

const Auth = ({ leftStatus = 'signin' }: AuthProps) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const addAccount = queryParams.get('add') === 'true';
  const error = queryParams.get('error');
  const errorType = queryParams.get('type');
  const errorCode = queryParams.get('code');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [signupData, setSignupData] = useState<SignupType>({
    username: '',
    email: '',
    password: '',
  });
  const [signinData, setSigninData] = useState<SigninType>({
    email: '',
    password: '',
  });
  const [dataStatus, setDataStatus] = useState<statusType>({
    username: 'empty',
    email: 'empty',
    password: 'empty',
  });
  const [authValid, setAuthValid] = useState<AuthValidType>({
    signin: false,
    signup: false,
  });
  const [showPassword, setShowPassword] = useState<AuthValidType>({
    signup: false,
    signin: false,
  });
  const [loading, setLoading] = useState<AuthValidType>({
    signup: false,
    signin: false,
    forgot: false,
    reset: false,
  });
  const [resetData, setResetData] = useState<string>('');

  const { setShowSearchPage } = useContext(GeneralContext);
  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const emailRef = useRef<HTMLInputElement>(null!);
  const checkBoxRef = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    document.title = 'Buzzer - Authentication';

    const checkUserAuth = async () => {
      try {
        await apiClient('v1/auth/auth-check');
        navigate('/home');
        // eslint-disable-next-line no-empty
      } catch {}
    };

    if (!addAccount) checkUserAuth();

    if (error === 'Google' || error === 'Facebook') {
      if (errorType === 'signin' || errorType === 'signup') {
        if (errorCode === '409') {
          toast.error('This user already exists!');
        } else if (errorCode === '404') {
          toast.error(
            `There’s no account linked to this ${error} login. You can link it in your settings.`
          );
        } else if (errorCode === '403') {
          toast.error(
            'Finish setting up your account by clicking the verification link in the email we sent you!'
          );
        } else if (errorCode === '406') {
          toast.error(`There’s no email linked to this ${error} login.`);
        } else {
          toast.error(
            `An error occurred while signing ${
              errorType === 'signup' ? 'up' : 'in'
            } with ${error}.`
          );
        }
      }
    }

    return () => {
      setShowSearchPage(false);
      navigate(location.pathname, { replace: true });
    };
  }, []);

  useEffect(() => {
    const { email, password } = signinData;

    const validateData = () => {
      if (email.trim().length >= 1 && password.length >= 1) {
        setAuthValid({ ...authValid, signin: true });
      } else {
        setAuthValid({ ...authValid, signin: false });
      }
    };

    validateData();
  }, [signinData]);

  useEffect(() => {
    const validateData = () => {
      if (resetData.trim().length >= 1) {
        setAuthValid({ ...authValid, [leftStatus]: true });
      } else {
        setAuthValid({ ...authValid, [leftStatus]: false });
      }
    };

    validateData();
  }, [resetData]);

  const addToRef =
    (ref: React.MutableRefObject<HTMLInputElement[]>) =>
    (el: HTMLInputElement) => {
      if (el && !ref.current.includes(el)) {
        ref.current.push(el);
      }
    };

  const validateData = async (
    type: 'username' | 'email' | 'password',
    signupData: SignupType
  ) => {
    const { username, email, password } = signupData;
    let newData: statusType = { ...dataStatus };

    if (type === 'username') {
      if (username.length === 0) {
        newData = { ...newData, username: 'empty' };
      } else if (username.match(/\W/g)) {
        newData = { ...newData, username: 'invalid' };
      } else {
        newData = (await fieldValidator(
          'username',
          signupData.username,
          dataStatus,
          setDataStatus
        )) as statusType;
      }
    } else if (type === 'email') {
      if (email.length === 0) {
        newData = { ...newData, email: 'empty' };
      } else if (!emailRef.current.validity.valid) {
        newData = { ...newData, email: 'invalid' };
      } else {
        newData = (await fieldValidator(
          'email',
          signupData.email,
          dataStatus,
          setDataStatus
        )) as statusType;
      }
    } else {
      if (password.length === 0) {
        newData = { ...newData, password: 'empty' };
        checkBoxRef.current.forEach(
          (el: HTMLInputElement) => (el.checked = false)
        );
      } else {
        if (password.match(/[A-z]/) && password.match(/[0-9]/))
          checkBoxRef.current[0].checked = true;
        else checkBoxRef.current[0].checked = false;

        if (password.match(/\W/)) checkBoxRef.current[1].checked = true;
        else checkBoxRef.current[1].checked = false;

        if (password.length >= 8) checkBoxRef.current[2].checked = true;
        else checkBoxRef.current[2].checked = false;

        const isValid = checkBoxRef.current.every(
          (el: HTMLInputElement) => el.checked
        );

        if (isValid) newData = { ...newData, password: 'valid' };
        else newData = { ...newData, password: 'invalid' };
      }
    }

    setDataStatus(newData);
    setAuthValid({
      ...authValid,
      signup: Object.values(newData).every((field) => field === 'valid'),
    });
  };

  const handleAuth =
    (type: 'signup' | 'signin') =>
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!authValid[type]) return;

      const { username, email, password } =
        type === 'signup' ? signupData : (signinData as SignupType);

      setLoading((prevValue) => ({ ...prevValue, [type]: true }));

      try {
        const response = await apiClient.post(
          `v1/auth/${type === 'signup' ? type : 'login'}`,
          {
            username,
            email,
            password,
            addAccount,
          }
        );

        if (type === 'signup') {
          setSignupData({
            username: '',
            email: '',
            password: '',
          });
          setDataStatus({
            username: 'empty',
            email: 'empty',
            password: 'empty',
          });
        } else {
          setSigninData({
            email: '',
            password: '',
          });
        }

        if (type === 'signup' || response.data.signin)
          toast.success(response.data.message);
        else navigate('/home');
      } catch (err: any) {
        if (!err.response) {
          toast.error(
            `Could not ${
              type === 'signup' ? 'create account' : 'sign in'
            }. Please Try again.`
          );
        } else {
          toast.error(err.response.data.message);

          if (err.response.data.data.emailError) {
            setSignupData({
              username: '',
              email: '',
              password: '',
            });

            setSigninData({
              email: '',
              password: '',
            });

            setDataStatus({
              username: 'empty',
              email: 'empty',
              password: 'empty',
            });

            setAuthMode('signin');
            setAuthValid({
              signin: false,
              signup: false,
            });

            checkBoxRef.current.forEach(
              (el: HTMLInputElement) => (el.checked = false)
            );
          }
        }
      } finally {
        setLoading((prevValue) => ({ ...prevValue, [type]: false }));
      }
    };

  const handlePassword =
    (type: 'forgot' | 'reset') =>
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!authValid[type]) return;

      setLoading((prevValue) => ({ ...prevValue, [type]: true }));

      const field = type === 'forgot' ? 'email' : 'password';
      const url =
        type === 'forgot'
          ? 'forgot-password'
          : `reset-password/${searchParams.get('token')}`;

      try {
        const response = await apiClient.post(`v1/auth/${url}`, {
          [field]: resetData,
        });

        toast.success(response.data.message, {
          duration: 3000,
        });

        if (type === 'reset') setTimeout(() => navigate('/auth'), 3000);
      } catch (err: any) {
        if (!err.response) {
          toast.error('Could not complete request. Please Try again');
        } else {
          toast.error(err.response.data.message);
        }
      } finally {
        setLoading((prevValue) => ({ ...prevValue, [type]: false }));
      }
    };

  const handleOAuth =
    (type: typeof authMode, provider: 'google' | 'facebook') => async () => {
      setLoading((prevValue) => ({ ...prevValue, [type]: true }));

      try {
        const { data } = await apiClient.post(
          `v1/auth/oauth/${provider}${type === 'signup' ? '?signup=true' : ''}`
        );
        return navigate(data.data.url);
      } catch {
        setLoading((prevValue) => ({ ...prevValue, [type]: false }));
        return toast.error(
          `An error occurred while signing ${
            type === 'signup' ? 'up' : 'in'
          } with ${provider[0].toUpperCase()}${provider.slice(1)}.`
        );
      }
    };

  return (
    <section className={styles.body}>
      <div
        className={`${styles['container']} ${
          authMode === 'signup' ? styles['right-panel-active'] : ''
        }`}
      >
        <div
          className={`${styles['form-container']} ${styles['sign-up-container']}`}
        >
          <form className={styles.form} onSubmit={handleAuth('signup')}>
            <div className={styles['logo-head']}>
              <img
                src="../../assets/logo.png"
                alt="Buzzer Logo"
                className={styles.logo}
              />
              <span className={styles['logo-text']}>Buzzer</span>
            </div>

            <div className={styles['form-div']}>
              <h1 className={styles.head}>Create Account</h1>
              <div className={styles['social-container']}>
                <span
                  className={`${styles['social']}`}
                  onClick={handleOAuth('signup', 'google')}
                >
                  <FcGoogle className={styles.google} />
                </span>
                <span
                  className={`${styles['social']}`}
                  onClick={handleOAuth('signup', 'facebook')}
                >
                  <FaFacebookSquare className={styles.facebook} />
                </span>
              </div>
              <span className={styles.span}>
                or use your email for registration
              </span>
              <span className={styles['input-box']}>
                {' '}
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Username"
                  value={signupData.username}
                  onChange={(e) => {
                    setSignupData({ ...signupData, username: e.target.value });
                    validateData('username', {
                      ...signupData,
                      username: e.target.value,
                    });
                  }}
                  maxLength={50}
                />
                <span
                  className={`${styles['input-text']}  ${
                    dataStatus.username === 'exist' ||
                    dataStatus.username === 'invalid' ||
                    dataStatus.username === 'error'
                      ? styles['invalid-text']
                      : dataStatus.username === 'loading'
                      ? styles['loading-text']
                      : dataStatus.username === 'valid'
                      ? styles['valid-text']
                      : ''
                  } `}
                >
                  {dataStatus.username === 'exist'
                    ? 'This username already exists.'
                    : dataStatus.username === 'error'
                    ? 'Could not verify username. Try again.'
                    : dataStatus.username === 'invalid'
                    ? 'This username is invalid.'
                    : dataStatus.username === 'loading'
                    ? 'Checking username....'
                    : dataStatus.username === 'valid'
                    ? 'This username is available.'
                    : ''}
                </span>
              </span>

              <span className={styles['input-box']}>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="Email"
                  value={signupData.email}
                  onChange={(e) => {
                    setSignupData({ ...signupData, email: e.target.value });
                    validateData('email', {
                      ...signupData,
                      email: e.target.value,
                    });
                  }}
                  ref={emailRef}
                />

                <span
                  className={`${styles['input-text']}  ${
                    dataStatus.email === 'exist' ||
                    dataStatus.email === 'invalid' ||
                    dataStatus.email === 'error'
                      ? styles['invalid-text']
                      : dataStatus.email === 'loading'
                      ? styles['loading-text']
                      : dataStatus.email === 'valid'
                      ? styles['valid-text']
                      : ''
                  } `}
                >
                  {dataStatus.email === 'exist'
                    ? 'This email already exists.'
                    : dataStatus.email === 'error'
                    ? 'Could not verify email. Try again.'
                    : dataStatus.email === 'invalid'
                    ? 'This email is invalid.'
                    : dataStatus.email === 'loading'
                    ? 'Checking email....'
                    : dataStatus.email === 'valid'
                    ? 'This email is available.'
                    : ''}
                </span>
              </span>

              <span className={styles['input-box']}>
                <span className={styles['input-span']}>
                  <input
                    className={styles.input2}
                    type={showPassword.signup ? 'text' : 'password'}
                    placeholder="Password"
                    value={signupData.password}
                    onChange={(e) => {
                      setSignupData({
                        ...signupData,
                        password: e.target.value,
                      });
                      validateData('password', {
                        ...signupData,
                        password: e.target.value,
                      });
                    }}
                  />

                  {showPassword.signup ? (
                    <IoMdEye
                      className={styles['eye-icon']}
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          signup: !showPassword.signup,
                        })
                      }
                    />
                  ) : (
                    <IoMdEyeOff
                      className={styles['eye-icon']}
                      onClick={() =>
                        setShowPassword({
                          ...showPassword,
                          signup: !showPassword.signup,
                        })
                      }
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
              </span>

              <span className={styles['alt-auth']}>
                Already have an account?
                <span
                  className={styles['alt-link']}
                  onClick={() => setAuthMode('signin')}
                >
                  Sign in
                </span>
              </span>

              <span className={styles['loader-box']}>
                <button
                  className={`${styles.button} ${styles['btn']} ${
                    !authValid.signup || loading.signup || loading.signin
                      ? styles['disable-btn']
                      : ''
                  }`}
                  type="submit"
                >
                  <span
                    className={`${loading.signup ? styles['hide-text'] : ''}`}
                  >
                    Sign up
                  </span>
                </button>

                {loading.signup ? (
                  <LoadingAnimation className={styles['loading-animation']} />
                ) : (
                  ''
                )}
              </span>
            </div>
          </form>
        </div>

        {leftStatus === 'signin' ? (
          <div
            className={`${styles['form-container']} ${styles['sign-in-container']}`}
          >
            <form className={styles.form} onSubmit={handleAuth('signin')}>
              <div className={styles['logo-head']}>
                <img
                  src="../../assets/logo.png"
                  alt="Buzzer Logo"
                  className={styles.logo}
                />
                <span className={styles['logo-text']}>Buzzer</span>
              </div>

              <div className={styles['form-div']}>
                <h1 className={styles.head}>Sign in</h1>
                <div className={styles['social-container']}>
                  <span
                    className={`${styles['social']}`}
                    onClick={handleOAuth('signin', 'google')}
                  >
                    <FcGoogle className={styles.google} />
                  </span>
                  <span
                    className={`${styles['social']}`}
                    onClick={handleOAuth('signin', 'facebook')}
                  >
                    <FaFacebookSquare className={styles.facebook} />
                  </span>
                </div>
                <span className={styles.span}>or use your account</span>
                <span className={styles['input-box']}>
                  <input
                    className={styles.input}
                    type="email"
                    placeholder="Email"
                    value={signinData.email}
                    onChange={(e) =>
                      setSigninData({ ...signinData, email: e.target.value })
                    }
                  />
                </span>
                <span className={styles['input-box']}>
                  <span className={styles['input-span']}>
                    <input
                      className={styles.input2}
                      type={showPassword.signin ? 'text' : 'password'}
                      placeholder="Password"
                      value={signinData.password}
                      onChange={(e) =>
                        setSigninData({
                          ...signinData,
                          password: e.target.value,
                        })
                      }
                    />

                    {showPassword.signin ? (
                      <IoMdEye
                        className={styles['eye-icon']}
                        onClick={() =>
                          setShowPassword({
                            ...showPassword,
                            signin: !showPassword.signin,
                          })
                        }
                      />
                    ) : (
                      <IoMdEyeOff
                        className={styles['eye-icon']}
                        onClick={() =>
                          setShowPassword({
                            ...showPassword,
                            signin: !showPassword.signin,
                          })
                        }
                      />
                    )}
                  </span>
                </span>

                <a className={styles.link} href="/forgot-password">
                  Forgot your password?
                </a>
                <span className={styles['alt-auth']}>
                  Don't have an account?{' '}
                  <span
                    className={styles['alt-link']}
                    onClick={() => setAuthMode('signup')}
                  >
                    Sign up
                  </span>
                </span>

                <span className={styles['loader-box']}>
                  <button
                    className={`${styles.button} ${styles['btn']} ${
                      !authValid.signin || loading.signin || loading.signup
                        ? styles['disable-btn']
                        : ''
                    }`}
                    type="submit"
                  >
                    <span
                      className={`${loading.signin ? styles['hide-text'] : ''}`}
                    >
                      Sign In
                    </span>
                  </button>

                  {loading.signin ? (
                    <LoadingAnimation className={styles['loading-animation']} />
                  ) : (
                    ''
                  )}
                </span>
              </div>
            </form>
          </div>
        ) : leftStatus === 'forgot' ? (
          <div
            className={`${styles['form-container']} ${styles['sign-in-container']}`}
          >
            <form className={styles.form} onSubmit={handlePassword('forgot')}>
              <div className={styles['logo-head']}>
                <img
                  src="../../assets/logo.png"
                  alt="Buzzer Logo"
                  className={styles.logo}
                />
                <span className={styles['logo-text']}>Buzzer</span>
              </div>

              <div className={styles['form-div']}>
                <h1 className={styles.head2}>Forgot password</h1>

                <span className={styles['password-text']}>
                  Enter your email address:
                </span>

                <span
                  className={`${styles['input-box']} ${styles['input-box2']}`}
                >
                  <input
                    className={styles.input}
                    type="email"
                    placeholder="Email"
                    value={resetData}
                    onChange={(e) => setResetData(e.target.value)}
                  />
                </span>

                <span className={styles['loader-box']}>
                  <button
                    className={`${styles.button} ${styles['btn']} ${
                      !authValid.forgot || loading.forgot || loading.signup
                        ? styles['disable-btn']
                        : ''
                    }`}
                    type="submit"
                  >
                    <span
                      className={`${loading.forgot ? styles['hide-text'] : ''}`}
                    >
                      Next
                    </span>
                  </button>

                  {loading.forgot ? (
                    <LoadingAnimation className={styles['loading-animation']} />
                  ) : (
                    ''
                  )}
                </span>
              </div>
            </form>
          </div>
        ) : (
          <div
            className={`${styles['form-container']} ${styles['sign-in-container']}`}
          >
            <form className={styles.form} onSubmit={handlePassword('reset')}>
              <div className={styles['logo-head']}>
                <img
                  src="../../assets/logo.png"
                  alt="Buzzer Logo"
                  className={styles.logo}
                />
                <span className={styles['logo-text']}>Buzzer</span>
              </div>

              <div className={styles['form-div']}>
                <h1 className={styles.head2}>Reset password</h1>

                <span className={styles['password-text']}>
                  Enter your new password:
                </span>

                <span className={styles['input-box']}>
                  <span className={styles['input-span']}>
                    <input
                      className={styles.input2}
                      type={showPassword.reset ? 'text' : 'password'}
                      placeholder="Password"
                      value={resetData}
                      onChange={(e) => setResetData(e.target.value)}
                    />

                    {showPassword.reset ? (
                      <IoMdEye
                        className={styles['eye-icon']}
                        onClick={() =>
                          setShowPassword({
                            ...showPassword,
                            reset: !showPassword.reset,
                          })
                        }
                      />
                    ) : (
                      <IoMdEyeOff
                        className={styles['eye-icon']}
                        onClick={() =>
                          setShowPassword({
                            ...showPassword,
                            reset: !showPassword.reset,
                          })
                        }
                      />
                    )}
                  </span>
                </span>

                <span className={styles['loader-box']}>
                  <button
                    className={`${styles.button} ${styles['btn']} ${
                      !authValid.reset || loading.reset || loading.signup
                        ? styles['disable-btn']
                        : ''
                    }`}
                    type="submit"
                  >
                    <span
                      className={`${loading.reset ? styles['hide-text'] : ''}`}
                    >
                      Done
                    </span>
                  </button>

                  {loading.reset ? (
                    <LoadingAnimation className={styles['loading-animation']} />
                  ) : (
                    ''
                  )}
                </span>
              </div>
            </form>
          </div>
        )}

        <div className={styles['overlay-container']}>
          <div className={styles['overlay']}>
            <div
              className={`${styles['overlay-panel']} ${styles['overlay-left']}`}
            >
              <h1 className={styles.head}>
                {leftStatus === 'forgot'
                  ? 'Need a New Password?'
                  : leftStatus === 'reset'
                  ? 'Pick a New Password'
                  : 'Welcome Back!'}
              </h1>
              <p className={styles.paragraph}>
                {leftStatus === 'forgot'
                  ? `No worries — just enter your email and we’ll send you a link to reset your password and get you back in.`
                  : leftStatus === 'reset'
                  ? `Set a new password and jump right back into the buzz with your friends.`
                  : `Sign in to reconnect and catch up on all the latest buzz with
                friends and community.`}
              </p>
              <button
                className={`${styles['ghost']} ${styles.button}`}
                onClick={() => setAuthMode('signin')}
              >
                {leftStatus === 'forgot'
                  ? 'Forgot Password'
                  : leftStatus === 'reset'
                  ? 'Reset Password'
                  : 'Sign In'}
              </button>
            </div>

            <div
              className={`${styles['overlay-panel']} ${styles['overlay-right']}`}
            >
              <h1 className={styles.head}>Hello, Friend!</h1>
              <p className={styles.paragraph}>
                Join the buzz! Enter your details to start your journey with us.
              </p>
              <button
                className={`${styles['ghost']} ${styles.button}`}
                onClick={() => setAuthMode('signup')}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Auth;
