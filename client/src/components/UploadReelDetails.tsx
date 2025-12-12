import styles from '../styles/UploadDetails.module.css';
import { useEffect, useRef, useState } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { FaPlay } from 'react-icons/fa';
import {
  getDurationText,
  sanitizeInput,
  serverUrl,
  streamResponse,
} from '../Utilities';
import { AudioFile } from '../pages/Create';
import PostDetails from './PostDetails';
import PostLoader from './PostLoader';
import { toast } from 'sonner';

export type ReelDetails = {
  video: string | ArrayBuffer | null;
  sound: string | undefined;
  duration: number[];
  coverPhoto: string;
  savedSound: boolean;
  reelSound: string;
};

type UploadReelDetailsProps = {
  data: ReelDetails;
  rawReelFile: File;
  soundData: {
    sounds: AudioFile[];
    rawSounds: FileList | File[];
    currentSound: string | null;
    volume: {
      sound: number;
      original: number;
    };
  };
  coverData: {
    coverIndex: number | 'local' | null;
    localCoverFile: File;
    rawCoverUrls: FileList | File[];
  };
  setStage: React.Dispatch<
    React.SetStateAction<{
      reel: 'select' | 'edit' | 'finish';
      content: 'select' | 'edit' | 'finish';
      story: 'select' | 'edit' | 'finish';
    }>
  >;
};

