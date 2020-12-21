import cleanStack from 'clean-stack';


const tryCatch = async (call, msg) => {
  try {
    const result = await call();
    return result || 0;
  } catch (err) {
    console.error(msg(cleanStack(err.stack)));
    return 1;
  }
};


export default tryCatch;
