import html2canvas from 'html2canvas';

/**
 * Captures a DOM node as an image using html2canvas and downloads it.
 * @param nodeId The ID of the HTML element to capture.
 * @param filename The filename for the downloaded image (should include .png extension)
 */
export async function downloadNodeAsImage(nodeId: string, filename: string) {
    const node = document.getElementById(nodeId);
    if (!node) {
        throw new Error(`Element with id ${nodeId} not found`);
    }

    try {
        const canvas = await html2canvas(node, {
            useCORS: true,
            scale: 2, // Higher resolution
            backgroundColor: null, // Allow transparent background
        });

        const dataUrl = canvas.toDataURL('image/png');
        downloadImage(dataUrl, filename);
    } catch (error) {
        console.error("Error generating image:", error);
        throw error;
    }
}

/**
 * Programmatically triggers a file download for a generated data URL.
 * @param dataUrl The data URL string representing the image
 * @param filename The filename for the downloaded file
 */
export function downloadImage(dataUrl: string, filename: string) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
