import html2canvas from 'html2canvas';

export async function exportImage(elementId: string, filename: string = 'foresight-scenario.png'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  try {
    // Temporarily make the element visible if it was hidden via absolute positioning off-screen
    const originalLeft = element.style.left;
    const originalPosition = element.style.position;
    
    // We don't want to show it on screen, so just ensure it's rendered.
    // Usually, position: absolute; left: -9999px is enough for html2canvas to still capture it,
    // as long as display is NOT 'none'.
    
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution (retina)
      useCORS: true,
      backgroundColor: '#050505', // Match our dark theme background
      logging: false,
    });

    const dataUrl = canvas.toDataURL('image/png');

    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
    
    // Cleanup
    link.remove();
  } catch (err) {
    console.error('Error generating image export:', err);
    throw err;
  }
}
