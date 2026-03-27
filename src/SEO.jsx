const SEO = ({ title }) => {
  const defaultTitle = "Life Saver Army";
  const pageTitle = title ? `${defaultTitle} - ${title}` : defaultTitle;

  return (
    <>
      <meta charSet="utf-8" />
      <title>{pageTitle}</title>
      <meta name="robots" content="noindex, follow" />
      <meta
        name="description"
        content="Life Saver Army- Blood donation Website"
      />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />
    </>
  );
};

export default SEO;
