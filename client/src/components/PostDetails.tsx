import { useEffect, useRef, useState } from 'react';
import styles from '../styles/UploadDetails.module.css';
import { Content } from '../pages/Create';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import {
  apiClient,
  debounce,
  getUrl,
  moveRangeOutOfInlineParents,
  sanitizeInput,
  saveSelection,
} from '../Utilities';
import { toast } from 'sonner';
import { IoClose, IoSearchSharp } from 'react-icons/io5';
import LoadingAnimation from './LoadingAnimation';
import { BsDot } from 'react-icons/bs';
import { createPortal } from 'react-dom';

type PostDetailsProps = {
  postType: 'content' | 'reel';
  setStage: React.Dispatch<
    React.SetStateAction<{
      reel: 'select' | 'edit' | 'finish';
      content: 'select' | 'edit' | 'finish';
      story: 'select' | 'edit' | 'finish';
    }>
  >;
  submitHandler: () => void;
  postDetails: {
    generalDescription: string;
    setGeneralDescription: React.Dispatch<React.SetStateAction<string>>;
    fileDescriptions?: Map<string, string>;
    setFileDescriptions?: React.Dispatch<
      React.SetStateAction<Map<string, string>>
    >;
    editedFiles?: Content[];
    collaborators: {
      id: string;
      username: string;
    }[];
    setCollaborators: React.Dispatch<
      React.SetStateAction<
        {
          id: string;
          username: string;
        }[]
      >
    >;
    mentions: Set<string>;
    setMentions: React.Dispatch<React.SetStateAction<Set<string>>>;
    settings: {
      accessibility: number;
      disableComments: boolean;
      hideEngagements: boolean;
    };
    setSettings: React.Dispatch<
      React.SetStateAction<{
        accessibility: number;
        disableComments: boolean;
        hideEngagements: boolean;
      }>
    >;
  };
  posting: boolean;
};

type MentionModalProps = {
  mentions: Set<string>;
  setShowMentionModal: React.Dispatch<React.SetStateAction<boolean>>;
  updateMentionList: (id: string, username: string, name: string) => () => void;
};

const maxFileDescriptionLength = 800;
const maxGeneralDescriptionLength = 2200;

const getUsers = async (...args: any[]) => {
  const [query, page, cursor] = args;

  try {
    const { data } = await apiClient(
      `v1/search/users?query=${query}&page=${page}&cursor=${cursor}`,
    );

    return data.data.result;
  } catch {
    return 'error';
  }
};

const debouncedQuery = debounce(getUsers, 300);