const UploadReelDetails = ({
  data,
  setStage,
  rawReelFile,
  soundData,
  coverData,
}: UploadReelDetailsProps) => {
  const { video, sound, duration, coverPhoto, savedSound, reelSound } = data;
  const { sounds, rawSounds, currentSound, volume } = soundData;
  const { coverIndex, localCoverFile, rawCoverUrls } = coverData;
  const [pauseVideo, setPauseVideo] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [durationValues, setDurationValues] = useState<number[]>([
    0,
    Math.floor(duration[1]) - Math.floor(duration[0]),
  ]);
  const [isProgressChanging, setIsProgressChanging] = useState<boolean>(false);
  const [collaborators, setCollaborators] = useState<
    { id: string; username: string }[]
  >([]);
  const [settings, setSettings] = useState({
    accessibility: 0,
    disableComments: false,
    hideEngagements: false,
  });
  const [mentions, setMentions] = useState<Set<string>>(new Set());
  const [generalDescription, setGeneralDescription] = useState<string>('');
  const [postStage, setPostStage] = useState<{
    value: 'preparing' | 'validating' | 'processing' | 'saving' | 'finish';
    filesIndexes: Set<number>;
    percent: number;
  }>({ value: 'preparing', filesIndexes: new Set(), percent: 0 });
  const [postProgress, setPostProgress] = useState(0);
  const [posting, setPosting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null!);
  const progressRef = useRef<HTMLInputElement>(null!);
  const audioRef = useRef<HTMLAudioElement>(null!);
  const carouselRef = useRef<HTMLDivElement>(null!);
  const durationBoxRef = useRef<HTMLDivElement>(null!);
  const progressInterval = useRef<number>(null!);
  const containerRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    if (videoRef.current) videoRef.current.currentTime = duration[0];
    if (containerRef.current) containerRef.current.scrollTop = 0;

    const resizeHandler = () => {
      if (window.matchMedia('(max-width: 510px)').matches) {
        const size = window.innerWidth - 4;

        carouselRef.current.style.width = `${size}px`;
        carouselRef.current.style.height = `${size}px`;

        progressRef.current.style.width = `${(17 * size) / 500}rem`;
        durationBoxRef.current.style.width = `${(17 * size) / 500}rem`;
      } else {
        carouselRef.current.style.width = '500px';
        carouselRef.current.style.height = '500px';

        progressRef.current.style.width = '17rem';
        durationBoxRef.current.style.width = '17rem';
      }
    };

    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
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

  useEffect(() => {
    // 10, 20, 50, 20

    clearInterval(progressInterval.current);

    if (posting) {
      const limit =
        postStage.value === 'preparing'
          ? 10
          : postStage.value === 'validating'
          ? 30
          : postStage.value === 'processing'
          ? Math.min(30 + (postStage.percent / 100) * 50, 80)
          : postStage.value === 'saving'
          ? 95
          : 100;

      const delay =
        postStage.value === 'preparing'
          ? 20
          : postStage.value === 'validating'
          ? 100
          : postStage.value === 'processing'
          ? 100
          : postStage.value === 'saving'
          ? 100
          : 20;

      progressInterval.current = setInterval(() => {
        setPostProgress((prev) => {
          return Math.floor(Math.min(prev + 1, limit));
        });
      }, delay);
    }
  }, [postStage]);

  useEffect(() => {
    if (postStage.value === 'finish' && postProgress === 100) {
      setTimeout(() => {
        clearInterval(progressInterval.current);
        setPosting(false);
        setStage((prevStage) => ({
          ...prevStage,
          reel: 'select',
        }));
        return toast.success('Reel created successfully!');
      }, 500);
    }
  }, [postProgress, postStage]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume.original / 100;
    if (audioRef.current) audioRef.current.volume = volume.sound / 100;
  }, [volume]);

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

  const updatePostStage = (data: any) => {
    const { message, percent } = data;

    if (message === 'processing') {
      setPostStage((prev) => ({
        ...prev,
        value: 'processing',
        percent: Math.min(Math.floor(Number(percent) || 0), 100),
      }));
    } else setPostStage((prev) => ({ ...prev, value: message }));
  };

  const postContent = async () => {
    setPosting(true);

    // Preparing stage
    setPostStage((prev) => ({ ...prev, value: 'preparing' }));

    const formData = new FormData();

    try {
      const container = document.createElement('div');
      container.innerHTML = generalDescription;

      const hashTags = container.querySelectorAll('.app-hashtags');

      if (hashTags.length > 0) {
        hashTags.forEach((elem) =>
          elem.setAttribute(
            'href',
            `/search?q=${elem.textContent?.trim().slice(1)}`
          )
        );
      }

      const description = sanitizeInput(container.innerHTML) || '';
      const collaboratorsList = collaborators.map((obj) => obj.id);
      const mentionsList = [...mentions];

      if (currentSound) {
        if (savedSound) {
          formData.append('savedSound', reelSound);
        } else {
          const soundIndex = sounds.findIndex((obj) => obj.id === currentSound);
          if (soundIndex !== -1) {
            formData.append('sound', rawSounds[soundIndex]);
          }
        }

        formData.append(
          'volume',
          JSON.stringify({
            original: volume.original / 100,
            sound: volume.sound / 100,
          })
        );
      } else {
        formData.append('volume', JSON.stringify({ original: 1, sound: 0 }));
      }

      if (coverIndex) {
        if (coverIndex === 'local') {
          formData.append('cover', localCoverFile);
        } else {
          formData.append('cover', rawCoverUrls[coverIndex]);
        }
      }

      formData.append('reel', rawReelFile);
      formData.append(
        'position',
        JSON.stringify({
          start: Math.floor(duration[0]),
          end: Math.floor(duration[1]),
        })
      );
      formData.append('settings', JSON.stringify(settings));
      formData.append('description', description);
      formData.append('collaborators', JSON.stringify(collaboratorsList));
      formData.append('mentions', JSON.stringify(mentionsList));
    } catch {
      clearInterval(progressInterval.current);
      setPosting(false);
      setPostStage((prev) => ({ ...prev, value: 'preparing' }));
      return toast.error(
        'Error occured while preparing file. Please try again.'
      );
    }

    try {
      await streamResponse(
        `${serverUrl}api/v1/reels`,
        formData,
        updatePostStage
      );
    } catch (err: any) {
      clearInterval(progressInterval.current);
      setPosting(false);
      setPostStage((prev) => ({ ...prev, value: 'preparing' }));
      return toast.error(
        err.name === 'operational'
          ? err.message
          : 'Failed to create post. Please try again.'
      );
    }
  };

  return (
    <div
      className={`${styles['carousel-details-section']} ${styles['reels-details-section']}`}
      ref={containerRef}
    >
      {posting && (
        <PostLoader
          postStage={postStage}
          postProgress={postProgress}
          postLength={1}
          postType="Reel"
        />
      )}

      <div className={styles['video-container']} ref={carouselRef}>
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

        <div className={styles['duration-box']} ref={durationBoxRef}>
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

      <PostDetails
        postType="reel"
        setStage={setStage}
        submitHandler={postContent}
        postDetails={{
          generalDescription,
          setGeneralDescription,
          collaborators,
          setCollaborators,
          mentions,
          setMentions,
          settings,
          setSettings,
        }}
      />
    </div>
  );
};

export default UploadReelDetails;
