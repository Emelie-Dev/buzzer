import styles from '../styles/UploadReel.module.css';
import { MdOutlineMonochromePhotos } from 'react-icons/md';
import { IoMusicalNotes } from 'react-icons/io5';
import { useEffect, useRef, useState, useContext } from 'react';
import { IoBookmarkOutline } from 'react-icons/io5';
import { MdDelete } from 'react-icons/md';
import { FaPlus } from 'react-icons/fa6';
import { IoBookmark } from 'react-icons/io5';
import ReactSlider from 'react-slider';
import { FaPlay } from 'react-icons/fa6';
import { FaPause } from 'react-icons/fa6';
import { IoClose } from 'react-icons/io5';
import { MdChangeCircle } from 'react-icons/md';
import { apiClient, getDurationText, getUrl } from '../Utilities';
import { soundData, videoData, AudioFile } from '../pages/Create';
import { FaCheck } from 'react-icons/fa6';
import { HiMenuAlt3 } from 'react-icons/hi';
import { GrPowerCycle } from 'react-icons/gr';
import MobileCoverPhoto from './MobileCoverPhoto';
import MobileSounds from './MobileSounds';
import LoadingAnimation from './LoadingAnimation';
import { toast } from 'sonner';
import { AuthContext } from '../Contexts';
import { ImVolumeMedium } from 'react-icons/im';
import MobileVolume from './MobileVolume';

type UploadReelProps = {
  videoProps: videoData;
  soundProps: soundData;
  setStage: React.Dispatch<
    React.SetStateAction<{
      reel: 'select' | 'edit' | 'finish';
      content: 'select' | 'edit' | 'finish';
      story: 'select' | 'edit' | 'finish';
    }>
  >;
};

