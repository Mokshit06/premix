import { useRouteData } from '@premix/core';
import { Link } from '@premix/core/router';
import {
  ServerLoaderFunction,
  MetaFunction,
  StaticLoaderFunction,
} from '@premix/core/types';
import Image from 'img:../assets/dummy_image.png?width=500&placeholder';
import { useEffect } from 'react';
import MyWorker from 'worker:../lib/worker';
import '../styles/style.css';

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

export const staticLoader: StaticLoaderFunction = async () => {
  const res = await fetch(
    'https://jsonplaceholder.typicode.com/posts?_limit=5'
  );
  const posts = (await res.json()) as Post[];

  return {
    props: {
      posts,
    },
    // revalidate: 10,
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
