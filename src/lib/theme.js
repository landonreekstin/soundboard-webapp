export function applyTheme(t) {
  if (!t) return;
  const root = document.documentElement;
  root.style.setProperty('--bg-color', t.bgColor);
  root.style.setProperty('--accent-color', t.accentColor);
  root.style.setProperty('--button-color', t.buttonColor);
  root.style.setProperty('--button-hover-color', t.buttonHoverColor);
  root.style.setProperty('--button-text-color', t.buttonTextColor);
  root.style.setProperty('--button-radius', `${t.buttonRadius}px`);
  root.style.setProperty('--font-family', t.fontFamily);

  const body = document.body;
  if (t.bgImageDataUrl) {
    body.style.backgroundImage = `url(${t.bgImageDataUrl})`;
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
    body.style.backgroundAttachment = 'fixed';
  } else {
    body.style.backgroundImage = '';
  }
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
