import { createApp } from './app';
import { load } from './store';

const app = createApp();
await load();

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`LOGIQ API listening on http://localhost:${PORT}`);
});