const UploadReel = ({ videoProps, soundProps, setStage }: UploadReelProps) => {
  const { user, setUser } = useContext(AuthContext);
  const savedSounds: AudioFile[] = user.reelSounds;
  const [category, setCategory] = useState<'cover' | 'sound' | 'volume'>(
    'cover'
  );
  const [soundCategory, setSoundCategory] = useState<'local' | 'saved'>(
    'local'
  );
  const [playingIndex, setPlayingIndex] = useState<string>(null!);
  const [addSounds, setAddSounds] = useState<boolean>(false);
  const [positionValues, setPositionValues] = useState<{
    left: string;
    right: string;
  }>({ left: '', right: '' });
  const [newDuration, setNewDuration] = useState<string>('');
  const [pauseVideo, setPauseVideo] = useState<boolean>(true);
  const [showCover, setShowCover] = useState<boolean>(true);
  const [durationValues, setDurationValues] = useState<number[]>([0, 0]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [showMobile, setShowMobile] = useState<{
    coverPhoto: boolean;
    sounds: boolean;
    volume: boolean;
  }>({ coverPhoto: false, sounds: false, volume: false });
  const [loadSounds, setLoadSounds] = useState(false);
  const [savedList, setSavedList] = useState<Set<string>>(new Set());
  const [bufferingList, setBufferingList] = useState<Set<string>>(new Set());

  const {
    src,
    inputRef,
    coverUrls,
    setCoverUrls,
    coverIndex,
    setCoverIndex,
    localCoverUrl,
    setLocalCoverUrl,
    sliderValues,
    setSliderValues,
    hideVideo,
    setHideVideo,
    currentSound,
    setCurrentSound,
    setLocalCoverFile,
    setRawCoverUrls,
  } = videoProps;

  const {
    sounds,
    rawSounds,
    setSounds,
    setRawSounds,
    setReelData,
    volume,
    setVolume,
  } = soundProps;

  const fileRef = useRef<HTMLInputElement>(null!);
  const coverRef = useRef<HTMLInputElement>(null!);
  const audioRef = useRef<HTMLAudioElement>(null!);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startRef = useRef<HTMLSpanElement>(null!);
  const endRef = useRef<HTMLSpanElement>(null!);
  const progressRef = useRef<HTMLSpanElement>(null!);

  const coverContainerRef = useRef<HTMLDivElement>(null!);
  const soundContainerRef = useRef<HTMLDivElement>(null!);
  const coverPhotoBoxRef = useRef<HTMLDivElement>(null!);
  const volumeContainerRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    if (loaded) {
      const tracks = document.querySelectorAll(`.${styles.track}`);
      const slider = document.querySelector(`.${styles.slider}`) as HTMLElement;

      const [firstTrack] = [...tracks].map((track) => track as HTMLElement);

      const [firstValue, secondValue] = Array.isArray(sliderValues)
        ? [...sliderValues]
        : [0, 100];
      const duration = videoRef.current ? videoRef.current.duration : 0;
      const values = [
        Math.floor((firstValue / 100) * duration),
        Math.floor((secondValue / 100) * duration),
      ];

      firstTrack.style.background = 'rgba(0,0,0,0.6)';
      slider.style.background = `linear-gradient(to right,  transparent ${secondValue}%,  rgba(0,0,0,0.6) ${secondValue}%, rgba(0,0,0,0.6) 100%)`;

      startRef.current.style.left = `${firstValue - 2}%`;

      const endNumber = window.matchMedia('(max-width: 400px)').matches
        ? 12
        : window.matchMedia('(max-width: 500px)').matches
        ? 10
        : 3;

      endRef.current.style.left = `${secondValue - endNumber}%`;

      const durationValues = values.reduce(
        (accumulator, value, index) => {
          const key = index === 0 ? 'left' : 'right';

          accumulator[key] = getDurationText(value);

          return accumulator;
        },
        { left: '', right: '' }
      );

      setDurationValues([
        (firstValue / 100) * duration,
        (secondValue / 100) * duration,
      ]);
      setNewDuration(
        getDurationText(
          Math.floor((secondValue / 100) * duration) -
            Math.floor((firstValue / 100) * duration)
        )
      );
      setPositionValues(durationValues);
    }
  }, [sliderValues]);

  useEffect(() => {
    if (pauseVideo) {
      videoRef.current?.pause();
      if (!playingIndex) audioRef.current.pause();
    } else {
      videoRef.current?.play();
    }
  }, [pauseVideo]);

  useEffect(() => {
    if (category === 'cover') {
      if (coverContainerRef.current) coverContainerRef.current.scrollTop = 0;
    } else if (category === 'sound') {
      if (soundContainerRef.current) soundContainerRef.current.scrollTop = 0;
    } else {
      if (volumeContainerRef.current) volumeContainerRef.current.scrollTop = 0;
    }
  }, [category]);

  useEffect(() => {
    if (currentSound) {
      if (videoRef.current) videoRef.current.volume = volume.original / 100;
      if (audioRef.current) audioRef.current.volume = volume.sound / 100;
    } else {
      if (videoRef.current) videoRef.current.volume = 1;
      if (audioRef.current) audioRef.current.volume = 1;
    }
  }, [volume, currentSound]);

  // Handle upload for mobile
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoadSounds(true);
    if (e.target.files) {
      const uploadFiles = [...e.target.files];
      const filesData: AudioFile[] = [];

      if (uploadFiles.length + sounds.length > 20) {
        e.target.files = new DataTransfer().files;
        setLoadSounds(false);
        return toast.error('You can only select 20 sounds at once.');
      }

      const promises = uploadFiles.map((file) => isFileValid(file));

      try {
        const results = await Promise.all(promises);
        results.forEach((result) => filesData.push(result));

        e.target.files = new DataTransfer().files;

        setRawSounds((prevFiles) => {
          return addSounds ? [...prevFiles, ...uploadFiles] : uploadFiles;
        });
        setSounds((prevFiles) => {
          return addSounds ? [...prevFiles, ...filesData] : filesData;
        });
      } catch (error: any) {
        const durationError =
          uploadFiles.length === 1
            ? 'The file exceeds the allowed length.'
            : 'Some files exceed the allowed length.';

        const sizeError =
          uploadFiles.length === 1
            ? 'The file exceeds the size limit.'
            : 'Some selected files exceed the size limit';

        const defaultError =
          uploadFiles.length === 1
            ? 'We couldn’t process your file. Please try again.'
            : 'We couldn’t process some files. Please try again.';

        filesData.forEach((data) => URL.revokeObjectURL(data.src as string));
        e.target.files = new DataTransfer().files;

        toast.error(
          error.message === 'Size Error'
            ? sizeError
            : error.message === 'Duration Error'
            ? durationError
            : defaultError
        );
      }

      setAddSounds(false);
    }
    setLoadSounds(false);
  };

  const isFileValid = (file: File): Promise<AudioFile> => {
    return new Promise((resolve, reject) => {
      if (file.size > 1_073_741_824) {
        reject('Size error');
      } else {
        const fileURL = URL.createObjectURL(file);
        const audio = document.createElement('audio');

        audio.src = fileURL;
        audio.preload = 'metadata';

        audio.onloadedmetadata = () => {
          const duration = Math.round(audio.duration);
          const durationText: string = getDurationText(duration);

          if (duration > 3600) return reject('Duration error');

          resolve({
            name: file.name,
            duration: durationText,
            src: fileURL,
            id: `ID-${Math.random()}`,
          });
        };

        audio.onerror = () => reject('Audio Error');
      }
    });
  };

  const handlePlayingSound = (soundId: string) => () => {
    setBufferingList(new Set());
    audioRef.current.oncanplay = null;

    const id = sounds.findIndex((file) => file.id === soundId);

    setPauseVideo(true);

    if (soundId === playingIndex) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    } else {
      audioRef.current.src = sounds[id].src;
      audioRef.current.play();
      setPlayingIndex(soundId);
    }
  };

  const deleteSound = (soundId: string) => () => {
    const id = sounds.findIndex((file) => file.id === soundId);

    if (soundId === playingIndex) {
      audioRef.current.src = '';
      setPlayingIndex(null!);
      setPauseVideo(true);
    }

    URL.revokeObjectURL(sounds[id].src as string);
    setSounds((prevFiles) => prevFiles.filter((_, index) => index !== id));
    setRawSounds((prevFiles) =>
      [...prevFiles].filter((_, index) => index !== id)
    );
  };

  const handleSavedSounds = (soundId: string) => async () => {
    if (savedList.has(soundId)) return;

    const sound = sounds.find((obj) => obj.id === soundId);
    const soundIndex = sounds.findIndex((obj) => obj.id === soundId);

    if (!sound) return toast.error('This sound deos not exist!');

    const set = new Set(savedList).add(soundId);
    setSavedList(set);

    try {
      if (sound.savedId) {
        const { data } = await apiClient.post(
          `v1/reels/sounds/${sound.savedId}`
        );
        setUser(data.data.user);
        setSounds((prev) => {
          prev[soundIndex].savedId = undefined;
          return [...prev];
        });
        toast.success('Sound deleted successfully.');
      } else {
        if (savedSounds.length >= 10) {
          const set = new Set(savedList);
          set.delete(soundId);
          setSavedList(set);
          return toast.error('You can only save up to ten sounds.');
        }

        const body = new FormData();
        body.append('sound', rawSounds[soundIndex]);

        const { data } = await apiClient.post('v1/reels/sounds', body);

        setSounds((prevFiles) => {
          prevFiles[soundIndex].savedId = data.data.soundId;
          return [...prevFiles];
        });
        setUser(data.data.user);
        toast.success('Sound saved successfully.');
      }
    } catch (err: any) {
      const message = sound.savedId
        ? 'Couldn’t delete the sound. Please try again.'
        : 'Failed to save sound. Please try again.';

      if (err.response) {
        return toast.error(err.response.data.message || message);
      } else {
        return toast.error(message);
      }
    } finally {
      const set = new Set(savedList);
      set.delete(soundId);
      setSavedList(set);
    }
  };

  const deleteSavedSound = (id: string) => async () => {
    if (savedList.has(id)) return;

    const set = new Set(savedList).add(id);
    setSavedList(set);

    try {
      const { data } = await apiClient.post(`v1/reels/sounds/${id}`);
      setUser(data.data.user);
      setSounds((prev) => {
        return [...prev].map((obj) => {
          if (obj.savedId === id) obj.savedId = undefined;
          return obj;
        });
      });

      toast.success('Sound deleted successfully.');
    } catch (err: any) {
      const message = 'Couldn’t delete the sound. Please try again.';

      if (err.response) {
        return toast.error(err.response.data.message || message);
      } else {
        return toast.error(message);
      }
    } finally {
      const set = new Set(savedList);
      set.delete(id);
      setSavedList(set);
    }
  };

  const handleCapture = async () => {
    if (hideVideo) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const urls: string[] = [];
      const files: File[] = [];

      if (video && canvas) {
        const duration = video.duration;
        const interval = duration / 9;

        const ctx = canvas.getContext('2d');

        if (ctx) {
          for (let i = 0; i < 10; i++) {
            const { url, file } = await captureFrameAt(
              video,
              canvas,
              ctx,
              i * interval,
              i
            );

            urls.push(url);
            files.push(file);
          }
        }

        video.currentTime = 0;
      }

      setHideVideo(false);
      setCoverUrls(urls);
      setRawCoverUrls(files);
    }

    setSliderValues((values) => {
      if (Array.isArray(values)) return [...values];
      else return values;
    });
    setLoaded(true);
  };

  const captureFrameAt = (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    time: number,
    index: number
  ) => {
    return new Promise<{ url: string; file: File }>((resolve) => {
      video.currentTime = time;
      video.onseeked = () => {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the current frame from video to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({ url: '', file: null! });
            }

            const file = new File([blob], `Cover-${index + 1}`, {
              type: 'image/jpeg',
            });
            const url = URL.createObjectURL(file);

            resolve({ url, file });
          },
          'image/jpeg',
          0.9
        );
      };
    });
  };

  const handleCoverPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];

      if (file.size > 1_073_741_824) {
        return toast.error('The file exceeds the size limit.');
      } else {
        const fileURL = URL.createObjectURL(file);
        setLocalCoverUrl(fileURL);
        setLocalCoverFile(file);
        setPauseVideo(true);
        setCoverIndex('local');
        setShowCover(true);

        if (coverPhotoBoxRef) coverPhotoBoxRef.current.scrollLeft = 0;
      }
    }
  };

  const playVideo = (index: number | null, local?: boolean) => () => {
    const condition = local ? coverIndex !== 'local' : coverIndex !== index;

    if (condition) {
      if (videoRef.current) {
        setPauseVideo(true);
        setCoverIndex(local ? 'local' : index);
        setShowCover(true);
        setPlayingIndex('');
      }
    }
  };

  const handleCurrentSound = (soundId: string) => () => {
    if (currentSound === soundId) {
      setCurrentSound(null);
      setSounds((prevFiles) =>
        prevFiles.map((file) => {
          if (file.id === soundId) file.current = false;
          return file;
        })
      );

      setPlayingIndex((prev) => (prev === soundId ? '' : prev));
    } else {
      setSounds((prevFiles) =>
        prevFiles.map((file) => {
          if (file.id === soundId) file.current = true;
          else file.current = false;
          return file;
        })
      );
      setPlayingIndex(soundId);
      setCurrentSound(soundId);
    }

    audioRef.current.src = '';
    if (!pauseVideo) setPauseVideo(true);
  };

  const handleCurrentSavedSound = (id: string) => () => {
    const sound = sounds.find((sound) => sound.savedId === id);

    if (currentSound === id) {
      setCurrentSound(null);
      setSounds((prevFiles) =>
        prevFiles.map((file) => {
          if (file.savedId === id) file.current = false;
          return file;
        })
      );
      setPlayingIndex((prev) => {
        if (sound) {
          return prev === id || prev === sound.id ? '' : prev;
        }

        return prev === id ? '' : prev;
      });
    } else {
      setSounds((prevFiles) =>
        prevFiles.map((file) => {
          if (file.savedId === id) file.current = true;
          else file.current = false;
          return file;
        })
      );

      setPlayingIndex(sound ? sound.id : id);
      setCurrentSound(id);
    }

    audioRef.current.src = '';
    if (!pauseVideo) setPauseVideo(true);
  };

  const handlePlayVideo = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>
  ) => {
    setShowCover(false);
    const target = e.target as HTMLVideoElement;

    const startValue = (target.currentTime / target.duration) * 100;
    const endValue = Array.isArray(sliderValues) ? sliderValues[1] : startValue;

    if (currentSound) {
      const sound = sounds.find((file) => file.id === currentSound);
      const savedSound = savedSounds.find((file) => file._id === currentSound);

      if (savedSound) {
        const localSound = sounds.find((obj) => obj.savedId === savedSound._id);

        if (localSound) {
          audioRef.current.src = localSound.src;
          audioRef.current.currentTime = target.currentTime - durationValues[0];
          audioRef.current.play();
        } else {
          audioRef.current.src = getUrl(savedSound!.src, 'reels');
          setBufferingList((prev) => {
            const set = new Set(prev).add(savedSound._id!);
            return set;
          });

          audioRef.current.oncanplay = () => {
            audioRef.current.currentTime =
              target.currentTime - durationValues[0];
            audioRef.current.play();

            setBufferingList(new Set());
            audioRef.current.oncanplay = null;
          };
        }
      } else if (sound) {
        audioRef.current.src = sound.src;
        audioRef.current.currentTime = target.currentTime - durationValues[0];
        audioRef.current.play();
      }

      setPlayingIndex(currentSound);
    } else {
      audioRef.current.pause();
    }

    progressRef.current.style.display = 'inline';
    const animation = progressRef.current.animate(
      {
        left: [`${startValue}%`, `calc(${endValue}% - 0.5rem)`],
      },
      {
        duration: (durationValues[1] - target.currentTime) * 1000,
      }
    );

    animation.onfinish = () => {
      if (progressRef.current) progressRef.current.style.display = 'none';
    };
  };

  const handleAddSound = (add: boolean) => () => {
    if (sounds.length >= 20) {
      return toast.error('You can only select 20 sounds at once.');
    }

    fileRef.current.click();
    setPauseVideo(true);
    if (add) setAddSounds(true);
  };

  const handlePlayingSavedSound = (id: string) => () => {
    if (bufferingList.has(id)) return;

    setBufferingList(new Set());
    audioRef.current.oncanplay = null;

    const localSound = sounds.find((obj) => obj.savedId === id);

    if (localSound) {
      return handlePlayingSound(localSound.id)();
    } else {
      setPauseVideo(true);
      const sound = savedSounds.find((obj) => obj._id === id);

      if (id === playingIndex) {
        if (audioRef.current.paused) {
          audioRef.current.play();
        } else {
          audioRef.current.pause();
        }
      } else {
        audioRef.current.src = getUrl(sound!.src, 'reels');
        setBufferingList((prev) => {
          const set = new Set(prev);
          set.add(id);
          return set;
        });

        audioRef.current.oncanplay = () => {
          audioRef.current.play();
          setBufferingList(new Set());
          audioRef.current.oncanplay = null;
        };

        setPlayingIndex(id);
      }
    }
  };

  const isPlayingSound = (id: string) => {
    const sound = sounds.find((obj) => obj.savedId === id);

    if (sound) {
      return sound.id === playingIndex || id === playingIndex;
    } else return id === playingIndex;
  };

  const isCurrentSound = (id: string) => {
    const sound = sounds.find((obj) => obj.savedId === id);

    if (sound) {
      return sound.id === currentSound || id === currentSound;
    } else return id === currentSound;
  };

  const getSound = () => {
    if (currentSound) {
      const localSound = sounds.find((obj) => obj.id === currentSound);
      const sound = savedSounds.find((obj) => obj._id === currentSound);

      if (sound) {
        const savedSound = sounds.find((obj) => obj.savedId === sound._id);

        if (savedSound) {
          return { src: savedSound.src, value: true, reelSound: sound.src };
        } else {
          return {
            src: getUrl(sound.src, 'reels'),
            value: true,
            reelSound: sound.src,
          };
        }
      } else {
        return {
          src: localSound!.src,
          value: false,
          reelSound: localSound!.src,
        };
      }
    } else {
      return { src: undefined, value: false, reelSound: '' };
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles['edit-container']}>
          <div className={styles['container-head']}>
            Edit Video
            <span className={styles['head-menu']}>
              <span
                className={styles['close-edit-box']}
                onClick={() =>
                  setStage((prevStage) => ({ ...prevStage, reel: 'select' }))
                }
              >
                <IoClose className={styles['close-edit-icon']} />
              </span>

              <span
                className={`${styles['close-edit-box']} ${styles['next-stage-btn']}`}
                onClick={() => {
                  setReelData(() => {
                    const sound = getSound();
                    return {
                      video: src,
                      sound: sound.src,
                      duration: durationValues,
                      coverPhoto: coverIndex
                        ? coverIndex === 'local'
                          ? localCoverUrl
                          : coverUrls[coverIndex]
                        : '',
                      savedSound: sound.value,
                      reelSound: sound.reelSound,
                    };
                  });
                  setStage((prevStage) => ({ ...prevStage, reel: 'finish' }));
                }}
              >
                <FaCheck className={styles['close-edit-icon2']} />
              </span>
            </span>
          </div>

          <div className={styles['hidden-div']}>
            <input
              type="file"
              ref={fileRef}
              accept="audio/mpeg,audio/wav,audio/ogg,audio/mp3"
              multiple={true}
              onChange={handleFileUpload}
            />

            <input
              type="file"
              ref={coverRef}
              accept="image/*"
              onChange={handleCoverPhoto}
            />

            <audio ref={audioRef}></audio>

            <canvas ref={canvasRef} />
          </div>

          <div className={styles['video-container']}>
            <ul className={styles['category-list']}>
              <li
                className={`${styles['category-item']} ${
                  category === 'cover' ? styles['current-category'] : ''
                }`}
                onClick={() => setCategory('cover')}
              >
                <MdOutlineMonochromePhotos className={styles['edit-icon']} />
                <span className={styles['category-name']}> Cover Photo</span>
              </li>
              <li
                className={`${styles['category-item']} ${
                  category === 'sound' ? styles['current-category'] : ''
                }`}
                onClick={() => setCategory('sound')}
              >
                <IoMusicalNotes className={styles['edit-icon']} />
                <span className={styles['category-name']}> Sounds </span>
              </li>
              <li
                className={`${styles['category-item']} ${
                  category === 'volume' ? styles['current-category'] : ''
                }`}
                onClick={() => setCategory('volume')}
              >
                <ImVolumeMedium className={styles['edit-icon']} />
                <span className={styles['category-name']}> Volume </span>
              </li>

              <MdChangeCircle
                className={styles['swap-icon']}
                title="Change Video"
                onClick={() => {
                  setStage((prevStage) => ({ ...prevStage, reel: 'select' }));
                  inputRef.current.click();
                }}
              />
            </ul>

            {category === 'cover' ? (
              <div
                className={styles['cover-photo-container']}
                ref={coverContainerRef}
              >
                <div className={styles['cover-photo-head']}>
                  Select cover photo
                </div>

                <div className={styles['cover-photo-div']}>
                  {coverUrls.length === 0 ? (
                    <div className={styles['loader-container']}>
                      <LoadingAnimation
                        style={{
                          width: '3rem',
                          height: '3rem',
                          transform: 'scale(2.5)',
                        }}
                      />
                    </div>
                  ) : (
                    coverUrls.length > 0 &&
                    coverUrls.map((src, index) => (
                      <span
                        key={index}
                        className={`${styles['cover-photo-box']} ${
                          index === coverIndex ? styles['current-cover'] : ''
                        }`}
                        onClick={playVideo(index)}
                      >
                        {index === coverIndex && (
                          <span
                            className={styles['remove-cover-box']}
                            onClick={() => setCoverIndex(null)}
                          >
                            <IoClose className={styles['remove-cover-icon']} />
                          </span>
                        )}
                        <img src={src} className={styles['cover-photo-img']} />
                      </span>
                    ))
                  )}
                </div>

                {localCoverUrl && (
                  <div className={styles['local-photo-div']}>
                    <span className={styles['local-photo-head']}>
                      Local photo
                    </span>

                    <span
                      className={`${styles['cover-photo-box']} ${
                        coverIndex === 'local' ? styles['current-cover'] : ''
                      }`}
                      onClick={playVideo(null, true)}
                    >
                      {coverIndex === 'local' && (
                        <span
                          className={styles['remove-cover-box']}
                          onClick={() => setCoverIndex(null)}
                        >
                          <IoClose className={styles['remove-cover-icon']} />
                        </span>
                      )}
                      <img
                        src={localCoverUrl}
                        className={styles['cover-photo-img']}
                      />
                    </span>
                  </div>
                )}

                <div className={styles['cover-photo-btn-div']}>
                  <button
                    className={styles['cover-photo-btn']}
                    onClick={() => {
                      coverRef.current.click();
                      setPauseVideo(true);
                    }}
                  >
                    Select from computer
                  </button>
                </div>
              </div>
            ) : category === 'sound' ? (
              <div
                className={styles['add-sound-container']}
                ref={soundContainerRef}
              >
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
                              playingIndex === file.id
                                ? styles['playing-sound']
                                : ''
                            }`}
                            onClick={handlePlayingSound(file.id)}
                          >
                            <span className={styles['sound-name']}>
                              {file.name}
                            </span>
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
                                className={`${styles['sound-save-icon']} ${
                                  savedList.has(file.savedId || file.id)
                                    ? styles['disable-save-icon']
                                    : ''
                                }`}
                                onClick={handleSavedSounds(file.id)}
                              />
                            ) : (
                              <IoBookmarkOutline
                                className={`${styles['sound-save-icon']} ${
                                  savedList.has(file.savedId || file.id)
                                    ? styles['disable-save-icon']
                                    : ''
                                }`}
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
                      savedSounds.map((file) => (
                        <article key={file._id} className={styles['sound-box']}>
                          <span
                            className={`${styles['sound-details']} ${
                              isPlayingSound(file._id!)
                                ? styles['playing-sound']
                                : ''
                            } ${
                              bufferingList.has(file._id!)
                                ? styles.downloading
                                : ''
                            }`}
                            onClick={handlePlayingSavedSound(file._id!)}
                          >
                            <span className={styles['sound-name']}>
                              {file.name}
                            </span>
                            <span className={styles['sound-duration']}>
                              {getDurationText(
                                Math.round(Number(file.duration))
                              )}
                            </span>
                          </span>

                          <span className={styles['sound-btn-box']}>
                            <button
                              className={styles['sound-use-button']}
                              onClick={handleCurrentSavedSound(file._id!)}
                            >
                              {isCurrentSound(file._id!) ? 'Remove' : 'Use'}
                            </button>

                            <IoBookmark
                              className={`${styles['sound-save-icon']} ${
                                savedList.has(file._id!)
                                  ? styles['disable-save-icon']
                                  : ''
                              }`}
                              onClick={deleteSavedSound(file._id!)}
                            />
                          </span>
                        </article>
                      ))}

                    {soundCategory === 'local' && sounds.length > 0 && (
                      <div className={styles['plus-icon-div']}>
                        <span
                          className={styles['plus-icon-box']}
                          title="Add sound"
                          onClick={handleAddSound(true)}
                        >
                          <FaPlus className={styles['plus-icon']} />
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {soundCategory === 'local' &&
                  (loadSounds ? (
                    <div className={styles['loader-container']}>
                      <LoadingAnimation
                        style={{
                          width: '3rem',
                          height: '3rem',
                          transform: 'scale(2.5)',
                        }}
                      />
                    </div>
                  ) : sounds.length === 0 ? (
                    <div className={styles['add-sound-btn-div']}>
                      <span className={styles['add-sound-txt']}>
                        You can select multiple sounds and pick one to use
                      </span>
                      <br />
                      <button
                        className={styles['add-sound-btn']}
                        onClick={handleAddSound(false)}
                      >
                        Select from computer
                      </button>
                    </div>
                  ) : (
                    ''
                  ))}

                {soundCategory === 'saved' && savedSounds.length === 0 && (
                  <span className={styles['add-sound-txt2']}>
                    You have no saved sounds
                  </span>
                )}
              </div>
            ) : (
              <div
                className={styles['cover-photo-container']}
                ref={volumeContainerRef}
              >
                <div className={styles['cover-photo-head']}>
                  Set sound volume
                </div>

                {currentSound ? (
                  <div className={styles['sound-volume-container']}>
                    <div className={styles['sound-volume-box']}>
                      <span className={styles['sound-volume-heading']}>
                        Sound Volume
                      </span>
                      <div className={styles['sound-volume-slider']}>
                        <input
                          type="range"
                          value={volume.sound}
                          onChange={(e) => {
                            setVolume({
                              sound: Number(e.target.value),
                              original: 100 - Number(e.target.value),
                            });
                          }}
                        />
                        <span>{volume.sound}%</span>
                      </div>
                    </div>

                    <div className={styles['sound-volume-box']}>
                      <span className={styles['sound-volume-heading']}>
                        Original Audio Volume
                      </span>
                      <div className={styles['sound-volume-slider']}>
                        <input type="range" value={volume.original} disabled />
                        <span>{volume.original}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles['add-sound-btn-div']}>
                    <span className={styles['add-sound-txt']}>
                      No sound selected
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className={styles['video-box']}>
              <div className={styles['video-div']}>
                {hideVideo && (
                  <div className={styles['loader-box']}>
                    <LoadingAnimation
                      style={{
                        width: '3rem',
                        height: '3rem',
                        transform: 'scale(2.5)',
                      }}
                    />
                  </div>
                )}

                <video
                  className={`${styles.video}  ${
                    hideVideo ? styles['hide-item'] : ''
                  } `}
                  ref={videoRef}
                  onLoadedMetadata={handleCapture}
                  onEnded={() => {
                    setPauseVideo(true);
                    setShowCover(true);
                    setPlayingIndex('');
                  }}
                  onTimeUpdate={(e) => {
                    if (e.currentTarget.currentTime >= durationValues[1]) {
                      setPauseVideo(true);
                      setShowCover(true);
                      setPlayingIndex('');
                    }
                  }}
                  onPlay={handlePlayVideo}
                >
                  <source src={src as string} />
                  Your browser does not support playing video.
                </video>

                <div className={styles['video-details']}>
                  {pauseVideo ? (
                    <FaPlay
                      className={styles['video-play-icon']}
                      onClick={() => {
                        if (showCover && videoRef.current)
                          videoRef.current.currentTime = durationValues[0];
                        setPauseVideo(false);
                        setShowCover(false);
                      }}
                    />
                  ) : (
                    <FaPause
                      className={styles['video-play-icon']}
                      onClick={() => {
                        setPauseVideo(true);
                        setPlayingIndex('');
                      }}
                    />
                  )}
                  <span className={styles['video-duration']}>
                    {newDuration}
                  </span>
                </div>

                {showCover && coverIndex !== null && (
                  <img
                    className={styles.poster}
                    src={
                      coverIndex === 'local'
                        ? localCoverUrl
                        : coverUrls[coverIndex]
                    }
                  />
                )}
              </div>
            </div>

            <div className={styles['mobile-menu-div']}>
              <span className={styles['menu-icon-box']}>
                <HiMenuAlt3 className={styles['menu-icon']} />
              </span>

              <ul className={styles['menu-list']}>
                <li
                  className={styles['menu-item']}
                  onClick={() => {
                    setShowMobile((prev) => ({ ...prev, coverPhoto: true }));
                    setCategory('cover');
                  }}
                >
                  <MdOutlineMonochromePhotos
                    className={styles['menu-item-icon']}
                  />
                  Cover Photo
                </li>
                <li
                  className={styles['menu-item']}
                  onClick={() => {
                    setShowMobile((prev) => ({ ...prev, sounds: true }));
                    setCategory('sound');
                  }}
                >
                  <IoMusicalNotes className={styles['menu-item-icon']} />
                  Sounds
                </li>
                <li
                  className={styles['menu-item']}
                  onClick={() => {
                    setShowMobile((prev) => ({ ...prev, volume: true }));
                    setCategory('volume');
                  }}
                >
                  <ImVolumeMedium className={styles['menu-item-icon']} />
                  Volume
                </li>
                <li
                  className={styles['menu-item']}
                  onClick={() => {
                    setStage((prevStage) => ({ ...prevStage, reel: 'select' }));
                    inputRef.current.click();
                  }}
                >
                  <GrPowerCycle className={styles['menu-item-icon']} />
                  Change Video
                </li>
              </ul>
            </div>
          </div>

          <div className={styles['trim-container']}>
            <div className={styles['trim-div']}>
              {coverUrls
                ? coverUrls.map((url, index) => (
                    <img key={index} className={styles['trim-img']} src={url} />
                  ))
                : ''}

              <div className={styles['slider-div']}>
                {!pauseVideo && (
                  <span
                    className={styles['progress-line']}
                    ref={progressRef}
                  ></span>
                )}

                <span
                  className={`${styles['start-position']} ${
                    hideVideo ? styles['hide-item'] : ''
                  } `}
                  ref={startRef}
                >
                  {positionValues.left}
                </span>

                <ReactSlider
                  className={`${styles.slider} ${
                    hideVideo ? styles['hide-item'] : ''
                  }`}
                  trackClassName={styles.track}
                  value={sliderValues}
                  min={0}
                  max={100}
                  pearling
                  minDistance={1}
                  renderThumb={({ key, ...props }: any) => (
                    <div key={key} {...props} className={styles['thumb']}>
                      <img
                        src="../../assets/images/suppository-capsule-svgrepo-com (4).svg"
                        alt="Thumb"
                        className={styles['thumb-image']}
                      />
                    </div>
                  )}
                  onChange={(values) => {
                    setSliderValues(values);
                    setPauseVideo(true);
                    if (coverIndex) setShowCover(true);
                    setPlayingIndex('');
                  }}
                  onAfterChange={() => {
                    if (videoRef.current)
                      videoRef.current.currentTime = durationValues[0];
                    setPauseVideo(false);
                    setShowCover(false);
                  }}
                />

                <span
                  className={`${styles['start-position']} ${
                    hideVideo ? styles['hide-item'] : ''
                  } `}
                  ref={endRef}
                >
                  {positionValues.right}
                </span>
              </div>
            </div>

            {!hideVideo && (
              <div className={styles['next-btn-div']}>
                <button
                  className={styles['next-btn']}
                  onClick={() => {
                    setReelData(() => {
                      const sound = getSound();
                      return {
                        video: src,
                        sound: sound.src,
                        duration: durationValues,
                        coverPhoto: coverIndex
                          ? coverIndex === 'local'
                            ? localCoverUrl
                            : coverUrls[coverIndex]
                          : '',
                        savedSound: sound.value,
                        reelSound: sound.reelSound,
                      };
                    });
                    setStage((prevStage) => ({ ...prevStage, reel: 'finish' }));
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMobile.coverPhoto && (
        <MobileCoverPhoto
          coverUrls={coverUrls}
          coverIndex={coverIndex}
          playVideo={playVideo}
          setCoverIndex={setCoverIndex}
          localCoverUrl={localCoverUrl}
          coverRef={coverRef}
          setPauseVideo={setPauseVideo}
          setShowMobile={setShowMobile}
          coverPhotoBoxRef={coverPhotoBoxRef}
        />
      )}

      {showMobile.sounds && (
        <MobileSounds
          setShowMobile={setShowMobile}
          soundCategory={soundCategory}
          setAddSounds={setAddSounds}
          setPauseVideo={setPauseVideo}
          setSoundCategory={setSoundCategory}
          sounds={sounds}
          playingIndex={playingIndex}
          handleCurrentSound={handleCurrentSound}
          handlePlayingSound={handlePlayingSound}
          handleSavedSounds={handleSavedSounds}
          deleteSound={deleteSound}
          fileRef={fileRef}
          setPlayingIndex={setPlayingIndex}
          audioRef={audioRef}
        />
      )}

      {showMobile.volume && (
        <MobileVolume
          setShowMobile={setShowMobile}
          currentSound={currentSound}
          volume={volume}
          setVolume={setVolume}
        />
      )}
    </>
  );
};

export default UploadReel;
