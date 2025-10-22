import html2canvas from 'html2canvas';

const SCREENSHOT_DIR = 'screencaptures';

const sanitizeDir = (dir: string): string => {
    return dir.replace(/[^a-zA-Z0-9\-_\/]/g, '');
};

export const captureScreenshot = async (elementRef: HTMLElement | null, filename: string = 'screenshot'): Promise<void> => {
    if (!elementRef) return;
    
    try {
        const canvas = await html2canvas(elementRef, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true
        });
        
        canvas.toBlob((blob) => {
            if (!blob) return;
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const sanitizedFilename = filename.replace(/[^a-zA-Z0-9\-_]/g, '');
            link.href = url;
            link.download = `${sanitizedFilename}-${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(url);
        });
    } catch (error) {
        console.error('Screenshot capture failed:', error);
    }
};
