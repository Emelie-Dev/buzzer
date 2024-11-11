import React, { createContext } from 'react';

interface LikeObj {
  like: boolean;
  setLike: React.Dispatch<React.SetStateAction<boolean>>;
  setHideLike: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ContentContext = createContext<
  React.MutableRefObject<HTMLDivElement[]>
>(null!);

export const LikeContext = createContext<LikeObj>(null!);
