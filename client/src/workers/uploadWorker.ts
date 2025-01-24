self.onmessage = async (e: MessageEvent) => {
  const { file } = e.data;

  try {
    const type = file.type.includes('image')
      ? 'image'
      : file.type.includes('video')
      ? 'video'
      : null;

    if (type) {
      if (file.size > 1_073_741_824) {
        throw new Error('too large');
      } else {
        const result = await readFile(file);
        self.postMessage({ result, type });
      }
    } else {
      throw new Error('error');
    }
  } catch (error) {
    self.postMessage({ error });
  }
};

const readFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Read the file as ArrayBuffer
    const reader = new FileReader();
    reader.onload = () => {
      // Create a Blob from the ArrayBuffer
      const blob = new Blob([reader.result as ArrayBuffer]);
      // Generate a URL from the Blob
      const fileUrl = URL.createObjectURL(blob);
      resolve(fileUrl);
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

// let uploadWorker: Worker;

// // Check if browser supports web workers
// if (typeof Worker !== 'undefined') {
//   uploadWorker = new Worker(
//     new URL('../workers/uploadWorker.ts', import.meta.url)
//   );
// }
