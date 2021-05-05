# Premix Documentation

## Routing

In Premix, a page is a React Component exported from a .js, .jsx, .ts, or .tsx file in the pages directory. Each page is associated with a route based on its path in `app/routes.ts`;

**Example**: If you create `pages/about.js` that exports a React component like below, it will be accessible at `/about`.

```js
function About() {
  return <div>About</div>;
}

export default About;
```

```js
export const routes = makeRoutes([
  ...,
  {
    path: '/about',
    page: () => import('./pages/about')
  }
])
```

### Dynamic Routing

Premix supports pages with dynamic routes. For example, if you set the `path` to `/posts/:id`, then it will be accessible at `posts/1`, `posts/2`, etc.

## Data fetching

Premix has two functions for data fetching:

- `loader` (Hybrid): Fetch data at build time or on each request.
- `loadPaths` (Static Generation): Specify dynamic routes to pre-render pages based on data.

### `loadPaths` (Static Generation)

If a page has dynamic routes, uses `loader` and is being prerendered, it needs to define a list of paths that have to be rendered to HTML at build time.

If you export an async function called `loadPaths` from a page that uses dynamic routes, Premix will statically pre-render all the paths specified by `loadPaths`.

```ts
export const loadPaths: LoadPathsFunction = async () => {
  return {
    paths: [
      { params: { ... } }
    ],
  };
}
```

#### The `paths` key (required)

The paths key determines which paths will be pre-rendered. For example, suppose that you have a page that uses dynamic routes named `pages/posts/$slug.tsx`. If you export `loadPaths` from this page and return the following for paths:

```js
return {
  paths: [{ params: { id: '1' } }, { params: { id: '2' } }],
};
```

Then Premix will statically generate `posts/1` and `posts/2` at build time using the page component in `pages/posts/$id.tsx`.

### `loader` (Hybrid)

If you export an async function called `loader` from a page, Premix will pre-render this page on each request or build time using the data returned by `loader`.

```ts
export const loader: LoaderFunction = async context => {
  return {
    props: {},
  };
};
```

### Example

```tsx
export default function Post() {
  const { post } = useRouteData();
  // Render post...
}

export const loadPaths: LoadPathsFunction = async () => {
  const res = await fetch('https://.../posts');
  const posts = await res.json();

  const paths = posts.map(post => ({
    params: { id: post.id },
  }));

  return { paths };
};

export const loader: LoaderFunction = async ({ params }) => {
  const res = await fetch(`https://.../posts/${params.id}`);
  const post = await res.json();

  return { props: { post } };
};
```

## Data mutation

Premix has built in support for data mutations.

### `action` (Server-Side Rendering)

If you export an `action` function from your page, Premix will call that function for evert `POST`/`PUT`/`DELETE` request on that route. This does not work with Static Generation.

```ts
// The req and res are from express
export const action: ActionFunction = async (req, res) => {
  // Create data
  await db.posts.create({ ... })

  // Optionally redirect to refetch client data
  res.redirect('/posts')
}
```

### Example

```tsx
export default function CreatePost() {
  return (
    <form method="post" action="/posts/create">
      {/* Render the inputs */}
    </form>
  )
}

export const action: ActionFunctino = async (req, res) => {
  await db.posts.create({ ... });

  res.redirect('/posts')
}
```

## Optimistic UI

In some cases, if the data mutation request takes a long time, its better to show an optimistic result in the UI for better UX. Premix has support for optimistic updates with the help of hooks and components.

Premix has the following api's for optimistic updates:

- `<Form />`: React Component to work with `usePendingForm`
- `usePendingFormSubmit`: React hook that returns value of `<Form />`

### `<Form />`

`<Form />` is a wrapper around the html `<form />` but it submits the form with Javascript and allows optimistic updates.

```tsx
export default function Create() {
  return <Form action="/.../create">{/* Render the inputs */}</Form>;
}
```

### `usePendingFormSubmit`

`usePendingFormSubmit` returns `null` by default. When `onSubmit` is called on `<Form />`, its value gets set to a [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object, from which you can get the values that the user entered

```ts
export default function Create() {
  const pendingFormSubmit = usePendingFormSubmit();

  // Render <Form />
}
```

### Example

```tsx
export default function CreatePost() {
  const pendingFormSubmit = usePendingFormSubmit();

  return (
    <>
      {pendingFormSubmit && (
        <div>Creating {pendingFormSubmit.get('title')}</div>
      )}
      <Form action="/posts/create">
        <input name="title" type="text" />
        <input name="body" type="text" />
      </Form>
    </>
  )
}

export const action: ActionFunctino = async (req, res) => {
  ...
}
```

## CSS Suport

You can import a stylesheet in any React Component inside your application. Premix will statically analyse your imports to only add those stylesheets to the head of the pages that import that Component.

During build time, all stylesheets will be concatenated into **many minified code split** and preloaded.

Due to the way it works, it has out of the box support for any other build time styling solution that outputs a css file like `vanilla-extract`, `css-modules` and `sass`.

### Example

```tsx
// components/Button.tsx
import '../styles/button.css';

