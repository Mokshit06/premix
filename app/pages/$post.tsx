import { useRouteData } from '../../src';
import { LoaderFunction, MetaFunction } from '../../src/types';
import '../styles/style.css';

export const meta: MetaFunction = ({ post }) => {
  return {
    title: post.title,
    description: post.body,
  };
};

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

export default function Post() {
  const [{ post }] = useRouteData();

  return (
    <>
      <a href="/">Back</a>
      <h2>{post.title}</h2>
      <p>{post.body}</p>
    </>
  );
}
