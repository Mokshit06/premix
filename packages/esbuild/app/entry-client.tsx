import { hydrate } from 'preact/compat';
import { RemixProvider } from '../src';
import { currentPage } from '../src/client';

const initialData = (window as any).__INITIAL_DATA__;

delete (window as any).__INITIAL_DATA__;

async function main() {
  const Page = await currentPage();

  hydrate(
    <RemixProvider context={{ data: initialData }}>
      <Page />
    </RemixProvider>,
    document.getElementById('__remix')
  );
}

main();
