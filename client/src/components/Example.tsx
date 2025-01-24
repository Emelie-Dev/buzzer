const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (category === 'content') {
    const uploadFiles = e.target.files;

    if (uploadFiles) {
      const filesData: {
        src: string | ArrayBuffer | null;
        type: 'image' | 'video' | null;
      }[] = [];

      [...uploadFiles].forEach((file, index) => {
        const type = file.type.includes('image')
          ? 'image'
          : file.type.includes('video')
          ? 'video'
          : null;

        if (type) {
          const reader = new FileReader();
          reader.onload = function () {
            filesData[index] = { src: reader.result, type };
          };
          reader.readAsDataURL(file);
        }
      });

      setFiles({ ...files, content: filesData });
    }
  } else {
    const uploadFile = e.target.files && e.target.files[0];

    if (uploadFile) {
      let fileData: string | ArrayBuffer | null = '';

      const reader = new FileReader();
      reader.onload = function () {
        fileData = reader.result;
      };
      reader.readAsDataURL(uploadFile);

      setFiles({ ...files, reel: fileData });
    }
  }

  setStage({ ...stage, [category]: 'edit' });
};
