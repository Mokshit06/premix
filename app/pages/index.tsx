import styles from 'url:../styles/style.css';
import { useRouteData } from '../../src';
import { LinksFunction, LoaderFunction, MetaFunction } from '../../src/types';

export const meta: MetaFunction = data => {
  return {
    title: 'Posts',
  };
};

export const links: LinksFunction = data => {
  return [
    {
      rel: 'stylesheet',
      href: styles,
    },
  ];
};

export const loader: LoaderFunction = async () => {
  const res = await fetch(
    'https://jsonplaceholder.typicode.com/posts?_limit=5'
  );
  const posts = await res.json();

  return {
    props: {
      posts,
    },
  };
};

export default function Home() {
  const [{ posts }] = useRouteData();

  return (
    <>
      {posts.map(post => (
        <div key={post.id}>
          <a href={`/${post.id}`}>{post.title}</a>
        </div>
      ))}
    </>
  );
}
