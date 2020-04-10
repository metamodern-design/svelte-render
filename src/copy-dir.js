import cpy from 'cpy';
import fs from 'fs-extra';
import pathResolve from './path-resolve';


const copyDir = async (fromPath, toPath) => {
  const resolved = pathResolve(fromPath);

  if (await fs.pathExists(resolved)) {
    return cpy(
      `${resolved}/*`,
      pathResolve(toPath),
    );
  }

  return Promise.resolve([]);
};


export default copyDir;