const PostDetails = ({
  postType,
  setStage,
  submitHandler,
  postDetails,
  posting,
}: PostDetailsProps) => {
  const {
    generalDescription,
    setGeneralDescription,
    fileDescriptions,
    setFileDescriptions,
    collaborators,
    setCollaborators,
    mentions,
    setMentions,
    settings,
    setSettings,
    editedFiles,
  } = postDetails;
  const [savedRange, setSavedRange] = useState<{
    range: Range;
    selection: Selection;
  }>(null!);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [addTag, setAddTag] = useState<boolean>(false);
  const [showMentionModal, setShowMentionModal] = useState<boolean>(false);
  const [searchData, setSearchData] = useState<{
    cursor: Date;
    end: boolean;
    page: number;
  }>({ cursor: null!, end: false, page: 1 });

  const [loading, setLoading] = useState<{
    display: boolean;
    query: string;
    value: boolean | 'error';
  }>({ value: false, query: '', display: false });

  const [searchResult, setSearchResult] = useState<any[]>([]);

  const collaboratorRef = useRef<HTMLInputElement>(null!);
  const descriptionRef = useRef<HTMLDivElement>(null!);
  const collaboratorSearchRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      if (collaboratorSearchRef.current) {
        const target = e.target as HTMLElement;
        if (
          target !== collaboratorSearchRef.current &&
          !collaboratorSearchRef.current.contains(target)
        ) {
          setLoading({
            display: false,
            value: false,
            query: '',
          });
          setSearchData({
            page: 1,
            cursor: null!,
            end: false,
          });
          setSearchResult([]);
        }
      }
    };

    if (descriptionRef.current) {
      descriptionRef.current.focus();
    }

    window.addEventListener('click', clickHandler);

    return () => {
      window.removeEventListener('click', clickHandler);
    };
  }, []);

  useEffect(() => {
    if (!showMentionModal && savedRange) {
      if (descriptionRef.current) {
        const { selection, range } = savedRange;
        selection.removeAllRanges();
        selection.addRange(range);
        descriptionRef.current.focus();
      }
    }
  }, [showMentionModal]);

  useEffect(() => {
    const filteredMentionList = [...mentions].filter((user) =>
      descriptionRef.current.querySelector(
        `.app-user-tags[data-tag-index="${user}"]`,
      ),
    );

    // Removes hidden formatting
    if (descriptionRef.current.textContent?.trim() === '') {
      descriptionRef.current.innerHTML = '';
      descriptionRef.current.focus();
    }

    setMentions(new Set(filteredMentionList));
  }, [generalDescription]);

  useEffect(() => {
    handleSearch();
  }, [loading]);

  const handleFileDescription = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFileDescriptions!((prev) => {
      const key = editedFiles![currentFileIndex].key;
      const map = new Map(prev);
      map.set(key, e.target.value);

      return map;
    });
  };

  const handleBeforeInput = (e: React.FormEvent<HTMLDivElement>) => {
    const data = (e as any).data;
    if (typeof data !== 'string') return e.preventDefault();

    const formattedText = sanitizeInput(generalDescription);

    const div = document.createElement('div');
    div.innerHTML = formattedText;

    if ((div.textContent || '').trim().length >= 2200) {
      e.preventDefault();
      return toast.info(`Content description can’t exceed 2200 characters.`);
    }

    if (data === '#') {
      e.preventDefault();
      return handleHashTag();
    }

    if (addTag) {
      if (data === ' ') {
        e.preventDefault();
        const tags = Array.from(
          descriptionRef.current.querySelectorAll('.app-hashtags'),
        );
        tags.forEach(
          (elem) => elem && ((elem as HTMLElement).contentEditable = 'false'),
        );

        const { sel: selection, range } = saveSelection(
          descriptionRef.current,
          setSavedRange,
        )!;

        selection.removeAllRanges();
        selection.addRange(range);

        range.deleteContents();

        moveRangeOutOfInlineParents(range, descriptionRef.current);

        const textNode = document.createTextNode(' ');

        range.insertNode(textNode);

        range.setStartAfter(textNode);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);

        saveSelection(descriptionRef.current, setSavedRange);
        setGeneralDescription(descriptionRef.current.innerHTML || '');
        setAddTag(false);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();

    const target = e.target as HTMLDivElement;
    const obj = saveSelection(descriptionRef.current, setSavedRange);

    const pastedText = e.clipboardData.getData('text/plain');

    if (obj && pastedText) {
      const { sel, range } = obj;

      const formattedText = sanitizeInput(generalDescription);
      const div = document.createElement('div');
      div.innerHTML = formattedText;

      if ((div.textContent || '').trim().length + pastedText.length >= 2200) {
        return toast.info(`Content description can’t exceed 2200 characters.`);
      }

      if (pastedText === '#') return handleHashTag();

      sel.removeAllRanges();
      sel.addRange(range);

      range.deleteContents();

      // Insert plain text at caret
      const textNode = document.createTextNode(pastedText);
      range.insertNode(textNode);

      // Moves caret after inserted text
      range.setStartAfter(textNode);
      range.collapse(true);

      sel.removeAllRanges();
      sel.addRange(range);

      saveSelection(descriptionRef.current, setSavedRange);
      setGeneralDescription(target.innerHTML || '');
    }
  };

  const handleGeneralDescription = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    saveSelection(descriptionRef.current, setSavedRange);
    setGeneralDescription(target.innerHTML || '');
  };

  const handleHashTag = () => {
    const { sel: selection, range } = saveSelection(
      descriptionRef.current,
      setSavedRange,
    )!;

    selection.removeAllRanges();
    selection.addRange(range);

    range.deleteContents();

    moveRangeOutOfInlineParents(range, descriptionRef.current);

    const container = range.startContainer;
    const offset = range.startOffset;
    let prevElem: Node = null!;
    let newNode: HTMLElement | Node = null!;

    if (container.nodeType === Node.TEXT_NODE) {
      if (offset === 0) prevElem = container.previousSibling!;
      else prevElem = container;
    }

    if (container.nodeType === Node.ELEMENT_NODE) {
      prevElem = container.childNodes[offset - 1];
    }

    newNode = document.createElement('span');
    (newNode as HTMLElement).setAttribute('class', 'app-hashtags');
    (newNode as HTMLElement).innerHTML = `#`;

    if (prevElem && prevElem.nodeType === Node.ELEMENT_NODE) {
      if ((prevElem as HTMLElement).classList.contains('app-hashtags')) {
        if (prevElem.textContent?.trim() === '#') {
          newNode = document.createTextNode('#');
          (prevElem as HTMLElement).remove();
        }
      }
    }

    range.insertNode(newNode);

    range.setStartAfter(newNode);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);

    setAddTag(newNode.nodeType === Node.ELEMENT_NODE);
    saveSelection(descriptionRef.current, setSavedRange);
    setGeneralDescription(descriptionRef.current.innerHTML || '');
  };

  const handleContainerClick = () => {
    saveSelection(descriptionRef.current, setSavedRange);
  };

  const handleSearch = async () => {
    if (loading.value === true) {
      const result = await debouncedQuery(
        loading.query,
        searchData.page,
        searchData.cursor,
      );

      if (result === 'error') {
        setLoading({ ...loading, value: 'error' });
      } else {
        const filteredResults = (result as []).filter(
          (obj: any) => !searchResult.find((data) => data._id === obj._id),
        );

        setSearchResult([...searchResult, ...filteredResults]);
        setSearchData({ ...searchData, end: (result as []).length < 30 });
        setLoading({ ...loading, value: false });
      }
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    const isBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

    if (isBottom && !searchData.end && loading.value === false) {
      if (loading.query === '') {
        setSearchData((prev) => ({
          ...prev,
          cursor:
            loading.value === 'error'
              ? prev.cursor
              : searchResult[searchResult.length - 1].createdAt,
        }));
      } else {
        setSearchData((prev) => ({
          ...prev,
          page: loading.value === 'error' ? prev.page : prev.page + 1,
        }));
      }

      setLoading({ ...loading, value: true });
    }
  };

  const updateCollaborators = (id: string, username: string) => () => {
    const user = collaborators.find((obj) => obj.id === id);

    if (user) {
      setCollaborators((prev) => prev.filter((user) => user.id !== id));
    } else {
      if (collaborators.length >= 3) {
        return toast.error('You can add only three collaborators.');
      }
      setCollaborators((prev) => [...prev, { id, username }]);
    }
  };

  const handleMentionClick = () => {
    const tags = Array.from(
      descriptionRef.current.querySelectorAll('.app-hashtags'),
    );
    tags.forEach(
      (elem) => elem && ((elem as HTMLElement).contentEditable = 'false'),
    );
    setAddTag(false);
    setShowMentionModal(true);
  };

  const updateMentionList =
    (id: string, username: string, name: string) => () => {
      const set = new Set(mentions);

      const { range, selection } = savedRange;

      if (!mentions.has(id)) {
        selection.removeAllRanges();
        selection.addRange(range);

        range.deleteContents();

        const tagElement = document.createElement('span');
        const textNode = document.createTextNode(' ');
        tagElement.setAttribute('class', 'app-user-tags');
        tagElement.setAttribute('data-tag-index', id);
        tagElement.setAttribute('href', `/@${username}`);

        tagElement.innerHTML = `@${name}`;
        tagElement.setAttribute('contentEditable', 'false');

        range.insertNode(textNode);
        range.insertNode(tagElement);

        // Moves caret after inserted text
        range.setStartAfter(textNode);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);

        set.add(id);
      } else {
        selection.removeAllRanges();
        selection.addRange(range);

        const users = Array.from(
          descriptionRef.current.querySelectorAll('.app-user-tags'),
        );

        const user = users.find(
          (elem) => elem && elem.getAttribute('data-tag-index') === id,
        );

        if (user) descriptionRef.current.removeChild(user);

        set.delete(id);
      }

      saveSelection(descriptionRef.current, setSavedRange);
      setGeneralDescription(descriptionRef.current.innerHTML);
      setMentions(set);
    };

  return (
    <>
      {showMentionModal && (
        <MentionModal
          setShowMentionModal={setShowMentionModal}
          mentions={mentions}
          updateMentionList={updateMentionList}
        />
      )}

      <div className={styles['upload-details-container']}>
        <div className={styles['description-container']}>
          <span className={styles['description-head']}>Description</span>

          {postType === 'content' && (
            <>
              <div className={styles['file-description-container']}>
                <span className={styles['file-description-text']}>
                  File Description:
                </span>

                <div className={styles['file-description-box']}>
                  <textarea
                    className={styles['file-description']}
                    value={
                      fileDescriptions!.get(
                        editedFiles![currentFileIndex].key,
                      ) || ''
                    }
                    onChange={handleFileDescription}
                    placeholder="Description for each file...."
                    maxLength={maxFileDescriptionLength}
                  ></textarea>

                  <div className={styles['file-description-details']}>
                    <div className={styles['file-pagination-details']}>
                      <span
                        className={`${styles['prev-file-box']} ${
                          currentFileIndex === 0
                            ? styles['inactive-file-box']
                            : ''
                        }`}
                        onClick={() => setCurrentFileIndex((prev) => prev - 1)}
                      >
                        <MdKeyboardArrowLeft
                          className={styles['prev-file-icon']}
                        />
                      </span>

                      <span className={styles['file-select-box']}>
                        <select
                          className={styles['file-select']}
                          value={currentFileIndex}
                          onChange={(e) =>
                            setCurrentFileIndex(Number(e.target.value))
                          }
                        >
                          {editedFiles!.map((_, index) => (
                            <option key={index} value={index}>
                              {index + 1}
                            </option>
                          ))}
                        </select>
                        /{' '}
                        <span className={styles['file-select-length']}>
                          {editedFiles!.length}
                        </span>
                      </span>

                      <span
                        className={`${styles['next-file-box']} ${
                          currentFileIndex === editedFiles!.length - 1
                            ? styles['inactive-file-box']
                            : ''
                        }`}
                        onClick={() => setCurrentFileIndex((prev) => prev + 1)}
                      >
                        <MdKeyboardArrowRight
                          className={styles['next-file-icon']}
                        />
                      </span>
                    </div>

                    <span className={styles['file-description-length']}>
                      {fileDescriptions!.has(editedFiles![currentFileIndex].key)
                        ? String(
                            fileDescriptions!.get(
                              editedFiles![currentFileIndex].key,
                            ),
                          ).trim().length
                        : 0}
                      /{maxFileDescriptionLength}
                    </span>
                  </div>
                </div>
              </div>
              <span className={styles['general-description-text']}>
                General Description:
              </span>
            </>
          )}

          <div className={styles['description-box']}>
            <div
              className={styles.description}
              contentEditable={true}
              ref={descriptionRef}
              onInput={handleGeneralDescription}
              onBeforeInput={handleBeforeInput}
              onPaste={handlePaste}
              onDrop={(e) => e.preventDefault()}
              onFocus={() =>
                saveSelection(descriptionRef.current, setSavedRange)
              }
              onClick={handleContainerClick}
            ></div>

            {descriptionRef.current?.textContent?.length === 0 && (
              <span className={styles.placeholder}>
                {postType === 'reel'
                  ? 'Add video description....'
                  : 'General description for all files....'}
              </span>
            )}

            <div className={styles['description-details']}>
              <span className={styles['links-box']}>
                <span
                  className={styles['mention-box']}
                  onClick={handleMentionClick}
                >
                  @ Mention
                </span>
                <span className={styles['hashtag-box']} onClick={handleHashTag}>
                  # Hashtags
                </span>
              </span>

              <span className={styles['description-length']}>
                {Math.min(
                  descriptionRef.current?.textContent?.trim().length || 0,
                  maxGeneralDescriptionLength,
                )}
                /{maxGeneralDescriptionLength}
              </span>
            </div>
          </div>
        </div>

        <div className={styles['collaborator-container']}>
          <span className={styles['collaborator-head']}>Add collaborators</span>

          <div
            className={styles['collaborators-search-div']}
            ref={collaboratorSearchRef}
          >
            <span className={styles['collaborators-box']}>
              <input
                type="text"
                className={styles['collaborators-input']}
                ref={collaboratorRef}
                placeholder="Search for user...."
                value={loading.query}
                onChange={(e) => {
                  setLoading({
                    display: true,
                    value: true,
                    query: e.target.value,
                  });
                  setSearchData({
                    page: 1,
                    cursor: null!,
                    end: false,
                  });
                  setSearchResult([]);
                }}
                onFocus={() =>
                  setLoading((prev) => ({
                    display: true,
                    value: true,
                    query: prev.query,
                  }))
                }
              />

              {loading.query.length > 0 && (
                <IoClose
                  className={styles['clear-icon']}
                  onClick={() => {
                    setLoading({ value: true, query: '', display: true });
                    setSearchData({
                      page: 1,
                      cursor: null!,
                      end: false,
                    });
                    setSearchResult([]);
                    collaboratorRef.current.focus();
                  }}
                />
              )}
            </span>

            {loading.display && (
              <div
                className={styles['collaborators-result-div']}
                onScroll={handleScroll}
              >
                {loading.value === true &&
                searchData.cursor === null &&
                searchData.page === 1 ? (
                  <div className={styles['error-text']}>
                    <LoadingAnimation
                      style={{
                        width: '3rem',
                        height: '3rem',
                        transform: 'scale(2.5)',
                      }}
                    />
                  </div>
                ) : loading.value === 'error' &&
                  searchData.cursor === null &&
                  searchData.page === 1 ? (
                  <div className={styles['error-text']}>
                    Couldn’t load users. Please try again.
                    <button
                      className={styles['error-btn']}
                      onClick={() => {
                        setLoading((prev) => ({ ...prev, value: true }));
                      }}
                    >
                      Try again
                    </button>
                  </div>
                ) : searchResult.length === 0 ? (
                  <div className={styles['error-text']}>
                    No matching user found.
                  </div>
                ) : (
                  <>
                    {searchResult.map((user) => (
                      <article
                        key={user._id}
                        className={styles['search-result']}
                        onClick={updateCollaborators(user._id, user.username)}
                      >
                        <img
                          src={getUrl(user.photo, 'users')}
                          className={styles['search-img']}
                        />

                        <span className={styles['name-box']}>
                          <span className={styles['search-username']}>
                            {user.name}

                            {user.type && (
                              <span className={styles['type-text']}>
                                <BsDot className={styles.dot} />
                                {user.type}
                              </span>
                            )}
                          </span>
                          <span className={styles['search-handle']}>
                            {user.username}
                          </span>
                        </span>

                        <input
                          className={styles['checkbox']}
                          type="checkbox"
                          checked={
                            !!collaborators.find((obj) => obj.id === user._id)
                          }
                          readOnly
                        />
                      </article>
                    ))}

                    {loading.value === true &&
                      (searchData.page !== 1 || searchData.cursor !== null) && (
                        <div className={styles['loader-box']}>
                          <LoadingAnimation
                            style={{
                              width: '2rem',
                              height: '2rem',
                              transform: 'scale(2.5)',
                            }}
                          />
                        </div>
                      )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className={styles['collaborator-list']}>
            {collaborators.map((user) => (
              <article
                key={user.id}
                className={styles['collaborator-list-item']}
              >
                <span>{user.username}</span>
                <IoClose
                  className={styles['collaborator-remove-icon']}
                  onClick={updateCollaborators(user.id, user.username)}
                />
              </article>
            ))}
          </div>
        </div>

        <div className={styles['settings-container']}>
          <span className={styles['settings-head']}>Settings</span>

          <div className={styles['settings-div']}>
            <div className={styles['settings-box']}>
              <span className={styles['settings-box-head']}>
                Accessibility:
              </span>
              <select
                className={styles['accessibility-select']}
                value={settings.accessibility}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    accessibility: parseInt(e.target.value),
                  }))
                }
              >
                <option value={0}>Everyone</option>
                <option value={1}>Friends</option>
                <option value={2}>Only you</option>
              </select>
            </div>

            <div className={styles['settings-box2']}>
              <input
                type="checkbox"
                id="views"
                className={styles['settings-checkbox']}
                checked={settings.hideEngagements}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    hideEngagements: e.target.checked,
                  }))
                }
              />

              <label className={styles['settings-box-label']} htmlFor="views">
                Hide the number of likes and comments on this post
              </label>
            </div>

            <div className={styles['settings-box2']}>
              <input
                type="checkbox"
                id="comments"
                className={styles['settings-checkbox']}
                checked={settings.disableComments}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    disableComments: e.target.checked,
                  }))
                }
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
          <button
            className={`${styles['post-btn']} ${styles['cancel-btn']} ${
              posting ? styles['disable-btn'] : ''
            }`}
            onClick={() => {
              setStage((prevStage) => ({
                ...prevStage,
                [postType]: 'select',
              }));
            }}
          >
            Discard
          </button>

          <button
            className={`${styles['post-btn']} ${
              posting ? styles['disable-btn'] : ''
            }`}
            onClick={submitHandler}
          >
            Post
          </button>
        </div>
      </div>
    </>
  );
};