export default function Button(props) {
  return <button {...props} className="button" type="button" />;
}
```

```tsx
// pages/index.tsx
export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      <Button>Click Me</Button>
    </div>
  );
}
```

```tsx
// pages/posts.tsx
export default function Post() {
  return (
    <div>
      <h1>Posts</h1>
    </div>
  );
}
```

### Rendered HTML

```html
<!-- Home page -->
<html>
  <head>
    <!-- Button Stylesheet -->
    <link rel="preload" as="style" href="/build/chunks/chunk.5KF3SF.css" />
    <link rel="stylesheet" href="/build/chunks/chunk.5KF3SF.css" />
    ...
  </head>
  ...
</html>
```

```html
<!-- Post page -->
<html>
  <head>
    <!-- No Stylesheet  -->
    ...
  </head>
  ...
</html>
```

## Image Optimization

Premix has a built-in Automatic Image Optimization.

The Automatic Image Optimization allows for resizing, optimizing, and serving images in modern formats like WebP when the browser supports it. This happens at the build time and only works with images in the file system.

Images are lazy loaded by default. That means your page speed isn't penalized for images outside the viewport. Images load as they are scrolled into viewport.

Images are always rendered in such a way as to avoid Cumulative Layout Shift. They also have a Base64 encoded string of the image in the server rendered markup which gets replaced by the image once its loaded.

### Example

```js
// Set the placeholder query to generate base64 string
// Set the width for the <img /> tag. The aspect ratio is maintained
import Image from 'img:../assets/image.jpg?width=500&placeholder';

export default function Home() {
  // This will expand into
  // <img
  //   height="..."
  //   width=".."
  //   src="..."
  //   loading="lazy"
  //   style={{ backgroundImage: '...', backgroundSize: 'cover' }}
  // />
  return <Image />;
}
```

## Live Reload

Live Reload is a Premix feature that gives you instantaneous feedback on edits made to your code. Live Reload is enabled by default.

### How It Works

Premix starts up a dev server during development that listens for the changes made to the build. It also starts a connection with the client using [Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events). Whenever you edit a file that is imported in app, `esbuild` will rebuild the code, then the dev server will emit an event to the client and the client refresh the page.

## Code Splitting

Premix has built-in support for Code Splitting on per page basis. This means that each page will be code split into its own Javascript bundle during the build process. These will be lazy loaded and preloaded in the html file.

### `loadable`

You can also set your own breakpoints for code splitting React components using `loadable` provided by Premix.
Currently it doesn't work with Server-Side Rendering.

```ts
const DynamicComponent = loadable('../components/DynamicComponent');
```

## Custom ESBuild Configuration

Premix uses [`esbuild`](https://esbuild.github.io/) as the Javascript/Typescript bundler.

In order to extend the usage of `esbuild`, you can define a function that extends its config inside `premix.config.js`, like so:

### Example

```js
/** @type {import('./src/types').PremixConfig} */
module.exports = {
  // `config` is the default Premix configuration for the environment
  // It will be different for server and client
  esbuild(config, { isServer }) {
    // Add an esbuild plugin
    config.plugins.push(...)

    return config;
  }
}
```

## Differences to Remix

### Main differences

- Premix doesn't support Nested routes. Currently there are no plans to support it as in most of the cases, they create alot of confusion as to which page is rendering on which route.
- Currently there is no client side router for Premix so each navigation will do a full page reload. The router should be added pretty soon.
- There is no API in Premix for cookie and session management.

### Features unique to Premix

Preact actually adds a few convenient features that are not supported in Remix:

#### Static Generation

Premix supports both Static Generation and Server-Side rendering out of the box. This means that you can prerender your Premix app into html files and deploy it anywhere you want.

In comparison, Remix only supports Server-Side rendering.

#### Automatic Stylesheet Injection

In Remix, you can only import stylesheets inside the pages which has alot of limitations. For eg. it doesn't support scoped styling, component level CSS, CSS modules or any other styling solution that outputs a CSS file.

Premix statically analyses your CSS imports at build time and creates a map of which stylesheet is being imported on which page and automatically injects them in the `<head />` during rendering.

#### Image Optimization

For convenience, Premix exports a React Component from the image imports rather than an object. Take a look at this component which renders an image.

```tsx
// Remix
import image from 'img:../image.jpg?placeholder';

export default function Home() {
  return (
    <div>
      <img
        height={image.height}
        width={image.width}
        src={image.src}
        loading="lazy"
        style={{
          backgroundImage: image.placeholder,
          backgroundSize: 'cover',
        }}
      />
    </div>
  );
}
```

In Premix this can be written as:

```tsx
// Premix
import Image from 'img:../image.jpg?placeholder';

export default function Home() {
  return (
    <div>
      <Image />
    </div>
  );
}
```

Both snippets render the exact same thing. It's just a matter of stylistic preference.
