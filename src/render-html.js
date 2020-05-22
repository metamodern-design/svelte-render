import defaultTemplate from './default-template.js';


const renderHtml = (
  buildId = 'bundle',
  template = defaultTemplate,
  component = null,
) => {
  const css = `<link rel="stylesheet" href="style-${buildId}.css">`;
  const script = `<script src="client-${buildId}.js"></script>`;

  const { head, html } = (
    component
      ? component.render()
      : { head: '', html: '' }
  );

  return (
    template
      .replace('%svelte:head%', head)
      .replace('%svelte:html%', html)
      .replace('%svelte:css%', css)
      .replace('%svelte:script%', script)
  );
};


export default renderHtml;
