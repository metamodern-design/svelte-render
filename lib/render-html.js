import { defaultTemplate } from './default-template.js';

export const renderHtml = ({
  buildId = 'bundle',
  template = false,
  component = false,
  noClient = false,
  noCss = false,
} = {}) => {
  const css = (
    noCss
      ? ''
      : `<link rel="stylesheet" href="/style-${buildId}.css">`
  );

  const script = (
    noClient
      ? ''
      : `<script src="/client-${buildId}.js"></script>`
  );

  const { head, html } = (
    component
      ? component.render()
      : { head: '', html: '' }
  );

  return (
    (template || defaultTemplate)
      .replace('%svelte:head%', head)
      .replace('%svelte:html%', html)
      .replace('%svelte:css%', css)
      .replace('%svelte:script%', script)
  );
};
