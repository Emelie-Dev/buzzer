import React, { createContext } from 'react';

interface LikeObj {
  like: boolean;
  setLike: React.Dispatch<React.SetStateAction<boolean>>;
  setHideLike: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
  setHideMenu: React.Dispatch<React.SetStateAction<boolean>>;
  reelMenuRef: React.MutableRefObject<HTMLDivElement>;
  viewComment: boolean;
}

export const ContentContext = createContext<{
  contentRef: React.MutableRefObject<HTMLDivElement[]>;
  activeVideo: HTMLVideoElement | null;
  setActiveVideo: React.Dispatch<React.SetStateAction<HTMLVideoElement | null>>;
}>(null!);

export const LikeContext = createContext<LikeObj>(null!);
