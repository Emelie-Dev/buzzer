import styles from '../styles/Footer.module.css';
import { LuUserCheck } from 'react-icons/lu';
import { BsPlusSquareFill } from 'react-icons/bs';
import { FaUserCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

type FooterProps = {
  page: 'home' | 'following' | 'reels' | 'profile' | 'none';
};

const Footer = ({ page }: FooterProps) => {
  const navigate = useNavigate();

  return (
    <footer className={styles.footer}>
      <ul className={styles['footer-list']}>
        <li className={styles['footer-item']} onClick={() => navigate('/home')}>
          <span
            className={`${styles['item-box']} ${
              page === 'home' ? styles['active-item'] : ''
            }`}
          >
            {page === 'home' ? (
              <svg
                className={`${styles['item-icon']} ${styles['active-icon']}`}
                x="0px"
                y="0px"
                width="100"
                height="100"
                viewBox="0 0 24 24"
              >
                <path d="M 12 2.0996094 L 1 12 L 4 12 L 4 21 L 10 21 L 10 14 L 14 14 L 14 21 L 20 21 L 20 12 L 23 12 L 12 2.0996094 z"></path>
              </svg>
            ) : (
              <svg
                className={styles['item-icon']}
                x="0px"
                y="0px"
                width="100"
                height="100"
                viewBox="0 0 24 24"
              >
                <path
                  className={styles.path}
                  d="M 12 2.0996094 L 1 12 L 4 12 L 4 21 L 11 21 L 11 15 L 13 15 L 13 21 L 20 21 L 20 12 L 23 12 L 12 2.0996094 z M 12 4.7910156 L 18 10.191406 L 18 11 L 18 19 L 15 19 L 15 13 L 9 13 L 9 19 L 6 19 L 6 10.191406 L 12 4.7910156 z"
                ></path>
              </svg>
            )}
            Home
          </span>
        </li>
        <li
          className={styles['footer-item']}
          onClick={() => navigate('/following')}
        >
          <span
            className={`${styles['item-box']} ${
              page === 'following' ? styles['active-item'] : ''
            }`}
          >
            {page === 'following' ? (
              <FaUserCheck
                className={`${styles['item-icon']} ${styles['active-icon']}`}
              />
            ) : (
              <LuUserCheck className={styles['item-icon']} />
            )}
            Following
          </span>
        </li>
        <li
          className={styles['footer-item']}
          onClick={() => navigate('/create')}
        >
          <span className={styles['item-box']}>
            <BsPlusSquareFill className={styles['create-icon']} />
          </span>
        </li>
        <li
          className={styles['footer-item']}
          onClick={() => navigate('/reels')}
        >
          <span
            className={`${styles['item-box']} ${
              page === 'reels' ? styles['active-item'] : ''
            }`}
          >
            {page === 'reels' ? (
              <svg
                className={`${styles['item-icon']} ${styles['active-icon']}`}
                x="0px"
                y="0px"
                width="100"
                height="100"
                viewBox="0 0 48 48"
              >
                <path
                  className={styles['active-icon']}
                  d="M41.28,12.28c-0.4-0.43-4.476-0.606-5.28-1.28c-1.14-0.955-0.622-3.939-1.83-4.76	C37.42,6.96,40.07,9.25,41.28,12.28z"
                ></path>
                <path
                  className={styles['active-icon']}
                  d="M41.28,15.64L42,17v1.26c-1.26-1.71-10.459-9.858-14.289-11.668L29.7,6H32	c0.75,0,1.47,0.08,2.17,0.24c2.06,1.4,4.03,2.99,5.88,4.79c0.42,0.41,0.83,0.82,1.23,1.25c0.225,0.55,0.399,1.126,0.52,1.72	C41.8,14,41.28,14.957,41.28,15.64z"
                ></path>
                <path
                  className={styles['active-icon']}
                  d="M42,18.26v6.1C40.351,21.326,24.095,7.862,16.802,6.109c-0.183-0.044-0.285,0.03-0.456,0.001L16.7,6	h9.52l1.037,0.509c1.298,0.613,2.441,0.792,3.678,1.555c2.413,1.489,4.7,3.263,6.815,5.326C39.32,14.92,40.74,16.55,42,18.26z"
                ></path>
                <path
                  className={styles['active-icon']}
                  d="M42,24.36c0,0-0.02,8.69-0.05,8.64C40.46,27.51,9.3,8.79,9.06,8.81	c1.204-1.164,2.695-2.029,4.359-2.473C13.419,6.337,15.107,7,16,7c0,0,0.589-0.945,0.749-0.916	c6.827,1.245,13.366,4.457,18.711,9.656C38.13,18.34,40.31,21.25,42,24.36z"
                ></path>
                <path
                  className={styles['active-icon']}
                  d="M41.95,33c-0.2,2.06-1.03,3.93-2.3,5.43c-0.72-6.59-31.9-26.28-32.93-26.16	c0.53-1.32,1.33-2.5,2.34-3.46C9.3,8.79,9.54,8.78,9.78,8.78c8.41-0.11,16.87,2.98,23.38,9.32C37.53,22.35,40.46,27.51,41.95,33z"
                ></path>
                <path
                  className={styles['active-icon']}
                  d="M39.65,38.43v0.01c-0.87,1.03-1.93,1.87-3.14,2.48c-0.17-6.6-27.828-25.531-29.107-25.321	C7.417,15.019,6.089,14.552,6.2,14c0.121-0.599,0.296-1.178,0.52-1.73c1.03-0.12,2.06-0.19,3.1-0.2c7.58-0.1,15.19,2.68,21.05,8.39	C36,25.45,38.93,31.84,39.65,38.43z"
                ></path>
                <path
                  className={styles['active-icon']}
                  d="M33.24,41.92c0,0-25.95-23.12-27.24-22.88V17l0.876-1.319c1.28-0.21,1.704-0.301,2.994-0.321	c6.73-0.09,13.5,2.39,18.7,7.45c5.11,4.97,7.77,11.51,7.94,18.11C35.51,41.43,34.41,41.78,33.24,41.92z"
                ></path>
                <path
                  className={styles['active-icon']}
                  d="M33.24,41.36v0.56C32.84,41.97,32.42,42,32,42h-2.06C29.95,41.8,7.3,22.11,6,22.39v-3.35	c1.29-0.24,2.6-0.37,3.91-0.39c5.89-0.08,11.81,2.09,16.37,6.52C30.84,29.61,33.16,35.47,33.24,41.36z"
                ></path>
                <path
                  className={styles['active-icon']}
                  d="M29.95,41.4c0,0.2,0,0.4-0.01,0.6h-3.29c0.01-0.19-1.283-0.646-1.283-0.826	C25.317,36.964,11.4,24.34,6,25.77v-3.38c1.3-0.28,2.63-0.43,3.95-0.45c5.05-0.07,10.13,1.79,14.04,5.59	C27.89,31.33,29.89,36.35,29.95,41.4z"
                ></path>
                <path
                  className={styles['active-icon']}
                  d="M26.66,41.45c0,0.18,0,0.36-0.01,0.55h-3.28c0.01-0.17-1.156-0.982-1.156-1.152	C22.164,37.488,10.53,27.68,6,29.2v-3.43c5.4-1.43,11.39-0.07,15.69,4.11C24.95,33.05,26.61,37.24,26.66,41.45z"
                ></path>
                <path
                  className={styles['active-icon']}
                  d="M23.38,41.49c0,0.17,0,0.34-0.01,0.51h-3.29c0.09-2.68-10.44-10.96-14.05-9.26	C6.02,32.74,6,29.2,6,29.2c4.53-1.52,9.74-0.53,13.4,3.04C22,34.78,23.33,38.13,23.38,41.49z"
                ></path>
                <path
                  className={styles['active-icon']}
                  d="M16.78,42c0.1-1.82-7.44-7.47-9.93-5.97c-0.45-1.02-0.74-2.12-0.82-3.29	c3.61-1.7,8.05-1.09,11.07,1.86c2.08,2.02,3.07,4.72,2.98,7.4H16.78z"
                ></path>
                <path
                  className={styles['active-icon']}
                  d="M16.78,42H16c-0.86,0-1.69-0.11-2.49-0.32c0-0.86-3.62-3.57-4.85-2.9c-0.75-0.8-1.36-1.73-1.81-2.75	c2.49-1.5,5.78-1.2,7.96,0.93C16.22,38.33,16.88,40.18,16.78,42z"
                ></path>
                <path
                  className={styles['active-icon']}
                  d="M13.51,41.68c-1.89-0.48-3.57-1.5-4.85-2.9c1.23-0.67,2.8-0.49,3.85,0.53	C13.18,39.96,13.51,40.82,13.51,41.68z"
                ></path>
                <path
                  fill="#fff"
                  d="M42,16v1H6v-1c0-0.69,0.07-1.36,0.2-2h11.69l-4.47-7.66C14.24,6.12,15.11,6,16,6h0.7l4.66,8h9.53	l-4.67-8h3.48l4.66,8h7.44C41.93,14.64,42,15.31,42,16z"
                ></path>
                <path
                  fill="#fff"
                  d="M18,33.114v-9.228c0-1.539,1.666-2.502,2.999-1.732l7.998,4.614c1.334,0.77,1.334,2.695,0,3.465	l-7.998,4.614C19.666,35.616,18,34.653,18,33.114z"
                ></path>
              </svg>
            ) : (
              <svg
                className={styles['item-icon']}
                version="1.1"
                viewBox="0 0 100 100"
              >
                <defs></defs>
                <g
                  style={{
                    stroke: 'none',
                    strokeWidth: 0,
                    strokeDasharray: 'none',
                    strokeLinecap: 'butt',
                    strokeLinejoin: 'miter',
                    strokeMiterlimit: 10,
                    fill: 'none',
                    fillRule: 'nonzero',
                    opacity: 1,
                    transform:
                      'translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)}',
                  }}
                >
                  <linearGradient
                    id="SVGID_44"
                    gradientUnits="userSpaceOnUse"
                    x1="20.9489"
                    y1="70.2584"
                    x2="72.2486"
                    y2="16.3831"
                  >
                    <stop offset="0%" />
                    <stop offset="50%" />
                    <stop offset="100%" />
                  </linearGradient>
                  <path
                    d="M 61.692 0.878 H 28.307 C 12.699 0.878 0 13.577 0 29.186 v 31.629 c 0 15.608 12.699 28.307 28.307 28.307 h 33.385 C 77.301 89.121 90 76.423 90 60.814 V 29.186 C 90 13.577 77.301 0.878 61.692 0.878 z M 81.6 25.186 H 67.854 L 58.78 8.878 h 2.912 C 71.52 8.878 79.737 15.898 81.6 25.186 z M 39.888 25.186 L 30.815 8.878 h 18.811 l 9.073 16.307 H 39.888 z M 22.186 9.825 l 8.546 15.36 H 8.4 C 9.859 17.913 15.213 12.035 22.186 9.825 z M 61.692 81.121 H 28.307 C 17.11 81.121 8 72.012 8 60.814 V 33.186 h 74 v 27.629 C 82 72.012 72.89 81.121 61.692 81.121 z"
                    style={{
                      stroke: 'none',
                      strokeWidth: 1,
                      strokeDasharray: 'none',
                      strokeLinecap: 'butt',
                      strokeLinejoin: 'miter',
                      strokeMiterlimit: 10,
                      fillRule: 'nonzero',
                      opacity: 1,
                      transform: ' matrix(1 0 0 1 0 0) ',
                    }}
                    className={`${styles.path} `}
                    strokeLinecap="round"
                  />
                  <linearGradient
                    id="SVGID_45"
                    gradientUnits="userSpaceOnUse"
                    x1="24.1901"
                    y1="73.3447"
                    x2="75.4898"
                    y2="19.4693"
                  >
                    <stop offset="0%" />
                    <stop offset="50%" />
                    <stop offset="100%" />
                  </linearGradient>
                  <path
                    d="M 56.367 51.97 l -17.41 -9.305 c -2.366 -1.265 -5.227 0.45 -5.227 3.133 v 18.611 c 0 2.683 2.861 4.398 5.227 3.133 l 17.41 -9.305 C 58.871 56.898 58.871 53.309 56.367 51.97 z"
                    style={{
                      stroke: 'none',
                      strokeWidth: 1,
                      strokeDasharray: 'none',
                      strokeLinecap: 'butt',
                      strokeLinejoin: 'miter',
                      strokeMiterlimit: 10,
                      fillRule: 'nonzero',
                      opacity: 1,
                      transform: ' matrix(1 0 0 1 0 0) ',
                    }}
                    className={styles.path}
                    strokeLinecap="round"
                  />
                </g>
              </svg>
            )}
            Reels
          </span>
        </li>
        <li
          className={styles['footer-item']}
          onClick={() => navigate('/profile')}
        >
          <span
            className={`${styles['item-box']} ${
              page === 'profile' ? styles['active-item'] : ''
            }`}
          >
            <img
              className={`${styles['profile-img']} ${
                page === 'profile' ? styles['active-profile'] : ''
              }`}
              src="../../assets/images/users/user14.jpeg"
            />
            Profile
          </span>
        </li>
      </ul>
    </footer>
  );
};

export default Footer;
