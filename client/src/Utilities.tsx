import axios from 'axios';
import DOMPurify from 'dompurify';
import React from 'react';
import parse from 'html-react-parser';
import { Link } from 'react-router-dom';

type FileData = {
  filter: string;
  adjustments: {
    brightness: number;
    contrast: number;
    grayscale: number;
    'hue-rotate': number;
    saturate: number;
    sepia: number;
  };
};

export const serverUrl =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_BACKEND_URL
    : import.meta.env.VITE_LOCAL_BACKEND_URL;

export const apiClient = axios.create({
  baseURL: `${serverUrl}api/`,
  withCredentials: true,
  headers: {
    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
});

// Helper: Convert base64 public key to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

const sanitizeHTML = (dirtyHtml: string, allowedClasses: string[]) => {
  const hook = (_: Element, data: any) => {
    if (data.attrName === 'class') {
      const classes = (data.attrValue || '').split(/\s+/);
      const filtered = classes.filter((cls: any) =>
        allowedClasses.includes(cls),
      );

      if (filtered.length > 0) {
        data.attrValue = filtered.join(' ');
        data.keepAttr = true;
      } else {
        data.keepAttr = false;
      }
    }
  };

  // Add the hook temporarily
  DOMPurify.addHook('uponSanitizeAttribute', hook);

  const clean = DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: ['a', 'br'],
    ALLOWED_ATTR: ['class', 'href'],
    ALLOW_DATA_ATTR: false,
  });

  // Remove the hook so it doesn't affect other sanitizations
  DOMPurify.removeHook('uponSanitizeAttribute', hook);

  return clean;
};

export const filters = [
  {
    name: 'Original',
    filter:
      'brightness(1) contrast(1) grayscale(0) hue-rotate(0deg) saturate(1) sepia(0)',
  },
  { name: 'Warm Glow', filter: 'brightness(1.1) saturate(1.2) sepia(0.2)' },
  {
    name: 'Cool Mist',
    filter: 'brightness(0.95) saturate(0.8) contrast(1.1) hue-rotate(-20deg)',
  },
  { name: 'Vintage Charm', filter: 'sepia(0.5) saturate(0.8) contrast(1.2)' },
  { name: 'Dreamscape', filter: 'blur(2px) brightness(1.1) saturate(1.1)' },
  {
    name: 'Golden Hour',
    filter: 'brightness(1.2) sepia(0.4) hue-rotate(-10deg)',
  },
  {
    name: 'Ocean Breeze',
    filter: 'brightness(1.05) saturate(1.3) hue-rotate(-40deg)',
  },
  {
    name: 'Pastel Dreams',
    filter: 'brightness(1.1) saturate(0.7) contrast(1.1)',
  },
  { name: 'Rustic Vibes', filter: 'sepia(0.6) contrast(1.1) brightness(0.9)' },
  { name: 'Cinematic', filter: 'contrast(1.4) brightness(0.8) saturate(0.9)' },
  { name: 'Frosted', filter: 'brightness(1.2) blur(1px) saturate(0.8)' },
  {
    name: 'Twilight',
    filter: 'brightness(0.9) contrast(1.1) hue-rotate(40deg)',
  },
  { name: 'Ember', filter: 'sepia(0.3) brightness(1.2) saturate(1.1)' },
  { name: 'Serenity', filter: 'contrast(1.1) brightness(1.1) saturate(0.9)' },
  {
    name: 'Lush Forest',
    filter: 'hue-rotate(80deg) brightness(1.1) saturate(1.3)',
  },
  {
    name: 'Muted Elegance',
    filter: 'brightness(0.9) saturate(0.7) contrast(1.2)',
  },
  { name: 'Radiance', filter: 'brightness(1.3) saturate(1.2) contrast(1.1)' },
  {
    name: 'Arctic Chill',
    filter: 'brightness(1.1) saturate(0.8) hue-rotate(-50deg)',
  },
  { name: 'Sepia Luxe', filter: 'sepia(1) brightness(1.2) contrast(1.1)' },

  { name: 'Noir', filter: 'grayscale(1) brightness(0.9) contrast(1.2)' },
  { name: 'Monochrome Bliss', filter: 'grayscale(1) brightness(1.1)' },
];