const MentionModal = ({
  setShowMentionModal,
  mentions,
  updateMentionList,
}: MentionModalProps) => {
  const target = document.getElementById('mention-portal') || document.body;

  const [searchData, setSearchData] = useState<{
    cursor: Date;
    end: boolean;
    page: number;
  }>({ cursor: null!, end: false, page: 1 });

  const [loading, setLoading] = useState<{
    query: string;
    value: boolean | 'error';
  }>({ value: true, query: '' });

  const [searchResult, setSearchResult] = useState<any[]>([]);

  const searchRef = useRef<HTMLDivElement>(null!);
  const inputRef = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [loading]);

  useEffect(() => {
    const container = searchRef.current;

    if (
      searchResult.length !== 0 &&
      loading.value !== 'error' &&
      container &&
      container.scrollHeight <= container.clientHeight &&
      !searchData.end
    ) {
      handleSearch();
    }
  }, [searchResult]);

  const handleSearch = async () => {
    if (loading.value === true) {
      const result = await debouncedQuery(
        loading.query,
        searchData.page,
        searchData.cursor,
      );

      if (result === 'error') {
        setLoading({ ...loading, value: 'error' });
      } else {
        const filteredResults = (result as []).filter(
          (obj: any) => !searchResult.find((data) => data._id === obj._id),
        );

        setSearchResult([...searchResult, ...filteredResults]);
        setSearchData({ ...searchData, end: (result as []).length < 30 });
        setLoading({ ...loading, value: false });
      }
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;

    const isBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 50;

    if (isBottom && !searchData.end && loading.value === false) {
      if (loading.query === '') {
        setSearchData((prev) => ({
          ...prev,
          cursor:
            loading.value === 'error'
              ? prev.cursor
              : searchResult[searchResult.length - 1].createdAt,
        }));
      } else {
        setSearchData((prev) => ({
          ...prev,
          page: loading.value === 'error' ? prev.page : prev.page + 1,
        }));
      }

      setLoading({ ...loading, value: true });
    }
  };

  return createPortal(
    <section
      className={styles['mention-section']}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowMentionModal(false);
        }
      }}
    >
      <div
        className={styles['container']}
        ref={searchRef}
        onScroll={handleScroll}
      >
        <div className={styles['mention-head-box']}>
          <h4 className={styles['mention-heading']}>Find Users</h4>

          <span
            className={styles['close-icon-box']}
            onClick={() => setShowMentionModal(false)}
          >
            <IoClose className={styles['close-icon']} />
          </span>
        </div>
        <div className={styles['mention-search-div']}>
          <div className={styles['mention-search-box']}>
            <IoSearchSharp className={styles['mention-search-icon']} />
            <input
              type="text"
              placeholder="Search...."
              value={loading.query}
              onChange={(e) => {
                setLoading({ value: true, query: e.target.value });
                setSearchData({
                  page: 1,
                  cursor: null!,
                  end: false,
                });
                setSearchResult([]);
              }}
              ref={inputRef}
            />
            <IoClose
              className={styles['mention-clear-icon']}
              onClick={() => {
                setLoading({ value: true, query: '' });
                if (inputRef.current) inputRef.current.focus();
              }}
              title="Clear"
            />
          </div>
        </div>

        <div className={styles['result-container']}>
          {loading.value === true &&
          searchData.cursor === null &&
          searchData.page === 1 ? (
            <div className={styles['error-text']}>
              <LoadingAnimation
                style={{
                  width: '4rem',
                  height: '4rem',
                  transform: 'scale(2.5)',
                }}
              />
            </div>
          ) : loading.value === 'error' &&
            searchData.cursor === null &&
            searchData.page === 1 ? (
            <div className={styles['error-text']}>
              Couldn’t load users. Please try again.
              <button
                className={styles['error-btn']}
                onClick={() => {
                  setLoading((prev) => ({ ...prev, value: true }));
                }}
              >
                Try again
              </button>
            </div>
          ) : searchResult.length === 0 ? (
            <div className={styles['error-text']}>No matching user found.</div>
          ) : (
            <>
              {searchResult.map((user) => (
                <article
                  key={user._id}
                  className={styles['search-result']}
                  onClick={updateMentionList(
                    user._id,
                    user.username,
                    user.name,
                  )}
                >
                  <img
                    src={getUrl(user.photo, 'users')}
                    className={styles['search-img']}
                  />

                  <span className={styles['name-box']}>
                    <span className={styles['search-username']}>
                      {user.name}

                      {user.type && (
                        <span className={styles['type-text']}>
                          <BsDot className={styles.dot} />
                          {user.type}
                        </span>
                      )}
                    </span>
                    <span className={styles['search-handle']}>
                      {user.username}
                    </span>
                  </span>

                  <input
                    className={styles['checkbox']}
                    type="checkbox"
                    checked={mentions.has(user._id)}
                    readOnly
                  />
                </article>
              ))}

              {loading.value === true &&
                (searchData.page !== 1 || searchData.cursor !== null) && (
                  <div className={styles['loader-box']}>
                    <LoadingAnimation
                      style={{
                        width: '2rem',
                        height: '2rem',
                        transform: 'scale(2.5)',
                      }}
                    />
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </section>,
    target,
  );
};

export default PostDetails;
