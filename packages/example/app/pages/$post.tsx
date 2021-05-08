import { useRouteData } from '@premix/core';
import { LoaderFunction, LoadPathsFunction, MetaFunction } from '@premix/core';
import '../styles/style.css';

export const meta: MetaFunction = ({ post }) => {
  return {
    title: post.title,
    description: post.body,
  };
};

interface Post {
  title: string;
  body: string;
  id: string;
}

export const loadPaths: LoadPathsFunction = async () => {
  const res = await fetch(
    'https://jsonplaceholder.typicode.com/posts?_limit=5'
  );
  const posts = (await res.json()) as Post[];

  return {
    paths: posts.map(post => ({
      params: { post: post.id },
    })),
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
  const { post } = useRouteData<{ post: Post }>();

  return (
    <>
      <a href="/">Home</a>
      <h2>{post.title}</h2>
      <p>{post.body}</p>
    </>
  );
}
