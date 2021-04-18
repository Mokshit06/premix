import { LinksFunction, LoaderFunction, MetaFunction } from '../../src/types';
import styles from 'url:../styles/style.css';
import { useRouteData } from '../../src';

export const meta: MetaFunction = ({ post }) => {
  return {
    title: post.title,
    description: post.body,
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

export default function Post() {
  const [{ post }] = useRouteData();

  return (
    <>
      <h2>{post.title}</h2>
      <p>{post.body}</p>
    </>
  );
}

export const loader: LoaderFunction = async ({ params }) => {
  const res = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${params.post}`
  );
  const post = await res.json();

  return {
    props: {
      post,
    },
  };
};
