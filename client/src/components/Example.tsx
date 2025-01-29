import { useEffect, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';

const ffmpeg = new FFmpeg();

const VideoTrimmer = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [trimmedVideo, setTrimmedVideo] = useState<string | null>(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(10);
  const [videoDuration, setVideoDuration] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoURL(url);

      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => setVideoDuration(video.duration);
    }
  }, [videoFile]);

  const handleTrim = async () => {
    if (!videoFile) return;

    setLoading(true);
    await ffmpeg.load();

    ffmpeg.writeFile('input.mp4', await videoFile.arrayBuffer());

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-ss',
      `${start}`,
      '-to',
      `${end}`,
      '-c',
      'copy',
      'output.mp4',
    ]);

    const data = await ffmpeg.readFile('output.mp4');
    const blob = new Blob([data], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    setTrimmedVideo(url);
    setLoading(false);
  };

  return (
    <div>
      <input
        type="file"
        accept="video/mp4"
        onChange={(e) => {
          setVideoFile(e.target.files?.[0] || null);
          setTrimmedVideo(null);
        }}
      />

      {videoURL && (
        <div>
          <video controls src={videoURL} width="400" />

          <div>
            <label>Start: {start}s</label>
            <input
              type="range"
              min="0"
              max={videoDuration}
              value={start}
              onChange={(e) => setStart(Number(e.target.value))}
            />

            <label>End: {end}s</label>
            <input
              type="range"
              min="0"
              max={videoDuration}
              value={end}
              onChange={(e) => setEnd(Number(e.target.value))}
            />
          </div>

          <button onClick={handleTrim} disabled={loading}>
            {loading ? 'Trimming...' : 'Trim Video'}
          </button>
        </div>
      )}

      {trimmedVideo && (
        <div>
          <h3>Trimmed Video:</h3>
          <video controls src={trimmedVideo} width="400" />
          <a href={trimmedVideo} download="trimmed-video.mp4">
            Download
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoTrimmer;
