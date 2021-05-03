import { useRouteData } from '../../src';
import { LoaderFunction, MetaFunction } from '../../src/types';
import '../styles/style.css';

export const meta: MetaFunction = data => {
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
