import { useContext, useEffect, useRef } from 'react';
import styles from '../styles/MobileSounds.module.css';
import ReactDOM from 'react-dom';
import { AudioFile } from '../pages/Create';
import { IoBookmarkOutline } from 'react-icons/io5';
import { MdDelete } from 'react-icons/md';
import { IoBookmark } from 'react-icons/io5';
import { AuthContext } from '../Contexts';

type MobileSoundsProps = {
  setShowMobile: React.Dispatch<
    React.SetStateAction<{
      coverPhoto: boolean;
      sounds: boolean;
      volume: boolean;
    }>
  >;
  soundCategory: 'local' | 'saved';
  setSoundCategory: React.Dispatch<React.SetStateAction<'local' | 'saved'>>;
  sounds: AudioFile[];
  playingIndex: string;
  handleCurrentSound: (soundId: string) => () => void;
  handlePlayingSound: (soundId: string) => () => void;
  handleSavedSounds: (soundId: string) => () => void;
  deleteSound: (soundId: string) => () => void;
  setAddSounds: React.Dispatch<React.SetStateAction<boolean>>;
  fileRef: React.MutableRefObject<HTMLInputElement>;
  setPauseVideo: React.Dispatch<React.SetStateAction<boolean>>;
  setPlayingIndex: React.Dispatch<React.SetStateAction<string>>;
  audioRef: React.MutableRefObject<HTMLAudioElement>;
};

const MobileSounds = ({
  setShowMobile,
  soundCategory,
  setAddSounds,
  setPauseVideo,
  setSoundCategory,
  sounds,
  playingIndex,
  handleCurrentSound,
  handlePlayingSound,
  handleSavedSounds,
  deleteSound,
  fileRef,
  setPlayingIndex,
  audioRef,
}: MobileSoundsProps) => {
  const { user } = useContext(AuthContext);
  const containerRef = useRef<HTMLDivElement>(null!);

  const savedSounds: AudioFile[] = user.reelSounds;
  const target = document.getElementById('sounds-portal') || document.body;

  useEffect(() => {
    containerRef.current.animate(
      {
        height: ['0', `${containerRef.current.scrollHeight + 50}px`],
      },
      {
        fill: 'both',
        duration: 150,
      }
    );
  }, []);

  return ReactDOM.createPortal(
    <section className={styles.section}>
      <div className={styles['filter-container']} ref={containerRef}>
        <span className={styles['container-head']}>Sounds</span>

        <div className={styles['add-sound-container']}>
          <div className={styles['sound-category-container']}>
            <ul className={styles['sound-category-list']}>
              <li
                className={`${styles['sound-category-item']} ${
                  soundCategory === 'local'
                    ? styles['current-sound-category']
                    : ''
                }`}
                onClick={() => setSoundCategory('local')}
              >
                Local
              </li>

              <li
                className={`${styles['sound-category-item']} ${
                  soundCategory === 'saved'
                    ? styles['current-sound-category']
                    : ''
                }`}
                onClick={() => setSoundCategory('saved')}
              >
                Saved
              </li>
            </ul>

            <div className={styles['sound-category-div']}>
              {soundCategory === 'local' &&
                sounds.length > 0 &&
                sounds.map((file, index) => (
                  <article
                    key={`${Math.random()}-${index}`}
                    className={styles['sound-box']}
                  >
                    <span
                      className={`${styles['sound-details']} ${
                        playingIndex === file.id ? styles['playing-sound'] : ''
                      }`}
                      onClick={handlePlayingSound(file.id)}
                    >
                      <span className={styles['sound-name']}>{file.name}</span>
                      <span className={styles['sound-duration']}>
                        {file.duration}
                      </span>
                    </span>

                    <span className={styles['sound-btn-box']}>
                      <button
                        className={styles['sound-use-button']}
                        onClick={handleCurrentSound(file.id)}
                      >
                        {file.current ? 'Remove' : 'Use'}
                      </button>

                      {file.savedId ? (
                        <IoBookmark
                          className={styles['sound-save-icon']}
                          onClick={handleSavedSounds(file.id)}
                        />
                      ) : (
                        <IoBookmarkOutline
                          className={styles['sound-save-icon']}
                          onClick={handleSavedSounds(file.id)}
                        />
                      )}
                    </span>

                    <MdDelete
                      className={styles['sound-icon']}
                      onClick={deleteSound(file.id)}
                      title="Delete Sound"
                    />
                  </article>
                ))}

              {soundCategory === 'saved' &&
                savedSounds.length > 0 &&
                savedSounds.map((file, index) => (
                  <article
                    key={`${Math.random()}-${index}`}
                    className={styles['sound-box']}
                  >
                    <span
                      className={`${styles['sound-details']} ${
                        playingIndex === file.id ? styles['playing-sound'] : ''
                      }`}
                      onClick={handlePlayingSound(file.id)}
                    >
                      <span className={styles['sound-name']}>{file.name}</span>
                      <span className={styles['sound-duration']}>
                        {file.duration}
                      </span>
                    </span>

                    <span className={styles['sound-btn-box']}>
                      <button className={styles['sound-use-button']}>
                        Use
                      </button>
                      <IoBookmark
                        className={styles['sound-save-icon']}
                        onClick={handleSavedSounds(file.id)}
                      />
                    </span>
                  </article>
                ))}
            </div>
          </div>

          {soundCategory === 'local' && sounds.length === 0 && (
            <div className={styles['add-sound-btn-div']}>
              <span className={styles['add-sound-txt']}>
                You can select multiple songs and pick one to use
              </span>

              <button
                className={styles['add-sound-btn']}
                onClick={() => {
                  fileRef.current.click();
                  setPauseVideo(true);
                }}
              >
                Select from computer
              </button>
            </div>
          )}

          {soundCategory === 'saved' && savedSounds.length === 0 && (
            <span className={styles['add-sound-txt2']}>
              You have no saved songs
            </span>
          )}
        </div>

        <div className={styles['close-btn-box']}>
          <button
            className={styles['close-btn2']}
            onClick={() => {
              setAddSounds(true);
              fileRef.current.click();
              setPauseVideo(true);
            }}
          >
            Add sound
          </button>

          <button
            className={styles['close-btn']}
            onClick={() => {
              audioRef.current.src = '';
              setPlayingIndex(null!);
              setShowMobile((prev) => ({ ...prev, sounds: false }));
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

export default MobileSounds;
