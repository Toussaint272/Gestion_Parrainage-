import app from './app.js';

const PORT = +(process.env.PORT || 5000);
app.listen(PORT, () => {
  console.log(`✔ API CotiScola : http://localhost:${PORT}/api/v1`);
});
