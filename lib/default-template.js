const defaultTemplate = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width">
    <meta name="format-detection" content="email=no,telephone=no">
    <link rel="apple-touch-icon" sizes="192x192" href="/favicon.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon.png">
    %svelte:head%
    %svelte:css%
  </head>
  <body>
    %svelte:html%
    %svelte:script%
  </body>
</html>
`;


export default defaultTemplate;