export const monthLabels = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const getAdjustmentsValue = (currentFileData: FileData) => {
  const adjustments = { ...currentFileData.adjustments };

  for (const [key, value] of Object.entries(adjustments)) {
    if (key === 'brightness' || key === 'contrast') {
      adjustments[key] = value / 200;
    } else if (key === 'saturate') {
      adjustments[key] = value / 100;
    } else if (key === 'hue-rotate') {
      adjustments[key] = value / (10 / 9);
    } else if (key === 'sepia' || key === 'grayscale') {
      adjustments[key] = value / 100;
    }
  }

  return adjustments;
};

export const getFilterValue = (currentFileData: FileData, request = false) => {
  const filter = filters.find(
    (filter) => filter.name === currentFileData.filter,
  )?.filter;

  if (filter) {
    const initialValues: Record<string, number> = {
      brightness: 1,
      contrast: 1,
      grayscale: 0,
      'hue-rotate': 0,
      saturate: 1,
      sepia: 0,
      blur: 0,
    };

    const filterValue = filter.split(' ');

    const filterObj = filterValue.reduce<Record<string, number>>(
      (accumulator, filter) => {
        const name = filter.slice(0, filter.indexOf('('));
        const value = parseFloat(
          filter.slice(filter.indexOf('(') + 1, filter.indexOf(')')),
        );
        accumulator[name] = value;
        return accumulator;
      },
      {},
    );

    const adjustments: Record<string, number> =
      getAdjustmentsValue(currentFileData);

    const keys = [
      ...new Set([...Object.keys(filterObj), ...Object.keys(adjustments)]),
    ];

    const filterString = keys.reduce((accumulator, value) => {
      const result =
        (filterObj[value] || initialValues[value]) + (adjustments[value] || 0);

      if (value === 'hue-rotate') {
        return (
          accumulator +
          (request ? `${value}(${result}) ` : `${value}(${result}deg) `)
        );
      } else if (value === 'blur') {
        return (
          accumulator +
          (request ? `${value}(${result}) ` : `${value}(${result}px) `)
        );
      }

      return accumulator + `${value}(${result}) `;
    }, '');

    return filterString;
  }
};

export const getDurationText = (duration: number): string => {
  if (!duration) return '00:00';

  if (duration < 60) {
    return `00:${String(duration).padStart(2, '0')}`;
  } else if (duration < 3600) {
    const trunc = Math.trunc(duration / 60);
    const rem = duration - trunc * 60;

    return `${String(trunc).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  } else {
    return `1:00:00`;
  }
};

export const getDate = (value: string) => {
  const date = new Date(value);

  return `${
    monthLabels[date.getMonth()]
  } ${date.getDate()}, ${date.getFullYear()}`;
};

export const registerPush = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported in this browser');
    return;
  }

  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();

  if (!existingSubscription) {
    // ✅ Not subscribed yet — now create and send to backend
    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });

    await apiClient.post('v1/notifications/push/subscribe', {
      subscription: newSubscription,
    });

    console.log('New push subscription registered.');
  } else {
    console.log('Already subscribed to push.');
  }
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
) => {
  let timeout: ReturnType<typeof setTimeout>;

  return function async(...args: Parameters<T>) {
    clearTimeout(timeout);

    return new Promise((resolve) => {
      timeout = setTimeout(async () => {
        const result = await func(...args);

        resolve(result);
      }, delay);
    });
  };
};

export const getUrl = (path: string, resource: string) => {
  return import.meta.env.MODE === 'production'
    ? path
    : `${serverUrl}${resource}/${path}`;
};

export const getTime = (time: string, comment = false) => {
  const date = new Date(time);
  const diff = new Date().getTime() - Date.parse(time);
  let value;

  if (diff > 31_536_000_000) {
    value = comment
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          '0',
        )}-${String(date.getDate()).padStart(2, '0')}`
      : `${
          monthLabels[date.getMonth()]
        } ${date.getDate()}, ${date.getFullYear()}`;
  } else if (diff > 2_592_000_000) {
    value = comment
      ? `${String(date.getMonth() + 1).padStart(2, '0')}-${String(
          date.getDate(),
        ).padStart(2, '0')}`
      : `${monthLabels[date.getMonth()]} ${date.getDate()}`;
  } else if (diff > 604_800_000) {
    value = `${Math.floor(diff / 604_800_000)}w`;
  } else if (diff > 86_400_000) {
    value = `${Math.floor(diff / 86_400_000)}d`;
  } else if (diff > 3_600_000) {
    value = `${Math.floor(diff / 3_600_000)}h`;
  } else if (diff > 60_000) {
    value = `${Math.floor(diff / 60_000)}m`;
  } else if (diff > 1000) {
    value = `${Math.floor(diff / 1000)}s`;
  } else {
    value = '1s';
  }

  return value;
};

