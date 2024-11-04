import { UIEventHandler, useRef, useState } from 'react';
import NavBar from '../components/NavBar';
import styles from '../styles/Home.module.css';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { MdKeyboardArrowRight } from 'react-icons/md';

interface User {
  name: string;
}

interface Arrow {
  left: boolean;
  right: boolean;
}

const users: User[] = [
  { name: 'userOne' },
  { name: 'coolGuy' },
  { name: 'happy123' },
  { name: 'sunshineGirl' },
  { name: 'codeMaster' },
  { name: 'skyWalker' },
  { name: 'theArtist' },
  { name: 'jungleKing' },
  { name: 'dreamer_98' },
  { name: 'techieDude' },
  { name: 'cityExplorer' },
  { name: 'natureLover' },
  { name: 'mountainView' },
  { name: 'coffeeAddict' },
  { name: 'chefTom' },
  { name: 'oceanWave' },
  { name: 'bookworm101' },
  { name: 'fastRunner' },
  { name: 'digitalNomad' },
  { name: 'starGazer' },
];

const Home = () => {
  const [showArrow, setShowArrow] = useState<Arrow>({
    left: false,
    right: true,
  });

  const storyRef = useRef<HTMLDivElement>(null!);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    setShowArrow({
      left: target.scrollLeft > 50,
      right: !(
        target.scrollLeft + target.clientWidth >=
        target.scrollWidth - 5
      ),
    });
  };

  return (
    <>
      <NavBar page="home" />

      <section className={styles.main}>
        <section className={styles['main-container']}>
          <div
            className={styles['stories-container']}
            ref={storyRef}
            onScroll={handleScroll}
          >
            {showArrow.left && (
              <span
                className={styles['left-arrow-box']}
                onClick={() => (storyRef.current.scrollLeft -= 300)}
              >
                <MdKeyboardArrowLeft className={styles['left-arrow']} />
              </span>
            )}
            {users.map(({ name }, index) => (
              <article key={index} className={styles.user}>
                <span className={styles['user-pics-box']}>
                  <img
                    src={`../../assets/images/users/user${index + 1}.jpeg`}
                    alt={name}
                    className={styles['user-pics']}
                  />
                </span>

                <span className={styles['user-name']}>{name}</span>
              </article>
            ))}

            {showArrow.right && (
              <span
                className={styles['right-arrow-box']}
                onClick={() => (storyRef.current.scrollLeft += 300)}
              >
                <MdKeyboardArrowRight className={styles['right-arrow']} />
              </span>
            )}
          </div>
        </section>

        <section></section>
      </section>
    </>
  );
};

export default Home;
