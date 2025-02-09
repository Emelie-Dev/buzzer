import styles from '../styles/UploadDetails.module.css';
import { useEffect, useRef, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { IoArrowBack } from 'react-icons/io5';
import { FaPlay } from 'react-icons/fa';
import { getDurationText } from '../Utilities';

export type ReelDetails = {
  video: string | ArrayBuffer | null;
  sound: string | undefined;
  duration: number[];
  coverPhoto: string;
};

type UploadReelDetailsProps = {
  data: ReelDetails;
  setStage: React.Dispatch<
    React.SetStateAction<{
      reel: 'select' | 'edit' | 'finish';
      content: 'select' | 'edit' | 'finish';
    }>
  >;
};

const UploadReelDetails = ({ data, setStage }: UploadReelDetailsProps) => {
  const { video, sound, duration, coverPhoto } = data;
  const [generalDescription, setGeneralDescription] = useState<string>('');
  const [collaborator, setCollaborator] = useState<string>('');
  const [pauseVideo, setPauseVideo] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [durationValues, setDurationValues] = useState<number[]>([
    0,
    Math.floor(duration[1]) - Math.floor(duration[0]),
  ]);
  const [isProgressChanging, setIsProgressChanging] = useState<boolean>(false);

  const collaboratorRef = useRef<HTMLInputElement>(null!);
  const videoRef = useRef<HTMLVideoElement>(null!);
  const progressRef = useRef<HTMLInputElement>(null!);
  const audioRef = useRef<HTMLAudioElement>(null!);

  useEffect(() => {
    if (videoRef.current) videoRef.current.currentTime = duration[0];
  }, []);

  useEffect(() => {
    if (pauseVideo) {
      videoRef.current.pause();
      audioRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [pauseVideo]);

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.background = `linear-gradient(to right, white ${progress}%, gray ${progress}%)`;
    }
  }, [progress]);

  const handleProgressUpdate = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLVideoElement;
    const currentTime = target.currentTime - duration[0];

    if (!isProgressChanging)
      setProgress((currentTime / (duration[1] - duration[0])) * 100);

    setDurationValues(() => {
      return [Math.max(Math.floor(currentTime), 0), durationValues[1]];
    });

    if (target.currentTime >= duration[1]) {
      setPauseVideo(true);
      setTimeout(() => (videoRef.current.currentTime = duration[0]), 100);
    }
  };

  const seekMedia = () => {
    if (videoRef.current) {
      const currentTime =
        (progress / 100) * (duration[1] - duration[0]) + duration[0];

      setPauseVideo(false);
      videoRef.current.currentTime = currentTime;
      setIsProgressChanging(false);

      if (sound) {
        audioRef.current.currentTime = currentTime - duration[0];
        audioRef.current.play();
      }
    }
  };

  const playMusic = (e: React.SyntheticEvent) => {
    if (sound) {
      const target = e.target as HTMLVideoElement;
      const currentTime = target.currentTime - duration[0];

      audioRef.current.currentTime = currentTime;
      audioRef.current.play();
    }
  };

  return (
    <div className={styles['carousel-details-section']}>
      <div className={styles['video-container']}>
        <span
          className={styles['back-arrow-box']}
          onClick={() =>
            setStage((prevStage) => ({ ...prevStage, reel: 'edit' }))
          }
        >
          <IoArrowBack className={styles['back-arrow']} />
        </span>

        {pauseVideo && (
          <FaPlay
            className={styles['play-icon']}
            onClick={() => setPauseVideo(false)}
          />
        )}

        {coverPhoto && pauseVideo && (
          <img src={coverPhoto} className={styles['cover-photo']} />
        )}

        <video
          className={styles.video}
          ref={videoRef}
          onClick={() => setPauseVideo(!pauseVideo)}
          onTimeUpdate={handleProgressUpdate}
          onPlay={playMusic}
        >
          <source src={video as string} />
          Your browser does not support playing video.
        </video>

        <audio className={styles.audio} ref={audioRef}>
          <source src={sound} />
          Your browser does not support the audio element.
        </audio>

        <div className={styles['duration-box']}>
          <span>{getDurationText(durationValues[0])}</span>
          <span>{getDurationText(durationValues[1])}</span>
        </div>

        <input
          className={`${styles['progress-input']} ${
            isProgressChanging ? styles['progress-input2'] : ''
          }`}
          value={progress}
          type="range"
          min={0}
          max={100}
          ref={progressRef}
          onKeyDown={(e) => e.preventDefault()}
          onChange={(e) => {
            setIsProgressChanging(true);
            setProgress(Number(e.target.value));
          }}
          onClick={seekMedia}
        />
      </div>

      <div className={styles['upload-details-container']}>
        <div className={styles['description-container']}>
          <span className={styles['description-head']}>Description</span>

          <div className={styles['description-box']}>
            <div
              className={styles.description}
              contentEditable={true}
              onInput={(e) => {
                setGeneralDescription(e.currentTarget.textContent || '');
              }}
            ></div>

            {generalDescription.length === 0 && (
              <span className={styles.placeholder}>
                Add video description....
              </span>
            )}

            <div className={styles['description-details']}>
              <span className={styles['links-box']}>
                <span className={styles['mention-box']}>@ Mention</span>
                <span className={styles['hashtag-box']}># Hashtags</span>
              </span>

              <span className={styles['description-length']}>200/3000</span>
            </div>
          </div>
        </div>

        <div className={styles['collaborator-container']}>
          <span className={styles['collaborator-head']}>Add collaborators</span>

          <span className={styles['collaborators-box']}>
            <input
              type="text"
              className={styles['collaborators-input']}
              ref={collaboratorRef}
              placeholder="Search for user...."
              value={collaborator}
              onChange={(e) => setCollaborator(e.target.value)}
            />

            {collaborator.length > 0 && (
              <IoClose
                className={styles['clear-icon']}
                onClick={() => {
                  setCollaborator('');
                  collaboratorRef.current.focus();
                }}
              />
            )}
          </span>
        </div>

        <div className={styles['settings-container']}>
          <span className={styles['settings-head']}>Settings</span>

          <div className={styles['settings-div']}>
            <div className={styles['settings-box']}>
              <span className={styles['settings-box-head']}>
                Accessibility:
              </span>
              <select className={styles['accessibility-select']}>
                <option value={'everyone'}>Everyone</option>
                <option value={'friends'}>Friends</option>
                <option value={'only-you'}>Only you</option>
              </select>
            </div>

            <div className={styles['settings-box2']}>
              <input
                type="checkbox"
                id="views"
                className={styles['settings-checkbox']}
              />

              <label className={styles['settings-box-label']} htmlFor="views">
                Hide the like and view counts for this post
              </label>
            </div>

            <div className={styles['settings-box2']}>
              <input
                type="checkbox"
                id="comments"
                className={styles['settings-checkbox']}
              />

              <label
                className={styles['settings-box-label']}
                htmlFor="comments"
              >
                Disable comments on this post
              </label>
            </div>
          </div>
        </div>

        <div className={styles['post-btn-div']}>
          <button className={`${styles['post-btn']} ${styles['cancel-btn']}`}>
            Discard
          </button>

          <button className={styles['post-btn']}>Post</button>
        </div>
      </div>
    </div>
  );
};

export default UploadReelDetails;
