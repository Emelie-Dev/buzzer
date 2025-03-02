import styles from '../styles/StoryModal.module.css';
import { IoClose } from 'react-icons/io5';
import { useCallback, useEffect, useRef, useState } from 'react';
import StoryItem from './StoryItem';
import { StoryContent } from './StoryItem';
import ReactDOM from 'react-dom';

export interface Story {
  name: string;
  content: StoryContent[];
  time: string;
  index: number;
}

export type VoidStory = {
  value: null;
};

type StoryModalProps = {
  setViewStory: React.Dispatch<React.SetStateAction<boolean>>;
  itemIndex: number;
};

const stories: (Story | { value: null })[] = [
  { value: null },
  {
    name: 'userOne',
    content: [
      { type: 'video', src: 'content20' },
      { type: 'image', src: 'content10' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content20' },
      { type: 'video', src: 'content6' },
      { type: 'image', src: 'content8' },
      { type: 'image', src: 'content14' },
    ],
    time: '23 seconds ago',
    index: 0,
  },
  {
    index: 1,
    name: 'coolGuy',
    content: [
      { type: 'image', src: 'content8' },
      { type: 'video', src: 'content6' },
      { type: 'video', src: 'content21' },
      { type: 'video', src: 'content20' },
      { type: 'video', src: 'content20' },
    ],
    time: '12 hours ago',
  },
  {
    index: 2,
    name: 'happy123',
    content: [
      { type: 'image', src: 'content7' },
      { type: 'image', src: 'content3' },
      { type: 'image', src: 'content14' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content24' },
      { type: 'video', src: 'content6' },
      { type: 'video', src: 'content20' },
    ],
    time: '19 seconds ago',
  },
  {
    index: 3,
    name: 'sunshineGirl',
    content: [
      { type: 'image', src: 'content16' },
      { type: 'video', src: 'content6' },
    ],
    time: '17 hours ago',
  },
  {
    index: 4,
    name: 'codeMaster',
    content: [
      { type: 'image', src: 'content15' },
      { type: 'image', src: 'content10' },
      { type: 'image', src: 'content2' },
      { type: 'video', src: 'content20' },
      { type: 'image', src: 'content1' },
      { type: 'image', src: 'content5' },
      { type: 'image', src: 'content22' },
      { type: 'video', src: 'content25' },
      { type: 'image', src: 'content18' },
    ],
    time: '13 hours ago',
  },
  {
    index: 5,
    name: 'skyWalker',
    content: [
      { type: 'image', src: 'content5' },
      { type: 'image', src: 'content7' },
      { type: 'image', src: 'content3' },
      { type: 'video', src: 'content21' },
      { type: 'image', src: 'content13' },
      { type: 'image', src: 'content5' },
      { type: 'video', src: 'content20' },
    ],
    time: '15 hours ago',
  },
  {
    index: 6,
    name: 'theArtist',
    content: [
      { type: 'video', src: 'content24' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content20' },
      { type: 'image', src: 'content8' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content21' },
      { type: 'video', src: 'content6' },
      { type: 'image', src: 'content2' },
      { type: 'video', src: 'content24' },
      { type: 'image', src: 'content12' },
    ],
    time: '12 hours ago',
  },
  {
    index: 7,
    name: 'jungleKing',
    content: [
      { type: 'video', src: 'content21' },
      { type: 'image', src: 'content3' },
    ],
    time: '17 hours ago',
  },
  {
    index: 8,
    name: 'dreamer_98',
    content: [
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content25' },
      { type: 'image', src: 'content10' },
      { type: 'image', src: 'content11' },
      { type: 'video', src: 'content6' },
      { type: 'video', src: 'content21' },
      { type: 'video', src: 'content24' },
      { type: 'video', src: 'content24' },
      { type: 'image', src: 'content3' },
    ],
    time: '12 minutes ago',
  },
  {
    index: 9,
    name: 'techieDude',
    content: [{ type: 'video', src: 'content24' }],
    time: '20 hours ago',
  },
  {
    index: 10,
    name: 'cityExplorer',
    content: [
      { type: 'video', src: 'content21' },
      { type: 'image', src: 'content22' },
      { type: 'video', src: 'content6' },
    ],
    time: '15 minutes ago',
  },
  {
    index: 11,
    name: 'natureLover',
    content: [
      { type: 'image', src: 'content19' },
      { type: 'image', src: 'content22' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content25' },
      { type: 'image', src: 'content13' },
      { type: 'video', src: 'content6' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content21' },
    ],
    time: '13 seconds ago',
  },
  {
    index: 12,
    name: 'mountainView',
    content: [
      { type: 'image', src: 'content15' },
      { type: 'image', src: 'content1' },
      { type: 'video', src: 'content20' },
      { type: 'video', src: 'content24' },
    ],
    time: '22 hours ago',
  },
  {
    index: 13,
    name: 'coffeeAddict',
    content: [
      { type: 'image', src: 'content10' },
      { type: 'image', src: 'content8' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content20' },
      { type: 'image', src: 'content3' },
      { type: 'image', src: 'content13' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content20' },
    ],
    time: '18 minutes ago',
  },
  {
    index: 14,
    name: 'chefTom',
    content: [
      { type: 'image', src: 'content8' },
      { type: 'image', src: 'content10' },
      { type: 'video', src: 'content20' },
      { type: 'image', src: 'content10' },
      { type: 'image', src: 'content8' },
      { type: 'video', src: 'content21' },
      { type: 'image', src: 'content2' },
      { type: 'image', src: 'content19' },
      { type: 'video', src: 'content6' },
      { type: 'image', src: 'content5' },
    ],
    time: '15 seconds ago',
  },
  {
    index: 15,
    name: 'oceanWave',
    content: [
      { type: 'video', src: 'content21' },
      { type: 'video', src: 'content21' },
      { type: 'image', src: 'content8' },
    ],
    time: '6 seconds ago',
  },
  {
    index: 16,
    name: 'bookworm101',
    content: [
      { type: 'video', src: 'content6' },
      { type: 'video', src: 'content6' },
      { type: 'video', src: 'content24' },
      { type: 'image', src: 'content9' },
      { type: 'video', src: 'content24' },
      { type: 'video', src: 'content6' },
      { type: 'video', src: 'content20' },
    ],
    time: '17 seconds ago',
  },
  {
    index: 17,
    name: 'fastRunner',
    content: [
      { type: 'image', src: 'content22' },
      { type: 'video', src: 'content25' },
      { type: 'video', src: 'content25' },
      { type: 'image', src: 'content17' },
      { type: 'video', src: 'content24' },
      { type: 'video', src: 'content25' },
    ],
    time: '17 minutes ago',
  },
  {
    index: 18,
    name: 'digitalNomad',
    content: [
      { type: 'video', src: 'content24' },
      { type: 'video', src: 'content25' },
      { type: 'image', src: 'content17' },
      { type: 'image', src: 'content18' },
      { type: 'image', src: 'content18' },
      { type: 'image', src: 'content7' },
      { type: 'image', src: 'content9' },
    ],
    time: '6 seconds ago',
  },
  {
    index: 19,
    name: 'starGazer',
    content: [
      { type: 'image', src: 'content2' },
      { type: 'image', src: 'content19' },
      { type: 'video', src: 'content24' },
      { type: 'image', src: 'content18' },
      { type: 'video', src: 'content6' },
    ],
    time: '20 hours ago',
  },
  { value: null },
];

const StoryModal = ({ setViewStory, itemIndex }: StoryModalProps) => {
  const [currentIndex, setCurrentIndex] = useState<number>(itemIndex);
  const [swicthType, setSwitchType] = useState<'front' | 'back' | 'none'>(
    'none'
  );

  const carouselRef = useRef<HTMLDivElement>(null!);

  const target = document.getElementById('stories-portal') || document.body;

  useEffect(() => {
    moveToStory(currentIndex, null, null, null, 'jump')();

    if (carouselRef.current)
      carouselRef.current.style.scrollBehavior = 'smooth';
  }, []);

  const moveToStory = useCallback(
    (
        index: number,
        storyItemIndex: number | null,
        contentLength: number | null,
        setContentIndex: React.Dispatch<React.SetStateAction<number>> | null,
        type: 'initial' | 'next' | 'prev' | 'jump'
      ) =>
      () => {
        if (type === 'next') {
          if (storyItemIndex === contentLength) {
            setCurrentIndex(index);
            setSwitchType('front');
          } else {
            if (setContentIndex) setContentIndex((prev) => prev + 1);
          }
        } else if (type === 'prev') {
          if (storyItemIndex === 0) {
            setCurrentIndex(index);
            setSwitchType('back');
          } else {
            if (setContentIndex) setContentIndex((prev) => prev - 1);
          }
        } else {
          if (type === 'jump') setCurrentIndex(index);
        }
      },
    []
  );

  return ReactDOM.createPortal(
    <section className={styles.section}>
      <span
        className={styles['close-icon-box']}
        title="Close"
        onClick={() => setViewStory(false)}
      >
        <IoClose className={styles['close-icon']} />
      </span>

      <div className={styles['story-container']} ref={carouselRef}>
        {stories.slice(currentIndex, currentIndex + 3).map((data, index) => (
          <StoryItem
            key={index}
            itemIndex={(data as Story).index}
            active={index === 1}
            moveToStory={moveToStory}
            totalLength={stories.length}
            data={data}
            currentIndex={currentIndex}
            switchType={swicthType}
          />
        ))}
      </div>
    </section>,
    target
  );
};

export default StoryModal;
