import defaultTemplate from './default-template.js';


const renderHtml = ({
  buildId = 'bundle',
  template = null,
  component = null,
  noStyle = false,
  noClient = false,
} = {}) => {
  const css = (
    noStyle
      ? ''
      : `<link rel="stylesheet" href="style-${buildId}.css">`
  );

  const script = (
    noClient
      ? ''
      : `<script src="client-${buildId}.js"></script>`
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


export default renderHtml;
