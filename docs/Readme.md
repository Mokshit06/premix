# Premix Documentation

## Routing

In Premix, a page is a React Component exported from a .js, .jsx, .ts, or .tsx file in the pages directory. Each page is associated with a route based on its name in `pages` directory.

**Example**: If you create `pages/about.js` that exports a React component like below, it will be accessible at `/about`.

```js
function About() {
  return <div>About</div>;
}

export default About;
```

### Dynamic Routing

Premix supports pages with dynamic routes. For example, if you set the `path` to `/posts/:id`, then it will be accessible at `posts/1`, `posts/2`, etc.

### Links

Premix prefetches the route data and resources when you hover or touch on the links so that the data is already available when route transition starts. This makes the app feel faster.

#### `useRouter`

`useRouter` wraps React Router's multiple hooks into a single hook and provides a few additional methods like `prefetch` to preload a route's assets (CSS and JS) and its data so that the browser can cache it, for faster navigation.

#### `usePendingLocation`

There is also a hook `usePendingLocation` which can be used to see if the transition is taking place.

## Data fetching

Premix has two functions for data fetching:

- `serverLoader` (Server-Side Rendering): Fetch data on each request.
- `staticLoader` (Static Generation): Fetch data at build time.
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

The paths key determines which paths will be pre-rendered. For example, suppose that you have a page that uses dynamic routes named `pages/posts/[slug].tsx`. If you export `loadPaths` from this page and return the following for paths:

```js
return {
  paths: [{ params: { id: '1' } }, { params: { id: '2' } }],
};
```

Then Premix will statically generate `posts/1` and `posts/2` at build time using the page component in `pages/posts/[id].tsx`.

### `serverLoader` (Server-Side Rendering)

If you export an async function called `serverLoader` from a page, Premix will render this page on each request using the data returned by `serverLoader`.

```ts
export const serverLoader: ServerLoaderFunction = async req => {
  return {
    props: {},
  };
};
```

### `staticLoader` (Static Generation)

If you export an async function called `staticLoader` from a page, Premix will pre-render this page at build time using the data returned by `staticLoader`.

```ts
export const staticLoader: StaticLoaderFunction = async ctx => {
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

export const serverLoader: ServerLoaderFunction = async req => {
  const res = await fetch(`https://.../posts/${req.params.id}`);
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
  res.redirect(303, '/posts')
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

## Cookies / Sessions

Premix adds Express's [`express-session`](https://www.npmjs.com/package/express-session), [`connect-flash`](https://www.npmjs.com/package/connect-flash) and [`cookie-parser`](https://www.npmjs.com/package/cookie-parser) middlewares. Since you get Express's `req` object in your `action` and `serverLoader`, you can directly interact with the API of these middlewares.

### Flash

```tsx
export const action: ActionFunction = async (req, res) => {
  // Set flash message with the key `message`
  req.flash('message', 'Some message');
  res.redirect(303, '/');
};

export const serverLoader: ServerLoaderFunction = async req => {
  // Get all flash messages with the key `message`
  const messages = req.flash('message');

  return {
    props: { messages },
  };
};

export default function Home() {
  const { messages } = useRouteData();

  return (
    <div>
      {messages.map(message => (
        <div className="flash">{message}</div>
      ))}
    </div>
  );
}
```

### Cookies

```tsx
export const action: ActionFunction = async (req, res) => {
  // Set cookie with the key `userId`
  res.cookie('userId', 'some_id');
  res.redirect(303, '/');
};

export const serverLoader: ServerLoaderFunction = async req => {
  // Get all flash messages with the key `message`
  const userId = req.cookies.userId;

  return {
    props: { userId },
  };
};

export default function Home() {
  const { userId } = useRouteData();
  const submit = useSubmit();

  return (
    <div>
      {userId ? <h1>User ID: {userId}</h1> : <h1>Not authenticated</h1>}
      <button
        // Call the `action` on click
        onClick={() => submit({})}
      >
        Login
      </button>
    </div>
  );
}
```

## API Routes

API routes provide a solution to build your API with Premix.

Any file inside the folder `pages/api` is mapped to `/api/*` and will be treated as an API endpoint instead of a page. They are server-side only bundles and won't increase your client-side bundle size.

The handlers get the `Request` and `Response` types from Express and work like any other Express request handler.

### Example

```ts
// pages/api/user.ts
import type { Request, Response } from 'express';

export default (req: Request, res: Response) => {
  res.json({
    name: 'John',
  });
};
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

## Automatic Static Optimization

Premix automatically determines that a page is static (can be prerendered) if it has no blocking data requirements. This determination is made by the absence of `serverLoader` and `action` in the page.

This feature allows Premix to emit hybrid applications that contain both server-rendered and statically generated pages.

One of the main benefits of this feature is that optimized pages require no server-side computation, and can be instantly streamed to the end-user from multiple CDN locations. The result is an ultra fast loading experience for your users.

## CSS Suport

You can import a stylesheet in any React Component inside your application. Premix will statically analyse your imports to only add those stylesheets to the head of the pages that import that Component.

During build time, all stylesheets for each page will be concatenated into seperate files for each page and will be preloaded.

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
    <!-- Home Page Stylesheet -->
    <link rel="preload" as="style" href="/build/chunks/pages.[hash].css" />
    <link rel="stylesheet" href="/build/chunks/pages.[hash].css" />
    ...
  </head>
  ...
</html>
```

```css
/* Home page stylesheet */
.button {
  /* Button Styles */
}
```

```html
<!-- Post page -->
<html>
  <head>
    <!-- Post Page Stylesheet -->
    <link rel="preload" as="style" href="/build/chunks/posts.[hash].css" />
    <link rel="stylesheet" href="/build/chunks/posts.[hash].css" />
    ...
  </head>
  ...
</html>
```

```css
/* Post page stylesheet */
/* No css rules */
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
  // This will render
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

## Error Handling

## Web Workers

A web worker script can be directly imported by prefixing `worker:` to the import. The default export will be a custom worker constructor. The web worker will be inlined as a base64 string in the bundle.

### Example

```js
import MyWorker from 'worker:./worker';

const worker = new MyWorker();
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
/** @type {import('@premix/core/types').PremixConfig} */
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

### Main difference

- Premix doesn't support Nested routes.

### Features unique to Premix

Premix actually adds a few convenient features that are not supported in Remix:

#### Static Generation

Premix supports both Static Generation and Server-Side on per page basis rendering out of the box. This means that you can prerender your Premix app into html files and deploy it anywhere you want.

In comparison, Remix only supports Server-Side rendering.

#### Automatic Stylesheet Injection

In Remix, you can only import stylesheets inside the pages which has alot of limitations. For eg. it doesn't support scoped styling, component level CSS, CSS modules or any other styling solution that outputs a CSS file.

Premix statically analyses your CSS imports at build time and creates a map of which stylesheet is being imported on which page and automatically injects them in the `<head />` during rendering.

#### API Routes

In Remix, `pages` can only return React elements and to add an additional endpoint, you need to check for the pathname in the `entry.server.js`. It works fine if you only have 1-2 endpoints but it quickly increases the file size and you can't do dynamic routes. Premix has built-in support for API Routes.

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