export const getEngagementValue = (field: number) => {
  if (field > 1_000_000_000) {
    return `${Number((field / 1_000_000_000).toFixed(1))}B`;
  } else if (field > 1_000_000) {
    return `${Number((field / 1_000_000).toFixed(1))}M`;
  } else if (field > 9999) {
    return `${Number((field / 1_000).toFixed(1))}K`;
  } else {
    return field;
  }
};

export const sanitizeInput = (textContent: string) => {
  const convertedHTML = textContent
    .replace(/<span([^>]*)>/g, '<a$1>')
    .replace(/<\/span>/g, '</a>');

  const text = sanitizeHTML(convertedHTML, ['app-user-tags', 'app-hashtags']);

  const formatted = text
    .replace(/(<br\s*\/?>\s*){2,}/gi, '<br />')
    .replace(/(&nbsp;\s*){2,}/gi, '&nbsp;');

  return formatted.trim();
};

export const saveSelection = (
  container: HTMLElement,
  stateSetter: React.Dispatch<
    React.SetStateAction<{
      range: Range;
      selection: Selection;
    }>
  >,
  setState: boolean = true,
) => {
  if (document.activeElement !== container) container.focus();

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);

  // Makes sure the range is inside the container
  if (!container.contains(range.startContainer)) return;

  if (setState) stateSetter({ range: range.cloneRange(), selection: sel });

  return { sel, range };
};

export const moveRangeOutOfInlineParents = (
  range: Range,
  container: HTMLElement,
) => {
  let node = range.startContainer;

  while (node && node !== container) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;

      const display = window.getComputedStyle(el).display;

      if (
        display === 'inline' ||
        display === 'inline-block' ||
        el.tagName === 'SPAN'
      ) {
        range.setStartAfter(el);
        range.collapse(true);
        return;
      }
    }

    node = node.parentNode!;
  }
};

export const streamResponse = async (
  url: string,
  body: FormData,
  updatePostStage: (data: any) => void,
) => {
  const request = new Request(url, {
    method: 'POST',
    body,
    credentials: 'include',
  });

  const response = await fetch(request);
  if (!response.body) throw new Error();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      // decode incrementally so multi-byte UTF-8 characters are handled correctly
      const chunkText = decoder.decode(value, { stream: true });
      buffer += chunkText;

      const streams = buffer.split('\n');
      buffer = streams.pop()!;

      for (const stream of streams) {
        if (!stream.trim()) continue;
        const data = JSON.parse(stream);

        if (data.status !== 'success') {
          const error = new Error(data.message);
          error.name = 'operational';
          throw error;
        }

        updatePostStage(data);
      }
    }

    // flush remaining bytes from decoder (multi-byte chars)
    const rest = decoder.decode();
    if (rest) buffer += rest;

    // finally parse any remaining JSON object
    if (buffer.trim()) {
      const data = JSON.parse(buffer);

      if (data.status !== 'success') {
        const error = new Error(data.message);
        error.name = 'operational';
        throw error;
      }

      updatePostStage(data);
    }
  } catch (err) {
    try {
      await reader.cancel();
      // eslint-disable-next-line no-empty
    } catch {}
    throw err;
  } finally {
    try {
      reader.releaseLock();
      // eslint-disable-next-line no-empty
    } catch {}
  }
};

export const parseHTML = (text: string) => {
  if (!text) return '';

  const content = parse(text, {
    replace: (domNode: any) => {
      if (domNode.name === 'a' && domNode.attribs?.href?.startsWith('/')) {
        return (
          <Link to={domNode.attribs.href} className={domNode.attribs.class}>
            {domNode.children[0]?.data}
          </Link>
        );
      }
    },
  });

  return content;
};
