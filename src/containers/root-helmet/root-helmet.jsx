import React from 'react';
import { Helmet } from 'react-helmet';

/**
 * helmet optimization
 * https://www.metatagseo.com/
 * https://github.com/nfl/react-helmet#readme
 */

const RootHelmet = () => (
  <Helmet
    defaultTitle="React Starter Pack"
    titleTemplate="React Starter Pack - %"
  >
    <meta charSet="utf-8" />
    <meta name="description" content="React Starter Pack" />
    <meta property="og:site_name" content="React Starter Pack" />
    <meta property="og:description" content="Change your description to fit project need" />
    <meta property="og:image" content="" />
    <meta property="og:url" content="http://mysite.com/example" />
    <meta property="og:type" content="article" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="http://mysite.com/example" />
  </Helmet>
);

export default RootHelmet;
