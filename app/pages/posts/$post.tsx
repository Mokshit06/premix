import { useRouteData } from '@premix/core';
import {
  HeadersFunction,
  ServerLoaderFunction,
  MetaFunction,
} from '@premix/core/types';
import '../../styles/style.css';
import { Link } from '@premix/core/router';

export const meta: MetaFunction = ({ post }) => {
  return {
    title: post.title,
    description: post.body,
  };
};

export const headers: HeadersFunction = () => {
  return {
    'Cache-Control': 'max-age=60',
  };
};

interface Post {
  title: string;
  body: string;
  id: string;
}

// export const loadPaths: LoadPathsFunction = async () => {
//   const res = await fetch('https://jsonplaceholder.typicode.com/posts');
//   const posts = (await res.json()) as Post[];

//   return {
//     paths: posts.map(post => ({
//       params: { post: post.id },
//     })),
//   };
// };

// Change to `staticLoader` for prerendering
export const serverLoader: ServerLoaderFunction = async req => {
  const res = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${req.params.post}`
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
      <Link href="/">Home</Link>
      <h2>{post.title}</h2>
      <p>{post.body}</p>
    </>
  );
}
