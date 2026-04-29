import { useState } from "react";

export const useFileDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const downloadFile = async (url, fileName) => {
    setIsDownloading(true);
    setProgress(0);

    try {
      // Use a controller to handle potential timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("Download failed");
      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      if (!total) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        const reader = response.body.getReader();
        let received = 0;
        const chunks = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          setProgress(received / total);
        }

        const blob = new Blob(chunks);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.error("Download error:", error);
      // Fallback: Extremely reliable direct download
      try {
        window.location.assign(url);
      } catch (fallbackError) {
        // Last resort
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.click();
      }
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  return { isDownloading, progress, downloadFile };
};
