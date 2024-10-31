import { useEffect, useState, useRef } from 'react';
import styles from '../styles/Auth.module.css';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebookSquare } from 'react-icons/fa';
import { IoMdEye, IoMdEyeOff } from 'react-icons/io';

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
  username: 'empty' | 'invalid' | 'loading' | 'exist' | 'valid';
  email: 'empty' | 'invalid' | 'loading' | 'exist' | 'valid';
  password: 'empty' | 'valid' | 'invalid';
};

type AuthValidType = {
  signup: boolean;
  signin: boolean;
};

const Auth = () => {
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

  const emailRef = useRef<HTMLInputElement>(null!);
  const checkBoxRef = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    document.title = 'Buzzer - Auth';
  }, []);

  useEffect(() => {
    const { username, email, password } = signupData;

    const validateData = () => {
      let newData: statusType = { ...dataStatus };

      if (username.length === 0) {
        newData = { ...newData, username: 'empty' };
      } else if (username.match(/\W/g)) {
        newData = { ...newData, username: 'invalid' };
      } else {
        newData = { ...newData, username: 'valid' };
      }

      if (email.length === 0) {
        newData = { ...newData, email: 'empty' };
      } else if (!emailRef.current.validity.valid) {
        newData = { ...newData, email: 'invalid' };
      } else {
        newData = { ...newData, email: 'valid' };
      }

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

      setDataStatus(newData);
      setAuthValid({
        ...authValid,
        signup: Object.values(newData).every((field) => field === 'valid'),
      });
    };

    validateData();
  }, [signupData]);

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

  const addToRef =
    (ref: React.MutableRefObject<HTMLInputElement[]>) =>
    (el: HTMLInputElement) => {
      if (el && !ref.current.includes(el)) {
        ref.current.push(el);
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
          <form className={styles.form} action="#">
            <div className={styles['logo-head']}>
              <img
                src="../../public/assets/logo.png"
                alt="Buzzer Logo"
                className={styles.logo}
              />
              <span className={styles['logo-text']}>Buzzer</span>
            </div>

            <div className={styles['form-div']}>
              <h1 className={styles.head}>Create Account</h1>
              <div className={styles['social-container']}>
                <span className={`${styles['social']}`}>
                  <FcGoogle className={styles.google} />
                </span>
                <span className={`${styles['social']}`}>
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
                  onChange={(e) =>
                    setSignupData({ ...signupData, username: e.target.value })
                  }
                  maxLength={50}
                />
                <span
                  className={`${styles['input-text']}  ${
                    dataStatus.username === 'exist' ||
                    dataStatus.username === 'invalid'
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
                  onChange={(e) =>
                    setSignupData({ ...signupData, email: e.target.value })
                  }
                  ref={emailRef}
                />

                <span
                  className={`${styles['input-text']}  ${
                    dataStatus.email === 'exist' ||
                    dataStatus.email === 'invalid'
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
                    onChange={(e) =>
                      setSignupData({ ...signupData, password: e.target.value })
                    }
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

              <button
                className={`${styles.button} ${styles['btn']} ${
                  !authValid.signup ? styles['disable-btn'] : ''
                }`}
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
        <div
          className={`${styles['form-container']} ${styles['sign-in-container']}`}
        >
          <form className={styles.form} action="#">
            <div className={styles['logo-head']}>
              <img
                src="../../public/assets/logo.png"
                alt="Buzzer Logo"
                className={styles.logo}
              />
              <span className={styles['logo-text']}>Buzzer</span>
            </div>

            <div className={styles['form-div']}>
              <h1 className={styles.head}>Sign in</h1>
              <div className={styles['social-container']}>
                <span className={`${styles['social']}`}>
                  <FcGoogle className={styles.google} />
                </span>
                <span className={`${styles['social']}`}>
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
                      setSigninData({ ...signinData, password: e.target.value })
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
              <a href="#" className={styles.link}>
                Forgot your password?
              </a>
              <button
                className={`${styles.button} ${styles['btn']} ${
                  !authValid.signin ? styles['disable-btn'] : ''
                }`}
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
        <div className={styles['overlay-container']}>
          <div className={styles['overlay']}>
            <div
              className={`${styles['overlay-panel']} ${styles['overlay-left']}`}
            >
              <h1 className={styles.head}>Welcome Back!</h1>
              <p className={styles.paragraph}>
                Sign in to reconnect and catch up on all the latest buzz with
                friends and community.
              </p>
              <button
                className={`${styles['ghost']} ${styles.button}`}
                onClick={() => setAuthMode('signin')}
              >
                Sign In
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
