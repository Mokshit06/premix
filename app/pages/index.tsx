import Image from 'img:../assets/dummy_image.png?width=500&placeholder';
import { useRouteData } from '@premix/core';
import { LoaderFunction, MetaFunction } from '@premix/core/types';
import '../styles/style.css';
import { Link } from '@premix/core/router';
import MyWorker from 'worker:../lib/worker';
import { useEffect } from 'react';

export const meta: MetaFunction = () => {
  return {
    title: 'Posts',
  };
};

interface Post {
  title: string;
  body: string;
  id: string;
}

export const loader: LoaderFunction = async () => {
  const res = await fetch(
    'https://jsonplaceholder.typicode.com/posts?_limit=5'
  );
  const posts = (await res.json()) as Post[];

  return {
    props: {
      posts,
    },
  };
};

export default function Home() {
  const { posts } = useRouteData<{ posts: Post[] }>();

  useEffect(() => {
    const worker = new MyWorker();
    worker.postMessage('Hello world');
  }, []);

  return (
    <>
      <Link href="/todos">Todos</Link>
      <div>
        <Image />
      </div>
      {posts.map(post => (
        <div key={post.id}>
          <Link href={`/posts/${post.id}`}>{post.title}</Link>
        </div>
      ))}
    </>
  );
}
