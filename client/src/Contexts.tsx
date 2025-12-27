import React, { createContext } from 'react';

interface LikeObj {
  like: {
    value: boolean;
    obj: any;
    count: number;
  };
  setLike: React.Dispatch<
    React.SetStateAction<{
      value: boolean;
      obj: any;
      count: number;
    }>
  >;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
  setHideMenu: React.Dispatch<React.SetStateAction<boolean>>;
  reelMenuRef: React.MutableRefObject<HTMLDivElement>;
  viewComment: boolean;
  setShowMobileMenu?: React.Dispatch<React.SetStateAction<boolean>>;
  muted: boolean;
  setMuted: React.Dispatch<React.SetStateAction<boolean>>;
  handleLike: () => Promise<void>;
  handlePinnedReels: (action: 'add' | 'delete') => string | number | undefined;
  isReelPinned: () => boolean;
  collaboratorsList: {
    value: any[];
    loading: boolean;
    isCollaborator: boolean;
  };
  handleFollow: (
    e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
    id: string
  ) => Promise<void>;
  followList: Set<string>;
  getFollowText: (id: string) => 'Unfollow' | 'Follow';
}

type AudioFile = {
  name: string;
  duration: string;
  src: string;
  id: string;
  saved?: boolean;
  current?: boolean;
};

export const ContentContext = createContext<{
  contentRef: React.MutableRefObject<HTMLDivElement[]>;
  activeVideo: HTMLVideoElement | null;
  setActiveVideo: React.Dispatch<React.SetStateAction<HTMLVideoElement | null>>;
  reelOptions?: {
    autoScroll: boolean;
    playBackSpeed: 0.5 | 1 | 1.5 | 2;
  };
  mainRef?: React.MutableRefObject<HTMLDivElement>;
}>(null!);

export const LikeContext = createContext<LikeObj>(null!);

export const UploadReelContext = createContext<{
  sounds: AudioFile[];
  setSounds: React.Dispatch<React.SetStateAction<AudioFile[]>>;
  rawSounds: File[] | FileList;
  setRawSounds: React.Dispatch<React.SetStateAction<FileList | File[]>>;
  savedSounds: AudioFile[];
  setSavedSounds: React.Dispatch<React.SetStateAction<AudioFile[]>>;
  coverUrls: string[];
  setCoverUrls: React.Dispatch<React.SetStateAction<string[]>>;
  coverIndex: number | 'local' | null;
  setCoverIndex: React.Dispatch<React.SetStateAction<number | 'local' | null>>;
  localCoverUrl: string;
  setLocalCoverUrl: React.Dispatch<React.SetStateAction<string>>;
  sliderValues: number | number[];
  setSliderValues: React.Dispatch<React.SetStateAction<number | number[]>>;
  src: string | ArrayBuffer | null;
  setStage: React.Dispatch<
    React.SetStateAction<{
      reel: 'select' | 'edit' | 'finish';
      content: 'select' | 'edit' | 'finish';
    }>
  >;
  fileRef: React.MutableRefObject<HTMLInputElement>;
}>(null!);

export const GeneralContext = createContext<{
  settingsCategory: string;
  setSettingsCategory: React.Dispatch<React.SetStateAction<string>>;
  createCategory: 'reel' | 'content' | 'story';
  setCreateCategory: React.Dispatch<
    React.SetStateAction<'reel' | 'content' | 'story'>
  >;
  scrollingUp: boolean | null;
  setScrollingUp: React.Dispatch<React.SetStateAction<boolean | null>>;
  showSearchPage: boolean;
  setShowSearchPage: React.Dispatch<React.SetStateAction<boolean>>;
  suggestedUsers: any[];
  setSuggestedUsers: React.Dispatch<React.SetStateAction<any[]>>;
  showFriendRequests: boolean;
  setShowFriendRequests: React.Dispatch<React.SetStateAction<boolean>>;
  showCollaborationRequests: boolean;
  setShowCollaborationRequests: React.Dispatch<React.SetStateAction<boolean>>;
  profileData: {
    followers: number;
    following: number;
    friends: number;
    posts: number;
    likes: number;
  };
  setProfileData: React.Dispatch<
    React.SetStateAction<{
      followers: number;
      following: number;
      friends: number;
      posts: number;
      likes: number;
    }>
  >;
}>(null!);

export const SettingsContext = createContext<{
  setMainCategory: React.Dispatch<React.SetStateAction<string>>;
  sectionRef: React.MutableRefObject<HTMLDivElement>;
}>(null!);

export const AuthContext = createContext<{
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
}>(null!);

export const StoryContext = createContext<{
  viewStory: boolean;
  setViewStory: React.Dispatch<React.SetStateAction<boolean>>;
  storyIndex: number;
  setStoryIndex: React.Dispatch<React.SetStateAction<number>>;
  stories: any[];
  userStory: any[];
  setUserStory: React.Dispatch<React.SetStateAction<any[]>>;
  setStories: React.Dispatch<React.SetStateAction<any[]>>;
}>(null!);

export const NotificationContext = createContext<{
  likes: {
    content: {
      value: string;
      obj: any;
    }[];
    reel: {
      value: string;
      obj: any;
    }[];
    story: {
      value: string;
      obj: any;
    }[];
    comment: {
      value: string;
      obj: any;
    }[];
  };

  setLikes: React.Dispatch<
    React.SetStateAction<{
      content: {
        value: string;
        obj: any;
      }[];
      reel: {
        value: string;
        obj: any;
      }[];
      story: {
        value: string;
        obj: any;
      }[];
      comment: {
        value: string;
        obj: any;
      }[];
    }>
  >;
  followingList: any[];
  setFollowingList: React.Dispatch<React.SetStateAction<any[]>>;
  deleteData: {
    list: Set<string>;
    loading: boolean;
  };
  setDeleteData: React.Dispatch<
    React.SetStateAction<{
      list: Set<string>;
      loading: boolean;
    }>
  >;
  deleteNotifications: () => Promise<void>;
}>(null!);
