import cleanStack from 'clean-stack';

export const tryCatch = async (call, msg) => {
  try {
    const result = await call();
    return result || 0;
  } catch (err) {
    console.error(msg(cleanStack(err.stack)));
    return 1;
  }
};
